const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // service role bypasses RLS
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('=== 1. Checking RLS status on events table ===');
  const { data: rlsStatus, error: rlsErr } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename IN ('events', 'tournament_events', 'marathon_events')
      ORDER BY tablename;
    `
  });
  if (rlsErr) {
    // Try info_schema approach
    const { data: pgData, error: pgErr } = await supabase
      .from('pg_tables')
      .select('tablename,rowsecurity')
      .eq('schemaname', 'public')
      .in('tablename', ['events', 'tournament_events', 'marathon_events']);
    console.log('RLS status error (exec_sql):', rlsErr?.message);
  } else {
    console.log('RLS status:', rlsStatus);
  }

  console.log('\n=== 2. Checking existing RLS policies ===');
  const { data: policies, error: polErr } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename IN ('events','tournament_events','marathon_events')
      ORDER BY tablename, policyname;
    `
  });
  if (polErr) {
    console.log('Policies error:', polErr?.message);
  } else {
    console.log('Existing policies:', JSON.stringify(policies, null, 2));
  }

  console.log('\n=== 3. Checking events with organiser_id ===');
  const { data: events, error: evErr } = await supabase
    .from('events')
    .select('id, title, organiser_id, type, publish_status, created_at')
    .order('created_at', { ascending: false })
    .limit(20);
  if (evErr) {
    console.log('Events error:', evErr?.message);
  } else {
    console.log(`Found ${events.length} events total.`);
    const noOrg = events.filter(e => !e.organiser_id);
    console.log(`  - Events WITHOUT organiser_id: ${noOrg.length}`);
    const uniqueOrgs = [...new Set(events.map(e => e.organiser_id).filter(Boolean))];
    console.log(`  - Unique organiser_ids: ${uniqueOrgs.length}`);
    uniqueOrgs.forEach(oid => {
      const count = events.filter(e => e.organiser_id === oid).length;
      console.log(`    * ${oid}: ${count} events`);
    });
  }

  console.log('\n=== 4. Checking organisers table ===');
  const { data: orgs, error: orgErr } = await supabase
    .from('organisers')
    .select('id, email, full_name, status')
    .limit(10);
  if (orgErr) {
    console.log('Organisers error:', orgErr?.message);
  } else {
    console.log(`Found ${orgs.length} organisers.`);
    orgs.forEach(o => console.log(`  * ${o.id} | ${o.email} | ${o.full_name}`));
  }
}

diagnose().catch(console.error);
