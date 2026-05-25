import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTemplatedEmail } from '@/lib/emailService';

// This endpoint can be triggered by a cron job or Supabase Edge Function to process queued notifications
export async function POST(req) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Fetch pending notifications
    const { data: queue, error: fetchError } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) throw fetchError;
    if (!queue || queue.length === 0) {
      return NextResponse.json({ success: true, message: 'Queue is empty', processed: 0 });
    }

    let processedCount = 0;

    // 2. Process each notification
    for (const notification of queue) {
      try {
        if (notification.channel === 'email') {
          // Send templated email based on event_type
          const templateKey = notification.event_type; // e.g. 'booking_confirmation'
          const to = notification.payload.to;
          
          if (!to) throw new Error("Missing recipient email 'to' in payload");

          const emailResult = await sendTemplatedEmail({
            templateIdentifier: templateKey,
            to,
            variables: notification.payload
          });

          if (!emailResult.success) {
            throw new Error(emailResult.error || 'Email dispatch failed');
          }
        }

        // Mark as processed
        await supabase
          .from('notification_queue')
          .update({
            status: 'processed',
            processed_at: new Date().toISOString()
          })
          .eq('id', notification.id);
          
        processedCount++;
      } catch (err) {
        console.error(`Failed to process notification ${notification.id}:`, err);
        // Increment retry count or mark as failed
        const newRetryCount = (notification.retry_count || 0) + 1;
        await supabase
          .from('notification_queue')
          .update({
            status: newRetryCount >= 3 ? 'failed' : 'pending',
            retry_count: newRetryCount
          })
          .eq('id', notification.id);
      }
    }

    return NextResponse.json({ success: true, processed: processedCount });
  } catch (err) {
    console.error('Queue Processing Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
