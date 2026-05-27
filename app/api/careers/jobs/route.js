import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
});

export async function GET() {
    try {
        // Fetch only jobs with 'open' status for public API
        const { data, error } = await supabaseAdmin
            .from('jobs')
            .select('*')
            .eq('status', 'open')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Public Jobs Fetch Error:", error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Public Jobs API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
