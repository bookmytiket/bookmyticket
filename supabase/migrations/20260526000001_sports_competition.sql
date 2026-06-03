-- Competition Categories
CREATE TABLE IF NOT EXISTS competition_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    category_name TEXT NOT NULL,
    dob_from DATE,
    dob_to DATE,
    min_age INT,
    max_age INT,
    gender TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competition Events (Races/Matches)
CREATE TABLE IF NOT EXISTS competition_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    distance TEXT,
    fee DECIMAL(10,2) DEFAULT 0,
    max_participants INT,
    gender TEXT,
    status TEXT DEFAULT 'Open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participants
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    dob DATE,
    gender TEXT,
    guardian_name TEXT,
    school_name TEXT,
    medical_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participant Documents
CREATE TABLE IF NOT EXISTS participant_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    verification_status TEXT DEFAULT 'Pending',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registrations
CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    registration_mode TEXT NOT NULL, -- Individual, Relay
    payment_status TEXT DEFAULT 'Pending',
    booking_status TEXT DEFAULT 'Confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registration Items
CREATE TABLE IF NOT EXISTS registration_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
    competition_event_id UUID REFERENCES competition_events(id) ON DELETE CASCADE,
    price DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relay Teams
CREATE TABLE IF NOT EXISTS relay_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
    team_name TEXT NOT NULL,
    captain_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relay Members
CREATE TABLE IF NOT EXISTS relay_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relay_team_id UUID REFERENCES relay_teams(id) ON DELETE CASCADE,
    member_name TEXT NOT NULL,
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QR Tickets
CREATE TABLE IF NOT EXISTS qr_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
    qr_token TEXT NOT NULL UNIQUE,
    ticket_status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Checkins
CREATE TABLE IF NOT EXISTS checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verification_status TEXT DEFAULT 'Checked-In',
    remarks TEXT,
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and Policies
ALTER TABLE competition_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE relay_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE relay_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

-- Public read policies for event configs
CREATE POLICY "Public read competition_categories" ON competition_categories FOR SELECT USING (true);
CREATE POLICY "Public read competition_events" ON competition_events FOR SELECT USING (true);

-- Authenticated User Policies
CREATE POLICY "Users can insert their own participants" ON participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read their own participants" ON participants FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can read their own registrations" ON registrations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own registrations" ON registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Competition Types
CREATE TABLE IF NOT EXISTS competition_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE competition_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read competition_types" ON competition_types FOR SELECT USING (true);

INSERT INTO competition_types (name) VALUES
    ('Swimming Competition'),
    ('Marathon'),
    ('Cycling Race'),
    ('Athletics Meet'),
    ('Cricket Tournament'),
    ('Football Tournament'),
    ('Badminton Championship'),
    ('Chess Tournament'),
    ('Dance Competition'),
    ('Talent Show'),
    ('School Sports Meet'),
    ('College Championship'),
    ('Kids Competition'),
    ('Open Championship'),
    ('State/National Competition')
ON CONFLICT (name) DO NOTHING;
