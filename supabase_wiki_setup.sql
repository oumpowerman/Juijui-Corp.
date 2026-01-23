
-- ==========================================
-- WIKI SYSTEM SETUP
-- ==========================================

create table if not exists public.wiki_articles (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  content text not null,
  category text default 'GENERAL',
  target_roles text[] default '{ALL}', -- Array of roles e.g. ['EDITOR', 'CREATIVE']
  is_pinned boolean default false
);

-- Enable RLS
alter table public.wiki_articles enable row level security;

-- Policies (Allow all authenticated users to read/write)
drop policy if exists "Enable all access for authenticated users" on public.wiki_articles;
create policy "Enable all access for authenticated users" on public.wiki_articles for all using (auth.role() = 'authenticated');

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
