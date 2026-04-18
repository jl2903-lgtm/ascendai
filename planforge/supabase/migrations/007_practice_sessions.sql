-- Practice Sessions table for Student Practice Hub
create table if not exists practice_sessions (
  id uuid primary key default gen_random_uuid(),
  share_code text unique not null,
  user_id uuid references auth.users not null,
  lesson_title text not null,
  lesson_topic text not null,
  lesson_level text not null,
  student_nationality text not null default '',
  vocabulary jsonb not null default '[]',
  grammar_focus text not null default '',
  practice_sentences jsonb not null default '[]',
  lesson_content text not null default '',
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

-- Indexes
create index if not exists practice_sessions_user_id_idx on practice_sessions (user_id);
create index if not exists practice_sessions_share_code_idx on practice_sessions (share_code);

-- RLS
alter table practice_sessions enable row level security;

-- Teachers can manage their own sessions
create policy "Users can insert own practice sessions"
  on practice_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can select own practice sessions"
  on practice_sessions for select
  using (auth.uid() = user_id);

create policy "Users can delete own practice sessions"
  on practice_sessions for delete
  using (auth.uid() = user_id);

-- Public read by share_code (no auth required)
create policy "Public can read practice sessions by share_code"
  on practice_sessions for select
  using (true);

-- Public can increment view_count
create policy "Public can update view_count"
  on practice_sessions for update
  using (true)
  with check (true);
