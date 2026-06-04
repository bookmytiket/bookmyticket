import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: 'Supabase configuration is missing on server' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { searchParams } = new URL(request.url);
        const filter = searchParams.get('filter') || 'All';

        const { data, error } = await supabase
            .from('organizer_reports')
            .select('*, organisers(name, email, kyc_status)');

        if (error) throw error;

        return NextResponse.json({ success: true, reports: data });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
