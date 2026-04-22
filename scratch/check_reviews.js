import { supabase } from "../lib/supabase";

async function checkReviews() {
    const { data, error } = await supabase
        .from('vendor_reviews')
        .select('*, profiles(*)');
    
    if (error) {
        console.error("Error fetching reviews:", error);
    } else {
        console.log("Total reviews found:", data.length);
        console.log("Reviews:", JSON.stringify(data, null, 2));
    }
}

checkReviews();
