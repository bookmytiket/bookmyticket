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

    // Update status
    const { error: updateError } = await supabase
      .from('events')
      .update({ status: 'pending_review' })
      .eq('id', event_id)
      .eq('organiser_id', session.user.id);

    if (updateError) throw updateError;

    // Create review record
    await supabase.from('event_reviews').insert({
      event_id,
      review_status: 'pending'
    });

    // Notify Admin (Assuming admin has a specific UUID or we log an admin notification)
    // You can implement custom email/push notification logic here
    await supabase.from('notifications').insert({
      user_id: session.user.id, // For the organizer
      title: 'Event Submitted for Review',
      message: 'Your event has been submitted and is pending admin approval.',
      is_read: false
    });

    return NextResponse.json({ success: true, status: 'pending_review' });
  } catch (error) {
    console.error('Error in submit-review:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
