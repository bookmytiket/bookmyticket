-- Organizer KYC Workflow Migration

-- 1. Organizer Profiles
CREATE TABLE IF NOT EXISTS organizer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT,
  phone TEXT,
  dob DATE,
  profile_photo_url TEXT,
  business_name TEXT,
  business_type TEXT,
  company_registration_number TEXT,
  gst_number TEXT,
  pan_number TEXT,
  website TEXT,
  business_address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE organizer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizers can read own profile" ON organizer_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Organizers can update own profile" ON organizer_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Organizers can insert own profile" ON organizer_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Organizer Bank Details
CREATE TABLE IF NOT EXISTS organizer_bank_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES organizer_profiles(id),
  account_holder_name TEXT,
  bank_name TEXT,
  account_number_encrypted TEXT,
  ifsc_code TEXT,
  upi_id TEXT,
  cancelled_cheque_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE organizer_bank_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizers can manage own bank details" ON organizer_bank_details FOR ALL USING (auth.uid() = organizer_id);

-- 3. Organizer KYC Documents
CREATE TABLE IF NOT EXISTS organizer_kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES organizer_profiles(id),
  document_type TEXT,
  document_name TEXT,
  document_url TEXT,
  verification_status TEXT DEFAULT 'pending',
  review_notes TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE organizer_kyc_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizers can manage own docs" ON organizer_kyc_documents FOR ALL USING (auth.uid() = organizer_id);

-- 4. Organizer Verification Status
CREATE TABLE IF NOT EXISTS organizer_verification_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES organizer_profiles(id) UNIQUE,
  kyc_status TEXT DEFAULT 'draft',
  dashboard_access BOOLEAN DEFAULT FALSE,
  first_login_complete BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE organizer_verification_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizers can read own status" ON organizer_verification_status FOR SELECT USING (auth.uid() = organizer_id);
CREATE POLICY "Organizers can insert own status" ON organizer_verification_status FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizers can update own status" ON organizer_verification_status FOR UPDATE USING (auth.uid() = organizer_id);

-- 5. Admin KYC Audit Logs
CREATE TABLE IF NOT EXISTS admin_kyc_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES organizer_profiles(id),
  admin_user_id UUID REFERENCES auth.users(id),
  action TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE admin_kyc_audit_logs ENABLE ROW LEVEL SECURITY;
-- (Only admins can read/write, handled via service role)

-- Insert storage buckets if not exists (conceptual, run via dashboard if needed)
INSERT INTO storage.buckets (id, name, public) VALUES ('organizer-kyc-documents', 'organizer-kyc-documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('organizer-profile-assets', 'organizer-profile-assets', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('bank-documents', 'bank-documents', false) ON CONFLICT DO NOTHING;
