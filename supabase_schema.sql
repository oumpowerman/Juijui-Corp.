
-- ==========================================
-- UPDATE: Gamification & Task Details
-- ==========================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level integer DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS available_points integer DEFAULT 0; -- NEW: Spendable Points

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'MEDIUM'; -- EASY, MEDIUM, HARD
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS estimated_hours numeric DEFAULT 0;

-- ==========================================
-- 10. TASK REVIEWS (Booking & Quality Gate)
-- ==========================================
create table if not exists public.task_reviews (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  task_id uuid references public.tasks(id) on delete cascade not null,
  round integer not null default 1, -- Draft 1, 2, 3
  scheduled_at timestamp with time zone not null, -- จองคิวตรวจตอนไหน
  reviewer_id uuid references public.profiles(id) on delete set null,
  status text default 'PENDING', -- 'PENDING', 'PASSED', 'REVISE'
  feedback text,
  is_completed boolean default false
);

-- Fix: Drop policy before creating to avoid 42710 error
alter table public.task_reviews enable row level security;
drop policy if exists "Enable access for authenticated users" on public.task_reviews;
create policy "Enable access for authenticated users" on public.task_reviews for all using (auth.role() = 'authenticated');

-- ==========================================
-- 11. TASK LOGS (Audit Trail / Delays)
-- ==========================================
create table if not exists public.task_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null, -- Who did it
  action text not null, -- 'DELAYED', 'STATUS_CHANGE', etc.
  details text, -- "Changed date from A to B"
  reason text -- "Sick", "Client Change"
);

-- Fix: Drop policy before creating
alter table public.task_logs enable row level security;
drop policy if exists "Enable access for authenticated users" on public.task_logs;
create policy "Enable access for authenticated users" on public.task_logs for all using (auth.role() = 'authenticated');

-- ==========================================
-- 13. TEAM MESSAGES (Chat System)
-- ==========================================
create table if not exists public.team_messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  content text not null,
  user_id uuid references public.profiles(id) on delete set null, -- Nullable for Bot
  is_bot boolean default false,
  message_type text default 'TEXT' -- 'TEXT', 'TASK_CREATED'
);

alter table public.team_messages enable row level security;

-- Fix: Drop existing policies first
drop policy if exists "Enable read access for authenticated users" on public.team_messages;
drop policy if exists "Enable insert access for authenticated users" on public.team_messages;

create policy "Enable read access for authenticated users" on public.team_messages
  for select
  using (auth.role() = 'authenticated');

create policy "Enable insert access for authenticated users" on public.team_messages
  for insert
  with check (auth.role() = 'authenticated');

-- ==========================================
-- 14. TASK COMMENTS
-- ==========================================
create table if not exists public.task_comments (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  content text not null,
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null
);

alter table public.task_comments enable row level security;

drop policy if exists "Enable read access for authenticated users" on public.task_comments;
drop policy if exists "Enable insert access for authenticated users" on public.task_comments;

create policy "Enable read access for authenticated users" on public.task_comments
  for select using (auth.role() = 'authenticated');

create policy "Enable insert access for authenticated users" on public.task_comments
  for insert with check (auth.role() = 'authenticated');

-- ==========================================
-- UPDATE: Add Performance Column
-- ==========================================
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS performance JSONB;

-- ==========================================
-- UPDATE: Weekly Quests (Add Tracking Columns)
-- ==========================================
create table if not exists public.weekly_quests (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  week_start_date date not null,
  channel_id uuid references public.channels(id) on delete set null,
  target_count integer not null default 1,
  
  -- NEW TRACKING COLUMNS
  target_platform text, -- e.g. 'TIKTOK', 'FACEBOOK'
  target_format text,   -- e.g. 'REELS', 'SHORT_FORM' (from Master Data)
  target_status text,   -- e.g. 'DONE', 'PUBLISHED' (from Master Data)
  
  -- HYBRID COLUMNS
  quest_type text default 'AUTO', -- 'AUTO', 'MANUAL'
  manual_progress integer default 0
);

alter table public.weekly_quests enable row level security;
drop policy if exists "Enable all access for authenticated users" on public.weekly_quests;
create policy "Enable all access for authenticated users" on public.weekly_quests for all using (auth.role() = 'authenticated');

-- ==========================================
-- 15. REWARDS (Master Data for Rewards)
-- ==========================================
create table if not exists public.rewards (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  cost integer not null default 100,
  icon text, -- Emoji or Icon name
  is_active boolean default true
);

alter table public.rewards enable row level security;
drop policy if exists "Enable all access for rewards" on public.rewards;
create policy "Enable all access for rewards" on public.rewards for all using (auth.role() = 'authenticated');

-- ==========================================
-- 16. REDEMPTIONS (Transaction Log)
-- ==========================================
create table if not exists public.redemptions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  reward_id uuid references public.rewards(id) on delete cascade not null,
  reward_snapshot jsonb -- Snapshot of reward details at time of redemption
);

alter table public.redemptions enable row level security;
drop policy if exists "Enable all access for redemptions" on public.redemptions;
create policy "Enable all access for redemptions" on public.redemptions for all using (auth.role() = 'authenticated');

-- ==========================================
-- 17. GOALS (Monthly/Yearly Goals)
-- ==========================================
create table if not exists public.goals (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  platform text default 'ALL', -- 'YOUTUBE', 'FACEBOOK', etc.
  current_value integer default 0,
  target_value integer default 0,
  deadline date not null,
  channel_id uuid references public.channels(id) on delete set null,
  is_archived boolean default false
);

alter table public.goals enable row level security;
drop policy if exists "Enable all access for goals" on public.goals;
create policy "Enable all access for goals" on public.goals for all using (auth.role() = 'authenticated');
