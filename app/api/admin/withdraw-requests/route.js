import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with the Service Role Key to bypass RLS
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        // You can add authorization checks here using request headers if needed.
        
        // Unify with organiser panel's withdraw_requests table
        const { data, error } = await supabase
            .from('withdraw_requests')
            .select('*, organisers:organiser_id(full_name, id, email, business_name), bank_details:bank_details_id(*)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("API GET Error fetching withdraw requests:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const enriched = await Promise.all(data.map(async (req) => {
            const walletTable = 'organiser_wallet';
            const walletCol = 'organiser_id';
            
            const pid = req.organiser_id;
            
            if (pid) {
                const { data: w } = await supabase.from(walletTable).select('balance').eq(walletCol, pid).maybeSingle();
                return { 
                    ...req, 
                    current_balance: w?.balance || 0, 
                    provider_id: pid, 
                    wallet_table: walletTable, 
                    wallet_col: walletCol,
                    // Map for UI compatibility
                    requester_name: req.organisers?.full_name || req.organisers?.business_name || 'Partner',
                    requester_type: 'organiser',
                    requested_amount: req.amount
                };
            }
            return { ...req, current_balance: 0, requester_name: 'Partner', requester_type: 'organiser' };
        }));

        return NextResponse.json(enriched);
    } catch (err) {
        console.error("API GET Exception:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { id, status } = body;
        
        if (!id || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('withdraw_requests')
            .update({ status })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            console.error("API POST Error updating withdraw request:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error("API POST Exception:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
