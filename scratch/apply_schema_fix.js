const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function applySchemaFix() {
    const migration = fs.readFileSync('supabase/migrations/20260515_final_roadmap.sql', 'utf8');
    
    // Split migration into individual commands for better error handling, 
    // though Supabase RPC might be needed for complex migrations.
    // For simplicity, we'll try to run it via a simple SQL execution if possible, 
    // or just the critical tournament parts.
    
    const tournamentFix = `
        ALTER TABLE public.tournament_events ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;
        ALTER TABLE public.tournament_events ADD COLUMN IF NOT EXISTS registration_end_date TIMESTAMPTZ;
        ALTER TABLE public.tournament_events ADD COLUMN IF NOT EXISTS min_players INTEGER DEFAULT 1;
        ALTER TABLE public.tournament_events ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 20;
        ALTER TABLE public.tournament_events ADD COLUMN IF NOT EXISTS audience_free_access BOOLEAN DEFAULT true;
        ALTER TABLE public.tournament_events ADD COLUMN IF NOT EXISTS registration_open BOOLEAN DEFAULT true;

        CREATE TABLE IF NOT EXISTS public.tournament_categories (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
            category_name TEXT NOT NULL,
            category_fee NUMERIC(15,2) NOT NULL DEFAULT 0,
            max_teams INTEGER DEFAULT 16,
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Sync Price Drift
        UPDATE public.events e 
        SET price = t.registration_fee 
        FROM public.tournament_events t 
        WHERE (e.id = t.event_id OR e.id = t.id) 
        AND (e.type = 'Tournament' OR e.type = 'Tournament Event' OR e.type = 'Sports Tournament');
    `;

    const { error } = await supabase.rpc('exec_sql', { sql_query: tournamentFix });
    if (error) {
        console.error('Error applying tournament fix:', error);
        // Fallback: Try individual commands if rpc fails
    } else {
        console.log('Tournament schema fix applied successfully.');
    }
}

applySchemaFix();
