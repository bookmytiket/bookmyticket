import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function assignBibNumber(eventId, bookingId, categoryName = null, isAuto = false) {
    try {
        // 1. Fetch event bib config from events table
        const { data: event, error: eventErr } = await supabaseAdmin
            .from('events')
            .select('bib_enabled, bib_prefix, bib_start_number, bib_padding, bib_per_category, dynamic_config')
            .eq('id', eventId)
            .maybeSingle();

        if (eventErr || !event || !event.bib_enabled) {
            return null;
        }

        const dynCfg = typeof event.dynamic_config === 'string' ? JSON.parse(event.dynamic_config) : (event.dynamic_config || {});

        // Check if auto generation is disabled when triggered automatically
        if (isAuto && dynCfg.auto_bib_generation === false) {
            return null;
        }

        let prefix = event.bib_prefix || '';
        let startNumber = event.bib_start_number || 1;
        let padding = event.bib_padding || 4;
        let useCategoryCounter = event.bib_per_category && categoryName;

        // Try to get category specific config if enabled
        if (useCategoryCounter) {
            const cats = dynCfg.categories || dynCfg.marathonCategories || [];
            const cat = cats.find(c => c.name === categoryName || c.title === categoryName || c.category_name === categoryName);
            if (cat) {
                if (cat.bib_prefix) prefix = cat.bib_prefix;
                if (cat.bib_start_number) startNumber = cat.bib_start_number;
            }
        }

        // 2. Fetch the highest existing bib number for this event (and category if applicable)
        let query = supabaseAdmin
            .from('bookings')
            .select('bib_number')
            .eq('event_id', eventId)
            .not('bib_number', 'is', null);

        if (useCategoryCounter) {
            query = query.ilike('bib_number', `${prefix}%`);
        } else {
            query = query.ilike('bib_number', `${prefix}%`);
        }

        // Fetch top 50 to avoid any weird sorting issues, but order descending
        const { data: existingBibs, error: bibErr } = await query
            .order('bib_number', { ascending: false })
            .limit(50);

        let nextNumber = startNumber;

        if (!bibErr && existingBibs && existingBibs.length > 0) {
            // Find the maximum numeric part
            let maxNum = 0;
            for (const row of existingBibs) {
                const numStr = row.bib_number.replace(prefix, '').replace(/^-/, '');
                const num = parseInt(numStr, 10);
                if (!isNaN(num) && num > maxNum) {
                    maxNum = num;
                }
            }
            if (maxNum >= startNumber) {
                nextNumber = maxNum + 1;
            }
        }

        // 3. Prevent race conditions by checking uniqueness before assignment
        // Since we don't have true DB transactions via REST, we use a loop
        let assignedBib = null;
        for (let attempt = 0; attempt < 5; attempt++) {
            const candidateBib = `${prefix}${prefix && !prefix.endsWith('-') ? '-' : ''}${String(nextNumber).padStart(padding, '0')}`;
            
            // Verify it doesn't already exist
            const { count } = await supabaseAdmin
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', eventId)
                .eq('bib_number', candidateBib);
                
            if (count === 0) {
                assignedBib = candidateBib;
                break;
            }
            nextNumber++;
        }

        if (!assignedBib) {
            console.error("Failed to generate unique BIB after 5 attempts");
            return null;
        }

        // 4. Assign the BIB to the booking
        const { error: updateErr } = await supabaseAdmin
            .from('bookings')
            .update({ bib_number: assignedBib })
            .eq('id', bookingId);

        if (updateErr) {
            console.error("Failed to update booking with BIB:", updateErr);
            return null;
        }

        return assignedBib;

    } catch (err) {
        console.error("BIB generation error:", err);
        return null;
    }
}
