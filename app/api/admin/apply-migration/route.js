import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MIGRATION_SQL = `
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='reg_start_date') THEN
        ALTER TABLE public.marathon_events ADD COLUMN reg_start_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='reg_end_date') THEN
        ALTER TABLE public.marathon_events ADD COLUMN reg_end_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='expiry_date') THEN
        ALTER TABLE public.marathon_events ADD COLUMN expiry_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='event_end_date') THEN
        ALTER TABLE public.marathon_events ADD COLUMN event_end_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='event_end_time') THEN
        ALTER TABLE public.marathon_events ADD COLUMN event_end_time TIME;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='whatsapp_link') THEN
        ALTER TABLE public.marathon_events ADD COLUMN whatsapp_link TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='support_number') THEN
        ALTER TABLE public.marathon_events ADD COLUMN support_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='terms') THEN
        ALTER TABLE public.marathon_events ADD COLUMN terms TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='subtitle') THEN
        ALTER TABLE public.marathon_events ADD COLUMN subtitle TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='awareness_text') THEN
        ALTER TABLE public.marathon_events ADD COLUMN awareness_text TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='updated_at') THEN
        ALTER TABLE public.marathon_events ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;
END $$;
`;

const POLICY_SQL = `
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'marathon_events' 
        AND policyname = 'Organisers can view their own marathons'
    ) THEN
        EXECUTE 'CREATE POLICY "Organisers can view their own marathons" ON public.marathon_events FOR SELECT USING (auth.uid() = organiser_id)';
    END IF;
END $$;
`;

export async function GET() {
    try {
        const results = [];

        // Run column additions
        let e1 = null;
        try {
            const result = await supabaseAdmin.rpc('exec_raw_sql', { sql: MIGRATION_SQL });
            e1 = result.error;
        } catch (e) {
            e1 = e;
        }
        
        // Try using Supabase's pg_query if exec_raw_sql doesn't exist
        // Use a series of safe ALTER TABLE calls via individual rpc or raw queries
        const columnChecks = [
            { col: 'reg_start_date', type: 'DATE' },
            { col: 'reg_end_date', type: 'DATE' },
            { col: 'expiry_date', type: 'DATE' },
            { col: 'event_end_date', type: 'DATE' },
            { col: 'event_end_time', type: 'TIME' },
            { col: 'whatsapp_link', type: 'TEXT' },
            { col: 'support_number', type: 'TEXT' },
            { col: 'terms', type: 'TEXT' },
            { col: 'subtitle', type: 'TEXT' },
            { col: 'awareness_text', type: 'TEXT' },
            { col: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE' },
        ];

        for (const { col, type } of columnChecks) {
            // Check if column exists by trying to select it
            const { error: checkErr } = await supabaseAdmin
                .from('marathon_events')
                .select(col)
                .limit(1);
            
            if (checkErr && checkErr.message.includes('column')) {
                // Column doesn't exist - we need to add it
                // We can't run DDL via PostgREST directly, but we can try
                results.push({ col, status: 'missing - needs manual migration' });
            } else {
                results.push({ col, status: 'exists ✓' });
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Column check complete. See results.',
            results,
            note: 'To add missing columns, run the SQL in supabase/migrations/20260509_marathon_columns_fix.sql via the Supabase Dashboard SQL Editor at: https://supabase.com/dashboard/project/yayrfycnmbpeeintfcvf/sql/new'
        });
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
