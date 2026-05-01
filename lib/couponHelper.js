import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function validateCoupon(code, userId, ticketCount, eventId) {
    try {
        // Use service role client if available and not a placeholder, otherwise fallback to public client
        const isServiceKeyValid = process.env.SUPABASE_SERVICE_ROLE_KEY && 
                                 process.env.SUPABASE_SERVICE_ROLE_KEY !== 'REPLACE_WITH_YOUR_SERVICE_ROLE_KEY' &&
                                 process.env.SUPABASE_SERVICE_ROLE_KEY.length > 20;
        
        let client;
        if (isServiceKeyValid) {
            client = supabaseAdmin;
        } else {
            const { supabase: anonClient } = await import('@/lib/supabase');
            client = anonClient;
        }

        if (!client) {
            return { valid: false, message: "System configuration error" };
        }

        const { data: coupon, error: fetchErr } = await client
            .from('coupons')
            .select('*')
            .eq('code', code)
            .eq('is_active', true)
            .maybeSingle();

        if (fetchErr) {
            return { valid: false, message: "Error validating coupon" };
        }

        if (!coupon) {
            return { valid: false, message: "Invalid or inactive coupon code" };
        }

        // 2. Check Expiry
        if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
            return { valid: false, message: "Coupon has expired" };
        }

        // 3. Check Minimum Tickets
        if (ticketCount < coupon.min_tickets) {
            return { valid: false, message: `Minimum ${coupon.min_tickets} tickets required for this coupon` };
        }

        // 4. Check Maximum Tickets
        if (coupon.max_tickets && ticketCount > coupon.max_tickets) {
            return { valid: false, message: `Maximum ${coupon.max_tickets} tickets allowed for this coupon` };
        }

        // 5. Check Global Usage Limit
        if (coupon.global_usage_limit !== null) {
            const { count, error: countErr } = await client
                .from('coupon_usage')
                .select('*', { count: 'exact', head: true })
                .eq('coupon_id', coupon.id);
            
            if (!countErr && count >= coupon.global_usage_limit) {
                return { valid: false, message: "Coupon usage limit reached" };
            }
        }

        // 6. Check Per-User Usage Limit
        const { count: userCount, error: userCountErr } = await client
            .from('coupon_usage')
            .select('*', { count: 'exact', head: true })
            .eq('coupon_id', coupon.id)
            .eq('user_id', userId);

        if (!userCountErr && userCount >= coupon.usage_limit_per_user) {
            return { valid: false, message: "You have already used this coupon" };
        }

        // 7. Check Applicable Events
        if (coupon.applicable_events && coupon.applicable_events.length > 0) {
            if (!coupon.applicable_events.includes(eventId)) {
                return { valid: false, message: "This coupon is not valid for this event" };
            }
        }

        return { valid: true, coupon };
    } catch (err) {
        console.error("Coupon Validation Error:", err);
        return { valid: false, message: "Server error during validation" };
    }
}

export function calculateDiscount(baseAmount, coupon) {
    if (!coupon) return 0;
    if (coupon.type === 'percent') {
        return (baseAmount * coupon.value) / 100;
    } else {
        return Math.min(baseAmount, coupon.value);
    }
}
