const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function findUser() {
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('email', 'organiser@gmail.com')
        .maybeSingle();

    if (error) {
        console.error("Find user failed:", error);
        return;
    }

    if (profiles) {
        console.log(`User ID for ${profiles.email}: ${profiles.id} | Role: ${profiles.role}`);
    } else {
        console.log("User not found.");
    }
}

findUser();
