import { createServerClient } from "@supabase/ssr";
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
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
                        } catch {}
                    },
                },
            }
        );
        
        // Ensure user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!['admin', 'super_admin'].includes(profile?.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch campaigns with voucher counts
        const { data, error } = await supabase
            .from('reward_campaigns')
            .select(`
                *,
                reward_vouchers (count)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Format response
        const formattedData = data.map(campaign => ({
            ...campaign,
            vouchers_uploaded: campaign.reward_vouchers[0]?.count || 0
        }));

        return NextResponse.json(formattedData);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
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
                        } catch {}
                    },
                },
            }
        );
        
        // Ensure user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!['admin', 'super_admin'].includes(profile?.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { 
            campaign_name, 
            campaign_type, 
            sponsor_name, 
            reward_value, 
            start_date, 
            end_date, 
            total_quantity, 
            eligibility_rules 
        } = body;

        // Validation
        if (!campaign_name || !campaign_type || !reward_value || !start_date || !end_date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('reward_campaigns')
            .insert([{
                campaign_name,
                campaign_type,
                sponsor_name,
                reward_value,
                start_date,
                end_date,
                total_quantity: parseInt(total_quantity) || 0,
                eligibility_rules: eligibility_rules || {},
                status: 'active'
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, campaign: data });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
