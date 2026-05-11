import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
    const results = [];

    // Create runner_registrations table
    const { error: e1 } = await supabase.from('runner_registrations').select('id').limit(1);
    if (e1 && e1.message.includes('does not exist')) {
        results.push({ table: 'runner_registrations', status: 'needs_creation' });
    } else {
        results.push({ table: 'runner_registrations', status: 'exists', error: e1?.message });
    }

    // Create registration_fields table  
    const { error: e2 } = await supabase.from('registration_fields').select('id').limit(1);
    if (e2 && e2.message.includes('does not exist')) {
        results.push({ table: 'registration_fields', status: 'needs_creation' });
    } else {
        results.push({ table: 'registration_fields', status: 'exists', error: e2?.message });
    }

    return NextResponse.json({ results });
}
