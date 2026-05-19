import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fetch user's unlocked rewards
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Fetch user rewards along with campaign details and coupon code
        const { data: rewards, error } = await supabaseAdmin
            .from('user_coupon_rewards')
            .select(`
                id,
                reward_status,
                unlocked_at,
                redeemed_at,
                coupon_inventory:coupon_inventory_id (
                    id,
                    coupon_code,
                    status,
                    expires_at,
                    partner_campaigns:campaign_id (
                        id,
                        campaign_name,
                        offer_title,
                        offer_description,
                        terms,
                        redeem_url,
                        partners:partner_id (
                            name,
                            logo_url,
                            category
                        )
                    )
                )
            `)
            .eq('user_id', userId)
            .order('unlocked_at', { ascending: false });

        if (error) throw error;

        // Map rewards to a flat clean format
        const formattedRewards = (rewards || []).map(r => {
            const inventory = r.coupon_inventory || {};
            const campaign = inventory.partner_campaigns || {};
            const partner = campaign.partners || {};

            return {
                id: r.id,
                status: r.reward_status,
                unlockedAt: r.unlocked_at,
                redeemedAt: r.redeemed_at,
                couponCode: inventory.coupon_code,
                couponStatus: inventory.status,
                expiresAt: inventory.expires_at,
                campaignName: campaign.campaign_name,
                offerTitle: campaign.offer_title,
                offerDescription: campaign.offer_description,
                terms: campaign.terms,
                redeemUrl: campaign.redeem_url,
                partnerName: partner.name,
                partnerLogo: partner.logo_url,
                partnerCategory: partner.category
            };
        });

        return NextResponse.json({ success: true, rewards: formattedRewards });
    } catch (e) {
        console.error('[REWARDS] Fetch Error:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
