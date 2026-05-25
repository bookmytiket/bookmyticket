import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data, error } = await supabase.from('events').select(`*, organiser:profiles!events_organiser_id_fkey (*), event_ticket_categories (*), ticket_categories (*)`).limit(1);
console.log(error);
