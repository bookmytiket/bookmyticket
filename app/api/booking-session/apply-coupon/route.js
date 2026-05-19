import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getFeeBreakdown, DEFAULT_FEE_SETTINGS, resolveFeeSettings } from "@/app/utils/feeBreakdown";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    try {
        const { sessionToken, code } = await request.json();

        if (!sessionToken) {
            return NextResponse.json({ error: "Session token is required" }, { status: 400 });
        }

        // 1. Fetch booking session
        const { data: session, error: sessionErr } = await supabaseAdmin
            .from("booking_sessions")
            .select("*, events(*)")
            .eq("id", sessionToken)
            .maybeSingle();

        if (sessionErr || !session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        // 2. If code is empty/null, remove coupon
        if (!code) {
            const currentSnapshot = session.pricing_snapshot || {};
            
            // Recalculate without discount
            const event = session.events;
            const participantData = session.participant_data || {};
            const quantity = participantData.quantity || 1;
            const selectedSeats = participantData.selectedSeats || [];
            const ticketPrice = Number(participantData.price) || Number(event?.price) || 499;

            let baseAmount = ticketPrice * quantity;
            if (selectedSeats.length > 0) {
                baseAmount = selectedSeats.reduce((sum, seat) => sum + (seat.isFree ? 0 : Number(seat.price) || 0), 0);
            }

            const { data: feeSettingsRaw } = await supabaseAdmin.from("fee_settings").select("*").limit(1).maybeSingle();
            const feeSettingsSystem = feeSettingsRaw || DEFAULT_FEE_SETTINGS;

            const organiserId = event?.organiser_id || event?.organiserId;
            let organiserData = null;
            if (organiserId) {
                const { data: orgData } = await supabaseAdmin.from("profiles").select("*").eq("id", organiserId).maybeSingle();
                organiserData = orgData;
            }

            const resolvedFeeSettings = resolveFeeSettings(feeSettingsSystem, organiserData, event?.fee_config);
            const breakdown = getFeeBreakdown(baseAmount, resolvedFeeSettings);

            const pricingSnapshot = {
                baseAmount: baseAmount,
                discountAmount: 0,
                convenienceFee: breakdown.convenienceFee,
                gst: breakdown.gst,
                gstPercent: breakdown.gstPercent,
                totalPrice: breakdown.total,
                partnerBonus: breakdown.partnerBonus,
                platformRevenue: breakdown.platformRevenue,
                partnerTotal: breakdown.partnerTotal,
                appliedCouponCode: null,
                appliedCouponId: null,
                appliedCampaignId: null,
                appliedCampaignCode: null
            };

            await supabaseAdmin
                .from("booking_sessions")
                .update({ pricing_snapshot: pricingSnapshot })
                .eq("id", sessionToken);

            return NextResponse.json({ success: true, pricing: pricingSnapshot, breakdown });
        }

        // 3. Validate coupon code
        // Call the validate endpoint logic internally or redirect to validation
        const protocol = request.headers.get("x-forwarded-proto") || "https";
        const host = request.headers.get("host");
        const origin = `${protocol}://${host}`;

        const valRes = await fetch(`${origin}/api/booking-session/validate-coupon`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionToken, code })
        });

        const valData = await valRes.json();
        if (!valData.valid) {
            return NextResponse.json({ success: false, message: valData.message || "Invalid coupon" });
        }

        const coupon = valData.coupon;

        // 4. Calculate discount
        const event = session.events;
        const participantData = session.participant_data || {};
        const quantity = participantData.quantity || 1;
        const selectedSeats = participantData.selectedSeats || [];
        const ticketPrice = Number(participantData.price) || Number(event?.price) || 499;

        let baseAmount = ticketPrice * quantity;
        if (selectedSeats.length > 0) {
            baseAmount = selectedSeats.reduce((sum, seat) => sum + (seat.isFree ? 0 : Number(seat.price) || 0), 0);
        }

        let discountAmount = 0;
        if (coupon.type === "percent") {
            discountAmount = (baseAmount * Number(coupon.value)) / 100;
        } else {
            discountAmount = Math.min(baseAmount, Number(coupon.value));
        }

        // 5. Recalculate pricing breakdown
        const { data: feeSettingsRaw } = await supabaseAdmin.from("fee_settings").select("*").limit(1).maybeSingle();
        const feeSettingsSystem = feeSettingsRaw || DEFAULT_FEE_SETTINGS;

        const organiserId = event?.organiser_id || event?.organiserId;
        let organiserData = null;
        if (organiserId) {
            const { data: orgData } = await supabaseAdmin.from("profiles").select("*").eq("id", organiserId).maybeSingle();
            organiserData = orgData;
        }

        const resolvedFeeSettings = resolveFeeSettings(feeSettingsSystem, organiserData, event?.fee_config);
        const discountedBase = Math.max(0, baseAmount - discountAmount);
        const breakdown = getFeeBreakdown(discountedBase, resolvedFeeSettings);

        // 6. Save back to booking session
        const pricingSnapshot = {
            baseAmount: baseAmount,
            discountAmount: discountAmount,
            convenienceFee: breakdown.convenienceFee,
            gst: breakdown.gst,
            gstPercent: breakdown.gstPercent,
            totalPrice: breakdown.total,
            partnerBonus: breakdown.partnerBonus,
            platformRevenue: breakdown.platformRevenue,
            partnerTotal: breakdown.partnerTotal,
            appliedCouponCode: coupon.code,
            appliedCouponId: coupon.isCampaign ? null : coupon.id,
            appliedCampaignId: coupon.isCampaign ? coupon.campaignId : null,
            appliedCampaignCode: coupon.isCampaign ? coupon.campaignCode : null
        };

        await supabaseAdmin
            .from("booking_sessions")
            .update({ pricing_snapshot: pricingSnapshot })
            .eq("id", sessionToken);

        return NextResponse.json({
            success: true,
            pricing: pricingSnapshot,
            breakdown
        });
    } catch (err) {
        console.error("Apply Coupon Error:", err);
        return NextResponse.json({ error: "Failed to apply coupon" }, { status: 500 });
    }
}
