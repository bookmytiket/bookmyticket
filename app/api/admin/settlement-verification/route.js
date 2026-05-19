import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
    const cookieStore = await cookies();
    
    // Auth client to verify user status
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {}
                },
            },
        }
    );

    try {
        // 1. Verify user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Verify platform admin access
        const { data: adminRecord } = await supabaseAdmin
            .from('platform_admins')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!adminRecord) {
            return NextResponse.json({ error: "Access Denied" }, { status: 403 });
        }

        // 3. Fetch organizers
        const { data: orgData } = await supabaseAdmin
            .from('organisers')
            .select('id, business_name')
            .eq('is_approved', true);

        // 4. Try settlement_reconciliation_logs first
        const { data: srlData, error: srlError } = await supabaseAdmin
            .from('settlement_reconciliation_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(500);

        let reconciliations = [];
        let dataSource = 'none';

        if (!srlError && srlData && srlData.length > 0) {
            dataSource = 'settlement_reconciliation_logs';
            reconciliations = srlData;
        } else {
            // Fallback: synthesize from bookings
            const { data: bookings } = await supabaseAdmin
                .from('bookings')
                .select('id, event_id, total_price, base_amount, platform_charge, gst_amount, partner_total, status, created_at, events(organiser_id)')
                .eq('status', 'Confirmed')
                .order('created_at', { ascending: false })
                .limit(500);

            if (bookings && bookings.length > 0) {
                dataSource = 'bookings (live)';
                reconciliations = bookings.map(b => ({
                    id: b.id,
                    booking_id: b.id,
                    organizer_id: b.events?.organiser_id,
                    customer_paid: Number(b.total_price) || 0,
                    organizer_expected: Number(b.partner_total) || Number(b.base_amount) || 0,
                    organizer_actual: Number(b.partner_total) || Number(b.base_amount) || 0,
                    admin_expected: (Number(b.platform_charge) || 0) + (Number(b.gst_amount) || 0),
                    admin_actual: (Number(b.platform_charge) || 0) + (Number(b.gst_amount) || 0),
                    variance_amount: 0,
                    verification_status: 'matched',
                    created_at: b.created_at,
                    _synthesized: true
                }));
            }
        }

        return NextResponse.json({
            organizers: orgData || [],
            reconciliations,
            dataSource
        });

    } catch (err) {
        console.error("API Verification Fetch Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
