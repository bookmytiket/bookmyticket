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

    // Verify Admin Role
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userProfile?.role !== 'admin' && session.user.user_metadata?.role !== 'admin') {
       return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { event_id } = await req.json();

    if (!event_id) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    // Update Event Status
    const { error: updateError } = await supabase
      .from('events')
      .update({ status: 'approved' })
      .eq('id', event_id);

    if (updateError) throw updateError;

    // Update Review Status
    await supabase.from('event_reviews').update({
      review_status: 'approved',
      reviewed_by: session.user.id
    }).eq('event_id', event_id);

    return NextResponse.json({ success: true, status: 'approved' });
  } catch (error) {
    console.error('Error in admin approve event:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
