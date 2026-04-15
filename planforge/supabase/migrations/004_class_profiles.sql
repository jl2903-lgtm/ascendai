-- Class Profiles table — lets teachers store recurring class info for AI auto-fill
create table if not exists public.class_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  class_name text not null,
  student_nationality text not null default 'Chinese (Mandarin)',
  student_age_group text not null default 'adults',
  class_size integer not null default 15,
  cefr_level text not null default 'B1',
  course_type text not null default 'General English',
  textbook text,
  weak_areas text[] not null default '{}',
  focus_skills text[] not null default '{}',
  additional_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.class_profiles enable row level security;

create policy "Users can view own class profiles"
  on public.class_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own class profiles"
  on public.class_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own class profiles"
  on public.class_profiles for update
  using (auth.uid() = user_id);

create policy "Users can delete own class profiles"
  on public.class_profiles for delete
  using (auth.uid() = user_id);

create index if not exists class_profiles_user_idx on public.class_profiles(user_id);

-- Backfill: mark all existing users as onboarding_completed so they are
-- not forced through the new onboarding flow on next login.
-- New signups still get onboarding_completed = false via the trigger default.
update public.users
  set onboarding_completed = true
  where onboarding_completed = false;
