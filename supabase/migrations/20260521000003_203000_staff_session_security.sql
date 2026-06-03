-- 1. Create staff_active_sessions table
CREATE TABLE IF NOT EXISTS public.staff_active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE,
    device_id TEXT NOT NULL,
    device_name TEXT,
    device_type TEXT,
    os_name TEXT,
    browser_name TEXT,
    ip_address TEXT,
    user_agent TEXT,
    session_status TEXT DEFAULT 'active', -- active, terminated, expired, logged_out, blocked
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create staff_login_history table
CREATE TABLE IF NOT EXISTS public.staff_login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_id TEXT,
    ip_address TEXT,
    login_status TEXT, -- success, blocked, terminated_old_session, failed, logout
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create admin_security_settings table
CREATE TABLE IF NOT EXISTS public.admin_security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    single_device_login_enabled BOOLEAN DEFAULT true,
    login_policy TEXT DEFAULT 'replace_existing', -- strict_block, replace_existing
    heartbeat_interval INTEGER DEFAULT 30,
    session_timeout_minutes INTEGER DEFAULT 30,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default admin settings if empty
INSERT INTO public.admin_security_settings (single_device_login_enabled, login_policy) 
SELECT true, 'replace_existing' 
WHERE NOT EXISTS (SELECT 1 FROM public.admin_security_settings);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.staff_active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_security_settings ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Active Sessions: Staff can read/update their own sessions
DROP POLICY IF EXISTS "Staff can view their own sessions" ON public.staff_active_sessions;
CREATE POLICY "Staff can view their own sessions" ON public.staff_active_sessions FOR SELECT USING (auth.uid() = staff_user_id);
DROP POLICY IF EXISTS "Staff can update their own sessions" ON public.staff_active_sessions;
CREATE POLICY "Staff can update their own sessions" ON public.staff_active_sessions FOR UPDATE USING (auth.uid() = staff_user_id);
DROP POLICY IF EXISTS "Staff can insert their own sessions" ON public.staff_active_sessions;
CREATE POLICY "Staff can insert their own sessions" ON public.staff_active_sessions FOR INSERT WITH CHECK (auth.uid() = staff_user_id);

-- Login History: Staff can insert and view their own history
DROP POLICY IF EXISTS "Staff can view their own login history" ON public.staff_login_history;
CREATE POLICY "Staff can view their own login history" ON public.staff_login_history FOR SELECT USING (auth.uid() = staff_user_id);
DROP POLICY IF EXISTS "Staff can insert their own login history" ON public.staff_login_history;
CREATE POLICY "Staff can insert their own login history" ON public.staff_login_history FOR INSERT WITH CHECK (auth.uid() = staff_user_id);

-- Admin Security Settings: Anyone can read settings (needed for login check)
DROP POLICY IF EXISTS "Anyone can read admin security settings" ON public.admin_security_settings;
CREATE POLICY "Anyone can read admin security settings" ON public.admin_security_settings FOR SELECT USING (true);

-- Enable real-time for staff_active_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_active_sessions;

-- Notify pgrst
NOTIFY pgrst, 'reload schema';
