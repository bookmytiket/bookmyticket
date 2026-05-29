/**
 * Admin KYC Management API
 * POST /api/admin/kyc/approve  – Approve organizer KYC
 * POST /api/admin/kyc/reject   – Reject organizer KYC
 * POST /api/admin/kyc/reupload – Request re-upload
 * POST /api/admin/kyc/suspend  – Suspend organizer
 * GET  /api/admin/kyc/list     – List all pending KYC submissions
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// ─── Validate Admin ────────────────────────────────────────────────────────────
async function validateAdmin(request) {
  const token = request.headers.get('Authorization')?.split('Bearer ')[1];
  if (!token) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const adminRoles = ['admin', 'super_admin', 'system_admin'];
  if (!adminRoles.includes(profile?.role)) return null;

  return user;
}

// ─── POST /api/admin/kyc ──────────────────────────────────────────────
export async function POST(request) {
  const admin = await validateAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { action, organizer_id, remarks, risk_score_override } = body;

    if (!action || !['approve', 'reject', 'reupload', 'suspend'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!organizer_id) {
      return NextResponse.json({ error: 'organizer_id is required' }, { status: 400 });
    }

    // Fetch current KYC record
    const { data: kycRecord } = await supabaseAdmin
      .from('digilocker_kyc_records')
      .select('kyc_status, verified_name, verified_email, organizer_id')
      .eq('organizer_id', organizer_id)
      .single();

    if (!kycRecord) {
      return NextResponse.json({ error: 'KYC record not found' }, { status: 404 });
    }

    const previousStatus = kycRecord.kyc_status;
    let newStatus;
    let dashboardAccess = false;
    let notificationType;
    let emailSubject;
    let emailHtml;

    switch (action) {
      case 'approve':
        newStatus = 'approved';
        dashboardAccess = true;
        notificationType = 'kyc_approved';
        emailSubject = 'Organizer Verification Approved – BookMyTicket 🎉';
        emailHtml = buildApprovalEmail(kycRecord.verified_name || 'Organizer');
        break;

      case 'reject':
        newStatus = 'rejected';
        dashboardAccess = false;
        notificationType = 'kyc_rejected';
        emailSubject = 'KYC Verification Requires Changes – BookMyTicket';
        emailHtml = buildRejectionEmail(kycRecord.verified_name || 'Organizer', remarks);
        break;

      case 'reupload':
        newStatus = 'reupload_requested';
        dashboardAccess = false;
        notificationType = 'kyc_reupload';
        emailSubject = 'Action Required: KYC Documents Reupload – BookMyTicket';
        emailHtml = buildReuploadEmail(kycRecord.verified_name || 'Organizer', remarks);
        break;

      case 'suspend':
        newStatus = 'suspended';
        dashboardAccess = false;
        notificationType = 'kyc_suspended';
        emailSubject = 'Account Suspended – BookMyTicket';
        emailHtml = buildSuspensionEmail(kycRecord.verified_name || 'Organizer', remarks);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // ── Update DigiLocker KYC Record ──────────────────────────────────────
    const kycUpdate = {
      kyc_status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (action === 'approve') {
      kycUpdate.approved_at = new Date().toISOString();
      if (risk_score_override !== undefined) kycUpdate.risk_score = risk_score_override;
    } else if (action === 'reject' || action === 'suspend') {
      kycUpdate.rejected_at = new Date().toISOString();
    }

    await supabaseAdmin
      .from('digilocker_kyc_records')
      .update(kycUpdate)
      .eq('organizer_id', organizer_id);

    // ── Update Verification Status ─────────────────────────────────────────
    const statusUpdate = {
      kyc_status: newStatus,
      dashboard_access: dashboardAccess,
      last_reviewed_at: new Date().toISOString(),
      reviewed_by_admin: admin.id,
      updated_at: new Date().toISOString(),
    };

    if (action === 'reject' || action === 'reupload') {
      statusUpdate.rejection_reason = remarks || null;
    }

    if (action === 'approve') {
      statusUpdate.admin_risk_score = risk_score_override ?? 0;
    }

    await supabaseAdmin
      .from('organizer_verification_status')
      .upsert({
        organizer_id,
        ...statusUpdate,
      }, { onConflict: 'organizer_id' });

    // ── Update legacy organisers table ─────────────────────────────────────
    const legacyStatus = {
      approve: 'Active',
      reject: 'Rejected',
      reupload: 'Reupload Required',
      suspend: 'Suspended',
    }[action] || newStatus;

    const legacyUpdate = { kyc_status: legacyStatus };

    await supabaseAdmin
      .from('organisers')
      .update(legacyUpdate)
      .eq('id', organizer_id);

    // ── Admin KYC Audit Log ────────────────────────────────────────────────
    await supabaseAdmin.from('kyc_review_logs').insert({
      organizer_id,
      reviewed_by: admin.id,
      action: action === 'reupload' ? 'reupload_requested' : action,
      previous_status: previousStatus,
      new_status: newStatus,
      remarks: remarks || null,
      risk_score_override: risk_score_override || null,
      metadata: { admin_email: admin.email, timestamp: new Date().toISOString() },
    });

    // ── Add to KYC notifications queue ─────────────────────────────────────
    await supabaseAdmin.from('kyc_notifications').insert({
      organizer_id,
      notification_type: notificationType,
      metadata: { action, remarks, reviewed_by: admin.id },
    });

    // ── Send Email ─────────────────────────────────────────────────────────
    if (emailSubject && emailHtml) {
      const toEmail = kycRecord.verified_email;
      if (toEmail) {
        const { sendEmail } = await import('@/lib/emailService');
        await sendEmail({ to: toEmail, subject: emailSubject, html: emailHtml });
      }
    }

    return NextResponse.json({
      success: true,
      organizer_id,
      action,
      new_status: newStatus,
      dashboard_access: dashboardAccess,
    });

  } catch (err) {
    console.error('[Admin KYC] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── GET /api/admin/kyc/list ──────────────────────────────────────────────────
export async function GET(request) {
  const admin = await validateAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'submitted';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const { data: records, count } = await supabaseAdmin
      .from('digilocker_kyc_records')
      .select(`
        organizer_id, kyc_status, verified_name, verified_email, verified_mobile,
        verified_dob, verified_gender, verified_address, profile_photo_url,
        age_verified, aadhaar_verified, pan_verified,
        is_duplicate, risk_score, fraud_flags,
        submitted_at, approved_at, rejected_at, updated_at,
        digilocker_issued_documents(document_type, document_name, verification_status)
      `, { count: 'exact' })
      .eq('kyc_status', status)
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const formattedRecords = records || [];

    // Fetch manually uploaded documents separately (no FK relation to digilocker_kyc_records)
    if (formattedRecords.length > 0) {
      const orgIds = formattedRecords.map(r => r.organizer_id);
      const { data: manualDocs } = await supabaseAdmin
        .from('organizer_kyc_documents')
        .select('organizer_id, document_type, document_name, document_url')
        .in('organizer_id', orgIds);

      if (manualDocs && manualDocs.length > 0) {
        // Generate signed URLs since the bucket is private
        for (const doc of manualDocs) {
          try {
            if (doc.document_url && doc.document_url.includes('/public/organizer-kyc-documents/')) {
              const path = doc.document_url.split('/public/organizer-kyc-documents/')[1];
              const { data: signedData } = await supabaseAdmin.storage
                .from('organizer-kyc-documents')
                .createSignedUrl(path, 60 * 60); // 1 hour validity
              
              if (signedData?.signedUrl) {
                doc.document_url = signedData.signedUrl;
              }
            }
          } catch (e) {
            console.error('Failed to sign document URL', e);
          }
        }

        formattedRecords.forEach(record => {
          record.organizer_kyc_documents = manualDocs.filter(d => d.organizer_id === record.organizer_id);
        });
      }

      // Fetch profiles to get pan_number and other useful data
      const { data: profiles } = await supabaseAdmin
        .from('organizer_profiles')
        .select('id, pan_number')
        .in('id', orgIds);

      if (profiles && profiles.length > 0) {
        formattedRecords.forEach(record => {
          const profile = profiles.find(p => p.id === record.organizer_id);
          if (profile) {
            record.pan_number = profile.pan_number;
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      records: formattedRecords,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });

  } catch (err) {
    console.error('[Admin KYC List] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

function buildApprovalEmail(name) {
  return `
    <div style="font-family:'Inter',sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#fff;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#059669,#047857);padding:32px;text-align:center;">
        <div style="font-size:48px;margin-bottom:8px;">🎉</div>
        <h1 style="margin:0;font-size:24px;">Verification Approved!</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#34d399;margin-top:0;">Welcome to BookMyTicket, ${name}!</h2>
        <p style="color:#94a3b8;line-height:1.6;">
          Your organizer KYC verification has been approved. You now have full access to the
          BookMyTicket Organizer Panel.
        </p>
        <div style="background:#022c22;border:1px solid #059669;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="margin:0 0 8px;color:#34d399;font-weight:600;">You can now access:</p>
          <p style="margin:4px 0;color:#6ee7b7;font-size:14px;">✓ Event Creation &amp; Management</p>
          <p style="margin:4px 0;color:#6ee7b7;font-size:14px;">✓ Revenue Dashboard &amp; Analytics</p>
          <p style="margin:4px 0;color:#6ee7b7;font-size:14px;">✓ Wallet &amp; Settlement System</p>
          <p style="margin:4px 0;color:#6ee7b7;font-size:14px;">✓ Ticket Management</p>
        </div>
        <div style="text-align:center;margin-top:24px;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/organiser" style="background:linear-gradient(135deg,#059669,#047857);color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;">
            Open Organizer Panel →
          </a>
        </div>
      </div>
    </div>
  `;
}

function buildRejectionEmail(name, reason) {
  return `
    <div style="font-family:'Inter',sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#fff;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:32px;text-align:center;">
        <h1 style="margin:0;font-size:24px;">KYC Verification Update</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#f87171;margin-top:0;">Hi ${name}, Action Required</h2>
        <p style="color:#94a3b8;line-height:1.6;">
          After reviewing your KYC submission, our team has found that some information requires attention.
        </p>
        ${reason ? `<div style="background:#450a0a;border:1px solid #dc2626;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="margin:0 0 8px;color:#fca5a5;font-weight:600;">Reason:</p>
          <p style="margin:0;color:#fecaca;font-size:14px;">${reason}</p>
        </div>` : ''}
        <p style="color:#94a3b8;font-size:14px;">
          Please contact our support team or resubmit your verification with the correct information.
        </p>
        <div style="text-align:center;margin-top:24px;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/organiser" style="background:#dc2626;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;">
            Review KYC Status
          </a>
        </div>
      </div>
    </div>
  `;
}

function buildReuploadEmail(name, reason) {
  return `
    <div style="font-family:'Inter',sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#fff;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#d97706,#92400e);padding:32px;text-align:center;">
        <h1 style="margin:0;font-size:24px;">Document Reupload Required</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#fbbf24;margin-top:0;">Hi ${name},</h2>
        <p style="color:#94a3b8;line-height:1.6;">
          Some documents in your KYC submission need to be reuploaded for verification.
        </p>
        ${reason ? `<div style="background:#431407;border:1px solid #f97316;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="margin:0 0 8px;color:#fdba74;font-weight:600;">What's needed:</p>
          <p style="margin:0;color:#fed7aa;font-size:14px;">${reason}</p>
        </div>` : ''}
        <div style="text-align:center;margin-top:24px;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/organiser" style="background:#d97706;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;">
            Reupload Documents
          </a>
        </div>
      </div>
    </div>
  `;
}

function buildSuspensionEmail(name, reason) {
  return `
    <div style="font-family:'Inter',sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#fff;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#1f2937,#111827);padding:32px;text-align:center;">
        <h1 style="margin:0;font-size:24px;">Account Suspended</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#9ca3af;margin-top:0;">Hi ${name},</h2>
        <p style="color:#94a3b8;line-height:1.6;">
          Your organizer account has been suspended pending further review.
        </p>
        ${reason ? `<div style="background:#1f2937;border:1px solid #4b5563;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="margin:0 0 8px;color:#d1d5db;font-weight:600;">Reason:</p>
          <p style="margin:0;color:#9ca3af;font-size:14px;">${reason}</p>
        </div>` : ''}
        <p style="color:#94a3b8;font-size:14px;">
          If you believe this is an error, please contact our support team at support@bookmyticket.net
        </p>
      </div>
    </div>
  `;
}
