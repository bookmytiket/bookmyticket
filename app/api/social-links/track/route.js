import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { platform, source, user_id } = await req.json();

        if (!platform) {
            return NextResponse.json({ error: 'Platform is required' }, { status: 400, headers: corsHeaders });
        }

        // 1. Increment click count
        const { error: updateError } = await supabase.rpc('increment_social_clicks', { p_platform: platform });
        
        // Fallback if RPC doesn't exist yet
        if (updateError && updateError.code === 'PGRST202') {
            const { data: link } = await supabase.from('social_links').select('clicks_count').eq('platform', platform).single();
            if (link) {
                await supabase.from('social_links').update({ clicks_count: (link.clicks_count || 0) + 1 }).eq('platform', platform);
            }
        }

        // 2. Log the click
        const ip_address = req.headers.get('x-forwarded-for') || 'unknown';
        const { error: insertError } = await supabase
            .from('social_clicks_log')
            .insert([{ platform, source: source || 'unknown', user_id: user_id || null, ip_address }]);

        if (insertError && insertError.code !== '42P01') {
            console.error('Click log insert error:', insertError);
        }

        return NextResponse.json({ success: true }, { headers: corsHeaders });
    } catch (err) {
        console.error("Social Links Track Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
    }
}
