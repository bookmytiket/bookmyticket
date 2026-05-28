/**
 * Organizer KYC Status API
 * GET /api/organizer/kyc/status
 * 
 * Returns:
 * - Current KYC status
 * - Verification summary (no tokens/URIs)
 * - Access flags
 * - Next step guidance
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  try {
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // ── Fetch KYC record (exclude encrypted tokens) ────────────────────────
    const { data: kycRecord } = await supabaseAdmin
      .from('digilocker_kyc_records')
      .select(`
        id, kyc_status, verified_name, verified_dob, verified_email, verified_mobile,
        verified_gender, verified_address, profile_photo_url,
        age_verified, age_at_verification,
        aadhaar_verified, pan_verified, address_verified,
        is_duplicate, risk_score, fraud_flags,
        submitted_at, approved_at, rejected_at,
        created_at, updated_at
      `)
      .eq('organizer_id', user.id)
      .single();

    // ── Fetch verification status ──────────────────────────────────────────
    const { data: verificationStatus } = await supabaseAdmin
      .from('organizer_verification_status')
      .select('kyc_status, dashboard_access, first_login_complete, rejection_reason, submitted_at')
      .eq('organizer_id', user.id)
      .single();

    // ── Fetch profile ──────────────────────────────────────────────────────
    const { data: profile } = await supabaseAdmin
      .from('organizer_profiles')
      .select('full_name, kyc_step, kyc_onboarding_complete, digilocker_verified, digilocker_verified_at, business_name')
      .eq('id', user.id)
      .single();

    // ── Fetch documents (no URIs – only metadata) ──────────────────────────
    const { data: documents } = await supabaseAdmin
      .from('digilocker_issued_documents')
      .select('id, document_type, document_name, issuer, issue_date, expiry_date, verification_status, created_at')
      .eq('organizer_id', user.id)
      .order('created_at', { ascending: false });

    // ── Fetch review logs ──────────────────────────────────────────────────
    const { data: reviewLogs } = await supabaseAdmin
      .from('kyc_review_logs')
      .select('action, previous_status, new_status, remarks, created_at')
      .eq('organizer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // ── Compute next step ──────────────────────────────────────────────────
    const currentStep = profile?.kyc_step || 1;
    const digilockerVerified = profile?.digilocker_verified || false;
    const kycStatus = verificationStatus?.kyc_status || kycRecord?.kyc_status || 'pending';
    const dashboardAccess = verificationStatus?.dashboard_access || false;

    const nextStep = computeNextStep({
      currentStep,
      digilockerVerified,
      kycStatus,
      dashboardAccess,
      profile,
    });

    // ── Determine allowed features ─────────────────────────────────────────
    const allowedFeatures = dashboardAccess
      ? ['event_creation', 'revenue_dashboard', 'wallet', 'settlements', 'ticket_management', 'analytics']
      : ['kyc_status', 'profile', 'support', 'verification'];

    return NextResponse.json({
      success: true,
      kyc: {
        status: kycStatus,
        dashboard_access: dashboardAccess,
        digilocker_verified: digilockerVerified,
        digilocker_verified_at: profile?.digilocker_verified_at || null,
        onboarding_complete: profile?.kyc_onboarding_complete || false,
        current_step: currentStep,
        next_step: nextStep,
      },
      identity: kycRecord ? {
        verified_name: kycRecord.verified_name,
        verified_dob: kycRecord.verified_dob,
        verified_email: kycRecord.verified_email,
        verified_mobile: kycRecord.verified_mobile,
        verified_gender: kycRecord.verified_gender,
        verified_address: kycRecord.verified_address,
        profile_photo_url: kycRecord.profile_photo_url,
        age_verified: kycRecord.age_verified,
        age_at_verification: kycRecord.age_at_verification,
        aadhaar_verified: kycRecord.aadhaar_verified,
        pan_verified: kycRecord.pan_verified,
        address_verified: kycRecord.address_verified,
      } : null,
      risk: kycRecord ? {
        score: kycRecord.risk_score,
        flags: kycRecord.fraud_flags,
        is_duplicate: kycRecord.is_duplicate,
      } : null,
      documents: documents || [],
      review_logs: reviewLogs || [],
      profile: {
        full_name: profile?.full_name,
        business_name: profile?.business_name,
      },
      rejection_reason: verificationStatus?.rejection_reason || null,
      allowed_features: allowedFeatures,
      submitted_at: kycRecord?.submitted_at || verificationStatus?.submitted_at || null,
      approved_at: kycRecord?.approved_at || null,
    });

  } catch (err) {
    console.error('[KYC Status] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function computeNextStep({ currentStep, digilockerVerified, kycStatus, dashboardAccess, profile }) {
  if (dashboardAccess) return null; // All done

  if (!digilockerVerified) {
    return {
      step: 2,
      label: 'DigiLocker Verification',
      action: 'initiate_digilocker',
      description: 'Verify your identity using DigiLocker (MeriPehchaan)',
    };
  }

  if (currentStep < 3) {
    return {
      step: 3,
      label: 'Business Information',
      action: 'complete_business_info',
      description: 'Provide your business details and documents',
    };
  }

  if (currentStep < 4) {
    return {
      step: 4,
      label: 'Settlement Setup',
      action: 'complete_bank_setup',
      description: 'Add your bank account for payouts',
    };
  }

  if (kycStatus === 'reupload_requested') {
    return {
      step: 2,
      label: 'Re-verify with DigiLocker',
      action: 'initiate_digilocker',
      description: 'Admin has requested a re-verification. Please complete DigiLocker again.',
    };
  }

  if (kycStatus === 'submitted' || kycStatus === 'under_review') {
    return {
      step: 5,
      label: 'Admin Approval Pending',
      action: 'wait',
      description: 'Your KYC is under admin review. You will be notified once approved.',
    };
  }

  return null;
}
