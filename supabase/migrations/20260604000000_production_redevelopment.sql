CREATE TABLE IF NOT EXISTS organizer_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organizer_id UUID REFERENCES organisers(id) ON DELETE CASCADE,
    total_events INT DEFAULT 0,
    total_bookings INT DEFAULT 0,
    total_revenue NUMERIC DEFAULT 0,
    commission_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    total_users INT DEFAULT 0,
    active_users INT DEFAULT 0,
    mobile_users INT DEFAULT 0,
    web_users INT DEFAULT 0,
    signup_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS admin_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_name TEXT NOT NULL,
    category TEXT,
    organizer_type TEXT,
    publish_status TEXT DEFAULT 'Draft',
    created_by_admin UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS professional_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_name TEXT NOT NULL,
    category TEXT,
    provider_name TEXT,
    phone TEXT,
    email TEXT,
    pricing NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS onboarding_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_type TEXT,
    verification_status TEXT DEFAULT 'Pending',
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
