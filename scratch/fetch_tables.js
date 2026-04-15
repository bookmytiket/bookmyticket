import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase.rpc('get_tables_info');
    if (error) {
        console.log("RPC Error, trying direct query if possible, or just list public schema.");
    }
    const { data: tables, error: e2 } = await supabase.from('events').select('id').limit(1);
    console.log("Events ok?", !!tables);
    const { data: meetings, error: e3 } = await supabase.from('meetings').select('id').limit(1);
    console.log("Meetings ok?", meetings ? "Yes" : e3.message);
    const { data: promotions, error: e4 } = await supabase.from('promotions').select('id').limit(1);
    console.log("Promotions ok?", promotions ? "Yes" : e4.message);
    const { data: footers, error: e5 } = await supabase.from('checkout_footers').select('id').limit(1);
    console.log("Footers ok?", footers ? "Yes" : e5.message);
    const { data: banners, error: e6 } = await supabase.from('mobile_banners').select('id').limit(1);
    console.log("Mobile Banners ok?", banners ? "Yes" : e6.message);
    const { data: popups, error: e7 } = await supabase.from('ad_popups').select('id').limit(1);
    console.log("Ad popups ok?", popups ? "Yes" : e7.message);
}
check();
