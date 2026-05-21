import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const { data } = await supabase.from("bookings").select("id, selected_seats, status, created_at").order("created_at", { ascending: false }).limit(5);
    console.log(JSON.stringify(data, null, 2));
}
run();
