create table if not exists public.user_stats (
  user_id uuid references auth.users(id) on delete cascade primary key,
  total_lessons_created integer not null default 0,
  total_worksheets_created integer not null default 0,
  lessons_this_week integer not null default 0,
  worksheets_this_week integer not null default 0,
  last_weekly_reset timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.user_stats enable row level security;

create policy "Users can read own stats"
  on public.user_stats for select
  using (auth.uid() = user_id);

create policy "Users can insert own stats"
  on public.user_stats for insert
  with check (auth.uid() = user_id);

create policy "Users can update own stats"
  on public.user_stats for update
  using (auth.uid() = user_id);
