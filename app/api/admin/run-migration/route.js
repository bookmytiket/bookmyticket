import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/admin/run-migration
 * One-time migration endpoint to create financial settlement tables.
 * DELETE THIS FILE AFTER RUNNING!
 */
export async function POST(request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceKey) {
        return NextResponse.json({ error: 'No service key' }, { status: 403 });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    const results = {};

    // We can't run DDL via PostgREST, but we can use supabase.rpc if we first create
    // the tables by inserting into pg_class trick... 
    // Instead, let's check what tables exist and insert test data to verify
    
    const tablesToCheck = [
        'booking_financials',
        'organizer_revenue_ledger', 
        'settlement_reconciliation_logs',
        'admin_revenue_ledger',
        'tax_ledger',
        'organiser_transactions',
        'revenue_ledger'
    ];

    for (const table of tablesToCheck) {
        const { count, error } = await adminClient
            .from(table)
            .select('*', { count: 'exact', head: true });
        results[table] = error ? `MISSING: ${error.message.slice(0, 60)}` : `EXISTS (${count || 0} rows)`;
    }

    // Check payments
    const { data: pendingPay } = await adminClient
        .from('payments')
        .select('id, status')
        .eq('status', 'pending')
        .limit(5);
    results['payments_pending'] = pendingPay?.length || 0;

    const { data: successPay } = await adminClient
        .from('payments')
        .select('id, status')
        .eq('status', 'success')
        .limit(5);
    results['payments_success'] = successPay?.length || 0;

    return NextResponse.json({
        message: 'Tables need to be created via Supabase SQL Editor. Check results for status.',
        results,
        sql_file: '/home/raja/bookmyticket/scratch/migration_financial_tables.sql',
        instructions: 'Open https://supabase.com/dashboard/project/yayrfycnmbpeeintfcvf/sql/new and paste the SQL from the file above'
    });
}
