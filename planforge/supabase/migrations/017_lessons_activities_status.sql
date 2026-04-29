-- Two-stage lesson generation (v3): track activity-generation state separately
-- from the activities payload itself. activities_status drives the "Teach this
-- lesson" button states (not_started → generating → ready / failed) and lets
-- the runner show a generation screen and resume polling after a refresh.

alter table public.lessons
  add column if not exists activities_status text not null default 'not_started'
  check (activities_status in ('not_started', 'generating', 'ready', 'failed'));

alter table public.lessons
  add column if not exists activities_error text;

-- Backfill: any pre-v3 row that already has activities populated is "ready".
update public.lessons
set activities_status = 'ready'
where activities is not null
  and activities_status <> 'ready';

-- Index for the dashboard's status-aware card rendering.
create index if not exists lessons_activities_status_idx
  on public.lessons(activities_status);
