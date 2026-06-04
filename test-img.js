import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data, error } = await supabase.from('events').select('img, image_url, event_media!event_id(banner_url)').eq('id', '37fa474d-e475-4318-bf72-60c2ad1ae0e8').maybeSingle();
console.log("Image Data:", JSON.stringify(data, null, 2));
