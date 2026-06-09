import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Verify Admin (basic check)
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('social_links')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json([]); // Return empty if table doesn't exist yet
            }
            throw error;
        }

        return NextResponse.json(data || []);
    } catch (err) {
        console.error("Admin Social Links GET Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Verify Admin
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await req.json();

        // If it's an array, it's a bulk update/upsert
        if (Array.isArray(payload)) {
            const { error } = await supabase
                .from('social_links')
                .upsert(payload, { onConflict: 'platform' });
                
            if (error) {
                 if (error.code === '42P01') {
                     return NextResponse.json({ error: 'Database table missing. Please run the SQL migration.' }, { status: 400 });
                 }
                 throw error;
            }
            return NextResponse.json({ success: true });
        }

        // Single insert/update
        const { platform, title, url, icon_url, is_enabled, show_in_navbar, show_in_footer, show_on_event_page, show_on_booking_success } = payload;
        
        if (!platform || !title) {
            return NextResponse.json({ error: 'Platform and title are required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('social_links')
            .upsert({
                platform,
                title,
                url,
                icon_url,
                is_enabled,
                show_in_navbar,
                show_in_footer,
                show_on_event_page,
                show_on_booking_success
            }, { onConflict: 'platform' })
            .select()
            .single();

        if (error) {
             if (error.code === '42P01') {
                 return NextResponse.json({ error: 'Database table missing. Please run the SQL migration.' }, { status: 400 });
             }
             throw error;
        }

        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error("Admin Social Links POST Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
