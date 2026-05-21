import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
    const { data, error } = await supabase
        .from('seating_sections')
        .select(`
            id, 
            name, 
            capacity,
            seat_ticket_mapping ( price ),
            seating_layouts!inner ( event_id )
        `)
        .eq('seating_layouts.event_id', '51a0a18e-e47a-4271-9ce6-d227222b33f1');
    console.log("Error:", error);
    console.log("Data:", data);
}
test();
