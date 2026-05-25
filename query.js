import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
    const { data: eventData, error } = await supabase
        .from('events')
        .select('seat_categories, blocks, cols')
        .eq('id', '3d6b43f6-2af4-47e7-87fc-e3a27bcb8bc4');
        
    console.log("EVENT:", JSON.stringify(eventData, null, 2));

    const { data: invData } = await supabase
        .from('seat_inventory')
        .select('*')
        .eq('event_id', '3d6b43f6-2af4-47e7-87fc-e3a27bcb8bc4');

    console.log("INVENTORY:", JSON.stringify(invData, null, 2));
}
run();
