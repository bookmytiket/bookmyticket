import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/marathon/notifications
 * Dispatch notification for a marathon event.
 *
 * Body: { event_id, notification_type, channels: ['email', 'whatsapp', 'push'] }
 */
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const {
      event_id,
      notification_type = 'new_event',
      channels = ['email'],
      recipient_type = 'subscribers',
    } = body;

    if (!event_id) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 });
    }

    // Fetch marathon event
    const { data: marathon, error: mErr } = await adminClient
      .from('marathon_events')
      .select('*')
      .eq('id', event_id)
      .single();

    if (mErr || !marathon) {
      return NextResponse.json({ error: 'Marathon event not found' }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bookmyticket.net';
    const registrationUrl = `${baseUrl}/marathon/${marathon.slug || event_id}`;

    // Create notification records for each channel
    const notificationRecords = channels.map(channel => ({
      event_id,
      notification_type,
      recipient_type,
      channel,
      status: 'pending',
      metadata: {
        event_name: marathon.title,
        event_date: marathon.event_date,
        venue: marathon.venue,
        registration_url: registrationUrl,
      },
    }));

    const { data: notifications, error: nErr } = await adminClient
      .from('marathon_notifications')
      .insert(notificationRecords)
      .select();

    if (nErr) throw nErr;

    // For 'new_event' — send email notifications to subscribers
    if (notification_type === 'new_event' && channels.includes('email')) {
      await dispatchNewEventEmails(marathon, registrationUrl, adminClient);
    }

    // Update notification status to sent
    if (notifications?.length) {
      await adminClient
        .from('marathon_notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .in('id', notifications.map(n => n.id));
    }

    return NextResponse.json({
      success: true,
      notifications_dispatched: notifications?.length || 0,
      channels,
    });

  } catch (err) {
    console.error('[/api/marathon/notifications] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/marathon/notifications?event_id=xxx
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');

  if (!eventId) {
    return NextResponse.json({ error: 'event_id required' }, { status: 400 });
  }

  try {
    const { data, error } = await adminClient
      .from('marathon_notifications')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, notifications: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function dispatchNewEventEmails(marathon, registrationUrl, client) {
  try {
    // Fetch subscribers
    const { data: subscribers } = await client
      .from('subscribers')
      .select('email')
      .eq('status', 'Active')
      .limit(500);

    if (!subscribers?.length) return;

    // Queue email via notification engine (uses existing email infrastructure)
    // This integrates with the existing /api/email route
    const emailPayload = subscribers.map(sub => ({
      to: sub.email,
      subject: `🏃 New Marathon: ${marathon.title}`,
      template: 'marathon_new_event',
      data: {
        event_name: marathon.title,
        event_date: marathon.event_date,
        venue: marathon.venue,
        registration_url: registrationUrl,
      },
    }));

    // Batch insert into email_logs for processing
    await client.from('email_logs').insert(
      emailPayload.map(e => ({
        email: e.to,
        subject: e.subject,
        body: JSON.stringify(e.data),
        status: 'queued',
      }))
    );
  } catch (err) {
    console.warn('[marathon/notifications] Email dispatch failed:', err.message);
  }
}
