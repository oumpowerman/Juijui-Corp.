
-- ==========================================
-- MEETING LOGS SYSTEM
-- ==========================================

CREATE TABLE IF NOT EXISTS public.meeting_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    content TEXT,
    attendees TEXT[] DEFAULT '{}', -- Array of User IDs
    tags TEXT[] DEFAULT '{}',
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.meeting_logs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.meeting_logs;
CREATE POLICY "Enable all access for authenticated users" ON public.meeting_logs FOR ALL USING (auth.role() = 'authenticated');

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
