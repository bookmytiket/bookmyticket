import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Service role client to bypass RLS
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

        // 3. Fetch booking_financials with RLS bypass
        const { data: revData, error } = await supabaseAdmin
            .from('booking_financials')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        let totalRev = 0;
        let totalFee = 0;
        let totalGst = 0;
        let totalPartner = 0;
        let totalNet = 0;
        let mappedTransactions = [];

        if (revData) {
            totalRev = revData.reduce((acc, curr) => acc + (Number(curr.final_paid) || 0), 0);
            totalFee = revData.reduce((acc, curr) => acc + (Number(curr.platform_fee) || 0), 0);
            totalGst = revData.reduce((acc, curr) => acc + (Number(curr.gst_amount) || 0), 0);
            totalPartner = revData.reduce((acc, curr) => acc + (Number(curr.organizer_credit) || 0), 0);
            totalNet = revData.reduce((acc, curr) => acc + (Number(curr.admin_credit) || 0), 0);

            mappedTransactions = revData.map(tx => ({
                ...tx,
                total_revenue: tx.final_paid,
                partner_share: tx.organizer_credit,
                net_platform_revenue: tx.admin_credit
            }));
        }

        return NextResponse.json({
            stats: {
                totalRevenue: totalRev,
                totalPlatformFee: totalFee,
                totalGst: totalGst,
                totalPartner: totalPartner,
                totalNet: totalNet,
                recentTransactions: mappedTransactions.slice(0, 20)
            }
        });

    } catch (err) {
        console.error("API Revenue Fetch Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
