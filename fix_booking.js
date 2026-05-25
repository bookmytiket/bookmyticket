require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function run() {
    const id = "5b04e1c2-f620-4a20-b4c5-fa0b06bcb238";
    const nowIso = new Date().toISOString();
    
    console.log("Updating booking...");
    const { error: updateErr } = await supabaseAdmin
        .from('bookings')
        .update({ 
            status: 'Confirmed',
            payment_status: 'paid',
            confirmed_at: nowIso,
            booking_ref: id.slice(-8).toUpperCase()
        })
        .eq('id', id);

    console.log("Error:", updateErr);
}

run();
