import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { searchParams } = new URL(request.url);
        const filter = searchParams.get('filter') || 'All';
        
        let query = supabase.from('onboarding_requests').select('*').order('created_at', { ascending: false });
        if (filter !== 'All') {
            query = query.eq('user_type', filter);
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({ success: true, requests: data });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
