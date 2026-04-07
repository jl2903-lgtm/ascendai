-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends auth.users)
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  stripe_customer_id text,
  subscription_status text not null default 'free' check (subscription_status in ('free', 'pro', 'cancelled')),
  subscription_id text,
  lessons_used_this_month integer not null default 0,
  worksheets_used_this_month integer not null default 0,
  error_coach_used_this_month integer not null default 0,
  demo_lesson_used_this_month integer not null default 0,
  job_assistant_used_this_month integer not null default 0,
  lessons_reset_date timestamptz not null default now(),
  onboarding_completed boolean not null default false,
  default_level text,
  default_nationality text,
  default_age_group text,
  main_goal text,
  created_at timestamptz not null default now()
);

-- Lessons table
create table if not exists public.lessons (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  student_level text not null,
  topic text not null,
  lesson_length integer not null,
  student_age_group text not null,
  student_nationality text not null,
  lesson_content jsonb not null,
  created_at timestamptz not null default now()
);

-- Worksheets table
create table if not exists public.worksheets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete set null,
  title text not null,
  content jsonb not null,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.users enable row level security;
alter table public.lessons enable row level security;
alter table public.worksheets enable row level security;

-- RLS Policies for users
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- RLS Policies for lessons
create policy "Users can view own lessons"
  on public.lessons for select
  using (auth.uid() = user_id);

create policy "Users can insert own lessons"
  on public.lessons for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own lessons"
  on public.lessons for delete
  using (auth.uid() = user_id);

-- RLS Policies for worksheets
create policy "Users can view own worksheets"
  on public.worksheets for select
  using (auth.uid() = user_id);

create policy "Users can insert own worksheets"
  on public.worksheets for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own worksheets"
  on public.worksheets for delete
  using (auth.uid() = user_id);

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

-- Trigger to create user profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to reset monthly usage counters
create or replace function public.reset_monthly_usage()
returns void
language plpgsql
security definer
as $$
begin
  update public.users
  set
    lessons_used_this_month = 0,
    worksheets_used_this_month = 0,
    error_coach_used_this_month = 0,
    demo_lesson_used_this_month = 0,
    job_assistant_used_this_month = 0,
    lessons_reset_date = now()
  where
    subscription_status = 'free'
    and date_trunc('month', lessons_reset_date) < date_trunc('month', now());
end;
$$;

-- Indexes for performance
create index if not exists lessons_user_id_idx on public.lessons(user_id);
create index if not exists lessons_created_at_idx on public.lessons(created_at desc);
create index if not exists worksheets_user_id_idx on public.worksheets(user_id);
create index if not exists worksheets_created_at_idx on public.worksheets(created_at desc);
