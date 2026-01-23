
-- ==========================================
-- JUIJUI LIFE: GAMIFICATION SCHEMA
-- ==========================================

-- 1. Update Profiles (Add HP Stats)
-- xp, level, available_points (JP) already exist from previous updates
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS hp INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS max_hp INTEGER DEFAULT 100;

-- 2. Game Transactions (Log everything for Audit)
-- Keeps track of why HP/XP/JP changed (e.g., "Late Task", "Clean Duty")
CREATE TABLE IF NOT EXISTS public.game_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL, -- 'TASK_COMPLETE', 'LATE_SUBMIT', 'DUTY_MISSED', 'BUY_ITEM'
    related_id UUID, -- Optional: TaskID or DutyID
    xp_change INTEGER DEFAULT 0,
    hp_change INTEGER DEFAULT 0,
    jp_change INTEGER DEFAULT 0, -- Money change
    description TEXT
);

-- 3. Item Shop (Master Data)
CREATE TABLE IF NOT EXISTS public.shop_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    icon TEXT, -- Emoji
    effect_type TEXT NOT NULL, -- 'HEAL_HP', 'SKIP_DUTY', 'REMOVE_LATE'
    effect_value INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- 4. User Inventory (Owned Items)
CREATE TABLE IF NOT EXISTS public.user_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    item_id UUID REFERENCES public.shop_items(id) ON DELETE CASCADE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE
);

-- Seed Shop Items
INSERT INTO public.shop_items (name, description, price, icon, effect_type, effect_value) VALUES
('ยาแก้ปวดหลัง (Heal Potion)', 'ฟื้นฟู HP +20', 100, '💖', 'HEAL_HP', 20),
('บัตรกันเวร (Duty Shield)', 'ใช้ข้ามเวรทำความสะอาดได้ 1 ครั้ง', 500, '🛡️', 'SKIP_DUTY', 1),
('นาฬิกาย้อนเวลา (Time Warp)', 'ลบสถานะส่งงานช้าได้ 1 ครั้ง', 1000, '⏰', 'REMOVE_LATE', 1)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.game_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read for authenticated" ON public.game_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for system" ON public.game_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read for authenticated" ON public.shop_items FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read for authenticated" ON public.user_inventory FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable write for authenticated" ON public.user_inventory FOR ALL USING (auth.role() = 'authenticated');

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
