-- ============================================================
-- DigiLocker KYC Integration Schema
-- BookMyTicket – Production Migration
-- ============================================================

-- 1. DigiLocker Verification Sessions
-- Tracks OAuth flow state securely server-side
CREATE TABLE IF NOT EXISTS digilocker_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  state_token TEXT UNIQUE NOT NULL,                -- PKCE/CSRF state
  session_id_encrypted TEXT NOT NULL,             -- Encrypted session binding
  verification_request_id TEXT UNIQUE NOT NULL,   -- Unique request tracking
  status TEXT DEFAULT 'pending'                   -- pending | authorized | failed | expired
    CHECK (status IN ('pending', 'authorized', 'failed', 'expired', 'completed')),
  code_verifier TEXT,                             -- PKCE verifier (server only)
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE digilocker_sessions ENABLE ROW LEVEL SECURITY;
-- Only service role can manage DigiLocker sessions (no client RLS needed)

-- 2. DigiLocker KYC Records
-- Stores verified identity data fetched from DigiLocker
CREATE TABLE IF NOT EXISTS digilocker_kyc_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  verification_request_id TEXT REFERENCES digilocker_sessions(verification_request_id),

  -- Verified Identity Fields (from DigiLocker userinfo)
  digilocker_user_id TEXT,
  verified_name TEXT,
  verified_dob DATE,
  verified_email TEXT,
  verified_mobile TEXT,
  verified_gender TEXT,
  verified_address JSONB,                         -- { house, street, city, state, pincode }
  profile_photo_url TEXT,                         -- Fetched from DigiLocker profile

  -- Age Verification
  age_verified BOOLEAN DEFAULT FALSE,
  age_at_verification INTEGER,

  -- Document Verification Flags
  aadhaar_verified BOOLEAN DEFAULT FALSE,
  pan_verified BOOLEAN DEFAULT FALSE,
  driving_license_verified BOOLEAN DEFAULT FALSE,
  address_verified BOOLEAN DEFAULT FALSE,

  -- Risk & Fraud Detection
  is_duplicate BOOLEAN DEFAULT FALSE,
  duplicate_check_at TIMESTAMP WITH TIME ZONE,
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  fraud_flags JSONB DEFAULT '[]',                 -- Array of flag strings
  blacklisted BOOLEAN DEFAULT FALSE,

  -- OAuth Token Storage (encrypted, server-only)
  -- NOTE: access_token NEVER exposed to client
  access_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,

  -- KYC Status
  kyc_status TEXT DEFAULT 'pending'
    CHECK (kyc_status IN ('pending', 'in_progress', 'submitted', 'under_review', 'approved', 'rejected', 'reupload_requested', 'suspended')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE digilocker_kyc_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizers read own digilocker kyc" ON digilocker_kyc_records
  FOR SELECT USING (auth.uid() = organizer_id);
-- Writes only via service role

-- 3. DigiLocker Issued Documents
-- Individual documents fetched from DigiLocker
CREATE TABLE IF NOT EXISTS digilocker_issued_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  kyc_record_id UUID REFERENCES digilocker_kyc_records(id) ON DELETE CASCADE,

  document_type TEXT NOT NULL,                    -- 'ADHAR', 'PANCR', 'VHCL', 'DRVLC', etc.
  document_name TEXT,                             -- Human-readable name
  document_uri TEXT,                              -- DigiLocker document URI (server-only)
  issuer TEXT,                                    -- Issuing authority
  issue_date DATE,
  expiry_date DATE,
  document_data JSONB,                            -- Parsed document fields (name, number, etc.)
  verification_status TEXT DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'failed', 'expired')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE digilocker_issued_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizers read own documents" ON digilocker_issued_documents
  FOR SELECT USING (auth.uid() = organizer_id);

-- 4. KYC Admin Review Logs
CREATE TABLE IF NOT EXISTS kyc_review_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_by UUID REFERENCES auth.users(id),
  action TEXT NOT NULL
    CHECK (action IN ('approved', 'rejected', 'reupload_requested', 'suspended', 'flagged', 'note_added')),
  previous_status TEXT,
  new_status TEXT,
  remarks TEXT,
  risk_score_override INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE kyc_review_logs ENABLE ROW LEVEL SECURITY;
-- Admin-only via service role

-- 5. Add DigiLocker fields to existing organizer_profiles
ALTER TABLE organizer_profiles
  ADD COLUMN IF NOT EXISTS digilocker_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS digilocker_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS kyc_step INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS kyc_onboarding_complete BOOLEAN DEFAULT FALSE;

-- 6. Add DigiLocker fields to organizer_verification_status
ALTER TABLE organizer_verification_status
  ADD COLUMN IF NOT EXISTS digilocker_kyc_id UUID REFERENCES digilocker_kyc_records(id),
  ADD COLUMN IF NOT EXISTS admin_risk_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reviewed_by_admin UUID REFERENCES auth.users(id);

-- 7. KYC Notifications Queue
CREATE TABLE IF NOT EXISTS kyc_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL
    CHECK (notification_type IN ('kyc_started', 'kyc_submitted', 'kyc_approved', 'kyc_rejected', 'kyc_reupload', 'kyc_suspended')),
  email_sent BOOLEAN DEFAULT FALSE,
  push_sent BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE kyc_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizers read own notifications" ON kyc_notifications
  FOR SELECT USING (auth.uid() = organizer_id);

-- 8. Enable Realtime for KYC status sync
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'digilocker_kyc_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE digilocker_kyc_records;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'organizer_verification_status'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE organizer_verification_status;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'kyc_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE kyc_notifications;
  END IF;
END $$;

-- 9. Indexes
CREATE INDEX IF NOT EXISTS idx_digilocker_sessions_state ON digilocker_sessions(state_token);
CREATE INDEX IF NOT EXISTS idx_digilocker_sessions_org ON digilocker_sessions(organizer_id);
CREATE INDEX IF NOT EXISTS idx_digilocker_kyc_org ON digilocker_kyc_records(organizer_id);
CREATE INDEX IF NOT EXISTS idx_digilocker_kyc_status ON digilocker_kyc_records(kyc_status);
CREATE INDEX IF NOT EXISTS idx_digilocker_docs_org ON digilocker_issued_documents(organizer_id);
CREATE INDEX IF NOT EXISTS idx_kyc_review_logs_org ON kyc_review_logs(organizer_id);
CREATE INDEX IF NOT EXISTS idx_kyc_notifications_org ON kyc_notifications(organizer_id);
