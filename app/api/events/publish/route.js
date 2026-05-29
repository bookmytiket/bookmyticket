import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { event_id, organiser_id } = await req.json();
    if (!event_id) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    // Check if event is approved before publishing
    const { data: event } = await supabase
      .from('events')
      .select('status, organiser_id, title')
      .eq('id', event_id)
      .single();

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    // Verify ownership if organiser_id provided
    if (organiser_id && event.organiser_id !== organiser_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (event.status !== 'approved') {
      return NextResponse.json({ error: 'Event must be approved by admin before publishing' }, { status: 403 });
    }

    // Update only columns that exist in the events table
    const { error: updateError } = await supabase
      .from('events')
      .update({
        status: 'published',
        publish_status: 'published',
        listing_status: 'active',
        visibility_status: 'public',
      })
      .eq('id', event_id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, status: 'published' });
  } catch (error) {
    console.error('Error in publish event:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
