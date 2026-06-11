import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
    const { data, error } = await supabase.rpc('get_table_info', { table_name: 'bookings' });
    console.log("Schema error:", error?.message);
    
    // Let's just try to fetch 2 rows of bookings to see what the IDs are.
    const { data: b, error: e } = await supabase.from('bookings').select('id').limit(5);
    console.log("Booking IDs:", b);
}
run();
