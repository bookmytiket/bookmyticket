import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getFeeBreakdown, resolveFeeSettings } from "@/app/utils/feeBreakdown";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    try {
        const body = await request.json();
        const { eventId, packageId, quantity = 1, couponCode, addons = [] } = body;

        if (!eventId) {
            return NextResponse.json({ error: "eventId is required" }, { status: 400 });
        }

        // 1. Fetch Event details
        const { data: event, error: eventErr } = await supabaseAdmin
            .from("events")
            .select("*")
            .eq("id", eventId)
            .maybeSingle();

        if (eventErr || !event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // 2. Fetch Ticket Subtotal
        let ticketPrice = Number(event.price) || 0;
        if (packageId) {
            // First check legacy packages table
            const { data: pkg } = await supabaseAdmin
                .from("packages")
                .select("price")
                .eq("id", packageId)
                .maybeSingle();
            
            if (pkg) {
                ticketPrice = Number(pkg.price);
            } else {
                // Check if it's a V2 seating section or dynamic category
                const dynConfig = typeof event.dynamic_config === 'string' ? JSON.parse(event.dynamic_config) : (event.dynamic_config || {});
                let foundTier = null;
                
                if (Array.isArray(dynConfig.seatingSections)) {
                    foundTier = dynConfig.seatingSections.find(sec => sec.id === packageId);
                    if (foundTier) ticketPrice = Number(foundTier.basePrice || 0);
                }
                
                if (!foundTier && Array.isArray(dynConfig.categories)) {
                    foundTier = dynConfig.categories.find(c => c.id === packageId);
                    if (foundTier) ticketPrice = Number(foundTier.price || 0);
                }
                
                // Check legacy ticket categories
                if (!foundTier) {
                    const { data: ticketCat } = await supabaseAdmin
                        .from("ticket_categories")
                        .select("price")
                        .eq("id", packageId)
                        .maybeSingle();
                    if (ticketCat) ticketPrice = Number(ticketCat.price);
                }

                // Check event_ticket_categories
                if (!foundTier) {
                    const { data: eventTicketCat } = await supabaseAdmin
                        .from("event_ticket_categories")
                        .select("price")
                        .eq("id", packageId)
                        .maybeSingle();
                    if (eventTicketCat) ticketPrice = Number(eventTicketCat.price);
                }
                
                // Fallback custom subtotal if passed (useful for custom seat selection)
                if (!foundTier && body.customSubtotal !== undefined) {
                    ticketPrice = Number(body.customSubtotal) / quantity;
                }
            }
        } else if (body.customSubtotal !== undefined) {
            ticketPrice = Number(body.customSubtotal) / quantity;
        }
        
        const ticketSubtotal = ticketPrice * quantity;

        // 3. Fetch Configured Fee and Tax Settings from DB
        const { data: feeSettingsRaw } = await supabaseAdmin.from("fee_settings").select("*").eq("is_active", true).limit(1).maybeSingle();
        const { data: taxSettingsRaw } = await supabaseAdmin.from("tax_settings").select("*").eq("is_active", true).limit(1).maybeSingle();

        // Resolve Organiser Profile
        const { data: organiserProfile } = await supabaseAdmin
            .from("profiles")
            .select("*")
            .eq("id", event.organiser_id || event.organiserId)
            .maybeSingle();

        // 4. Resolve Fees
        const feeConfig = {
            convenienceFeeType: feeSettingsRaw?.fee_type || 'fixed',
            convenienceFeeValue: Number(feeSettingsRaw?.fee_value) || 40,
            gstPercent: Number(taxSettingsRaw?.tax_percentage) || 18,
            gstApplyOn: taxSettingsRaw?.apply_on || 'platform_fee',
            organiserCustomFeeType: event.fee_config?.custom_fee_type || organiserProfile?.fee_config?.custom_fee_type || null,
            organiserCustomFeeValue: Number(event.fee_config?.custom_fee_value) || Number(organiserProfile?.fee_config?.custom_fee_value) || 0,
            absorbFees: event.fee_config?.absorb_fees || organiserProfile?.fee_config?.absorb_fees || false
        };

        const resolvedFeeSettings = resolveFeeSettings(
            feeSettingsRaw,
            organiserProfile?.fee_config,
            event.fee_config
        );

        // Calculate Platform Base
        let platformFeeBase = 0;
        if (ticketSubtotal > 0) {
            platformFeeBase = resolvedFeeSettings.convenienceFeeType === 'fixed' 
                ? resolvedFeeSettings.convenienceFeeValue 
                : (ticketSubtotal * resolvedFeeSettings.convenienceFeeValue) / 100;
        }
        platformFeeBase = Math.round(platformFeeBase * 100) / 100;

        // Calculate Tax (GST)
        let taxAmount = 0;
        const taxRate = resolvedFeeSettings.gstPercent;
        if (taxRate > 0) {
            if (resolvedFeeSettings.gstApplyOn === 'ticket_only' || resolvedFeeSettings.gstApplyOn === 'ticket_price') {
                taxAmount = (ticketSubtotal * taxRate) / 100;
            } else if (resolvedFeeSettings.gstApplyOn === 'both' || resolvedFeeSettings.gstApplyOn === 'full_order') {
                taxAmount = ((ticketSubtotal + platformFeeBase) * taxRate) / 100;
            } else {
                // Default: platform_fee
                taxAmount = (platformFeeBase * taxRate) / 100;
            }
        }
        taxAmount = Math.round(taxAmount * 100) / 100;

        // 5. Calculate Addons
        let addonAmount = 0;
        if (addons.includes("donation")) {
            addonAmount = 1 * quantity; // 1 rupee per ticket
        }

        // 6. Calculate Coupon / Discount
        let discountAmount = 0;
        if (couponCode) {
            const { data: coupon } = await supabaseAdmin
                .from("coupons")
                .select("*")
                .eq("code", couponCode.toUpperCase())
                .maybeSingle();
            
            if (coupon && (!coupon.expiry_date || new Date(coupon.expiry_date) > new Date())) {
                const isValidForEvent = !coupon.applicable_events || coupon.applicable_events.includes(eventId);
                const isMinQtyMet = quantity >= (coupon.min_tickets || 1);
                
                if (isValidForEvent && isMinQtyMet) {
                    if (coupon.type === 'percent') {
                        discountAmount = (ticketSubtotal * coupon.value) / 100;
                    } else {
                        discountAmount = Math.min(ticketSubtotal, coupon.value);
                    }
                }
            } else {
                // Check partner campaigns
                const { data: campaign } = await supabaseAdmin
                    .from("partner_campaigns")
                    .select("*, partner_campaign_coupons!inner(*)")
                    .eq("partner_campaign_coupons.coupon_code", couponCode.toUpperCase())
                    .eq("partner_campaign_coupons.status", "Active")
                    .maybeSingle();

                if (campaign) {
                    if (campaign.discount_type === 'Percentage') {
                        discountAmount = (ticketSubtotal * campaign.discount_value) / 100;
                    } else {
                        discountAmount = Math.min(ticketSubtotal, campaign.discount_value);
                    }
                }
            }
        }
        discountAmount = Math.round(discountAmount * 100) / 100;

        // 7. Final Amount
        const finalAmount = Number((ticketSubtotal + platformFeeBase + taxAmount + addonAmount - discountAmount).toFixed(2));

        return NextResponse.json({
            ticketSubtotal,
            platformFeeBase,
            taxRate,
            taxAmount,
            addonAmount,
            discountAmount,
            finalAmount
        });

    } catch (err) {
        console.error("Pricing API Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
