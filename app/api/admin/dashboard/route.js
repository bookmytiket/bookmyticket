import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    const cookieStore = await cookies();
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
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );

    try {
        // 1. Verify Admin Status via Registry
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: adminRecord } = await supabase
            .from('platform_admins')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!adminRecord) return NextResponse.json({ error: "Access Denied" }, { status: 403 });

        // 2. Fetch Aggregated Metrics in Parallel
        const [
            profilesRes,
            organisersRes,
            eventsRes,
            tournamentsRes,
            bookingsRes,
            kycRes,
            revenueRes
        ] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact', head: true }),
            supabase.from('organisers').select('id', { count: 'exact', head: true }),
            supabase.from('events').select('id', { count: 'exact', head: true }),
            supabase.from('tournament_events').select('id', { count: 'exact', head: true }),
            supabase.from('bookings').select('id', { count: 'exact', head: true }),
            supabase.from('kyc_details').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
            supabase.from('platform_revenue').select('total_revenue')
        ]);

        // 3. Calculate Financials
        const totalFees = revenueRes.data?.reduce((acc, curr) => acc + (Number(curr.total_revenue) || 0), 0) || 0;

        return NextResponse.json({
            metrics: {
                totalUsers: profilesRes.count || 0,
                totalOrganisers: organisersRes.count || 0,
                totalEvents: (eventsRes.count || 0) + (tournamentsRes.count || 0),
                totalTournaments: tournamentsRes.count || 0,
                totalBookings: bookingsRes.count || 0,
                pendingKyc: kycRes.count || 0,
                totalRevenue: totalFees
            }
        });

    } catch (error) {
        console.error("Admin Dashboard API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
