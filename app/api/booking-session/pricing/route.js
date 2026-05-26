import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getFeeBreakdown, DEFAULT_FEE_SETTINGS, resolveFeeSettings } from "@/app/utils/feeBreakdown";
import { isFreeEvent } from "@/app/utils/eventUtils";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionToken = searchParams.get("sessionToken");

        if (!sessionToken) {
            return NextResponse.json({ error: "Session token is required" }, { status: 400 });
        }

        // Fetch session along with event details
        const { data: session, error: sessionErr } = await supabaseAdmin
            .from("booking_sessions")
            .select("*, events(*)")
            .eq("id", sessionToken)
            .maybeSingle();

        if (sessionErr || !session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const event = session.events;
        const participantData = session.participant_data || {};
        const quantity = participantData.quantity || 1;
        const selectedSeats = participantData.selectedSeats || [];
        const ticketPrice = isFreeEvent(event) ? 0 : (participantData.price !== undefined 
            ? Number(participantData.price) 
            : (event?.price !== undefined ? Number(event.price) : 499));

        // Calculate base amount
        let baseAmount = ticketPrice * quantity;
        if (selectedSeats.length > 0) {
            baseAmount = selectedSeats.reduce((sum, seat) => sum + (seat.isFree ? 0 : Number(seat.price) || 0), 0);
        }

        // Get system fee settings
        const { data: feeSettingsRaw } = await supabaseAdmin.from("fee_settings").select("*").limit(1).maybeSingle();
        const feeSettingsSystem = feeSettingsRaw || DEFAULT_FEE_SETTINGS;

        // Get organiser fee settings
        const organiserId = event?.organiser_id || event?.organiserId;
        let organiserData = null;
        if (organiserId) {
            const { data: orgData } = await supabaseAdmin.from("profiles").select("*").eq("id", organiserId).maybeSingle();
            organiserData = orgData;
        }

        // Resolve final fee settings
        const resolvedFeeSettings = resolveFeeSettings(
            feeSettingsSystem,
            organiserData,
            event?.fee_config
        );

        // Calculate discount (if applied in session's pricing snapshot)
        const currentPricingSnapshot = session.pricing_snapshot || {};
        const discountAmount = Number(currentPricingSnapshot.discountAmount) || 0;

        // Calculate breakdown
        const discountedBase = Math.max(0, baseAmount - discountAmount);
        const breakdown = getFeeBreakdown(discountedBase, resolvedFeeSettings);

        // Update pricing snapshot in database
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
            appliedCouponCode: currentPricingSnapshot.appliedCouponCode || null,
            appliedCouponId: currentPricingSnapshot.appliedCouponId || null,
            appliedCampaignId: currentPricingSnapshot.appliedCampaignId || null,
            appliedCampaignCode: currentPricingSnapshot.appliedCampaignCode || null
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
        console.error("Fetch Pricing Summary Error:", err);
        return NextResponse.json({ error: err.message || "Failed to fetch pricing summary" }, { status: 500 });
    }
}
