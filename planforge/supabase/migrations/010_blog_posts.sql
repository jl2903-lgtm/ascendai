-- Blog posts for SEO
create table if not exists public.blog_posts (
  id uuid default uuid_generate_v4() primary key,
  slug text unique not null,
  title text not null,
  excerpt text not null,
  content text not null,
  cover_image_url text,
  category text not null,
  tags text[] not null default '{}',
  author_name text not null default 'Jordan',
  read_time_minutes integer not null default 5,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_published_idx
  on public.blog_posts (published, published_at desc);
create index if not exists blog_posts_category_idx
  on public.blog_posts (category);
create index if not exists blog_posts_slug_idx
  on public.blog_posts (slug);

-- Keep updated_at current
create or replace function public.set_blog_posts_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute function public.set_blog_posts_updated_at();

alter table public.blog_posts enable row level security;

-- Anyone (including anon) can read published posts
drop policy if exists "Published posts are readable by everyone" on public.blog_posts;
create policy "Published posts are readable by everyone"
  on public.blog_posts for select
  using (published = true);

-- Admins can read all posts (including drafts)
drop policy if exists "Admins can read all posts" on public.blog_posts;
create policy "Admins can read all posts"
  on public.blog_posts for select
  to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and coalesce(u.email, '') in ('jordan@tyoutorpro.io', 'admin@tyoutorpro.io')
    )
  );

-- Only admins can insert / update / delete
drop policy if exists "Admins can insert posts" on public.blog_posts;
create policy "Admins can insert posts"
  on public.blog_posts for insert
  to authenticated
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and coalesce(u.email, '') in ('jordan@tyoutorpro.io', 'admin@tyoutorpro.io')
    )
  );

drop policy if exists "Admins can update posts" on public.blog_posts;
create policy "Admins can update posts"
  on public.blog_posts for update
  to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and coalesce(u.email, '') in ('jordan@tyoutorpro.io', 'admin@tyoutorpro.io')
    )
  );

drop policy if exists "Admins can delete posts" on public.blog_posts;
create policy "Admins can delete posts"
  on public.blog_posts for delete
  to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and coalesce(u.email, '') in ('jordan@tyoutorpro.io', 'admin@tyoutorpro.io')
    )
  );
