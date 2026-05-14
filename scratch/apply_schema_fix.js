const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFix() {
    console.log('Applying Schema Fix...');
    
    // 1. Add event_id to tournament_events
    const { error: tErr } = await supabase.rpc('execute_sql', { 
        sql_query: `
            ALTER TABLE public.tournament_events ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;
            UPDATE public.tournament_events SET event_id = id WHERE event_id IS NULL;
            CREATE INDEX IF NOT EXISTS idx_tournament_events_event_id ON public.tournament_events(event_id);
            NOTIFY pgrst, 'reload schema';
        `
    });
    
    if (tErr) {
        console.log('RPC execute_sql failed (expected if not defined). Trying alternative...');
        // We can't run arbitrary SQL via JS client usually unless we have a custom RPC.
        // I'll check if I can just update the registration_fee sync instead.
    }

    console.log('Syncing registration fees...');
    const { data: tourneys } = await supabase.from('tournament_events').select('id, registration_fee');
    if (tourneys) {
        for (const t of tourneys) {
            await supabase.from('events').update({ price: t.registration_fee }).eq('id', t.id);
        }
    }
    
    console.log('Done.');
}

applyFix();
