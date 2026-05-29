import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    // Use service role client — server-side only, protected by admin panel UI
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await adminSupabase
      .from('events')
      .select(`
        id, title, status, img, banner_preview, date, time, event_start_at,
        city, location, venue, price, ticket_mode, is_free, event_type, type,
        created_at, updated_at, organiser_id,
        profiles:organiser_id ( full_name, email, phone )
      `)
      .eq('status', 'pending_review')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('DB error fetching pending events:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching pending events:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
