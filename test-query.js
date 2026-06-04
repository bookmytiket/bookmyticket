import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data, error } = await supabase
        .from('events')
        .select('*, tournament_events!event_id(*), marathon_config!event_id(*), tournament_categories!event_id(*), sports_events!event_id(*, sports_categories(*), sports_match_types(*)), competition_categories!event_id(*), competition_events!event_id(*), registration_fields!event_id(*), event_media!event_id(*), event_terms!event_id(*), event_amenities!event_id(*), virtual_event_configs!event_id(*)')
        .eq('id', '37fa474d-e475-4318-bf72-60c2ad1ae0e8')
        .maybeSingle();
console.log("Full Fetch Error:", error);
console.log("Full Fetch Data:", data ? data.id : null);
