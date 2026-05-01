import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCoupons() {
    const { data, error } = await supabase.from('coupons').select('*');
    if (error) {
        console.error("Error fetching coupons:", error);
        return;
    }
    console.log("Coupons in database:");
    data.forEach(c => {
        console.log(`- Code: ${c.code}, Active: ${c.is_active}, Min Tickets: ${c.min_tickets}, Events: ${JSON.stringify(c.applicable_events)}`);
    });
}

checkCoupons();
