import { NextResponse } from 'next/server';

const RLS_SQL_STATEMENTS = [
  // Enable RLS on events
  `ALTER TABLE public.events ENABLE ROW LEVEL SECURITY`,

  // Drop old policies to avoid conflicts
  `DROP POLICY IF EXISTS "Organisers can manage their own events" ON public.events`,
  `DROP POLICY IF EXISTS "Public can view published events" ON public.events`,
  `DROP POLICY IF EXISTS "Anyone can read published events" ON public.events`,

  // Organiser CRUD: only own events
  `CREATE POLICY "Organisers can manage their own events" ON public.events
   FOR ALL TO authenticated
   USING (organiser_id = auth.uid())
   WITH CHECK (organiser_id = auth.uid())`,

  // Admins can see everything
  `CREATE POLICY "Admins can view all events" ON public.events
   FOR SELECT TO authenticated
   USING (
     EXISTS (
       SELECT 1 FROM public.profiles
       WHERE profiles.id = auth.uid()
       AND profiles.role IN ('admin', 'super_admin', 'system_admin')
     )
   )`,

  // Public can read published events (for homepage)
  `CREATE POLICY "Public can view published events" ON public.events
   FOR SELECT
   USING (publish_status = 'published' OR listing_status = 'active')`,

  // Enable RLS on tournament_events
  `ALTER TABLE public.tournament_events ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS "Organisers manage own tournament events" ON public.tournament_events`,
  `DROP POLICY IF EXISTS "Public view tournament events" ON public.tournament_events`,

  `CREATE POLICY "Organisers manage own tournament events" ON public.tournament_events
   FOR ALL TO authenticated
   USING (
     EXISTS (
       SELECT 1 FROM public.events e
       WHERE e.id = tournament_events.event_id
       AND e.organiser_id = auth.uid()
     )
   )
   WITH CHECK (
     EXISTS (
       SELECT 1 FROM public.events e
       WHERE e.id = tournament_events.event_id
       AND e.organiser_id = auth.uid()
     )
   )`,

  `CREATE POLICY "Public view tournament events" ON public.tournament_events
   FOR SELECT USING (true)`,

  // Enable RLS on marathon_events
  `ALTER TABLE public.marathon_events ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS "Organisers manage own marathon events" ON public.marathon_events`,
  `DROP POLICY IF EXISTS "Public view marathon events" ON public.marathon_events`,

  `CREATE POLICY "Organisers manage own marathon events" ON public.marathon_events
   FOR ALL TO authenticated
   USING (
     EXISTS (
       SELECT 1 FROM public.events e
       WHERE e.id = marathon_events.event_id
         AND e.organiser_id = auth.uid()
     )
   )
   WITH CHECK (
     EXISTS (
       SELECT 1 FROM public.events e
       WHERE e.id = marathon_events.event_id
         AND e.organiser_id = auth.uid()
     )
   )`,

  `CREATE POLICY "Public view marathon events" ON public.marathon_events
   FOR SELECT USING (true)`,

  // Enable RLS on bookings (organisers see bookings for their events)
  `ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS "Organisers can view own event bookings" ON public.bookings`,
  `DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings`,

  `CREATE POLICY "Organisers can view own event bookings" ON public.bookings
   FOR SELECT TO authenticated
   USING (
     EXISTS (
       SELECT 1 FROM public.events e
       WHERE e.id = bookings.event_id
       AND e.organiser_id = auth.uid()
     )
   )`,

  `CREATE POLICY "Users can view own bookings" ON public.bookings
   FOR ALL TO authenticated
   USING (user_id = auth.uid())
   WITH CHECK (user_id = auth.uid())`,
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Basic protection - require a secret param
    if (!secret || secret !== (process.env.MIGRATION_SECRET || 'bmt-rls-2026')) {
      return NextResponse.json({ error: 'Unauthorized. Pass ?secret=bmt-rls-2026' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const sql of RLS_SQL_STATEMENTS) {
      const preview = sql.trim().slice(0, 80).replace(/\n/g, ' ');

      // Try Supabase Management API
      const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ query: sql }),
      });

      if (res.ok) {
        results.push({ status: '✅', sql: preview });
        successCount++;
      } else {
        const errBody = await res.text();
        // Try alternate approach: REST RPC
        try {
          const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': serviceKey,
              'Authorization': `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({ sql_query: sql }),
          });
          if (rpcRes.ok) {
            results.push({ status: '✅ (rpc)', sql: preview });
            successCount++;
          } else {
            results.push({ status: '❌', sql: preview, error: errBody.slice(0, 200) });
            failCount++;
          }
        } catch (e) {
          results.push({ status: '❌', sql: preview, error: e.message });
          failCount++;
        }
      }
    }

    return NextResponse.json({
      message: `Applied ${successCount}/${RLS_SQL_STATEMENTS.length} statements`,
      successCount,
      failCount,
      results,
      note: failCount > 0
        ? 'Some statements failed. Please run the SQL manually in Supabase Dashboard > SQL Editor.'
        : 'All RLS policies applied successfully!',
    });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
