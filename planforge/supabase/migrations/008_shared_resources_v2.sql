-- Migration 008: Enhance shared_resources for community upload feature
-- Adds rich metadata, download tracking, FTS, and storage bucket.
--
-- Safe to apply alongside existing shared_resources table:
-- - Column renames happen first, then new columns are added
-- - is_public kept (default true) so existing page still loads during deploy
-- - Download count increments via API route using service role (no open UPDATE policy)

-- ── Column renames ────────────────────────────────────────────────────────────

ALTER TABLE public.shared_resources
  RENAME COLUMN uploaded_by_name TO uploader_name;

ALTER TABLE public.shared_resources
  RENAME COLUMN level TO cefr_level;

-- ── Backfill nulls before tightening constraints ──────────────────────────────

UPDATE public.shared_resources SET uploader_name = 'Unknown'     WHERE uploader_name IS NULL;
UPDATE public.shared_resources SET cefr_level    = 'Mixed'       WHERE cefr_level IS NULL;
UPDATE public.shared_resources SET subject       = 'Other'       WHERE subject IS NULL;

-- ── Add NOT NULL + defaults to renamed/existing columns ──────────────────────

ALTER TABLE public.shared_resources
  ALTER COLUMN uploader_name SET NOT NULL,
  ALTER COLUMN uploader_name SET DEFAULT 'Unknown',
  ALTER COLUMN cefr_level    SET NOT NULL,
  ALTER COLUMN cefr_level    SET DEFAULT 'Mixed',
  ALTER COLUMN subject       SET NOT NULL,
  ALTER COLUMN subject       SET DEFAULT 'Other';

-- ── New columns ───────────────────────────────────────────────────────────────

ALTER TABLE public.shared_resources
  ADD COLUMN IF NOT EXISTS uploader_avatar_url text,
  ADD COLUMN IF NOT EXISTS file_type           text    NOT NULL DEFAULT 'pdf',
  ADD COLUMN IF NOT EXISTS file_size_bytes     bigint,
  ADD COLUMN IF NOT EXISTS age_group           text    NOT NULL DEFAULT 'Adults',
  ADD COLUMN IF NOT EXISTS resource_type       text    NOT NULL DEFAULT 'Other',
  ADD COLUMN IF NOT EXISTS tags                text[],
  ADD COLUMN IF NOT EXISTS download_count      integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at          timestamptz NOT NULL DEFAULT now();

-- ── Full-text search vector (generated, auto-updates on INSERT/UPDATE) ────────

ALTER TABLE public.shared_resources
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english',
        coalesce(title, '')       || ' ' ||
        coalesce(description, '') || ' ' ||
        coalesce(subject, '')     || ' ' ||
        coalesce(cefr_level, '')  || ' ' ||
        coalesce(resource_type, '')
      )
    ) STORED;

-- ── updated_at trigger ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shared_resources_updated_at ON public.shared_resources;
CREATE TRIGGER shared_resources_updated_at
  BEFORE UPDATE ON public.shared_resources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Indexes ───────────────────────────────────────────────────────────────────

DROP INDEX IF EXISTS shared_resources_public_idx;

CREATE INDEX IF NOT EXISTS shared_resources_cefr_idx          ON public.shared_resources(cefr_level);
CREATE INDEX IF NOT EXISTS shared_resources_subject_idx        ON public.shared_resources(subject);
CREATE INDEX IF NOT EXISTS shared_resources_age_group_idx      ON public.shared_resources(age_group);
CREATE INDEX IF NOT EXISTS shared_resources_resource_type_idx  ON public.shared_resources(resource_type);
CREATE INDEX IF NOT EXISTS shared_resources_created_at_idx     ON public.shared_resources(created_at DESC);
CREATE INDEX IF NOT EXISTS shared_resources_download_count_idx ON public.shared_resources(download_count DESC);
CREATE INDEX IF NOT EXISTS shared_resources_fts_idx            ON public.shared_resources USING gin(search_vector);

-- ── RLS policies — refresh all ────────────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone can view public resources"    ON public.shared_resources;
DROP POLICY IF EXISTS "Users can insert own resources"      ON public.shared_resources;
DROP POLICY IF EXISTS "Users can delete own resources"      ON public.shared_resources;
DROP POLICY IF EXISTS "Authenticated users can view all resources"   ON public.shared_resources;
DROP POLICY IF EXISTS "Authenticated users can insert resources"     ON public.shared_resources;
DROP POLICY IF EXISTS "Uploaders can update own resources"           ON public.shared_resources;
DROP POLICY IF EXISTS "Uploaders can delete own resources"           ON public.shared_resources;

-- Any authenticated user can browse all community resources
CREATE POLICY "Authenticated users can view all resources"
  ON public.shared_resources FOR SELECT
  TO authenticated
  USING (true);

-- Anyone can insert — uploader_id check enforced in API route (service role)
-- RLS enforces the user_id = auth.uid() constraint at the DB level
CREATE POLICY "Authenticated users can insert resources"
  ON public.shared_resources FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only the original uploader can edit their resource metadata
CREATE POLICY "Uploaders can update own resources"
  ON public.shared_resources FOR UPDATE
  TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Only the original uploader can remove their resource
CREATE POLICY "Uploaders can delete own resources"
  ON public.shared_resources FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── Reported resources table (Phase 5 moderation) ────────────────────────────

CREATE TABLE IF NOT EXISTS public.reported_resources (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id uuid        NOT NULL REFERENCES public.shared_resources(id) ON DELETE CASCADE,
  reporter_id uuid        NOT NULL REFERENCES auth.users(id)              ON DELETE CASCADE,
  reason      text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reported_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can report resources"
  ON public.reported_resources FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
  ON public.reported_resources FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM public.users WHERE email LIKE '%@tyoutorpro.com'
  ));

CREATE INDEX IF NOT EXISTS reported_resources_resource_idx ON public.reported_resources(resource_id);
CREATE INDEX IF NOT EXISTS reported_resources_reporter_idx ON public.reported_resources(reporter_id);

-- ── Storage bucket: shared-resources ─────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shared-resources',
  'shared-resources',
  true,
  10485760,  -- 10 MB
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit   = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS: public bucket → files are publicly readable via CDN URL
-- These policies cover supabase-js API access (signed URLs, etc.)

DROP POLICY IF EXISTS "Public read for shared-resources bucket"              ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to shared-resources"   ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own uploads in shared-resources"     ON storage.objects;

CREATE POLICY "Public read for shared-resources bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'shared-resources');

CREATE POLICY "Authenticated users can upload to shared-resources"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'shared-resources');

CREATE POLICY "Users can delete own uploads in shared-resources"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'shared-resources' AND owner = auth.uid());
