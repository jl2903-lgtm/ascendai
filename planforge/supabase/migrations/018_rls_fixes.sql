-- Migration 018: RLS + trigger fixes uncovered by the final stress-test audit.
--
-- Every change here is idempotent (DROP POLICY IF EXISTS + CREATE POLICY, or
-- CREATE TABLE IF NOT EXISTS behavior) so the migration can be re-applied
-- without side effects.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CRITICAL: `public.lessons` has no UPDATE policy.
--    The generate-activities route uses the RLS-scoped route client to move
--    the row through `not_started → generating → ready|failed` and to write
--    the generated activities JSONB. Without an UPDATE policy the writes
--    silently return 0 rows (no error surface), so activities never persist.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "Users can update own lessons" on public.lessons;
create policy "Users can update own lessons"
  on public.lessons for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Same shape for worksheets (defense in depth — no client updates them
-- today, but future "edit worksheet" would silently no-op).
drop policy if exists "Users can update own worksheets" on public.worksheets;
create policy "Users can update own worksheets"
  on public.worksheets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CRITICAL: `practice_sessions` UPDATE was public and unrestricted.
--    The original policy (007) allowed anyone to overwrite share_code,
--    vocabulary, grammar_focus, lesson_content — not just view_count.
--    Replace with an owner-scoped UPDATE. Public view_count increment moves
--    to the server route (which uses the admin client anyway).
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "Public can update view_count" on practice_sessions;

drop policy if exists "Owners can update own practice sessions" on practice_sessions;
create policy "Owners can update own practice sessions"
  on practice_sessions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Fix `handle_new_user` — a NULL email from phone/OAuth signups causes the
--    trigger to fail (public.users.email is NOT NULL). Coalesce to '' and
--    rely on the app to backfill later. Keeps sign-up working end-to-end.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. `practice_sessions.user_id -> auth.users` was declared with no ON DELETE
--    clause (defaults to NO ACTION), so `auth.admin.deleteUser` throws an FK
--    violation for any user who ever shared a lesson. Add CASCADE so the
--    delete-account flow completes cleanly.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.practice_sessions
  drop constraint if exists practice_sessions_user_id_fkey;

alter table public.practice_sessions
  add constraint practice_sessions_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. `class_profiles` — attach the existing set_updated_at() trigger so any
--    write (from any source, not just the API route) refreshes updated_at.
-- ─────────────────────────────────────────────────────────────────────────────

drop trigger if exists class_profiles_updated_at on public.class_profiles;
create trigger class_profiles_updated_at
  before update on public.class_profiles
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Hot-path composite indexes on the two dashboard queries. Postgres was
--    choosing between the single-column (user_id) and (created_at) indexes;
--    a composite covers both filter + sort in one seek.
-- ─────────────────────────────────────────────────────────────────────────────

create index if not exists lessons_user_created_idx
  on public.lessons (user_id, created_at desc);

create index if not exists worksheets_user_created_idx
  on public.worksheets (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. CRITICAL — self-service Pro. The original "Users can update own profile"
--    policy (001) has no column filter, so any signed-in user can call
--    `supabase.from('users').update({subscription_status:'pro', trial_end:
--    '2099-12-31'})` from the browser console and grant themselves paid
--    access, bypassing Stripe entirely. Chains into stored-XSS via the
--    blog admin gate (`email IN (…)` — set your own email, gain blog write).
--
--    Fix: replace the broad UPDATE policy with a trigger that forbids
--    non-owned rows AND blocks writes to billing / auth-critical columns.
--    Only the service role (Stripe webhook via admin client) can touch
--    those fields.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.protect_users_columns()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Only owner can update their row (defense in depth alongside RLS).
  if auth.uid() is null or auth.uid() <> new.id then
    raise exception 'not owner';
  end if;
  -- Freeze columns that only the service role (Stripe webhook, admin flows)
  -- may change. Any attempt by an authenticated caller to alter them silently
  -- reverts to the old value.
  new.email                          = old.email;
  new.subscription_status            = old.subscription_status;
  new.subscription_tier              = old.subscription_tier;
  new.subscription_id                = old.subscription_id;
  new.trial_end                      = old.trial_end;
  new.stripe_customer_id             = old.stripe_customer_id;
  new.lessons_used_this_month        = old.lessons_used_this_month;
  new.worksheets_used_this_month     = old.worksheets_used_this_month;
  new.error_coach_used_this_month    = old.error_coach_used_this_month;
  new.demo_lesson_used_this_month    = old.demo_lesson_used_this_month;
  new.job_assistant_used_this_month  = old.job_assistant_used_this_month;
  new.lessons_reset_date             = old.lessons_reset_date;
  new.created_at                     = old.created_at;
  return new;
end;
$$;

-- Fires only for the `authenticated` role (RLS-scoped clients). The
-- service_role bypasses row-level triggers when using service_role.
-- To be safe we check auth.uid() in the trigger body too.
drop trigger if exists protect_users_columns_trg on public.users;
create trigger protect_users_columns_trg
  before update on public.users
  for each row
  when (current_setting('request.jwt.claim.role', true) = 'authenticated')
  execute function public.protect_users_columns();

-- Tighten the UPDATE policy itself. WITH CHECK ensures a caller can't
-- update to a row they don't own; the trigger above handles per-column.
drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Fix typo in reported_resources moderation policy — `tyoutor.io` should
--    be `tyoutorpro.io`, so no admin ever matched and the moderation queue
--    was silently unreadable.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "Admins can view all reports"   on public.reported_resources;
drop policy if exists "Admins can update report status" on public.reported_resources;

create policy "Admins can view all reports"
  on public.reported_resources for select
  to authenticated
  using (auth.uid() in (
    select id from public.users where email in ('info@tyoutorpro.io')
  ));

create policy "Admins can update report status"
  on public.reported_resources for update
  to authenticated
  using (auth.uid() in (
    select id from public.users where email in ('info@tyoutorpro.io')
  ))
  with check (auth.uid() in (
    select id from public.users where email in ('info@tyoutorpro.io')
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Storage: only allow uploading to your own folder inside shared-resources.
--    Was `WITH CHECK (bucket_id = 'shared-resources')` — any user could write
--    under another user's ${user_id}/ prefix.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "Authenticated users can upload to shared-resources" on storage.objects;
create policy "Authenticated users can upload to shared-resources"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'shared-resources'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
