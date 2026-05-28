const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const statements = [
  `CREATE TABLE IF NOT EXISTS digilocker_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    state_token TEXT UNIQUE NOT NULL,
    session_id_encrypted TEXT NOT NULL,
    verification_request_id TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'failed', 'expired', 'completed')),
    code_verifier TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS digilocker_kyc_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    verification_request_id TEXT,
    digilocker_user_id TEXT,
    verified_name TEXT,
    verified_dob DATE,
    verified_email TEXT,
    verified_mobile TEXT,
    verified_gender TEXT,
    verified_address JSONB,
    profile_photo_url TEXT,
    age_verified BOOLEAN DEFAULT FALSE,
    age_at_verification INTEGER,
    aadhaar_verified BOOLEAN DEFAULT FALSE,
    pan_verified BOOLEAN DEFAULT FALSE,
    address_verified BOOLEAN DEFAULT FALSE,
    is_duplicate BOOLEAN DEFAULT FALSE,
    duplicate_check_at TIMESTAMP WITH TIME ZONE,
    risk_score INTEGER DEFAULT 0,
    fraud_flags JSONB DEFAULT '[]',
    blacklisted BOOLEAN DEFAULT FALSE,
    access_token_encrypted TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    kyc_status TEXT DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS digilocker_issued_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    kyc_record_id UUID REFERENCES digilocker_kyc_records(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_name TEXT,
    document_uri TEXT,
    issuer TEXT,
    issue_date DATE,
    expiry_date DATE,
    document_data JSONB,
    verification_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS kyc_review_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewed_by UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    remarks TEXT,
    risk_score_override INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS kyc_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    email_sent BOOLEAN DEFAULT FALSE,
    push_sent BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,

  `ALTER TABLE organizer_profiles ADD COLUMN IF NOT EXISTS digilocker_verified BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE organizer_profiles ADD COLUMN IF NOT EXISTS digilocker_verified_at TIMESTAMP WITH TIME ZONE`,
  `ALTER TABLE organizer_profiles ADD COLUMN IF NOT EXISTS kyc_step INTEGER DEFAULT 1`,
  `ALTER TABLE organizer_profiles ADD COLUMN IF NOT EXISTS kyc_onboarding_complete BOOLEAN DEFAULT FALSE`,

  `ALTER TABLE digilocker_sessions ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE digilocker_kyc_records ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE digilocker_issued_documents ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE kyc_review_logs ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE kyc_notifications ENABLE ROW LEVEL SECURITY`,

  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='digilocker_kyc_records' AND policyname='Organizers read own digilocker kyc') THEN CREATE POLICY "Organizers read own digilocker kyc" ON digilocker_kyc_records FOR SELECT USING (auth.uid() = organizer_id); END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='digilocker_issued_documents' AND policyname='Organizers read own documents') THEN CREATE POLICY "Organizers read own documents" ON digilocker_issued_documents FOR SELECT USING (auth.uid() = organizer_id); END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='kyc_notifications' AND policyname='Organizers read own kyc notifications') THEN CREATE POLICY "Organizers read own kyc notifications" ON kyc_notifications FOR SELECT USING (auth.uid() = organizer_id); END IF; END $$`,

  `CREATE INDEX IF NOT EXISTS idx_digilocker_sessions_state ON digilocker_sessions(state_token)`,
  `CREATE INDEX IF NOT EXISTS idx_digilocker_sessions_org ON digilocker_sessions(organizer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_digilocker_kyc_org ON digilocker_kyc_records(organizer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_digilocker_kyc_status ON digilocker_kyc_records(kyc_status)`,
  `CREATE INDEX IF NOT EXISTS idx_digilocker_docs_org ON digilocker_issued_documents(organizer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_kyc_review_logs_org ON kyc_review_logs(organizer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_kyc_notifications_org ON kyc_notifications(organizer_id)`,
];

async function run() {
  let successCount = 0;
  let failedStatements = [];

  for (const stmt of statements) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/apply_migration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY,
        },
        body: JSON.stringify({ sql: stmt }),
      });

      if (response.status === 200 || response.status === 201) {
        successCount++;
        process.stdout.write('✓');
      } else {
        // Try the exec approach
        const { data, error: rpcError } = await supabase.rpc('exec_sql', { query: stmt });
        if (!rpcError) {
          successCount++;
          process.stdout.write('✓');
        } else {
          failedStatements.push({ stmt: stmt.substring(0, 80), error: rpcError.message });
          process.stdout.write('✗');
        }
      }
    } catch (err) {
      failedStatements.push({ stmt: stmt.substring(0, 80), error: err.message });
      process.stdout.write('!');
    }
  }

  console.log('\n');
  console.log(`Results: ${successCount} succeeded, ${failedStatements.length} failed`);
  
  if (failedStatements.length > 0) {
    console.log('\n⚠️  Manual migration required. Run this in Supabase SQL Editor:');
    console.log('Path: supabase/migrations/20260529300000_digilocker_kyc_schema.sql');
    console.log('\nFailed statements:');
    failedStatements.forEach(f => console.log('  -', f.stmt, '|', f.error));
  } else {
    console.log('\n✅ All DigiLocker KYC tables created successfully!');
  }
}

run();
