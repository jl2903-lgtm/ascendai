-- Allow authenticated users to insert their own row
-- (needed as fallback if the trigger didn't fire for existing auth users)
create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);
