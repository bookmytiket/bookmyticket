import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/marathon/[slug]
 * Returns full public marathon event data including categories, sponsors, benefits.
 */
export async function GET(request, { params }) {
  const { slug } = params;

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  try {
    // 1. Fetch from marathon_events by slug OR id
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    
    let marathonQuery = adminClient
      .from('marathon_events')
      .select('*');

    marathonQuery = isUuid
      ? marathonQuery.eq('id', slug)
      : marathonQuery.eq('slug', slug);

    const { data: marathon, error: mErr } = await marathonQuery.maybeSingle();

    if (mErr) throw mErr;

    // 2. Fallback: try the events table (for cross-table consistency)
    let eventData = marathon;
    if (!eventData && isUuid) {
      const { data: evt } = await adminClient
        .from('events')
        .select('*')
        .eq('id', slug)
        .eq('type', 'Marathon')
        .maybeSingle();
      if (evt) eventData = evt;
    }

    if (!eventData || eventData.is_deleted || eventData.status === 'DELETED') {
      return NextResponse.json({ error: 'Marathon not found' }, { status: 404 });
    }

    const marathonId = eventData.id;

    // 3. Fetch categories
    const { data: categories } = await adminClient
      .from('marathon_categories')
      .select('*')
      .eq('marathon_id', marathonId)
      .order('distance_km', { ascending: true });

    // 4. Fetch sponsors
    const { data: sponsors } = await adminClient
      .from('marathon_sponsors')
      .select('*')
      .eq('marathon_id', marathonId)
      .order('rank_order', { ascending: true });

    // 5. Fetch benefits
    const { data: benefits } = await adminClient
      .from('marathon_benefits')
      .select('*')
      .eq('marathon_id', marathonId);

    // 6. Apply early bird pricing automatically
    const today = new Date().toISOString().split('T')[0];
    const enrichedCategories = (categories || []).map(cat => {
      const isEarlyBird = cat.early_bird_start && cat.early_bird_end
        && today >= cat.early_bird_start
        && today <= cat.early_bird_end;
      return {
        ...cat,
        effective_price: isEarlyBird ? cat.early_bird_price : cat.price,
        is_early_bird: isEarlyBird,
        available_slots: cat.available_slots ?? Math.max(0, (cat.slots_total || 100) - (cat.slots_booked || 0)),
      };
    });

    // 7. Generate registration URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bookmyticket.net';
    const registrationUrl = `${baseUrl}/marathon/${eventData.slug || marathonId}`;

    return NextResponse.json({
      success: true,
      marathon: {
        ...eventData,
        registrationUrl,
      },
      categories: enrichedCategories,
      sponsors: sponsors || [],
      benefits: benefits || [],
    });

  } catch (err) {
    console.error('[/api/marathon/[slug]] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
