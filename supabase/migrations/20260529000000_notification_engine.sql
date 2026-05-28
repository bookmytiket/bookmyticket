-- BookMyTicket Production Notification Engine Schema

-- 1. Email Branding Settings
CREATE TABLE IF NOT EXISTS public.email_branding_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logo_url TEXT,
    primary_color TEXT DEFAULT '#1E40AF',
    secondary_color TEXT DEFAULT '#3B82F6',
    footer_text TEXT,
    support_email TEXT DEFAULT 'hello@bookmyticket.net',
    legal_notice TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Email Templates
-- If it exists, let's just make sure it has the required columns
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key TEXT UNIQUE NOT NULL,
    template_name TEXT NOT NULL,
    subject_template TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- For migration purposes, if 'identifier' exists instead of 'template_key' (from old schema)
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_templates' AND column_name='identifier') THEN
    ALTER TABLE public.email_templates RENAME COLUMN identifier TO template_key;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_templates' AND column_name='body') THEN
    ALTER TABLE public.email_templates RENAME COLUMN body TO html_content;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_templates' AND column_name='subject') THEN
    ALTER TABLE public.email_templates RENAME COLUMN subject TO subject_template;
  END IF;
  
  -- Add new columns if the table existed previously
  ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS template_name TEXT DEFAULT 'Unnamed Template';
  ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS text_content TEXT;
  ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
END $$;

-- 3. Email Logs
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    recipient_email TEXT NOT NULL,
    template_key TEXT,
    subject TEXT,
    status TEXT DEFAULT 'queued',
    provider_message_id TEXT,
    error_message TEXT,
    payload_snapshot JSONB,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Notification Queue
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    channel TEXT NOT NULL DEFAULT 'email',
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- 5. Notification Preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    marketing_enabled BOOLEAN DEFAULT false,
    reminder_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_branding_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read branding" ON public.email_branding_settings FOR SELECT USING (true);
CREATE POLICY "Admin full access branding" ON public.email_branding_settings FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin full access templates" ON public.email_templates FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Public read active templates" ON public.email_templates FOR SELECT USING (is_active = true);

CREATE POLICY "Admin full access email_logs" ON public.email_logs FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Users read own logs" ON public.email_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin full access queue" ON public.notification_queue FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Service role full queue" ON public.notification_queue FOR ALL USING (true);

CREATE POLICY "Users manage own preferences" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id);

-- 6. Trigger for Welcome Email on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user_welcome()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification preferences
  INSERT INTO public.notification_preferences (user_id) VALUES (NEW.id);
  
  -- Queue Welcome Email
  INSERT INTO public.notification_queue (
    user_id,
    channel,
    event_type,
    payload
  ) VALUES (
    NEW.id,
    'email',
    'welcome',
    jsonb_build_object(
      'to', NEW.email,
      'username', COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User')
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid errors on rerun
DROP TRIGGER IF EXISTS on_auth_user_created_welcome ON auth.users;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created_welcome
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_welcome();
