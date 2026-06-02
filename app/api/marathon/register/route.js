import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateRegistrationId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BMT-MR-${ts}${rand}`;
}

/**
 * POST /api/marathon/register
 * Full participant registration with mandatory health + identity fields.
 *
 * Body: {
 *   marathon_id, category_id, user_id (optional),
 *   participant: { full_name, email, phone, dob, gender, blood_group, emergency_contact, address, city, state, country },
 *   tshirt_size, running_club,
 *   payment_id, payment_amount, payment_status
 * }
 */
export async function POST(request) {
  try {
    // Auth (optional for guest registrations, required for user-linked)
    const authHeader = request.headers.get('authorization');
    let userId = null;

    if (authHeader?.startsWith('Bearer ')) {
      const userClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await userClient.auth.getUser();
      if (user) userId = user.id;
    }

    const body = await request.json();
    const {
      marathon_id,
      category_id,
      participant = {},
      tshirt_size,
      running_club,
      payment_id,
      payment_amount,
      payment_status = 'Paid',
      custom_fields = {},
    } = body;

    if (!marathon_id) {
      return NextResponse.json({ error: 'marathon_id is required' }, { status: 400 });
    }
    if (!participant.full_name) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }
    if (!participant.email && !participant.phone) {
      return NextResponse.json({ error: 'Email or phone is required' }, { status: 400 });
    }

    // Fetch marathon event
    const { data: marathon, error: mErr } = await adminClient
      .from('marathon_events')
      .select('id, title, event_date, venue, status')
      .eq('id', marathon_id)
      .maybeSingle();

    if (mErr || !marathon) {
      return NextResponse.json({ error: 'Marathon event not found' }, { status: 404 });
    }

    // Fetch category and check slots
    let category = null;
    if (category_id) {
      const { data: cat } = await adminClient
        .from('marathon_categories')
        .select('*')
        .eq('id', category_id)
        .maybeSingle();

      if (cat) {
        const available = Math.max(0, (cat.slots_total || 100) - (cat.slots_booked || 0));
        if (available <= 0) {
          return NextResponse.json({ error: `${cat.category_name} is fully booked` }, { status: 400 });
        }
        category = cat;
      }
    }

    // Apply early bird pricing
    let effectivePrice = payment_amount;
    if (category && !effectivePrice) {
      const today = new Date().toISOString().split('T')[0];
      const isEarlyBird = category.early_bird_start && category.early_bird_end
        && today >= category.early_bird_start
        && today <= category.early_bird_end;
      effectivePrice = isEarlyBird ? category.early_bird_price : category.price;
    }

    const registration_id = generateRegistrationId();

    // QR code data — will store the registration_id; frontend generates the actual QR image
    const qrData = JSON.stringify({
      type: 'marathon_registration',
      registration_id,
      marathon_id,
      participant_name: participant.full_name,
    });

    const { data: registration, error: regErr } = await adminClient
      .from('marathon_registrations')
      .insert({
        marathon_id,
        category_id: category_id || null,
        user_id: userId || (body.user_id || null),
        registration_id,
        participant_name: participant.full_name,
        participant_email: participant.email || null,
        participant_phone: participant.phone || null,
        participant_age: participant.dob ? calculateAge(participant.dob) : null,
        participant_gender: participant.gender || null,
        blood_group: participant.blood_group || null,
        emergency_contact: participant.emergency_contact || null,
        address: participant.address || null,
        city: participant.city || null,
        state: participant.state || null,
        country: participant.country || 'India',
        tshirt_size: tshirt_size || null,
        running_club: running_club || null,
        payment_status,
        payment_id: payment_id || null,
        payment_amount: effectivePrice || null,
        registration_status: 'confirmed',
        qr_code: qrData,
        custom_fields,
        dob: participant.dob || null,
      })
      .select()
      .single();

    if (regErr) {
      console.error('[marathon/register] Insert error:', regErr);
      return NextResponse.json({ error: regErr.message }, { status: 500 });
    }

    // Increment slots_booked
    if (category_id) {
      await adminClient.rpc('increment_marathon_slots', { p_category_id: category_id }).catch(() => {
        // Fallback if RPC doesn't exist
        adminClient
          .from('marathon_categories')
          .update({ slots_booked: (category?.slots_booked || 0) + 1 })
          .eq('id', category_id);
      });
    }

    // Trigger registration confirmation notification (async, don't await)
    triggerRegistrationNotification(registration, marathon, category).catch(console.error);

    return NextResponse.json({
      success: true,
      registration: {
        ...registration,
        marathon_title: marathon.title,
        category_name: category?.category_name || null,
      },
    });

  } catch (err) {
    console.error('[/api/marathon/register] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/marathon/register?marathon_id=xxx&user_id=yyy
 * Fetch registrations for a participant or organiser view.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const marathonId = searchParams.get('marathon_id');
  const userId = searchParams.get('user_id');
  const registrationId = searchParams.get('registration_id');

  try {
    let query = adminClient
      .from('marathon_registrations')
      .select(`
        *,
        marathon_categories ( category_name, distance_km, gender_category ),
        marathon_events ( title, event_date, venue )
      `)
      .order('created_at', { ascending: false });

    if (registrationId) query = query.eq('registration_id', registrationId);
    else if (marathonId) query = query.eq('marathon_id', marathonId);
    else if (userId) query = query.eq('user_id', userId);
    else return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, registrations: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function calculateAge(dob) {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

async function triggerRegistrationNotification(registration, marathon, category) {
  try {
    await adminClient.from('marathon_notifications').insert({
      event_id: marathon.id,
      notification_type: 'registration_confirmation',
      recipient_type: 'registered_participants',
      channel: 'email',
      status: 'pending',
      metadata: {
        registration_id: registration.registration_id,
        participant_name: registration.participant_name,
        participant_email: registration.participant_email,
        category_name: category?.category_name,
        event_title: marathon.title,
        event_date: marathon.event_date,
        venue: marathon.venue,
      },
    });
  } catch (err) {
    console.warn('[marathon/register] Notification trigger failed:', err.message);
  }
}
