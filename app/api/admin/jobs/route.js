import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');

        if (type === 'applications') {
            const { data, error } = await supabaseAdmin.from('job_applications').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return NextResponse.json({ success: true, data });
        } else {
            const { data, error } = await supabaseAdmin.from('jobs').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }
    } catch (error) {
        console.error("Admin Fetch Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        
        // If it has an ID, it's an update, otherwise insert
        const { data, error } = await supabaseAdmin
            .from('jobs')
            .upsert(body)
            .select();

        if (error) {
            console.error("Admin Jobs Upsert Error:", error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Jobs API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        
        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('jobs')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Admin Jobs Delete Error:", error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Jobs API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
