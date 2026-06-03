import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');

    let query = supabase
      .from('badminton_events')
      .select(`
        *,
        badminton_categories (*),
        badminton_sponsors (*)
      `)
      .eq('status', 'published');

    if (slug) {
      query = query.eq('slug', slug).single();
    } else if (id) {
      query = query.eq('id', id).single();
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[Badminton API V1]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
