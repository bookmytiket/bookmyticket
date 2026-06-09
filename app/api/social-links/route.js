import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data, error } = await supabase
            .from('social_links')
            .select('*')
            .eq('is_enabled', true);

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json([
                    { platform: 'whatsapp', title: 'WhatsApp Channel', url: '', show_in_navbar: true, show_in_footer: true, show_on_event_page: true, show_on_booking_success: true, is_enabled: true },
                    { platform: 'instagram', title: 'Instagram Community', url: '', show_in_navbar: true, show_in_footer: true, show_on_event_page: true, show_on_booking_success: true, is_enabled: true }
                ], { headers: corsHeaders });
            }
            throw error;
        }

        return NextResponse.json(data || [], { headers: corsHeaders });
    } catch (err) {
        console.error("Social Links GET Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
    }
}
