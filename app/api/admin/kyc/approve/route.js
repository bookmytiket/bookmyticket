/**
 * POST /api/admin/kyc/approve
 * Delegates to the shared admin KYC handler with action='approve'
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: adminProfile } = await supabaseAdmin
      .from('organisers')
      .select('role, kyc_status')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin = user.email?.includes('admin') ||
      ['admin', 'super_admin', 'system_admin'].includes(adminProfile?.role?.toLowerCase());
    if (!isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const body = await request.json();
    const { organizer_id, remarks, risk_score_override } = body;
    if (!organizer_id) return NextResponse.json({ error: 'organizer_id required' }, { status: 400 });

    // Update KYC record
    const { error: updateError } = await supabaseAdmin
      .from('digilocker_kyc_records')
      .update({
        kyc_status: 'approved',
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(risk_score_override !== undefined ? { risk_score: risk_score_override } : {}),
      })
      .eq('organizer_id', organizer_id);

    if (updateError) throw updateError;

    // Enable dashboard access
    await supabaseAdmin
      .from('organizer_verification_status')
      .upsert({
        organizer_id,
        kyc_status: 'approved',
        dashboard_access: true,
        verified_at: new Date().toISOString(),
      }, { onConflict: 'organizer_id' });

    // Sync legacy tables for backwards compatibility
    const { data: orgData } = await supabaseAdmin.from('organisers').select('email').eq('id', organizer_id).maybeSingle();
    
    await supabaseAdmin
      .from('organisers')
      .update({ kyc_status: 'Approved', status: 'Active' })
      .eq('id', organizer_id);

    if (orgData?.email) {
      await supabaseAdmin
        .from('partner_requests')
        .update({ status: 'Approved' })
        .eq('email', orgData.email);
    }

    // Audit log
    await supabaseAdmin.from('kyc_review_logs').insert({
      organizer_id,
      reviewed_by: user.id,
      action: 'approved',
      previous_status: 'submitted',
      new_status: 'approved',
      remarks: remarks || null,
      metadata: { risk_score_override },
    });

    return NextResponse.json({ success: true, action: 'approved', organizer_id });
  } catch (err) {
    console.error('[Admin KYC Approve]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
