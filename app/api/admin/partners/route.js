import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get list of all partners and campaigns (Admin only)
export async function GET() {
    try {
        const { data: partners, error } = await supabaseAdmin
            .from('partners')
            .select('*, partner_campaigns(*)');

        if (error) throw error;
        return NextResponse.json({ success: true, partners });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

// Create new partner
export async function POST(request) {
    try {
        const body = await request.json();
        const { 
            name, logo_url, category, description, agreement_url,
            agreement_start, agreement_end, contact_name, contact_email 
        } = body;

        if (!name) {
            return NextResponse.json({ error: 'Partner name is required' }, { status: 400 });
        }

        const { data: partner, error } = await supabaseAdmin
            .from('partners')
            .insert({
                name,
                logo_url: logo_url || '',
                category: category || '',
                description: description || '',
                agreement_url: agreement_url || '',
                agreement_start: agreement_start || null,
                agreement_end: agreement_end || null,
                contact_name: contact_name || '',
                contact_email: contact_email || '',
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, partner });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
