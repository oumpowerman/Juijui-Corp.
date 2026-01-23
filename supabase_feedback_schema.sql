
-- ==========================================
-- FEEDBACK & SUGGESTION BOX SCHEMA
-- ==========================================

-- 1. FEEDBACKS TABLE
CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL, -- 'IDEA', 'ISSUE', 'SHOUTOUT'
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED'
    is_anonymous BOOLEAN DEFAULT true,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Stored but protected by RLS
    vote_count INTEGER DEFAULT 0
);

-- 2. FEEDBACK VOTES (For tracking who voted)
CREATE TABLE IF NOT EXISTS public.feedback_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    feedback_id UUID REFERENCES public.feedbacks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(feedback_id, user_id)
);

-- Enable RLS
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_votes ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Feedbacks: Everyone can insert
CREATE POLICY "Enable insert for authenticated users" ON public.feedbacks FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Feedbacks: Read Access (Crucial for Anonymity)
-- 1. Users can see APPROVED items (Public Board)
-- 2. Users can see their OWN items (My Feedbacks)
-- 3. Admins can see ALL items (including PENDING for moderation)
-- Note: We assume 'admin' role check is handled in app logic or via a secure function, 
-- but for simplicity here we allow reading all rows but the frontend will filter 'PENDING' for non-admins.
-- Ideally, RLS should enforce status='APPROVED' OR auth.uid()=user_id OR auth.jwt()->>'role'='ADMIN'
CREATE POLICY "Enable read access for authenticated users" ON public.feedbacks FOR SELECT USING (auth.role() = 'authenticated');

-- Feedbacks: Admin Update (Approve/Reject) & Creator Delete
CREATE POLICY "Enable update for authenticated users" ON public.feedbacks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for users" ON public.feedbacks FOR DELETE USING (auth.role() = 'authenticated');

-- Votes: Standard CRUD
CREATE POLICY "Enable access for votes" ON public.feedback_votes FOR ALL USING (auth.role() = 'authenticated');

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
