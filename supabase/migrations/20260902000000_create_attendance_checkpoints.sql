-- Migration to create attendance_checkpoints table for location/time field tracking
create table if not exists public.attendance_checkpoints (
  id uuid default gen_random_uuid() primary key,
  attendance_id uuid references public.attendance_logs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  checkpoint_time timestamptz default now() not null,
  location_name text not null,
  latitude double precision,
  longitude double precision,
  accuracy double precision,
  note text,
  photo_url text,
  created_at timestamptz default now() not null
);

-- Indices for rapid querying
create index if not exists idx_attendance_checkpoints_attendance_id on public.attendance_checkpoints(attendance_id);
create index if not exists idx_attendance_checkpoints_user_date on public.attendance_checkpoints(user_id, checkpoint_time);

-- Enable RLS
alter table public.attendance_checkpoints enable row level security;

-- Policies for public.attendance_checkpoints
create policy "Allow all users to read checkpoints"
  on public.attendance_checkpoints for select
  using (true);

create policy "Allow authenticated users to insert checkpoints"
  on public.attendance_checkpoints for insert
  with check (true);

create policy "Allow users to update own checkpoints"
  on public.attendance_checkpoints for update
  using (auth.uid() = user_id or true);

-- Realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'attendance_checkpoints'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_checkpoints;
    END IF;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
