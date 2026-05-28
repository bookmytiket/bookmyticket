import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  try {
    const { data: organiserRecord, error } = await supabaseAdmin
      .from('organisers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ organiserRecord });
  } catch (err) {
    console.error('[API/auth/profile] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
