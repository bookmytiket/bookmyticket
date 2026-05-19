import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from("coupons")
            .select("*")
            .like("code", "BULK_AUTO_%")
            .order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, min_tickets, discount_type, discount_value } = body;

        // Generate a code, we use name to store a friendly identifier in the UI
        const code = `BULK_AUTO_${Date.now()}`;

        const { data, error } = await supabaseAdmin
            .from("coupons")
            .insert([{
                code,
                type: discount_type === 'percentage' ? 'percent' : 'fixed',
                value: discount_value,
                min_tickets: min_tickets,
                is_active: true
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) throw new Error("ID is required");

        const { error } = await supabaseAdmin
            .from("coupons")
            .delete()
            .eq("id", id)
            .like("code", "BULK_AUTO_%");

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
