import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    let userId = null;

    if (authHeader?.startsWith('Bearer ')) {
      const userClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await userClient.auth.getUser();
      if (user) userId = user.id;
    }

    const {
      event_id,
      export_type,
      records_count
    } = await request.json();

    const { error } = await adminClient
      .from('export_logs')
      .insert({
        user_id: userId,
        event_id: event_id || 'ALL_EVENTS',
        export_type,
        records_count
      });

    if (error) {
      // If table doesn't exist, we just ignore for now or fallback
      console.warn('Export log insert error:', error.message);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[/api/marathon/export-log] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
