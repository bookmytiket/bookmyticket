-- Tournament Module Schema

-- 1. Tournament Events Master Table
CREATE TABLE IF NOT EXISTS tournament_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organiser_id UUID REFERENCES organisers(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    sport_type TEXT NOT NULL, -- cricket, football, etc.
    tournament_format TEXT NOT NULL, -- knockout, league, etc.
    description TEXT,
    rules_regulations TEXT,
    terms_conditions TEXT,
    venue_name TEXT,
    address TEXT,
    city_id UUID,
    banner_url TEXT,
    gallery_urls TEXT[],
    event_start_at TIMESTAMP WITH TIME ZONE,
    event_end_at TIMESTAMP WITH TIME ZONE,
    registration_start_at TIMESTAMP WITH TIME ZONE,
    registration_end_at TIMESTAMP WITH TIME ZONE,
    registration_fee NUMERIC DEFAULT 0,
    min_team_size INTEGER DEFAULT 1,
    max_team_size INTEGER DEFAULT 20,
    substitutes_allowed BOOLEAN DEFAULT TRUE,
    audience_free_access BOOLEAN DEFAULT TRUE,
    qr_required_for_audience BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'draft', -- draft, published, ongoing, completed
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tournament Teams Table
CREATE TABLE IF NOT EXISTS tournament_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_event_id UUID REFERENCES tournament_events(id) ON DELETE CASCADE,
    team_name TEXT NOT NULL,
    captain_name TEXT NOT NULL,
    captain_mobile TEXT NOT NULL,
    captain_email TEXT,
    team_logo_url TEXT,
    city_id UUID,
    payment_status TEXT DEFAULT 'pending', -- pending, paid, failed, waived
    registration_status TEXT DEFAULT 'pending_approval', -- pending_approval, approved, rejected
    team_qr_code TEXT UNIQUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tournament Team Members Table
CREATE TABLE IF NOT EXISTS tournament_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES tournament_teams(id) ON DELETE CASCADE,
    member_name TEXT NOT NULL,
    role TEXT DEFAULT 'player', -- captain, vice captain, player, substitute, coach, manager
    age INTEGER,
    jersey_number TEXT,
    mobile TEXT,
    photo_url TEXT,
    id_proof_url TEXT,
    emergency_contact TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tournament Payments Table
CREATE TABLE IF NOT EXISTS tournament_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES tournament_teams(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    payment_gateway TEXT, -- razorpay, cashfree, upi
    transaction_id TEXT UNIQUE,
    payment_status TEXT DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tournament Matches / Fixtures
CREATE TABLE IF NOT EXISTS tournament_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_event_id UUID REFERENCES tournament_events(id) ON DELETE CASCADE,
    team_a_id UUID REFERENCES tournament_teams(id),
    team_b_id UUID REFERENCES tournament_teams(id),
    match_date TIMESTAMP WITH TIME ZONE,
    ground_name TEXT,
    match_status TEXT DEFAULT 'scheduled', -- scheduled, ongoing, completed, cancelled
    winner_team_id UUID REFERENCES tournament_teams(id),
    score_data JSONB DEFAULT '{}'::jsonb,
    round_number INTEGER,
    bracket_index INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tournament Groups
CREATE TABLE IF NOT EXISTS tournament_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_event_id UUID REFERENCES tournament_events(id) ON DELETE CASCADE,
    group_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tournament Group Teams Mapping
CREATE TABLE IF NOT EXISTS tournament_group_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES tournament_groups(id) ON DELETE CASCADE,
    team_id UUID REFERENCES tournament_teams(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    matches_lost INTEGER DEFAULT 0,
    net_run_rate NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tournament QR Scans / Validation
CREATE TABLE IF NOT EXISTS tournament_qr_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_code TEXT NOT NULL,
    scan_type TEXT NOT NULL, -- team_entry, player_entry, audience_entry
    tournament_event_id UUID REFERENCES tournament_events(id) ON DELETE CASCADE,
    team_id UUID REFERENCES tournament_teams(id),
    scanned_by UUID, -- user_id of the staff
    scan_status TEXT, -- success, failure
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Audience Visitors Table
CREATE TABLE IF NOT EXISTS audience_visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_event_id UUID REFERENCES tournament_events(id) ON DELETE CASCADE,
    visitor_name TEXT,
    mobile TEXT,
    qr_code TEXT UNIQUE,
    checked_in BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tournament_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_group_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_qr_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_visitors ENABLE ROW LEVEL SECURITY;

-- Basic Policies
DROP POLICY IF EXISTS "Organisers can manage their tournaments" ON tournament_events;
CREATE POLICY "Organisers can manage their tournaments" ON tournament_events FOR ALL USING (auth.uid() = organiser_id);

DROP POLICY IF EXISTS "Everyone can view published tournaments" ON tournament_events;
CREATE POLICY "Everyone can view published tournaments" ON tournament_events FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Organisers can view teams for their tournaments" ON tournament_teams;
CREATE POLICY "Organisers can view teams for their tournaments" ON tournament_teams FOR SELECT USING (
    EXISTS (SELECT 1 FROM tournament_events WHERE id = tournament_event_id AND organiser_id = auth.uid())
);

DROP POLICY IF EXISTS "Everyone can register a team" ON tournament_teams;
CREATE POLICY "Everyone can register a team" ON tournament_teams FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Teams can view their own registration" ON tournament_teams;
CREATE POLICY "Teams can view their own registration" ON tournament_teams FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournament_teams_event_id ON tournament_teams(tournament_event_id);
CREATE INDEX IF NOT EXISTS idx_tournament_members_team_id ON tournament_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_event_id ON tournament_matches(tournament_event_id);
