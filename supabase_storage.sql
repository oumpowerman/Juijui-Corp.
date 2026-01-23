
-- ==========================================
-- STORAGE SETUP: Chat Files
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Create a new storage bucket called 'chat-files'
insert into storage.buckets (id, name, public)
values ('chat-files', 'chat-files', true)
on conflict (id) do nothing;

-- 2. Policy: Allow authenticated users to upload files
create policy "Allow authenticated uploads"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'chat-files' );

-- 3. Policy: Allow anyone to view files (since it's public)
create policy "Allow public viewing"
on storage.objects for select
to public
using ( bucket_id = 'chat-files' );

-- 4. Policy: Allow authenticated users to delete their own files (Optional)
create policy "Allow users to delete own files"
on storage.objects for delete
to authenticated
using ( bucket_id = 'chat-files' and owner = auth.uid() );

-- Force refresh schema just in case
NOTIFY pgrst, 'reload schema';
