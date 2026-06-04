import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data, error } = await supabase.from('events').select('id').eq('id', '37fa474d-e475-4318-bf72-60c2ad1ae0e8').maybeSingle();
console.log("Anon Fetch:", data, "Error:", error);
