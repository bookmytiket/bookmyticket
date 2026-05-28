/**
 * DigiLocker KYC – Initiate OAuth Flow
 * POST /api/auth/digilocker/initiate
 * 
 * 1. Validates organizer session
 * 2. Generates PKCE + state token
 * 3. Creates server-side session record
 * 4. Returns redirect URL to client
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  generatePKCE,
  generateStateToken,
  generateVerificationRequestId,
  buildAuthorizationUrl,
  encryptToken,
} from '@/lib/digilocker';

export async function POST(request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  try {
    // ── 1. Authenticate organizer ──────────────────────────────────────────
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── 2. Check if KYC already approved ──────────────────────────────────
    const { data: existingKYC } = await supabaseAdmin
      .from('digilocker_kyc_records')
      .select('kyc_status, id')
      .eq('organizer_id', user.id)
      .single();

    if (existingKYC?.kyc_status === 'approved') {
      return NextResponse.json(
        { error: 'KYC already verified and approved' },
        { status: 400 }
      );
    }

    // ── 3. Generate secure tokens ──────────────────────────────────────────
    const { verifier, challenge } = generatePKCE();
    const stateToken = generateStateToken();
    const verificationRequestId = generateVerificationRequestId();
    const sessionIdEncrypted = encryptToken(`${user.id}:${Date.now()}`);

    // Invalidate any pending sessions for this user
    await supabaseAdmin
      .from('digilocker_sessions')
      .update({ status: 'expired' })
      .eq('organizer_id', user.id)
      .eq('status', 'pending');

    // ── 4. Store session server-side (NEVER send verifier to client) ──────
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min
    const { error: sessionError } = await supabaseAdmin
      .from('digilocker_sessions')
      .insert({
        organizer_id: user.id,
        state_token: stateToken,
        session_id_encrypted: sessionIdEncrypted,
        verification_request_id: verificationRequestId,
        code_verifier: encryptToken(verifier), // Encrypted at rest
        status: 'pending',
        expires_at: expiresAt,
      });

    if (sessionError) {
      console.error('[DigiLocker Initiate] Session create error:', sessionError);
      return NextResponse.json({ error: 'Failed to create verification session' }, { status: 500 });
    }

    // ── 5. Build authorization URL ─────────────────────────────────────────
    const authorizationUrl = buildAuthorizationUrl({
      stateToken,
      codeChallenge: challenge,
    });

    // ── 6. Log KYC initiation ──────────────────────────────────────────────
    await supabaseAdmin.from('kyc_notifications').insert({
      organizer_id: user.id,
      notification_type: 'kyc_started',
      metadata: { verification_request_id: verificationRequestId },
    });

    // Trigger KYC started email (non-blocking)
    triggerKYCEmail(supabaseAdmin, user, 'kyc_started').catch(console.error);

    return NextResponse.json({
      success: true,
      authorization_url: authorizationUrl,
      verification_request_id: verificationRequestId,
    });

  } catch (err) {
    console.error('[DigiLocker Initiate] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Fire-and-forget email trigger
async function triggerKYCEmail(supabaseAdmin, user, type) {
  const subjects = {
    kyc_started: 'Your KYC Verification Has Started – BookMyTicket',
  };

  const { data: settings } = await supabaseAdmin
    .from('email_settings')
    .select('*')
    .single();

  if (!settings?.microsoft_365) return;

  const html = `
    <div style="font-family:'Inter',sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#fff;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px;text-align:center;">
        <h1 style="margin:0;font-size:24px;font-weight:700;">BookMyTicket</h1>
        <p style="margin:8px 0 0;opacity:.8;">Organizer KYC Verification</p>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#a78bfa;margin-top:0;">KYC Verification Started</h2>
        <p style="color:#94a3b8;line-height:1.6;">Hi ${user.email},</p>
        <p style="color:#94a3b8;line-height:1.6;">
          Your identity verification process has been initiated via DigiLocker (MeriPehchaan).
          Please complete the DigiLocker consent flow to proceed with your organizer verification.
        </p>
        <div style="background:#1e1b4b;border:1px solid #4338ca;border-radius:12px;padding:20px;margin:24px 0;">
          <p style="margin:0;color:#c4b5fd;font-size:14px;">
            🔒 Your data is securely processed via the Government of India's DigiLocker platform.
          </p>
        </div>
        <p style="color:#94a3b8;font-size:13px;">If you did not initiate this, please contact support immediately.</p>
      </div>
    </div>
  `;

  const { sendEmail } = await import('@/lib/emailService');
  await sendEmail({
    to: user.email,
    subject: subjects[type],
    html,
  });
}
