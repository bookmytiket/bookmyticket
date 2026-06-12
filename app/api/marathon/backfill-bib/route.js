import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assignBibNumber } from '@/lib/bibGenerator';

// Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    try {
        const body = await request.json();
        const { event_id } = body;

        if (!event_id) {
            return NextResponse.json({ error: "event_id is required" }, { status: 400 });
        }

        // Fetch all confirmed bookings for this event where bib_number is null
        const { data: bookings, error: fetchErr } = await supabaseAdmin
            .from('bookings')
            .select('id, race_category_id')
            .eq('event_id', event_id)
            .eq('status', 'Confirmed')
            .is('bib_number', null)
            .order('created_at', { ascending: true });

        if (fetchErr) {
            console.error("Error fetching bookings:", fetchErr);
            return NextResponse.json({ error: fetchErr.message }, { status: 500 });
        }

        if (!bookings || bookings.length === 0) {
            return NextResponse.json({ success: true, count: 0, message: "No missing BIB numbers found." });
        }

        let assignedCount = 0;
        
        // Sequentially assign BIBs
        for (const b of bookings) {
            const categoryName = b.category || b.race_category_id || "default";
            const newBib = await assignBibNumber(event_id, b.id, categoryName);
            if (newBib) {
                assignedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            count: assignedCount,
            message: `Successfully assigned ${assignedCount} BIB numbers.`
        });

    } catch (err) {
        console.error("Backfill BIB error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
