
-- ==========================================
-- GOAL ENHANCEMENT: GUARDIANS & BOOSTS
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Goal Guardians (Who is responsible?)
CREATE TABLE IF NOT EXISTS public.goal_owners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(goal_id, user_id)
);

-- 2. Goal Boosts (Cheering system)
CREATE TABLE IF NOT EXISTS public.goal_boosts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(goal_id, user_id)
);

-- 3. Add Reward info to Goals
ALTER TABLE public.goals 
ADD COLUMN IF NOT EXISTS reward_xp INTEGER DEFAULT 500,
ADD COLUMN IF NOT EXISTS reward_coin INTEGER DEFAULT 100;

-- Enable RLS
ALTER TABLE public.goal_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_boosts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable all access for authenticated users" ON public.goal_owners FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON public.goal_boosts FOR ALL USING (auth.role() = 'authenticated');

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
