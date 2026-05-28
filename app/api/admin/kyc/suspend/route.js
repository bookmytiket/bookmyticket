/**
 * POST /api/admin/kyc/suspend
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

    const body = await request.json();
    const { organizer_id, remarks } = body;
    if (!organizer_id) return NextResponse.json({ error: 'organizer_id required' }, { status: 400 });

    await supabaseAdmin
      .from('digilocker_kyc_records')
      .update({
        kyc_status: 'suspended',
        blacklisted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('organizer_id', organizer_id);

    await supabaseAdmin
      .from('organizer_verification_status')
      .upsert({
        organizer_id,
        kyc_status: 'suspended',
        dashboard_access: false,
        rejection_reason: remarks || 'Account suspended by admin',
      }, { onConflict: 'organizer_id' });

    // Also suspend the organiser profile
    await supabaseAdmin
      .from('organisers')
      .update({ kyc_status: 'Suspended', is_approved: false })
      .eq('id', organizer_id);

    await supabaseAdmin.from('kyc_review_logs').insert({
      organizer_id,
      reviewed_by: user.id,
      action: 'suspended',
      new_status: 'suspended',
      remarks: remarks || null,
    });

    return NextResponse.json({ success: true, action: 'suspended', organizer_id });
  } catch (err) {
    console.error('[Admin KYC Suspend]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
