import { createServerClient } from "@supabase/ssr";
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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
        const { campaign_id, codes } = body;

        if (!campaign_id || !codes || !Array.isArray(codes) || codes.length === 0) {
            return NextResponse.json({ error: 'Invalid payload. Provide campaign_id and an array of codes.' }, { status: 400 });
        }

        // Prepare bulk insert payload
        const insertPayload = codes.map(code => ({
            campaign_id,
            voucher_code: code.trim(),
            is_assigned: false,
            is_redeemed: false
        })).filter(item => item.voucher_code.length > 0);

        // Perform bulk insert
        const { error } = await supabase
            .from('reward_vouchers')
            .insert(insertPayload);

        if (error) {
            // Handle unique constraint violation (duplicate codes)
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Some codes already exist in the database. Please ensure unique voucher codes.' }, { status: 400 });
            }
            throw error;
        }

        return NextResponse.json({ success: true, count: insertPayload.length });
    } catch (error) {
        console.error('Voucher Upload Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
