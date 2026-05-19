import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { validateCoupon } from "@/lib/couponHelper";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    try {
        const { sessionToken, code } = await request.json();

        if (!sessionToken || !code) {
            return NextResponse.json({ error: "Session token and coupon code are required" }, { status: 400 });
        }

        const cleanCode = code.trim().toUpperCase();

        // 1. Fetch booking session
        const { data: session, error: sessionErr } = await supabaseAdmin
            .from("booking_sessions")
            .select("*, events(*)")
            .eq("id", sessionToken)
            .maybeSingle();

        if (sessionErr || !session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const participantData = session.participant_data || {};
        const quantity = participantData.quantity || 1;
        const selectedSeats = participantData.selectedSeats || [];
        const ticketPrice = Number(participantData.price) || Number(session.events?.price) || 499;

        // Calculate base amount
        let baseAmount = ticketPrice * quantity;
        if (selectedSeats.length > 0) {
            baseAmount = selectedSeats.reduce((sum, seat) => sum + (seat.isFree ? 0 : Number(seat.price) || 0), 0);
        }

        // 2. Check if code starts with any partner prefix
        const { data: partners, error: partnersErr } = await supabaseAdmin
            .from("partners")
            .select("*")
            .not("prefix", "is", null);

        let partnerCampaign = null;
        let matchedPartner = null;

        if (!partnersErr && partners) {
            for (const partner of partners) {
                if (partner.prefix && cleanCode.startsWith(partner.prefix.toUpperCase())) {
                    matchedPartner = partner;
                    break;
                }
            }
        }

        // 3. If matched a partner prefix, validate via partner campaign + coupon inventory
        if (matchedPartner) {
            // Find the coupon in inventory
            const { data: coupon, error: couponErr } = await supabaseAdmin
                .from("coupon_inventory")
                .select("*, partner_campaigns(*)")
                .eq("coupon_code", cleanCode)
                .maybeSingle();

            if (couponErr || !coupon) {
                return NextResponse.json({ valid: false, message: "Invalid partner voucher code" });
            }

            const campaign = coupon.partner_campaigns;
            if (!campaign || !campaign.is_active) {
                return NextResponse.json({ valid: false, message: "Voucher campaign is inactive" });
            }

            // Verify campaign active dates
            const today = new Date().toISOString().split("T")[0];
            if (campaign.start_date && campaign.start_date > today) {
                return NextResponse.json({ valid: false, message: "Voucher campaign has not started yet" });
            }
            if (campaign.end_date && campaign.end_date < today) {
                return NextResponse.json({ valid: false, message: "Voucher campaign has expired" });
            }

            // Verify event restriction if specified
            if (campaign.event_id && campaign.event_id !== session.event_id) {
                return NextResponse.json({ valid: false, message: "This voucher is not applicable for this event" });
            }

            // Verify minimum booking amount
            if (campaign.min_booking_amount && baseAmount < Number(campaign.min_booking_amount)) {
                return NextResponse.json({ 
                    valid: false, 
                    message: `Minimum booking amount ₹${campaign.min_booking_amount} required to use this voucher` 
                });
            }

            // Verify coupon status/assignment
            if (coupon.status === "redeemed" || coupon.redeemed_at) {
                return NextResponse.json({ valid: false, message: "Voucher has already been redeemed" });
            }

            if (coupon.status === "assigned" && coupon.assigned_user_id && coupon.assigned_user_id !== session.user_id) {
                return NextResponse.json({ valid: false, message: "This voucher is assigned to another user" });
            }

            // If we get here, the partner voucher is valid!
            const discountType = campaign.discount_type === "percentage" ? "percent" : "fixed";
            const discountValue = Number(campaign.discount_value) || 0;

            return NextResponse.json({
                valid: true,
                coupon: {
                    id: coupon.id,
                    code: coupon.coupon_code,
                    type: discountType,
                    value: discountValue,
                    isCampaign: true,
                    campaignId: campaign.id,
                    campaignCode: campaign.campaign_name,
                    min_order: Number(campaign.min_booking_amount) || 0
                }
            });
        }

        // 4. Otherwise, validate as a regular coupon
        const result = await validateCoupon(cleanCode, session.user_id, quantity, session.event_id);
        
        return NextResponse.json(result);
    } catch (err) {
        console.error("Validate Coupon API Error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
