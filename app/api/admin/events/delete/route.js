import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { event_id, event_category } = await req.json();
    if (!event_id) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Forcefully delete from ALL possible child tables to prevent orphans
    // regardless of what the frontend thinks the category is.
    await adminSupabase.from('tournament_events').delete().eq('id', event_id);
    await adminSupabase.from('tournament_events').delete().eq('event_id', event_id);
    await adminSupabase.from('tournament_categories').delete().eq('event_id', event_id);
    await adminSupabase.from('marathon_events').delete().eq('id', event_id);
    await adminSupabase.from('marathon_events').delete().eq('event_id', event_id);
    await adminSupabase.from('marathon_config').delete().eq('id', event_id);
    await adminSupabase.from('marathon_config').delete().eq('event_id', event_id);
    await adminSupabase.from('bookings').delete().eq('event_id', event_id);

    // 2. Delete the event from primary events table
    const { error: deleteError } = await adminSupabase
      .from('events')
      .delete()
      .eq('id', event_id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in admin delete event:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
