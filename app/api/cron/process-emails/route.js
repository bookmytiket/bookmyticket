import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processNotificationJob } from '@/lib/notifications/email';

// Mark as dynamic so it doesn't cache
export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const authHeader = request.headers.get('authorization');
        // Simple CRON secret check (in production, Vercel sets this or you pass it via cron)
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // We allow running without secret in dev for testing
            if (process.env.NODE_ENV === 'production') {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Fetch up to 10 pending or failed-but-retriable jobs
        const { data: jobs, error: fetchError } = await supabase
            .from('notification_queue')
            .select('*')
            .in('status', ['pending', 'failed'])
            .lt('retry_count', 3)
            .order('created_at', { ascending: true })
            .limit(10);

        if (fetchError) {
            throw fetchError;
        }

        if (!jobs || jobs.length === 0) {
            return NextResponse.json({ message: 'No pending jobs', processed: 0 });
        }

        const results = [];

        for (const job of jobs) {
            // Mark as processing
            await supabase.from('notification_queue').update({ status: 'processing' }).eq('id', job.id);

            try {
                const result = await processNotificationJob(job);
                
                if (result.success) {
                    // Mark completed
                    await supabase.from('notification_queue').update({ 
                        status: 'completed',
                        processed_at: new Date().toISOString()
                    }).eq('id', job.id);

                    // Log success
                    await supabase.from('email_logs').insert({
                        user_id: job.user_id,
                        recipient_email: job.payload.to,
                        template_key: job.event_type,
                        subject: job.payload.subject || 'Notification',
                        status: 'delivered',
                        provider_message_id: result.messageId,
                        payload_snapshot: job.payload,
                        sent_at: new Date().toISOString()
                    });

                    results.push({ id: job.id, status: 'success' });
                } else {
                    throw new Error(result.error || 'Unknown sending error');
                }
            } catch (err) {
                // Mark failed
                const nextRetryCount = (job.retry_count || 0) + 1;
                await supabase.from('notification_queue').update({ 
                    status: nextRetryCount >= 3 ? 'dead_letter' : 'failed',
                    retry_count: nextRetryCount
                }).eq('id', job.id);

                // Log failure
                await supabase.from('email_logs').insert({
                    user_id: job.user_id,
                    recipient_email: job.payload?.to || 'unknown',
                    template_key: job.event_type,
                    status: 'failed',
                    error_message: err.message,
                    payload_snapshot: job.payload
                });

                results.push({ id: job.id, status: 'failed', error: err.message });
            }
        }

        return NextResponse.json({ message: 'Jobs processed', results, processed: jobs.length });

    } catch (error) {
        console.error('[Cron] Error processing emails:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
