import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Redeem reward endpoint
export async function POST(request) {
    try {
        const body = await request.json();
        const { rewardId, userId, ipAddress, deviceInfo } = body;

        if (!rewardId || !userId) {
            return NextResponse.json({ error: 'Missing rewardId or userId' }, { status: 400 });
        }

        // 1. Fetch reward record
        const { data: reward, error: fetchErr } = await supabaseAdmin
            .from('user_coupon_rewards')
            .select('*')
            .eq('id', rewardId)
            .eq('user_id', userId)
            .single();

        if (fetchErr || !reward) {
            return NextResponse.json({ error: 'Reward not found or access denied' }, { status: 404 });
        }

        if (reward.reward_status === 'redeemed') {
            return NextResponse.json({ success: true, message: 'Already redeemed' });
        }

        const now = new Date().toISOString();

        // 2. Mark reward as redeemed
        const { error: updateErr } = await supabaseAdmin
            .from('user_coupon_rewards')
            .update({
                reward_status: 'redeemed',
                redeemed_at: now
            })
            .eq('id', rewardId);

        if (updateErr) throw updateErr;

        // 3. Mark inventory coupon status as redeemed
        if (reward.coupon_inventory_id) {
            await supabaseAdmin
                .from('coupon_inventory')
                .update({
                    status: 'redeemed',
                    redeemed_at: now
                })
                .eq('id', reward.coupon_inventory_id);

            // 4. Log redemption log
            await supabaseAdmin.from('coupon_redemption_logs').insert({
                user_id: userId,
                coupon_id: reward.coupon_inventory_id,
                action: 'redeem',
                ip_address: ipAddress || '',
                device_info: deviceInfo || 'Web Browser'
            });
        }

        return NextResponse.json({ success: true, message: 'Reward successfully redeemed!' });
    } catch (e) {
        console.error('[REWARDS] Redeem Error:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
