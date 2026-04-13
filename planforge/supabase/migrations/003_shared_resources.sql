-- Shared resources table for community-uploaded lesson PDFs
create table if not exists public.shared_resources (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  description text,
  subject text,
  level text,
  file_url text not null,
  file_name text not null,
  is_public boolean not null default false,
  uploaded_by_name text,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.shared_resources enable row level security;

-- Any authenticated user can read public resources
create policy "Anyone can view public resources"
  on public.shared_resources for select
  using (is_public = true or auth.uid() = user_id);

-- Only uploader can insert
create policy "Users can insert own resources"
  on public.shared_resources for insert
  with check (auth.uid() = user_id);

-- Only uploader can delete their own
create policy "Users can delete own resources"
  on public.shared_resources for delete
  using (auth.uid() = user_id);

-- Index for browsing
create index if not exists shared_resources_public_idx on public.shared_resources(is_public, created_at desc);
create index if not exists shared_resources_user_idx on public.shared_resources(user_id);
