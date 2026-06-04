import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await supabase.from('events').select('id, title, type, status, publish_status').eq('id', '37fa474d-e475-4318-bf72-60c2ad1ae0e8');
console.log("Events:", data, "Error:", error);
const { data: mData, error: mError } = await supabase.from('marathon_events').select('id, title').eq('id', '37fa474d-e475-4318-bf72-60c2ad1ae0e8');
console.log("Marathon_Events:", mData, "Error:", mError);
