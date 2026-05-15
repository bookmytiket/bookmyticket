import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 1. Verify Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }
    const userJwt = authHeader.replace('Bearer ', '');

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${userJwt}` } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }

    // 2. Resolve Organiser ID
    // We use the service role to ensure we find the organiser record even if RLS is strict.
    const adminClient = createClient(supabaseUrl, serviceKey);
    
    // First, try to find the organiser record linked to this Auth UID
    // We check: Own ID -> auth_user_id -> Staff Assignment
    let { data: organiser, error: orgErr } = await adminClient
      .from('organisers')
      .select('id, business_name')
      .eq('id', user.id)
      .maybeSingle();

    if (!organiser) {
      // Try resolving via auth_user_id
      const { data: altOrg } = await adminClient
        .from('organisers')
        .select('id, business_name')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      
      if (altOrg) {
        organiser = altOrg;
      } else {
        // Try resolving via Staff Assignment
        const { data: staffMember } = await adminClient
          .from('staff')
          .select('organiser_id, organisers(business_name)')
          .eq('id', user.id)
          .maybeSingle();
        
        if (staffMember) {
          organiser = { 
            id: staffMember.organiser_id, 
            business_name: staffMember.organisers?.business_name 
          };
        }
      }
    }

    if (!organiser) {
       // If not found by ID, maybe it's in a different column? 
       // We fallback to checking if the user is an admin who can see everything.
       const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single();
       if (!['admin', 'super_admin', 'system_admin'].includes(profile?.role)) {
          return NextResponse.json({ 
            stats: { totalEvents: 0, activeEvents: 0, totalBookings: 0, revenue: 0, expiredEvents: 0 },
            message: 'No organiser profile found' 
          });
       }
    }

    const targetId = organiser?.id || user.id;
    const now = new Date().toISOString();

    // 3. Fetch Stats in Parallel
    const [eventsCount, activeCount, expiredCount, bookingsData] = await Promise.all([
      // Total Events
      adminClient.from('events').select('id', { count: 'exact', head: true }).eq('organiser_id', targetId),
      // Active Events
      adminClient.from('events').select('id', { count: 'exact', head: true })
        .eq('organiser_id', targetId)
        .eq('publish_status', 'published')
        .gt('event_end_at', now),
      // Expired Events
      adminClient.from('events').select('id', { count: 'exact', head: true })
        .eq('organiser_id', targetId)
        .lt('event_end_at', now),
      // Bookings & Revenue (Join through events)
      adminClient.from('bookings').select('total_amount, event_id, events!inner(organiser_id)')
        .eq('events.organiser_id', targetId)
    ]);

    const totalRevenue = bookingsData.data?.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0;

    return NextResponse.json({
      stats: {
        totalEvents: eventsCount.count || 0,
        activeEvents: activeCount.count || 0,
        expiredEvents: expiredCount.count || 0,
        totalBookings: bookingsData.data?.length || 0,
        revenue: totalRevenue,
        organiserName: organiser?.business_name || 'Organiser'
      },
      ownership: {
        auth_id: user.id,
        resolved_organiser_id: targetId
      }
    });

  } catch (err) {
    console.error('[/api/organiser/dashboard/summary] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
