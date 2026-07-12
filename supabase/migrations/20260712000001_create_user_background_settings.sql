-- Migration to create user_background_settings table for persisting wallpapers and background options.
CREATE TABLE IF NOT EXISTS public.user_background_settings (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    background_theme TEXT NOT NULL DEFAULT 'default', -- สำหรับ ScriptHubView
    admin_dashboard_season TEXT DEFAULT NULL,          -- สำหรับ AdminDashboard (ฤดูกาล)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_background_settings ENABLE ROW LEVEL SECURITY;

-- Policies for user_background_settings
CREATE POLICY "Allow individuals to select their own background settings" ON public.user_background_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow individuals to insert their own background settings" ON public.user_background_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow individuals to update their own background settings" ON public.user_background_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow individuals to delete their own background settings" ON public.user_background_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON TABLE public.user_background_settings TO anon;
GRANT ALL ON TABLE public.user_background_settings TO authenticated;
GRANT ALL ON TABLE public.user_background_settings TO service_role;

-- Notify postgrest schema reload
NOTIFY pgrst, 'reload schema';
