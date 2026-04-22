import { supabase } from "../lib/supabase";

async function testJoin() {
    console.log("Testing join between vendor_reviews and profiles...");
    const { data, error } = await supabase
        .from('vendor_reviews')
        .select('*, profiles!user_id(full_name, username)')
        .limit(1);
    
    if (error) {
        console.error("Join failed with profiles!user_id:", error.message);
        
        console.log("Retrying with profiles(...)");
        const { data: data2, error: error2 } = await supabase
            .from('vendor_reviews')
            .select('*, profiles(full_name, username)')
            .limit(1);
        
        if (error2) {
            console.error("Join failed with profiles(...):", error2.message);
        } else {
            console.log("Join succeeded with profiles(...)");
        }
    } else {
        console.log("Join succeeded with profiles!user_id");
    }
}

testJoin();
