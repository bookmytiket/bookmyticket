import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
});

export async function PUT(req) {
    try {
        const body = await req.json();
        
        const { id, ...updateData } = body;

        const { data, error } = await supabaseAdmin
            .from('job_applications')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) {
            console.error("Admin Application Update Error:", error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Applications API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
