import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { localEventId, eventPayload, categories, sponsors, newStatus } = body;

    // Generate slug from event name
    const slug = eventPayload.event_name
      ? eventPayload.event_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now()
      : null;

    let event_id = localEventId;

    if (localEventId) {
      // Update existing
      const { error } = await supabase
        .from('badminton_events')
        .update({ ...eventPayload, updated_at: new Date().toISOString() })
        .eq('id', localEventId)
        .eq('organiser_id', user.id);
      if (error) throw error;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('badminton_events')
        .insert({ ...eventPayload, organiser_id: user.id, slug })
        .select('id')
        .single();
      if (error) throw error;
      event_id = data.id;
    }

    // Upsert categories
    if (categories?.length > 0) {
      await supabase.from('badminton_categories').delete().eq('event_id', event_id);
      const catRows = categories.map(c => ({
        event_id,
        category_name: c.category_name,
        age_rule: c.age_rule || null,
        gender: c.gender || 'Boys',
        registration_fee: Number(c.registration_fee) || 0,
        platform_fee: Number(c.platform_fee) || 20,
        gst_percent: Number(c.gst_percent) || 18,
        capacity: Number(c.capacity) || 128,
        winner_prize: c.winner_prize || null,
        runner_prize: c.runner_prize || null,
        semifinal_prize: c.semifinal_prize || null,
        trophy_included: Boolean(c.trophy_included),
      }));
      const { error } = await supabase.from('badminton_categories').insert(catRows);
      if (error) throw error;
    }

    // Upsert sponsors
    if (sponsors?.length > 0) {
      await supabase.from('badminton_sponsors').delete().eq('event_id', event_id);
      const sponsorRows = sponsors
        .filter(s => s.sponsor_name)
        .map((s, i) => ({
          event_id,
          sponsor_name: s.sponsor_name,
          sponsor_type: s.sponsor_type || 'Gold Sponsor',
          logo_url: s.logo_url || null,
          website_url: s.website_url || null,
          display_order: i,
        }));
      if (sponsorRows.length > 0) {
        const { error } = await supabase.from('badminton_sponsors').insert(sponsorRows);
        if (error) throw error;
      }
    }

    // Also sync to events table for unified listing
    const eventsPayload = {
      title: eventPayload.event_name,
      event_name: eventPayload.event_name,
      img: eventPayload.banner_url,
      date: eventPayload.event_date || null,
      time: eventPayload.match_start_time || null,
      venue: eventPayload.venue || null,
      city: eventPayload.city,
      state: eventPayload.state,
      country: 'India',
      status: newStatus === 'published' ? 'published' : newStatus === 'pending_review' ? 'pending_review' : 'draft',
      publish_status: newStatus === 'published' ? 'published' : newStatus === 'pending_review' ? 'pending_review' : 'draft',
      type: 'Badminton',
      event_type: 'Badminton Championship',
      category: 'Sports',
      organiser_id: user.id,
      description: eventPayload.description,
      dynamic_config: {
        badminton_event_id: event_id,
        categories: categories || [],
        sponsors: sponsors || [],
        highlights: {
          feather_shuttle: eventPayload.highlight_feather_shuttle,
          knockout: eventPayload.highlight_knockout,
          participation_medal: eventPayload.highlight_participation_medal,
          bai_rules: eventPayload.highlight_bai_rules,
          live_scoring: eventPayload.highlight_live_scoring,
          referee_monitoring: eventPayload.highlight_referee_monitoring,
        }
      }
    };

    if (localEventId) {
      await supabase.from('events').update(eventsPayload).eq('id', localEventId);
    } else {
      await supabase.from('events').insert({ ...eventsPayload, id: event_id });
    }

    return NextResponse.json({ event_id, success: true });
  } catch (err) {
    console.error('[Badminton API]', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');

    let query = supabase
      .from('badminton_events')
      .select(`*, badminton_categories(*), badminton_sponsors(*)`);

    if (id) query = query.eq('id', id);
    else if (slug) query = query.eq('slug', slug);
    else return NextResponse.json({ error: 'id or slug required' }, { status: 400 });

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
