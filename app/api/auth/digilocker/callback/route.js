/**
 * DigiLocker KYC – OAuth Callback Handler
 * GET /api/auth/digilocker/callback
 * 
 * Processes the DigiLocker redirect after consent:
 * 1. Validates state token (CSRF protection)
 * 2. Exchanges code for access token (PKCE)
 * 3. Fetches verified identity + documents
 * 4. Runs fraud/duplicate detection
 * 5. Stores encrypted data to Supabase
 * 6. Redirects organizer to KYC status page
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  exchangeCodeForToken,
  fetchDigiLockerUserInfo,
  fetchIssuedDocuments,
  runKYCValidation,
  encryptToken,
  decryptToken,
} from '@/lib/digilocker';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.bookmyticket.net';

export async function GET(request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // ── Handle DigiLocker errors ───────────────────────────────────────────────
  if (error) {
    console.error('[DigiLocker Callback] OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${BASE_URL}/organiser?kyc_error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(`${BASE_URL}/organiser?kyc_error=invalid_callback`);
  }

  try {
    // ── 1. Validate state token & fetch session ────────────────────────────
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('digilocker_sessions')
      .select('*')
      .eq('state_token', state)
      .eq('status', 'pending')
      .single();

    if (sessionError || !session) {
      console.error('[DigiLocker Callback] Invalid/expired state token:', state);
      return NextResponse.redirect(`${BASE_URL}/organiser?kyc_error=invalid_state`);
    }

    // Check session expiry
    if (new Date(session.expires_at) < new Date()) {
      await supabaseAdmin
        .from('digilocker_sessions')
        .update({ status: 'expired' })
        .eq('id', session.id);
      return NextResponse.redirect(`${BASE_URL}/organiser?kyc_error=session_expired`);
    }

    const organizerId = session.organizer_id;

    // ── 2. Mark session as authorized ─────────────────────────────────────
    await supabaseAdmin
      .from('digilocker_sessions')
      .update({ status: 'authorized', updated_at: new Date().toISOString() })
      .eq('id', session.id);

    // ── 3. Exchange code for access token ─────────────────────────────────
    const codeVerifier = decryptToken(session.code_verifier);
    const tokenData = await exchangeCodeForToken({ code, codeVerifier });

    // ── 4. Fetch verified identity from DigiLocker ─────────────────────────
    let userInfo;
    try {
      userInfo = await fetchDigiLockerUserInfo(tokenData.access_token);
    } catch (fetchErr) {
      console.error('[DigiLocker Callback] UserInfo fetch failed:', fetchErr);
      return NextResponse.redirect(
        `${BASE_URL}/organiser?kyc_error=${encodeURIComponent('Failed to fetch verified identity')}`
      );
    }

    // ── 5. Fetch issued documents ──────────────────────────────────────────
    let documents = [];
    try {
      documents = await fetchIssuedDocuments(tokenData.access_token);
    } catch (docErr) {
      console.warn('[DigiLocker Callback] Documents fetch failed (non-fatal):', docErr.message);
    }

    // ── 6. Run KYC fraud/duplicate validation ─────────────────────────────
    const validation = await runKYCValidation({
      organizerId,
      verifiedData: userInfo,
      documents,
    });

    // ── 7. Determine KYC status based on validation ────────────────────────
    const kycStatus = validation.isDuplicate || validation.riskScore >= 70
      ? 'under_review'
      : validation.autoApprove
        ? 'submitted' // Admin still needs to approve
        : 'submitted';

    // ── 8. Upsert DigiLocker KYC Record ───────────────────────────────────
    const encryptedToken = encryptToken(tokenData.access_token);

    const { data: kycRecord, error: kycError } = await supabaseAdmin
      .from('digilocker_kyc_records')
      .upsert({
        organizer_id: organizerId,
        verification_request_id: session.verification_request_id,
        digilocker_user_id: userInfo.digilocker_user_id,
        verified_name: userInfo.verified_name,
        verified_dob: userInfo.verified_dob || null,
        verified_email: userInfo.verified_email,
        verified_mobile: userInfo.verified_mobile,
        verified_gender: userInfo.verified_gender,
        verified_address: userInfo.verified_address,
        profile_photo_url: userInfo.profile_photo_url,
        age_verified: validation.ageVerified,
        age_at_verification: validation.ageAtVerification,
        aadhaar_verified: validation.aadhaarVerified,
        pan_verified: validation.panVerified,
        address_verified: !!userInfo.verified_address,
        is_duplicate: validation.isDuplicate,
        duplicate_check_at: new Date().toISOString(),
        risk_score: validation.riskScore,
        fraud_flags: validation.fraudFlags,
        access_token_encrypted: encryptedToken,
        token_expires_at: tokenData.expires_at,
        kyc_status: kycStatus,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'organizer_id' })
      .select()
      .single();

    if (kycError) {
      console.error('[DigiLocker Callback] KYC record upsert failed:', kycError);
      return NextResponse.redirect(`${BASE_URL}/organiser?kyc_error=storage_failed:_${encodeURIComponent(kycError.message)}`);
    }

    // ── 9. Store issued documents ──────────────────────────────────────────
    if (documents.length > 0) {
      // Remove old docs for this record
      await supabaseAdmin
        .from('digilocker_issued_documents')
        .delete()
        .eq('organizer_id', organizerId);

      const docsToInsert = documents.map((doc) => ({
        organizer_id: organizerId,
        kyc_record_id: kycRecord.id,
        document_type: doc.document_type,
        document_name: doc.document_name,
        document_uri: doc.document_uri ? encryptToken(doc.document_uri) : null, // Encrypt URI
        issuer: doc.issuer,
        issue_date: doc.issue_date || null,
        expiry_date: doc.expiry_date || null,
        document_data: doc.document_data || {},
        verification_status: 'verified',
      }));

      await supabaseAdmin.from('digilocker_issued_documents').insert(docsToInsert);
    }

    // ── 10. Update organizer_profiles with DigiLocker data ─────────────────
    await supabaseAdmin
      .from('organizer_profiles')
      .upsert({
        id: organizerId,
        user_id: organizerId,
        full_name: userInfo.verified_name,
        dob: userInfo.verified_dob || null,
        profile_photo_url: userInfo.profile_photo_url,
        digilocker_verified: true,
        digilocker_verified_at: new Date().toISOString(),
        kyc_step: 3, // Advance to business info step
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    // ── 11. Update organizer_verification_status ───────────────────────────
    await supabaseAdmin
      .from('organizer_verification_status')
      .upsert({
        organizer_id: organizerId,
        digilocker_kyc_id: kycRecord.id,
        kyc_status: kycStatus,
        admin_risk_score: validation.riskScore,
        dashboard_access: false,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'organizer_id' });

    // ── 12. Mark session complete ──────────────────────────────────────────
    await supabaseAdmin
      .from('digilocker_sessions')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', session.id);

    // ── 13. Notify: KYC Submitted ──────────────────────────────────────────
    await supabaseAdmin.from('kyc_notifications').insert({
      organizer_id: organizerId,
      notification_type: 'kyc_submitted',
      metadata: {
        verification_request_id: session.verification_request_id,
        kyc_status: kycStatus,
        risk_score: validation.riskScore,
        documents_count: documents.length,
      },
    });

    // ── 14. Trigger KYC Submitted Email (non-blocking) ─────────────────────
    sendKYCSubmittedEmail(supabaseAdmin, organizerId, userInfo, validation).catch(console.error);

    // ── 15. Notify Admin Panel (non-blocking) ─────────────────────────────
    notifyAdminNewKYC(supabaseAdmin, organizerId, userInfo, validation).catch(console.error);

    // ── 16. Redirect to KYC onboarding with success ────────────────────────
    return NextResponse.redirect(
      `${BASE_URL}/organiser?kyc_step=3&digilocker_verified=1`
    );

  } catch (err) {
    console.error('[DigiLocker Callback] Unhandled error:', err);
    return NextResponse.redirect(
      `${BASE_URL}/organiser?kyc_error=${encodeURIComponent('Verification failed. Please try again.')}`
    );
  }
}

// ─── Email Helpers ─────────────────────────────────────────────────────────────

async function sendKYCSubmittedEmail(supabaseAdmin, organizerId, userInfo, validation) {
  try {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(organizerId);
    const email = authUser?.user?.email || userInfo.verified_email;
    if (!email) return;

    const { sendEmail } = await import('@/lib/emailService');
    await sendEmail({
      to: email,
      subject: 'KYC Documents Submitted Successfully – BookMyTicket',
      html: buildKYCSubmittedEmail(userInfo.verified_name || email, validation),
    });
  } catch (err) {
    console.error('[DigiLocker] KYC submitted email failed:', err.message);
  }
}

async function notifyAdminNewKYC(supabaseAdmin, organizerId, userInfo, validation) {
  try {
    const { sendEmail } = await import('@/lib/emailService');
    await sendEmail({
      to: 'hello@bookmyticket.net',
      subject: `New KYC Submission – ${userInfo.verified_name} (Risk: ${validation.riskScore})`,
      html: buildAdminKYCNotification(userInfo, validation, organizerId),
    });
  } catch (err) {
    console.error('[DigiLocker] Admin KYC notification failed:', err.message);
  }
}

function buildKYCSubmittedEmail(name, validation) {
  const flagWarning = validation.fraudFlags.length > 0
    ? `<div style="background:#431407;border:1px solid #f97316;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0;color:#fed7aa;">⚠️ Review Required: Your verification is being manually reviewed by our team.</p>
       </div>`
    : '';

  return `
    <div style="font-family:'Inter',sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#fff;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px;text-align:center;">
        <h1 style="margin:0;font-size:24px;font-weight:700;">BookMyTicket</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#a78bfa;margin-top:0;">KYC Submitted Successfully ✓</h2>
        <p style="color:#94a3b8;line-height:1.6;">Hi ${name},</p>
        <p style="color:#94a3b8;line-height:1.6;">
          Your identity has been verified through DigiLocker (MeriPehchaan) and your KYC
          submission is now under admin review.
        </p>
        ${flagWarning}
        <div style="background:#1e1b4b;border-radius:12px;padding:20px;margin:16px 0;">
          <p style="margin:0 0 8px;color:#c4b5fd;font-weight:600;">Verification Summary</p>
          <p style="margin:4px 0;color:#94a3b8;font-size:14px;">✓ Identity Verified via DigiLocker</p>
          <p style="margin:4px 0;color:#94a3b8;font-size:14px;">${validation.ageVerified ? '✓' : '✗'} Age Verification (18+)</p>
          <p style="margin:4px 0;color:#94a3b8;font-size:14px;">${validation.aadhaarVerified ? '✓' : '⏳'} Aadhaar Verification</p>
          <p style="margin:4px 0;color:#94a3b8;font-size:14px;">${validation.panVerified ? '✓' : '⏳'} PAN Verification</p>
        </div>
        <p style="color:#94a3b8;font-size:13px;">
          Admin review typically takes 24–48 hours. You will receive an email notification once approved.
        </p>
        <div style="text-align:center;margin-top:24px;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/organiser" style="background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;">
            View KYC Status
          </a>
        </div>
      </div>
    </div>
  `;
}

function buildAdminKYCNotification(userInfo, validation, organizerId) {
  const riskColor = validation.riskScore >= 70 ? '#dc2626' : validation.riskScore >= 30 ? '#f59e0b' : '#10b981';
  return `
    <div style="font-family:'Inter',sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#fff;border-radius:16px;overflow:hidden;">
      <div style="background:#1e293b;padding:24px;border-bottom:1px solid #334155;">
        <h2 style="margin:0;color:#a78bfa;">🔔 New KYC Submission</h2>
      </div>
      <div style="padding:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#64748b;font-size:14px;width:40%;">Organizer Name</td><td style="padding:8px 0;color:#f1f5f9;">${userInfo.verified_name || 'N/A'}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Verified Email</td><td style="padding:8px 0;color:#f1f5f9;">${userInfo.verified_email || 'N/A'}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Mobile</td><td style="padding:8px 0;color:#f1f5f9;">${userInfo.verified_mobile || 'N/A'}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Aadhaar</td><td style="padding:8px 0;color:#f1f5f9;">${validation.aadhaarVerified ? '✓ Verified' : '✗ Not Found'}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">PAN</td><td style="padding:8px 0;color:#f1f5f9;">${validation.panVerified ? '✓ Verified' : '✗ Not Found'}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Risk Score</td><td style="padding:8px 0;color:${riskColor};font-weight:700;">${validation.riskScore}/100</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Flags</td><td style="padding:8px 0;color:#f87171;">${validation.fraudFlags.join(', ') || 'None'}</td></tr>
        </table>
        <div style="margin-top:24px;text-align:center;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin?tab=kyc_review&id=${organizerId}" style="background:#7c3aed;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;">
            Review in Admin Panel →
          </a>
        </div>
      </div>
    </div>
  `;
}
