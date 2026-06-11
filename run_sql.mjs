import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fs from 'fs';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const sql = fs.readFileSync('supabase/migrations/20260611000002_atomic_bib_assignment.sql', 'utf8');

async function run() {
    const { data, error } = await supabase.rpc('run_sql', { sql_query: sql });
    console.log("Result:", data, error);
}
run();
