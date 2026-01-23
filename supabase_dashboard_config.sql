
-- ==========================================
-- 18. DASHBOARD CONFIGS (Dynamic Grouping)
-- ==========================================
create table if not exists public.dashboard_configs (
  id uuid default gen_random_uuid() primary key,
  key text not null unique, -- 'GROUP_1', 'GROUP_2', 'GROUP_3', 'GROUP_4'
  label text not null,
  icon text default 'circle',
  color_theme text default 'blue', -- 'blue', 'orange', 'pink', 'green'
  status_keys text[] default '{}', -- Stores array of Master Data Status Keys e.g. ['IDEA', 'SCRIPT']
  sort_order integer default 0
);

-- Enable RLS
alter table public.dashboard_configs enable row level security;
create policy "Enable all access for authenticated users" on public.dashboard_configs for all using (auth.role() = 'authenticated');

-- Initial Seed Data (Default Groups)
insert into public.dashboard_configs (key, label, icon, color_theme, status_keys, sort_order)
values 
  ('GROUP_1', 'วางแผน (Idea & Script)', 'list-todo', 'amber', ARRAY['IDEA', 'SCRIPT', 'TODO'], 1),
  ('GROUP_2', 'กำลังผลิต (Production)', 'film', 'blue', ARRAY['SHOOTING', 'EDIT_CLIP', 'DOING'], 2),
  ('GROUP_3', 'ตรวจงาน (Feedback)', 'message-circle', 'pink', ARRAY['FEEDBACK', 'EDIT_DRAFT_1', 'FEEDBACK_1', 'EDIT_DRAFT_2'], 3),
  ('GROUP_4', 'เสร็จสิ้น (Ready/Done)', 'check-circle-2', 'emerald', ARRAY['APPROVE', 'DONE'], 4)
on conflict (key) do nothing;
