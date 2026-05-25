import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data, error } = await supabase.from('events').select(`*, ticket_categories (*)`).eq('id', '3d6b43f6-2af4-47e7-87fc-e3a27bcb8bc4').single();
console.log(data?.ticket_categories);
console.log(data?.blocks);
