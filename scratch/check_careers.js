import { supabase } from '../lib/supabase.js';

async function check() {
    const { data } = await supabase.from('system_config').select('*').eq('key', 'careers_banner_settings').maybeSingle();
    console.log('Banner Config:', JSON.stringify(data, null, 2));
    
    const { data: jobs } = await supabase.from('jobs').select('id, title, status').eq('status', 'open');
    console.log('Open Jobs:', JSON.stringify(jobs, null, 2));
}

check();
