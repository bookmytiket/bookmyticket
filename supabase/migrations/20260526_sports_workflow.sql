-- Migration: Sports Event Category-Based Registration Workflow
-- Description: Core tables to support dynamic sports workflows (Badminton, Cricket, Marathon, etc.)

-- 1. Sports Events Configuration
CREATE TABLE IF NOT EXISTS sports_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    sport_type TEXT NOT NULL, -- 'Badminton Championship', 'Marathon', etc.
    competition_format TEXT, -- 'Knockout', 'League', 'Time-Trial'
    team_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Sports Categories (Age & Gender validation)
CREATE TABLE IF NOT EXISTS sports_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sports_event_id UUID REFERENCES sports_events(id) ON DELETE CASCADE,
    category_name TEXT NOT NULL, -- 'U-12', 'Senior', 'Open'
    dob_from DATE,
    dob_to DATE,
    min_age INT,
    max_age INT,
    gender TEXT, -- 'Male', 'Female', 'Mixed', 'All'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Sports Match Types (Singles, Doubles, Team Entry)
CREATE TABLE IF NOT EXISTS sports_match_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sports_event_id UUID REFERENCES sports_events(id) ON DELETE CASCADE,
    match_type TEXT NOT NULL, -- 'Men Singles', 'Mixed Doubles', 'Team Tournament'
    entry_mode TEXT NOT NULL, -- 'Individual', 'Doubles', 'Team'
    team_size INT DEFAULT 1,
    price DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'Open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Participants (Player Database) - Add missing columns if they don't exist
ALTER TABLE participants 
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS state TEXT,
    ADD COLUMN IF NOT EXISTS club_name TEXT,
    ADD COLUMN IF NOT EXISTS coach_name TEXT,
    ADD COLUMN IF NOT EXISTS blood_group TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
    ADD COLUMN IF NOT EXISTS aadhaar_number TEXT;

-- 5. Participant Documents (KYC / Medical)
-- Already exists, ensure it is ready
ALTER TABLE participant_documents
    ADD COLUMN IF NOT EXISTS document_type TEXT,
    ADD COLUMN IF NOT EXISTS file_url TEXT,
    ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'Pending';

-- 6. Team Registrations
CREATE TABLE IF NOT EXISTS team_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sports_event_id UUID REFERENCES sports_events(id) ON DELETE CASCADE,
    team_name TEXT NOT NULL,
    captain_name TEXT,
    manager_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Team Members
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_registration_id UUID REFERENCES team_registrations(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'Player', -- 'Captain', 'Player', 'Substitute'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Sports Registrations (Booking Record)
CREATE TABLE IF NOT EXISTS sports_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sports_event_id UUID REFERENCES sports_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE, -- For individual entry
    team_registration_id UUID REFERENCES team_registrations(id) ON DELETE CASCADE, -- For team entry
    match_type_id UUID REFERENCES sports_match_types(id) ON DELETE CASCADE,
    payment_status TEXT DEFAULT 'Pending',
    booking_status TEXT DEFAULT 'Confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID REFERENCES sports_registrations(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    gateway TEXT NOT NULL, -- 'Razorpay', 'UPI', 'Stripe'
    status TEXT DEFAULT 'Pending',
    transaction_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. QR Tickets
-- Already exists, just ensure columns
ALTER TABLE qr_tickets
    ADD COLUMN IF NOT EXISTS registration_id UUID REFERENCES sports_registrations(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS qr_token TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';

-- 11. Checkins
-- Already exists, ensure columns
ALTER TABLE checkins
    ADD COLUMN IF NOT EXISTS registration_id UUID REFERENCES sports_registrations(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'Checked-In',
    ADD COLUMN IF NOT EXISTS remarks TEXT;

-- RLS & Security

ALTER TABLE sports_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_match_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

-- Public Read Policies (for event configuration)
DROP POLICY IF EXISTS "Public read sports_events" ON sports_events;
CREATE POLICY "Public read sports_events" ON sports_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read sports_categories" ON sports_categories;
CREATE POLICY "Public read sports_categories" ON sports_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read sports_match_types" ON sports_match_types;
CREATE POLICY "Public read sports_match_types" ON sports_match_types FOR SELECT USING (true);

-- Authenticated Users Policies (My Bookings / My Participants)
DROP POLICY IF EXISTS "Users can insert their own participants" ON participants;
CREATE POLICY "Users can insert their own participants" ON participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own participants" ON participants;
CREATE POLICY "Users can read their own participants" ON participants FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own documents" ON participant_documents;
CREATE POLICY "Users can insert their own documents" ON participant_documents FOR INSERT TO authenticated WITH CHECK (
    participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can read their own documents" ON participant_documents;
CREATE POLICY "Users can read their own documents" ON participant_documents FOR SELECT TO authenticated USING (
    participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can read their own sports registrations" ON sports_registrations;
CREATE POLICY "Users can read their own sports registrations" ON sports_registrations FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sports registrations" ON sports_registrations;
CREATE POLICY "Users can insert their own sports registrations" ON sports_registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
