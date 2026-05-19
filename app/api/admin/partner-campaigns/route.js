import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create new partner campaign
export async function POST(request) {
    try {
        const body = await request.json();
        const { 
            partner_id, campaign_name, offer_title, offer_description,
            terms, redeem_url, start_date, end_date 
        } = body;

        if (!partner_id || !campaign_name || !offer_title) {
            return NextResponse.json({ error: 'Missing required partner campaign fields' }, { status: 400 });
        }

        const { data: campaign, error } = await supabaseAdmin
            .from('partner_campaigns')
            .insert({
                partner_id,
                campaign_name,
                offer_title,
                offer_description: offer_description || '',
                terms: terms || '',
                redeem_url: redeem_url || '',
                start_date: start_date || null,
                end_date: end_date || null,
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, campaign });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
