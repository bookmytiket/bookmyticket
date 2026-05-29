import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendTemplatedEmail } from '@/lib/emailService';

export async function POST(req) {
  try {
    const body = await req.json();
    const { event_id, organiser_id } = body;

    if (!event_id || !organiser_id) {
      return NextResponse.json({ error: 'Event ID and Organiser ID required' }, { status: 400 });
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Update status to pending_review
    const { error: updateError } = await adminSupabase
      .from('events')
      .update({ status: 'pending_review' })
      .eq('id', event_id)
      .eq('organiser_id', organiser_id);

    if (updateError) throw updateError;

    // Fetch event + organiser details
    const { data: event } = await adminSupabase
      .from('events')
      .select('title, date, time, venue, city, organiser_id, profiles:organiser_id(full_name, email)')
      .eq('id', event_id)
      .single();

    // Fetch admin email
    const { data: adminProfile } = await adminSupabase
      .from('profiles')
      .select('email')
      .eq('role', 'admin')
      .single();

    const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bookmyticket.net';
    const organiserName = event?.profiles?.full_name || 'Organiser';
    const organiserEmail = event?.profiles?.email;
    const eventTitle = event?.title || 'Event';
    const eventDate = event?.date
      ? new Date(event.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'TBD';
    const eventVenue = event?.venue || event?.city || 'TBD';

    // Email admin about new submission
    if (adminProfile?.email) {
      try {
        await sendTemplatedEmail({
          templateIdentifier: 'event_submitted_admin',
          to: adminProfile.email,
          variables: {
            event_title: eventTitle,
            organiser_name: organiserName,
            organiser_email: organiserEmail,
            event_date: eventDate,
            event_venue: eventVenue,
            admin_url: `${siteUrl}/admin?tab=event_reviews`,
            site_url: siteUrl
          }
        });
      } catch (_) {}
    }

    // Create review record (best effort)
    try {
      await adminSupabase.from('event_reviews').insert({
        event_id,
        review_status: 'pending'
      });
    } catch (_) {}

    // In-app notification for organiser
    try {
      await adminSupabase.from('notifications').insert({
        user_id: organiser_id,
        title: 'Event Submitted for Review',
        message: `"${eventTitle}" has been submitted and is pending admin approval.`,
        is_read: false
      });
    } catch (_) {}

    return NextResponse.json({ success: true, status: 'pending_review' });
  } catch (error) {
    console.error('Error in submit-review:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
