-- Add activities column to lessons for Teach Mode (interactive activity runner).
-- Nullable so existing rows remain valid; new generations populate it alongside lesson_content.
alter table public.lessons add column if not exists activities jsonb;
