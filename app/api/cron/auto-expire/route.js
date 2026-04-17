import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client with Service Role Key for bypassing RLS during cron execution
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        // Optional: Secure the endpoint via an Authorization header or CRON_SECRET if on Vercel
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new Response('Unauthorized', { status: 401 });
        }

        console.log("[Auto-Expire] Scanning for expired published events...");

        // Strategy: Pull all published events and evaluate their dates natively in JS
        // This avoids complex and fragile regex casting in PostgreSQL.
        const { data: activeEvents, error: fetchError } = await supabase
            .from('events')
            .select('id, date, time')
            .eq('status', 'published');

        if (fetchError) {
            throw fetchError;
        }

        const today = new Date();
        const expiredEventIds = [];

        for (const ev of activeEvents) {
            if (!ev.date) continue;

            const dateStr = String(ev.date).trim();
            const timeStr = String(ev.time || '23:59').trim();
            
            let dt = dateStr;
            let normalizedTime = timeStr;

            // Handle DD/MM/YYYY
            if (dt.match(/^\d{2}[-/]\d{2}[-/]\d{4}$/)) {
                const separator = dt.includes('/') ? '/' : '-';
                const [day, month, year] = dt.split(separator);
                dt = `${year}-${month}-${day}`;
            }

            // Handle AM/PM times
            if (normalizedTime.includes(' ')) {
                let [timePart, modifier] = normalizedTime.split(' ');
                let [hours, mins] = timePart.split(':').map(Number);
                if (modifier === 'PM' && hours < 12) hours += 12;
                if (modifier === 'AM' && hours === 12) hours = 0;
                normalizedTime = `${String(hours).padStart(2, '0')}:${String(mins || 0).padStart(2, '0')}`;
            }

            const eventDate = new Date(`${dt}T${normalizedTime}`);
            
            // If the calculated end time is strictly fully in the past, queue for expiry
            if (!isNaN(eventDate.getTime()) && eventDate.getTime() < today.getTime()) {
                expiredEventIds.push(ev.id);
            }
        }

        if (expiredEventIds.length === 0) {
            return new Response(JSON.stringify({ success: true, message: "No expired events found.", count: 0 }), {
                status: 200, headers: { "Content-Type": "application/json" }
            });
        }

        // Execute bulk update
        console.log(`[Auto-Expire] Marking ${expiredEventIds.length} events as expired...`);
        const { error: updateError } = await supabase
            .from('events')
            .update({ status: 'expired' })
            .in('id', expiredEventIds);

        if (updateError) {
            throw updateError;
        }

        return new Response(JSON.stringify({ success: true, message: "Successfully expired events", count: expiredEventIds.length, ids: expiredEventIds }), {
            status: 200, headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("[Auto-Expire] Exception:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500, headers: { "Content-Type": "application/json" }
        });
    }
}
