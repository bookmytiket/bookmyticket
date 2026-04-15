import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Testing Anon Query for bookmyticket-admin...");
  const { data, error } = await supabase
    .from('profiles')
    .select('email')
    .ilike('username', 'bookmyticket-admin');
    
  console.log("Result:", data, "Error:", error);
}
test();
