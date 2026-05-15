import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/organiser/events
 * 
 * Server-side enforced organiser isolation.
 * Uses the service role key (bypasses DB RLS) but ALWAYS filters by
 * the authenticated user's ID — so cross-organiser data leakage is impossible.
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

    // 2. Get the user from their JWT using a user-scoped client
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${userJwt}` } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }

    // 3. Use service role client (bypasses RLS) but FORCE filter by organiser_id
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Resolve Organiser ID (checks: Own ID -> Auth ID Mapping -> Staff Assignment)
    let { data: organiser } = await adminClient
      .from('organisers')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!organiser) {
      // Check for legacy Auth UID mapping
      const { data: altOrg } = await adminClient
        .from('organisers')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      
      if (altOrg) {
        organiser = altOrg;
      } else {
        // Check if user is STAFF assigned to an organiser
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

    // 4. Build the events query — ALWAYS scoped to the resolved organiser
    let query = adminClient
      .from('events')
      .select('*, tournament_events!event_id(*), tournament_categories!event_id(*), marathon_config!event_id(*)')
      .order('created_at', { ascending: false });

    // Hard-enforce: only own events
    query = query.eq('organiser_id', targetId);

    const { data: events, error: evErr } = await query;
    if (evErr) {
      console.error('[/api/organiser/events] Query error:', evErr);
      return NextResponse.json({ error: evErr.message }, { status: 500 });
    }

    return NextResponse.json({
      events: events || [],
      organiser_id: user.id,
      count: events?.length || 0,
    });

  } catch (err) {
    console.error('[/api/organiser/events] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
