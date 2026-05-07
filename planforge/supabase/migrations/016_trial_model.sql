-- Trial model migration
--
-- Changes:
--   1. Add trial_end timestamptz column to users
--   2. Extend subscription_status check constraint to include 'trialing'
--   3. Extend subscription_tier check constraint to include 'trialing'

-- ── 1. trial_end column ───────────────────────────────────────────────────────

alter table public.users
  add column if not exists trial_end timestamptz;

-- ── 2. subscription_status constraint ────────────────────────────────────────

alter table public.users
  drop constraint if exists users_subscription_status_check;

alter table public.users
  add constraint users_subscription_status_check
  check (subscription_status in ('free', 'trialing', 'pro', 'cancelled', 'expired'));

-- ── 3. subscription_tier constraint ──────────────────────────────────────────

alter table public.users
  drop constraint if exists users_subscription_tier_check;

alter table public.users
  add constraint users_subscription_tier_check
  check (subscription_tier in ('free', 'trialing', 'pro', 'cancelled', 'expired'));

-- ── 4. Index for trial expiry queries ────────────────────────────────────────

create index if not exists users_trial_end_idx
  on public.users(trial_end)
  where trial_end is not null;
