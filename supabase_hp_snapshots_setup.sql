-- 1. Create the hp_snapshots table
CREATE TABLE IF NOT EXISTS public.hp_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL, -- เช่น '2026-07-01' แทนจุดเริ่มต้นของเดือนกรกฎาคม 2026
    hp_value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE (user_id, snapshot_date)
);

-- Enable RLS and add basic policies so anyone authenticated can read snapshots
ALTER TABLE public.hp_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to hp_snapshots" 
    ON public.hp_snapshots FOR SELECT 
    USING (true);

CREATE POLICY "Allow authenticated insert/update access to hp_snapshots" 
    ON public.hp_snapshots FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update access to hp_snapshots" 
    ON public.hp_snapshots FOR UPDATE 
    USING (true);

-- 2. ระบบอัตโนมัติด้วย Supabase pg_cron
-- กำหนดให้รันสคริปต์เวลา 00:00:01 น. ของทุกวันที่ 1 (เวลาประเทศไทย) เพื่อบันทึกค่า HP ปัจจุบันของทุกคนเก็บไว้เป็นค่าตั้งต้นของเดือนใหม่:
SELECT cron.schedule(
    'snapshot-monthly-hp',
    '1 0 1 * *', -- รันเวลา 00:00:01 น. ของวันที่ 1 ของทุกเดือน
    $$
    INSERT INTO public.hp_snapshots (user_id, snapshot_date, hp_value)
    SELECT id, DATE_TRUNC('month', timezone('Asia/Bangkok'::text, now()))::DATE, hp
    FROM public.profiles
    WHERE is_active = true
    ON CONFLICT (user_id, snapshot_date) DO UPDATE 
    SET hp_value = EXCLUDED.hp_value;
    $$
);
