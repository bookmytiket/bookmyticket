import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/marathon/checkin
 * QR scan → record check-in, kit issuance.
 *
 * Body: { registration_id (BMT-MR-xxx), staff_id, action: 'checkin' | 'kit' | 'mark_present', notes, scan_location }
 */
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { registration_id, action = 'checkin', notes, scan_location } = body;

    if (!registration_id) {
      return NextResponse.json({ error: 'registration_id is required' }, { status: 400 });
    }

    // Fetch registration (by registration_id or UUID id)
    const isUuid = /^[0-9a-f-]{36}$/i.test(registration_id);
    const { data: registration, error: regErr } = await adminClient
      .from('marathon_registrations')
      .select(`
        *,
        marathon_categories ( category_name, distance_km, gender_category ),
        marathon_events ( id, title, event_date, venue, organiser_id )
      `)
      [isUuid ? 'eq' : 'eq'](isUuid ? 'id' : 'registration_id', registration_id)
      .maybeSingle();

    if (regErr || !registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // Check existing check-in
    const { data: existingCheckin } = await adminClient
      .from('marathon_checkins')
      .select('id, checkin_time, kit_issued, attendance_status')
      .eq('registration_id', registration.id)
      .maybeSingle();

    // Determine what to update/insert
    const checkInPayload = {
      registration_id: registration.id,
      staff_id: user.id,
      checkin_time: new Date().toISOString(),
      attendance_status: 'Present',
      kit_issued: action === 'kit' ? true : (existingCheckin?.kit_issued || false),
      notes: notes || null,
      scan_location: scan_location || null,
    };

    let checkin;
    if (existingCheckin) {
      // Update existing
      const { data: updated, error: upErr } = await adminClient
        .from('marathon_checkins')
        .update({
          kit_issued: action === 'kit' ? true : existingCheckin.kit_issued,
          attendance_status: 'Present',
          notes: notes || existingCheckin.notes,
          scan_location: scan_location || null,
        })
        .eq('id', existingCheckin.id)
        .select()
        .single();
      if (upErr) throw upErr;
      checkin = updated;
    } else {
      const { data: inserted, error: insErr } = await adminClient
        .from('marathon_checkins')
        .insert(checkInPayload)
        .select()
        .single();
      if (insErr) throw insErr;
      checkin = inserted;
    }

    return NextResponse.json({
      success: true,
      already_checked_in: !!existingCheckin && action === 'checkin',
      checkin,
      participant: {
        registration_id: registration.registration_id,
        full_name: registration.participant_name,
        email: registration.participant_email,
        phone: registration.participant_phone,
        gender: registration.participant_gender,
        tshirt_size: registration.tshirt_size,
        blood_group: registration.blood_group,
        emergency_contact: registration.emergency_contact,
        category_name: registration.marathon_categories?.category_name,
        distance_km: registration.marathon_categories?.distance_km,
        bib_number: registration.bib_number,
        payment_status: registration.payment_status,
        registration_status: registration.registration_status,
      },
    });

  } catch (err) {
    console.error('[/api/marathon/checkin] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/marathon/checkin?registration_id=xxx OR ?marathon_id=xxx
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const registrationId = searchParams.get('registration_id');
  const marathonId = searchParams.get('marathon_id');

  try {
    if (registrationId) {
      // Look up by registration_id string (BMT-MR-xxx)
      const { data: reg } = await adminClient
        .from('marathon_registrations')
        .select('id')
        .eq('registration_id', registrationId)
        .maybeSingle();

      if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

      const { data: checkin } = await adminClient
        .from('marathon_checkins')
        .select('*')
        .eq('registration_id', reg.id)
        .maybeSingle();

      return NextResponse.json({ success: true, checkin });
    }

    if (marathonId) {
      // Get all check-ins for a marathon (organiser view)
      const { data: checkins, error } = await adminClient
        .from('marathon_checkins')
        .select(`
          *,
          marathon_registrations!inner (
            registration_id, participant_name, participant_email,
            tshirt_size, bib_number, payment_status,
            marathon_categories ( category_name, distance_km )
          )
        `)
        .eq('marathon_registrations.marathon_id', marathonId)
        .order('checkin_time', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ success: true, checkins: checkins || [] });
    }

    return NextResponse.json({ error: 'registration_id or marathon_id required' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
