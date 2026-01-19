
-- ==========================================
-- 12. DUTY CONFIGS (Master Data for Roster)
-- ==========================================

-- Create a table to store rules for each day of the week (1=Mon, 5=Fri)
create table if not exists public.duty_configs (
  day_of_week integer primary key, -- 1=Monday, 2=Tuesday, ..., 5=Friday
  required_people integer default 1, -- How many people needed
  task_titles text[] default array['เวรทำความสะอาดทั่วไป'] -- Array of specific task names
);

-- Initial Data Seed (Monday - Friday)
insert into public.duty_configs (day_of_week, required_people, task_titles)
values 
  (1, 2, array['กวาดพื้น', 'ทิ้งขยะ']), -- Monday: 2 people
  (2, 1, array['ทำความสะอาดทั่วไป']), -- Tuesday: 1 person
  (3, 1, array['ทำความสะอาดทั่วไป']), -- Wednesday
  (4, 1, array['ทำความสะอาดทั่วไป']), -- Thursday
  (5, 2, array['ล้างตู้เย็น', 'เคลียร์พื้นที่ส่วนกลาง']) -- Friday: Big Cleaning
on conflict (day_of_week) do nothing;

-- RLS Policies
alter table public.duty_configs enable row level security;
create policy "Enable read access for all users" on public.duty_configs for select using (true);
create policy "Enable write access for authenticated users" on public.duty_configs for all using (auth.role() = 'authenticated');
