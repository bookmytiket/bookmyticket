import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        const payload = await req.json();

        // payload might contain 'id' for an update, or no 'id' for insert
        const { data, error } = await supabaseAdmin
            .from('coupons')
            .upsert([payload])
            .select()
            .single();

        if (error) {
            console.error("Admin Coupons API Error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error("Admin Coupons API Exception:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
