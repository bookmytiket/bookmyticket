-- Event Campaigns Table
CREATE TABLE IF NOT EXISTS event_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    campaign_name TEXT NOT NULL,
    campaign_type TEXT NOT NULL, -- 'email', 'whatsapp', 'push', 'in_app', 'all'
    audience_type TEXT NOT NULL, -- 'all', 'subscribers', 'category', 'location'
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Subscribers Table
CREATE TABLE IF NOT EXISTS notification_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT,
    email_enabled BOOLEAN DEFAULT TRUE,
    whatsapp_enabled BOOLEAN DEFAULT FALSE,
    push_enabled BOOLEAN DEFAULT TRUE,
    marketing_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- User Interest Profiles Table
CREATE TABLE IF NOT EXISTS user_interest_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    favorite_categories TEXT[] DEFAULT '{}',
    preferred_cities TEXT[] DEFAULT '{}',
    preferred_states TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Notification Queue Table (might already exist, so using IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES event_campaigns(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    channel TEXT NOT NULL, -- 'email', 'whatsapp', 'push', 'in_app'
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'queued', -- 'queued', 'processing', 'sent', 'failed'
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Delivery Logs Table
CREATE TABLE IF NOT EXISTS notification_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES event_campaigns(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    channel TEXT NOT NULL,
    delivery_status TEXT NOT NULL, -- 'delivered', 'opened', 'clicked', 'bounced', 'failed'
    provider_response JSONB,
    opened BOOLEAN DEFAULT FALSE,
    clicked BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp Templates Table
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT NOT NULL UNIQUE,
    template_content TEXT NOT NULL,
    template_status TEXT DEFAULT 'pending_approval', -- 'approved', 'pending_approval', 'rejected'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push Notifications Table
CREATE TABLE IF NOT EXISTS push_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    deeplink TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- In-App Notifications Table
CREATE TABLE IF NOT EXISTS in_app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'event_invite', 'promo', 'system', 'booking'
    entity_id UUID, -- References event_id or booking_id
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE event_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interest_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;

-- Admins and Service Roles can access everything
CREATE POLICY "Enable all for admins on event_campaigns" ON event_campaigns FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Enable all for admins on notification_subscribers" ON notification_subscribers FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Enable all for admins on user_interest_profiles" ON user_interest_profiles FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Enable all for admins on notification_delivery_logs" ON notification_delivery_logs FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Enable all for admins on whatsapp_templates" ON whatsapp_templates FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Enable all for admins on push_notifications" ON push_notifications FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Enable all for admins on in_app_notifications" ON in_app_notifications FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Users can access their own data
CREATE POLICY "Users can manage their own subscriber settings" ON notification_subscribers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own interest profiles" ON user_interest_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own delivery logs" ON notification_delivery_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own push notifications" ON push_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view and update their own in-app notifications" ON in_app_notifications FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_event_campaigns_modtime BEFORE UPDATE ON event_campaigns FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_notification_subscribers_modtime BEFORE UPDATE ON notification_subscribers FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_user_interest_profiles_modtime BEFORE UPDATE ON user_interest_profiles FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_whatsapp_templates_modtime BEFORE UPDATE ON whatsapp_templates FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
