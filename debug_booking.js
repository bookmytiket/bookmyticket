require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: booking, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", "5b04e1c2-f620-4a20-b4c5-fa0b06bcb238")
        .single();
        
    console.log("Booking:", booking);
    console.log("Error:", error);
}

run();
