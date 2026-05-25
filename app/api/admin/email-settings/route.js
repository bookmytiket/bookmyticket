import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request) {
    // You'd typically verify the admin session here.
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const { data, error } = await supabase.from('email_settings').select('*').limit(1).single();
        if (error && error.code !== 'PGRST116') {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ data: data || null });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const payload = await request.json();
        
        let res;
        if (payload.id) {
            res = await supabase.from('email_settings').update(payload).eq('id', payload.id);
        } else {
            // Check if one exists first
            const { data: existing } = await supabase.from('email_settings').select('id').limit(1).single();
            if (existing) {
                res = await supabase.from('email_settings').update(payload).eq('id', existing.id);
            } else {
                res = await supabase.from('email_settings').insert([payload]);
            }
        }

        if (res.error) throw res.error;
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
