import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
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

    // 3. Initialize service role client (bypasses RLS)
    const adminClient = createClient(supabaseUrl, serviceKey);

    // 4. Parse request payload
    const {
      localMarathonId,
      eventPayload,
      marathonEventsPayload,
      marathonPayload,
      categories = [],
      sponsors = [],
      benefits = [],
      customFields = [],
      newStatus
    } = await request.json();

    let marathon_id = localMarathonId;

    // Ensure organiser_id matches user.id
    eventPayload.organiser_id = user.id;
    marathonEventsPayload.organiser_id = user.id;

    // 5. Insert/Update into 'events' table
    if (localMarathonId) {
      if (newStatus === 'Draft' || newStatus === undefined) {
        const { data: existingEvent } = await adminClient.from('events').select('status, publish_status').eq('id', localMarathonId).single();
        if (existingEvent?.status?.toLowerCase() === 'published' || existingEvent?.publish_status?.toLowerCase() === 'published') {
          eventPayload.status = 'published';
          eventPayload.publish_status = 'published';
          if (marathonEventsPayload) marathonEventsPayload.status = 'published';
        }
      }
      const { error: updateError } = await adminClient
        .from('events')
        .update(eventPayload)
        .eq('id', localMarathonId);
      if (updateError) throw updateError;
    } else {
      const { data, error } = await adminClient
        .from('events')
        .insert(eventPayload)
        .select()
        .single();
      if (error) throw error;
      marathon_id = data.id;
    }

    // Assign final marathon_id to related payloads
    marathonEventsPayload.id = marathon_id;
    marathonPayload.id = marathon_id;
    marathonPayload.event_id = marathon_id;

    // 6. Upsert into 'marathon_events'
    const { error: meError } = await adminClient
      .from('marathon_events')
      .upsert(marathonEventsPayload, { onConflict: 'id' });
    if (meError) {
      console.error('[/api/organiser/marathon] marathon_events upsert error:', meError);
      throw meError;
    }

    // 7. Upsert into 'marathon_config'
    const { error: mError } = await adminClient
      .from('marathon_config')
      .upsert(marathonPayload, { onConflict: 'id' });
    if (mError) {
      console.error('[/api/organiser/marathon] marathon_config upsert error:', mError);
      throw mError;
    }

    // 8. Sync Categories
    try {
      await adminClient.from('marathon_categories').delete().eq('marathon_id', marathon_id);
      if (categories.length > 0) {
        const { error: catInsertError } = await adminClient.from('marathon_categories').insert(
          categories.map(c => ({
            title: c.category_name || c.title,
            distance_km: Number(c.distance_km) || 0,
            price: Number(c.price) || 0,
            total_slots: Number(c.slots_total || c.total_slots) || 0,
            marathon_id: marathon_id
          }))
        );
        if (catInsertError) console.warn('Categories table insert failed:', catInsertError.message);
      }
    } catch (catErr) {
      console.warn('Categories sync error:', catErr.message);
    }

    // 9. Sync Sponsors
    try {
      await adminClient.from('marathon_sponsors').delete().eq('marathon_id', marathon_id);
      if (sponsors.length > 0) {
        await adminClient.from('marathon_sponsors').insert(
          sponsors.map(s => ({
            sponsor_name: s.sponsor_name,
            logo_url: s.logo_url,
            sponsor_type: s.sponsor_type,
            marathon_id
          }))
        );
      }
    } catch (spErr) {
      console.warn('Sponsors sync error:', spErr.message);
    }

    // 10. Sync Benefits
    try {
      await adminClient.from('marathon_benefits').delete().eq('marathon_id', marathon_id);
      if (benefits.length > 0) {
        await adminClient.from('marathon_benefits').insert(
          benefits.map(b => ({
            benefit_name: b.benefit_name,
            icon_key: b.icon_key,
            marathon_id
          }))
        );
      }
    } catch (benErr) {
      console.warn('Benefits sync error:', benErr.message);
    }

    // 11. Sync Registration Fields
    try {
      await adminClient.from('registration_fields').delete().eq('event_id', marathon_id);
      if (customFields.length > 0) {
        await adminClient.from('registration_fields').insert(
          customFields.map((f, i) => ({
            event_id: marathon_id,
            field_key: f.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
            label: f.label,
            field_type: f.type || 'text',
            options: Array.isArray(f.options) ? f.options.filter(Boolean) : (f.options ? f.options.split(',').map(s => s.trim()) : null),
            is_required: !!f.required,
            sort_order: i,
            is_active: true
          }))
        );
      }
    } catch (regErr) {
      console.warn('Registration fields sync error:', regErr.message);
    }

    return NextResponse.json({
      success: true,
      marathon_id
    });

  } catch (err) {
    console.error('[/api/organiser/marathon] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to save marathon' }, { status: 500 });
  }
}
