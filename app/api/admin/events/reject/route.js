import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendTemplatedEmail } from '@/lib/emailService';

export async function POST(req) {
  try {
    const { event_id, reason } = await req.json();
    if (!event_id) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error: updateError } = await adminSupabase
      .from('events')
      .update({ status: 'rejected' })
      .eq('id', event_id);

    if (updateError) throw updateError;

    try {
      await adminSupabase.from('event_reviews')
        .update({ review_status: 'rejected', review_notes: reason })
        .eq('event_id', event_id);
    } catch (_) {}

    const { data: event } = await adminSupabase
      .from('events')
      .select('title, organiser_id, profiles:organiser_id(full_name, email)')
      .eq('id', event_id)
      .single();

    const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bookmyticket.net';
    const organiserName = event?.profiles?.full_name || 'Organiser';
    const organiserEmail = event?.profiles?.email;
    const eventTitle = event?.title || 'Your Event';

    if (organiserEmail) {
      try {
        await sendTemplatedEmail({
          templateIdentifier: 'event_rejected_organiser',
          to: organiserEmail,
          variables: {
            organiser_name: organiserName,
            event_title: eventTitle,
            rejection_reason: reason || 'No specific reason provided. Please contact support.',
            organiser_url: `${siteUrl}/organiser`,
            site_url: siteUrl
          }
        });
      } catch (_) {}
    }

    if (event?.organiser_id) {
      try {
        await adminSupabase.from('notifications').insert({
          user_id: event.organiser_id,
          title: 'Event Not Approved',
          message: `"${eventTitle}" was not approved. ${reason ? 'Reason: ' + reason : 'Please check your email for details.'}`,
          is_read: false
        });
      } catch (_) {}
    }

    return NextResponse.json({ success: true, status: 'rejected' });
  } catch (error) {
    console.error('Error in admin reject event:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
