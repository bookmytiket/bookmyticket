import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendTemplatedEmail } from '@/lib/emailService';

export async function POST(req) {
  try {
    const { event_id } = await req.json();
    if (!event_id) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Update Event Status
    const { error: updateError } = await adminSupabase
      .from('events')
      .update({ status: 'approved' })
      .eq('id', event_id);

    if (updateError) throw updateError;

    // Update Review Status (best effort)
    try {
      await adminSupabase.from('event_reviews')
        .update({ review_status: 'approved' })
        .eq('event_id', event_id);
    } catch (_) {}

    // Fetch event + organiser details for email
    const { data: event } = await adminSupabase
      .from('events')
      .select('title, date, venue, city, organiser_id, profiles:organiser_id(full_name, email)')
      .eq('id', event_id)
      .single();

    const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bookmyticket.net';
    const organiserName = event?.profiles?.full_name || 'Organiser';
    const organiserEmail = event?.profiles?.email;
    const eventTitle = event?.title || 'Your Event';
    const eventDate = event?.date
      ? new Date(event.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'TBD';
    const eventVenue = event?.venue || event?.city || 'TBD';

    // Send approval email to organiser
    if (organiserEmail) {
      try {
        await sendTemplatedEmail({
          templateIdentifier: 'event_approved_organiser',
          to: organiserEmail,
          variables: {
            organiser_name: organiserName,
            event_title: eventTitle,
            event_date: eventDate,
            event_venue: eventVenue,
            organiser_url: `${siteUrl}/organiser`,
            site_url: siteUrl
          }
        });
      } catch (_) {}
    }

    // In-app notification for organiser (best effort)
    if (event?.organiser_id) {
      try {
        await adminSupabase.from('notifications').insert({
          user_id: event.organiser_id,
          title: '🎉 Event Approved!',
          message: `"${eventTitle}" has been approved. You can now publish it from your dashboard.`,
          is_read: false
        });
      } catch (_) {}
    }

    return NextResponse.json({ success: true, status: 'approved' });
  } catch (error) {
    console.error('Error in admin approve event:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
