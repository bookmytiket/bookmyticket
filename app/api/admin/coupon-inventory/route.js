import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Bulk import or manually insert coupons
export async function POST(request) {
    try {
        const body = await request.json();
        const { campaign_id, coupons } = body; // coupons: Array of strings/objects

        if (!campaign_id || !Array.isArray(coupons) || coupons.length === 0) {
            return NextResponse.json({ error: 'Missing campaign_id or coupon codes list' }, { status: 400 });
        }

        const inserts = coupons.map(c => {
            const code = typeof c === 'string' ? c : c.code;
            return {
                campaign_id,
                coupon_code: code,
                status: 'available'
            };
        });

        const { data, error } = await supabaseAdmin
            .from('coupon_inventory')
            .insert(inserts)
            .select();

        if (error) throw error;

        return NextResponse.json({ success: true, count: data.length });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
