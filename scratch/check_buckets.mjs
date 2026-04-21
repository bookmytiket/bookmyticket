import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBuckets() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("Error listing buckets:", error);
    return;
  }
  console.log("Buckets:", JSON.stringify(data, null, 2));
}

checkBuckets();
