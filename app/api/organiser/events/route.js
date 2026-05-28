import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/organiser/events
 * 
 * Server-side enforced organiser isolation.
 * Returns events with live booked_seats count from bookings table.
 */
export async function GET(request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // 1. Verify the caller's JWT from the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }
    const userJwt = authHeader.replace('Bearer ', '');

    // 2. Get the user from their JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${userJwt}` } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }

    // 3. Use service role client
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Resolve Organiser ID
    let { data: organiser } = await adminClient
      .from('organisers')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!organiser) {
      const { data: altOrg } = await adminClient
        .from('organisers')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      
      if (altOrg) {
        organiser = altOrg;
      } else {
        const { data: staffMember } = await adminClient
          .from('staff')
          .select('organiser_id')
          .eq('id', user.id)
          .maybeSingle();
        
        if (staffMember) {
          organiser = { id: staffMember.organiser_id };
        }
      }
    }

    const targetId = organiser?.id || user.id;

    // 4. Fetch events scoped to this organiser
    const { data: events, error: evErr } = await adminClient
      .from('events')
      .select('*, tournament_events!event_id(*), tournament_categories!event_id(*), marathon_config!event_id(*), sports_events!event_id(*, sports_categories(*), sports_match_types(*)), competition_categories!event_id(*), competition_events!event_id(*), registration_fields!event_id(*), event_media!event_id(*), event_terms!event_id(*), event_amenities!event_id(*), virtual_event_configs!event_id(*)')
      .eq('organiser_id', targetId)
      .order('created_at', { ascending: false });

    if (evErr) {
      console.error('[/api/organiser/events] Query error:', evErr);
      return NextResponse.json({ error: evErr.message }, { status: 500 });
    }

    // 5. Fetch confirmed booking counts per event in one query
    let eventsWithBookings = events || [];
    if (eventsWithBookings.length > 0) {
      const eventIds = eventsWithBookings.map(e => e.id);

      // Get count of confirmed bookings and total ticket_count per event
      const { data: bookingSummary } = await adminClient
        .from('bookings')
        .select('event_id, ticket_count, total_price')
        .in('event_id', eventIds)
        .eq('status', 'Confirmed');

      // Aggregate per event
      const bookingMap = {};
      for (const b of (bookingSummary || [])) {
        if (!bookingMap[b.event_id]) {
          bookingMap[b.event_id] = { booked_seats: 0, booking_count: 0, total_revenue: 0 };
        }
        bookingMap[b.event_id].booked_seats += (b.ticket_count || 1);
        bookingMap[b.event_id].booking_count += 1;
        bookingMap[b.event_id].total_revenue += (Number(b.total_price) || 0);
      }

      // Merge into events
      eventsWithBookings = eventsWithBookings.map(ev => ({
        ...ev,
        booked_seats: bookingMap[ev.id]?.booked_seats || 0,
        booking_count: bookingMap[ev.id]?.booking_count || 0,
        event_revenue: bookingMap[ev.id]?.total_revenue || 0,
      }));
    }

    return NextResponse.json({
      events: eventsWithBookings,
      organiser_id: user.id,
      count: eventsWithBookings.length,
    });

  } catch (err) {
    console.error('[/api/organiser/events] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
