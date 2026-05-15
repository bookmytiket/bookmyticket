import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Use pg_query via a raw SQL approach through the admin API
  const fixes = [
    // Fix 1: Recreate is_staff_of() with correct column name
    `CREATE OR REPLACE FUNCTION public.is_staff_of(target_organiser_id UUID)
     RETURNS BOOLEAN AS $$
     BEGIN
       RETURN EXISTS (
         SELECT 1 FROM public.staff
         WHERE staff.auth_user_id = auth.uid()
           AND staff.organiser_id = target_organiser_id
       );
     END;
     $$ LANGUAGE plpgsql SECURITY DEFINER`,
  ];

  const results = [];

  for (const sql of fixes) {
    // Call via pg_catalog approach using a dummy table insert that triggers SQL
    // The only reliable way with service role is via the REST API /query endpoint
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_raw`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql })
    });

    if (!res.ok) {
      const err = await res.text();
      results.push({ sql: sql.slice(0, 60), status: 'failed', error: err });
    } else {
      results.push({ sql: sql.slice(0, 60), status: 'ok' });
    }
  }

  return NextResponse.json({ results });
}
