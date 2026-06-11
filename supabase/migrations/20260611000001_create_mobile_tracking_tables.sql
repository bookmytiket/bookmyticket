-- Create user_devices table
CREATE TABLE IF NOT EXISTS public.user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_model TEXT,
    os_version TEXT,
    app_version TEXT,
    push_token TEXT,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure a user can have multiple devices, but combination is unique
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_device ON public.user_devices(user_id, device_id);

-- Create user_dashboard_preferences table
CREATE TABLE IF NOT EXISTS public.user_dashboard_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    preferences JSONB DEFAULT '{}'::jsonb,
    theme TEXT DEFAULT 'system',
    notifications_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Allow RLS but open for authenticated users (or service role)
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dashboard_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own devices" ON public.user_devices
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own preferences" ON public.user_dashboard_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Also allow service role access
CREATE POLICY "Service role can manage devices" ON public.user_devices
    FOR ALL USING (true);

CREATE POLICY "Service role can manage preferences" ON public.user_dashboard_preferences
    FOR ALL USING (true);
