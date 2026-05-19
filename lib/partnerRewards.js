import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Evaluates rewards eligibility and unlocks/assigns a unique partner coupon code to the user post-booking.
 * Enforces one coupon per user per campaign to prevent abuse.
 */
export async function unlockPartnerReward(bookingId, userId, eventId) {
    try {
        console.log(`[REWARDS] Triggering reward unlock evaluation for Booking: ${bookingId}, User: ${userId}, Event: ${eventId}`);

        // 1. Fetch the event to verify it exists and is eligible
        const { data: event, error: eventErr } = await supabaseAdmin
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (eventErr || !event) {
            console.warn('[REWARDS] Event not found or not eligible.', eventErr?.message);
            return { success: false, message: 'Event not eligible for rewards' };
        }

        // 2. Fetch the active campaign mappings for this event
        const { data: mappings, error: mapErr } = await supabaseAdmin
            .from('event_coupon_mapping')
            .select('*, partner_campaigns(*)')
            .eq('event_id', eventId)
            .eq('is_enabled', true);

        if (mapErr || !mappings || mappings.length === 0) {
            console.log('[REWARDS] No active partner campaigns mapped to this event.');
            return { success: false, message: 'No active reward campaigns for this event' };
        }

        let unlockedRewards = [];

        // 3. Process mappings to find and assign eligible coupons
        for (const mapping of mappings) {
            const campaign = mapping.partner_campaigns;
            if (!campaign || !campaign.is_active) continue;

            // Enforce Campaign start/end dates
            const today = new Date().toISOString().split('T')[0];
            if (campaign.start_date && campaign.start_date > today) continue;
            if (campaign.end_date && campaign.end_date < today) continue;

            // Enforce One User One Coupon per campaign rule
            const { data: existingUserReward, error: rewardErr } = await supabaseAdmin
                .from('user_coupon_rewards')
                .select('*, coupon_inventory(*)')
                .eq('user_id', userId)
                .eq('coupon_inventory.campaign_id', campaign.id)
                .maybeSingle();

            if (existingUserReward) {
                console.log(`[REWARDS] User ${userId} already claimed a reward for Campaign ${campaign.id}. Skipping.`);
                continue;
            }

            // 4. Find one available coupon token from inventory
            const { data: availableCoupons, error: invErr } = await supabaseAdmin
                .from('coupon_inventory')
                .select('*')
                .eq('campaign_id', campaign.id)
                .eq('status', 'available')
                .limit(1);

            if (invErr || !availableCoupons || availableCoupons.length === 0) {
                console.warn(`[REWARDS] No available coupons left in inventory for Campaign: ${campaign.campaign_name}`);
                continue;
            }

            const coupon = availableCoupons[0];

            // 5. Allocate the coupon
            const expiresAt = campaign.end_date ? new Date(campaign.end_date).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default 30 days
            
            // Mark coupon as assigned
            const { error: updateErr } = await supabaseAdmin
                .from('coupon_inventory')
                .update({
                    status: 'assigned',
                    assigned_user_id: userId,
                    assigned_booking_id: bookingId,
                    expires_at: expiresAt
                })
                .eq('id', coupon.id);

            if (updateErr) {
                console.error(`[REWARDS] Failed to assign coupon ${coupon.id}:`, updateErr.message);
                continue;
            }

            // Record reward
            const { data: rewardRecord, error: insertErr } = await supabaseAdmin
                .from('user_coupon_rewards')
                .insert({
                    user_id: userId,
                    booking_id: bookingId,
                    coupon_inventory_id: coupon.id,
                    reward_status: 'unlocked',
                    unlocked_at: new Date().toISOString()
                })
                .select()
                .single();

            if (insertErr) {
                console.error('[REWARDS] Failed to insert user_coupon_rewards record:', insertErr.message);
                // Rollback coupon assignment
                await supabaseAdmin
                    .from('coupon_inventory')
                    .update({
                        status: 'available',
                        assigned_user_id: null,
                        assigned_booking_id: null,
                        expires_at: null
                    })
                    .eq('id', coupon.id);
                continue;
            }

            // Create log
            await supabaseAdmin.from('coupon_redemption_logs').insert({
                user_id: userId,
                coupon_id: coupon.id,
                action: 'unlock',
                device_info: 'Server Action'
            });

            // Create Notification
            await supabaseAdmin.from('coupon_notifications').insert([
                {
                    user_id: userId,
                    coupon_id: coupon.id,
                    channel: 'in-app',
                    status: 'sent',
                    sent_at: new Date().toISOString()
                },
                {
                    user_id: userId,
                    coupon_id: coupon.id,
                    channel: 'email',
                    status: 'pending'
                }
            ]);

            unlockedRewards.push({
                campaignName: campaign.campaign_name,
                offerTitle: campaign.offer_title,
                couponCode: coupon.coupon_code,
                redeemUrl: campaign.redeem_url
            });
        }

        return {
            success: true,
            rewards: unlockedRewards
        };

    } catch (e) {
        console.error('[REWARDS] Error in unlockPartnerReward:', e.message);
        return { success: false, error: e.message };
    }
}
