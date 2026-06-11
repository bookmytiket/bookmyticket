import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
    const { data, error } = await supabase.from('bookings').select('id');
    const counts = {};
    let duplicates = [];
    data.forEach(b => {
        if (counts[b.id]) {
            duplicates.push(b.id);
        }
        counts[b.id] = (counts[b.id] || 0) + 1;
    });
    console.log("Duplicates:", duplicates);
}
run();
