import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Evaluates rewards eligibility and assigns new reward vouchers/gift cards to the user post-booking.
 * Connects to the new reward_campaigns schema.
 */
export async function unlockPartnerReward(bookingId, userId, eventId) {
    try {
        console.log(`[REWARDS ENGINE] Triggering reward assignment for Booking: ${bookingId}, User: ${userId}, Event: ${eventId}`);

        // 1. Fetch active campaigns
        const today = new Date().toISOString();
        const { data: campaigns, error: campErr } = await supabaseAdmin
            .from('reward_campaigns')
            .select('*')
            .eq('status', 'active')
            .lte('start_date', today)
            .gte('end_date', today);

        if (campErr || !campaigns || campaigns.length === 0) {
            console.log('[REWARDS ENGINE] No active campaigns available.');
            return { success: true, message: 'No active campaigns' };
        }

        let unlockedRewards = [];

        // 2. Process each campaign
        for (const campaign of campaigns) {
            // Add eligibility rule checks here if needed (e.g. min_spend)
            
            // 3. Enforce One User One Reward per campaign rule
            const { data: existingRewards, error: checkErr } = await supabaseAdmin
                .from('user_rewards')
                .select('id, reward_vouchers!inner(campaign_id)')
                .eq('user_id', userId)
                .eq('reward_vouchers.campaign_id', campaign.id);

            if (existingRewards && existingRewards.length > 0) {
                console.log(`[REWARDS ENGINE] User ${userId} already received reward for Campaign ${campaign.id}. Skipping.`);
                continue;
            }

            // 4. Find one available voucher from the pool
            const { data: availableVouchers, error: invErr } = await supabaseAdmin
                .from('reward_vouchers')
                .select('*')
                .eq('campaign_id', campaign.id)
                .eq('is_assigned', false)
                .limit(1);

            if (invErr || !availableVouchers || availableVouchers.length === 0) {
                console.warn(`[REWARDS ENGINE] No available vouchers left in pool for Campaign: ${campaign.campaign_name}`);
                continue;
            }

            const voucher = availableVouchers[0];

            // 5. Assign the voucher
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days validity
            
            const { error: updateErr } = await supabaseAdmin
                .from('reward_vouchers')
                .update({
                    is_assigned: true,
                    expiry_date: expiresAt
                })
                .eq('id', voucher.id);

            if (updateErr) {
                console.error(`[REWARDS ENGINE] Failed to update voucher ${voucher.id}:`, updateErr.message);
                continue;
            }

            // 6. Record user reward
            const { data: userReward, error: insertErr } = await supabaseAdmin
                .from('user_rewards')
                .insert({
                    user_id: userId,
                    booking_id: bookingId,
                    voucher_id: voucher.id,
                    status: 'active'
                })
                .select()
                .single();

            if (insertErr) {
                console.error('[REWARDS ENGINE] Failed to insert user_rewards record:', insertErr.message);
                continue;
            }

            // 7. Auto-generate E-Card layout record for Gift Cards
            if (campaign.campaign_type === 'gift_card') {
                await supabaseAdmin
                    .from('reward_ecards')
                    .insert({
                        user_reward_id: userReward.id,
                        ecard_url: `/api/rewards/ecard/${userReward.id}`, // Example Dynamic URL
                        generated_at: new Date().toISOString()
                    });
            }

            unlockedRewards.push({
                campaignName: campaign.campaign_name,
                type: campaign.campaign_type,
                value: campaign.reward_value,
                code: voucher.voucher_code
            });
            
            console.log(`[REWARDS ENGINE] Successfully assigned voucher ${voucher.voucher_code} to User ${userId}`);
        }

        return {
            success: true,
            rewards: unlockedRewards
        };

    } catch (e) {
        console.error('[REWARDS ENGINE] Error in unlockPartnerReward:', e.message);
        return { success: false, error: e.message };
    }
}
