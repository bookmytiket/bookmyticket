import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/response';

export async function POST(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event_id } = await req.json();

    if (!event_id) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    // Check if event is approved before publishing
    const { data: event } = await supabase
      .from('events')
      .select('status, organiser_id')
      .eq('id', event_id)
      .single();

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    
    // Admins can bypass, organisers must own the event
    if (event.organiser_id !== session.user.id && session.user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (event.status !== 'approved' && session.user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Event must be approved by admin before publishing' }, { status: 403 });
    }

    // Update Event Status to published
    const { error: updateError } = await supabase
      .from('events')
      .update({ status: 'published', publish_status: 'published', published_at: new Date().toISOString() })
      .eq('id', event_id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, status: 'published' });
  } catch (error) {
    console.error('Error in publish event:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
