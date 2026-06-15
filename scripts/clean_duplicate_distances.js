require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const cleanCategoryName = (name) => {
    if (!name) return "";
    let clean = String(name);
    while (/(?:\s*\(\d+(?:\.\d+)?\s*KM\))+$/i.test(clean)) {
        clean = clean.replace(/(?:\s*\(\d+(?:\.\d+)?\s*KM\))+$/i, '').trim();
    }
    return clean;
};

async function run() {
    console.log("Starting cleanup of duplicate distance labels...");

    // 1. Clean marathon_categories
    const { data: categories } = await supabaseAdmin.from('marathon_categories').select('*');
    if (categories) {
        let updatedCount = 0;
        for (const cat of categories) {
            const raw = cat.category_name || cat.title || "";
            const clean = cleanCategoryName(raw);
            if (raw && clean !== raw) {
                console.log(`Cleaning marathon_category [${cat.id}]: "${raw}" -> "${clean}"`);
                const updatePayload = {};
                if (cat.category_name) updatePayload.category_name = clean;
                if (cat.title) updatePayload.title = clean;
                
                await supabaseAdmin.from('marathon_categories').update(updatePayload).eq('id', cat.id);
                updatedCount++;
            }
        }
        console.log(`Updated ${updatedCount} marathon_categories.`);
    }

    // 2. Clean events dynamic_config
    const { data: events } = await supabaseAdmin.from('events').select('id, dynamic_config').not('dynamic_config', 'is', null);
    if (events) {
        let updatedCount = 0;
        for (const event of events) {
            try {
                let dynCfg = event.dynamic_config;
                if (typeof dynCfg === 'string') dynCfg = JSON.parse(dynCfg);
                let changed = false;

                if (dynCfg.categories && Array.isArray(dynCfg.categories)) {
                    dynCfg.categories = dynCfg.categories.map(c => {
                        const originalName = c.name || "";
                        const cleanName = cleanCategoryName(originalName);
                        const expectedName = `${cleanName} (${c.distance_km}KM)`;
                        if (originalName !== expectedName && /KM\)/i.test(originalName)) {
                            changed = true;
                            c.name = expectedName;
                            c.title = expectedName;
                        }
                        if (c.category_name) {
                            const cn = cleanCategoryName(c.category_name);
                            if (cn !== c.category_name) {
                                changed = true;
                                c.category_name = cn;
                            }
                        }
                        return c;
                    });
                }

                if (dynCfg.marathonCategories && Array.isArray(dynCfg.marathonCategories)) {
                    dynCfg.marathonCategories = dynCfg.marathonCategories.map(c => {
                        if (c.category_name) {
                            const cn = cleanCategoryName(c.category_name);
                            if (cn !== c.category_name) {
                                changed = true;
                                c.category_name = cn;
                            }
                        }
                        return c;
                    });
                }

                if (changed) {
                    console.log(`Cleaning dynamic_config for event [${event.id}]`);
                    await supabaseAdmin.from('events').update({ dynamic_config: dynCfg }).eq('id', event.id);
                    updatedCount++;
                }
            } catch (e) {
                console.error(`Error processing event ${event.id}:`, e);
            }
        }
        console.log(`Updated ${updatedCount} events dynamic_config.`);
    }

    // 3. Clean bookings customer_details and race_category_id
    const { data: bookings } = await supabaseAdmin.from('bookings').select('id, customer_details, race_category_id').not('customer_details', 'is', null);
    if (bookings) {
        let updatedCount = 0;
        for (const booking of bookings) {
            let changed = false;
            let updatePayload = {};

            if (booking.race_category_id) {
                const cleanRaceCat = cleanCategoryName(booking.race_category_id);
                const expectedRaceCat = booking.race_category_id.match(/KM\)/i) 
                    ? `${cleanRaceCat} (${booking.race_category_id.match(/(\d+(?:\.\d+)?\s*KM)/i)?.[1] || ''})`
                    : cleanRaceCat;

                // Wait, race_category_id in bookings is often used as the full display string for exported lists.
                // Let's just fix it if it has multiple (X KM) (X KM).
                let fixedRaceCat = booking.race_category_id;
                while (/(?:\s*\(\d+(?:\.\d+)?\s*KM\)){2,}$/i.test(fixedRaceCat)) {
                    fixedRaceCat = fixedRaceCat.replace(/(?:\s*\(\d+(?:\.\d+)?\s*KM\))$/i, '').trim();
                }

                if (fixedRaceCat !== booking.race_category_id) {
                    updatePayload.race_category_id = fixedRaceCat;
                    changed = true;
                }
            }

            let custDetails = booking.customer_details;
            if (custDetails && custDetails.category) {
                let fixedCat = custDetails.category;
                while (/(?:\s*\(\d+(?:\.\d+)?\s*KM\)){2,}$/i.test(fixedCat)) {
                    fixedCat = fixedCat.replace(/(?:\s*\(\d+(?:\.\d+)?\s*KM\))$/i, '').trim();
                }
                if (fixedCat !== custDetails.category) {
                    custDetails.category = fixedCat;
                    updatePayload.customer_details = custDetails;
                    changed = true;
                }
            }

            if (changed) {
                console.log(`Cleaning booking [${booking.id}]`);
                await supabaseAdmin.from('bookings').update(updatePayload).eq('id', booking.id);
                updatedCount++;
            }
        }
        console.log(`Updated ${updatedCount} bookings.`);
    }

    console.log("Cleanup complete!");
}
run();
