
-- ==========================================
-- JUIJUI PLANNER: FULL DATABASE SCHEMA (UPDATED)
-- ==========================================

create extension if not exists "pgcrypto";

-- 1. PROFILES (Users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'MEMBER', 
  position text,
  phone_number text, -- เก็บเบอร์โทร
  is_approved boolean default false,
  is_active boolean default true,
  xp integer default 0,
  level integer default 1,
  available_points integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger: Create Profile automatically on SignUp
-- ปรับปรุงให้รองรับข้อมูลเสริมจากการสมัครสมาชิก (Metadata)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, position, phone_number, is_approved, is_active)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    'MEMBER', 
    new.raw_user_meta_data->>'position',
    new.raw_user_meta_data->>'phone_number',
    false,
    true
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. CHANNELS
create table if not exists public.channels (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  description text,
  color text,
  platforms text[] default '{}',
  platform text
);

-- 3. MASTER OPTIONS
create table if not exists public.master_options (
  id uuid default gen_random_uuid() primary key,
  type text not null, 
  key text not null,
  label text not null,
  color text,
  sort_order integer default 0,
  is_active boolean default true,
  is_default boolean default false
);

-- 4. CONTENTS
create table if not exists public.contents (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    title text not null,
    description text,
    status text default 'TODO',
    priority text default 'MEDIUM',
    tags text[] default '{}',
    pillar text,
    content_format text,
    category text,
    remark text,
    channel_id uuid references public.channels(id) on delete set null,
    target_platform text[],
    is_unscheduled boolean default false,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    idea_owner_ids text[] default '{}',
    editor_ids text[] default '{}',
    assignee_ids text[] default '{}',
    assets jsonb default '[]',
    performance jsonb,
    difficulty text default 'MEDIUM',
    estimated_hours numeric default 0
);

-- 5. TASKS
create table if not exists public.tasks (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    title text not null,
    description text,
    status text default 'TODO',
    priority text default 'MEDIUM',
    tags text[] default '{}',
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    assignee_ids text[] default '{}',
    difficulty text default 'MEDIUM',
    estimated_hours numeric default 0,
    type text default 'TASK' 
);

-- (Skip other tables as they remain the same)
-- 6. TASK REVIEWS
-- 7. TASK LOGS
-- 8. TASK COMMENTS
-- 9. TEAM MESSAGES
-- 10. WEEKLY QUESTS
-- 11. DUTY CONFIGS
-- 12. REWARDS
-- 13. REDEMPTIONS
-- 14. GOALS

-- ==========================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- ==========================================

alter table public.profiles enable row level security;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles 
  for update 
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Internal Tool Policy for all other tables
do $$
declare
  t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' and tablename != 'profiles' loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "Enable all access for authenticated users" on %I', t);
    execute format('create policy "Enable all access for authenticated users" on %I for all using (auth.role() = ''authenticated'')', t);
  end loop;
end
$$;
