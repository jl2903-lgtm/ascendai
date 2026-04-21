-- First-time user onboarding flow
-- Adds teaching_context + onboarding_completed_at.
-- Reuses existing default_level / default_age_group / default_nationality
-- columns as smart defaults for the Lesson Generator.

-- 1. New columns (nullable so existing users are unaffected)
alter table public.users
  add column if not exists teaching_context text
    check (teaching_context in ('private_tutor', 'classroom', 'both')),
  add column if not exists onboarding_completed_at timestamptz;

-- 2. Backfill: anyone who signed up before this migration has already seen
-- the old dashboard. Do not ambush them with the new onboarding modal.
update public.users
set
  onboarding_completed = true,
  onboarding_completed_at = coalesce(onboarding_completed_at, now())
where onboarding_completed = false;

-- 3. Index for admin funnel queries (partial, only tracks not-yet-onboarded)
create index if not exists users_onboarding_not_completed_idx
  on public.users(onboarding_completed)
  where onboarding_completed = false;
