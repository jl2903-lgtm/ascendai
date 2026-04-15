-- Stripe billing & usage tracking migration
--
-- Note: stripe_customer_id and subscription_status already exist on public.users
-- from 001_initial_schema.sql. This migration adds:
--   1. monthly_usage table for per-month lesson/worksheet usage tracking
--   2. subscription_tier column as an alias alongside subscription_status
--      (subscription_status is the field used by all API routes)

-- ── 1. monthly_usage table ───────────────────────────────────────────────────

create table if not exists public.monthly_usage (
  id            uuid        default uuid_generate_v4() primary key,
  user_id       uuid        references public.users(id) on delete cascade not null,
  month         text        not null,  -- 'YYYY-MM'
  lesson_count  integer     not null default 0,
  worksheet_count integer   not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(user_id, month)
);

alter table public.monthly_usage enable row level security;

create policy "Users can view own monthly usage"
  on public.monthly_usage for select
  using (auth.uid() = user_id);

create policy "Users can upsert own monthly usage"
  on public.monthly_usage for insert
  with check (auth.uid() = user_id);

create policy "Users can update own monthly usage"
  on public.monthly_usage for update
  using (auth.uid() = user_id);

create index if not exists monthly_usage_user_month_idx
  on public.monthly_usage(user_id, month);

-- ── 2. Helper: upsert monthly usage counters ────────────────────────────────

create or replace function public.increment_monthly_usage(
  p_user_id       uuid,
  p_month         text,
  p_lesson_delta  integer default 0,
  p_worksheet_delta integer default 0
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.monthly_usage (user_id, month, lesson_count, worksheet_count, updated_at)
  values (p_user_id, p_month, p_lesson_delta, p_worksheet_delta, now())
  on conflict (user_id, month) do update
    set lesson_count    = monthly_usage.lesson_count    + p_lesson_delta,
        worksheet_count = monthly_usage.worksheet_count + p_worksheet_delta,
        updated_at      = now();
end;
$$;

-- ── 3. subscription_tier column (matches subscription_status semantics) ──────
-- subscription_status is the authoritative field; subscription_tier is added
-- here as requested and kept in sync via webhook updates.

alter table public.users
  add column if not exists subscription_tier text
  not null default 'free'
  check (subscription_tier in ('free', 'pro', 'cancelled'));

-- Back-fill from existing subscription_status
update public.users
  set subscription_tier = subscription_status
  where subscription_tier != subscription_status;

-- ── 4. Indexes ───────────────────────────────────────────────────────────────

create index if not exists users_subscription_tier_idx
  on public.users(subscription_tier);
