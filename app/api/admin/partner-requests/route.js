import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !requester) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    let query = supabaseAdmin
      .from('partner_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, requests: data });
  } catch (err) {
    console.error("Fetch partner requests error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
