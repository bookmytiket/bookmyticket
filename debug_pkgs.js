require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: pkgs, error } = await supabaseAdmin
        .from('staff_packages')
        .select('*');
        
    console.log("Packages:", pkgs);
    if (error) console.log("Error:", error);
}

run();
