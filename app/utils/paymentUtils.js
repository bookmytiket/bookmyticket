import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Unified payment success handler.
 * Runs all financial settlement steps after a confirmed payment.
 *
 * Steps:
 *  1. Update payment record to success
 *  2. Insert booking_financials
 *  3. Credit organiser wallet (organiser_wallet table)
 *  4. Insert wallet_transaction record
 *  5. Insert organizer_revenue_ledger
 *  6. Insert admin_revenue_ledger
 *  7. Insert tax_ledger (GST)
 *  8. Insert settlement_reconciliation_log
 *  9. Insert organiser_transactions (earnings dashboard)
 * 10. Insert revenue_ledger (admin revenue dashboard)
 * 11. Insert platform_revenue
 */
export async function handlePaymentSuccess({
    paymentId,
    type,          // 'event' | 'service'
    referenceId,   // bookingId
    totalAmount,
    baseAmount,    // organiser payout amount
    platformFee,
    gstAmount,
    providerId,    // organiser_id
    eventId,       // optional - for linking to event
    description
}) {
    const errors = [];
    try {
        console.log(`[Payment] Processing success for ${type} ${referenceId}. Base: ${baseAmount}, Fee: ${platformFee}, GST: ${gstAmount}, Total: ${totalAmount}`);

        const adminTotal = Number(platformFee || 0) + Number(gstAmount || 0);

        // ── STEP 1: Update Payment Record to Success ──────────────────────────
        if (paymentId) {
            const { error: payUpdateErr } = await supabaseAdmin
                .from('payments')
                .update({
                    status: 'success',
                    total_amount: totalAmount,
                    base_amount: baseAmount,
                    platform_fee: platformFee,
                    gst_amount_col: gstAmount,
                    updated_at: new Date().toISOString()
                })
                .eq('id', paymentId);
            if (payUpdateErr) {
                errors.push(`payments update: ${payUpdateErr.message}`);
                console.warn('[Payment] payments update error:', payUpdateErr.message);
            }
        }

        // ── STEP 2: Booking Financials ─────────────────────────────────────────
        const { error: bfErr } = await supabaseAdmin.from('booking_financials').insert({
            booking_id: referenceId,
            ticket_amount: Number(baseAmount) || 0,
            discount_amount: 0,
            discounted_ticket_amount: Number(baseAmount) || 0,
            platform_fee: Number(platformFee) || 0,
            gst_amount: Number(gstAmount) || 0,
            gateway_fee: 0,
            final_paid: Number(totalAmount) || 0,
            organizer_credit: Number(baseAmount) || 0,
            admin_credit: adminTotal
        });
        if (bfErr) {
            errors.push(`booking_financials: ${bfErr.message}`);
            console.warn('[Payment] booking_financials insert error:', bfErr.message);
        }

        // ── STEP 3: Credit Organiser Wallet ────────────────────────────────────
        if (providerId && baseAmount > 0) {
            const walletTable = type === 'event' ? 'organiser_wallet' : 'provider_wallet';
            const idColumn = type === 'event' ? 'organiser_id' : 'service_provider_id';

            const { data: walletData } = await supabaseAdmin
                .from(walletTable)
                .select('balance')
                .eq(idColumn, providerId)
                .maybeSingle();

            const newBalance = (walletData?.balance || 0) + Number(baseAmount);

            await supabaseAdmin
                .from(walletTable)
                .upsert({
                    [idColumn]: providerId,
                    balance: newBalance,
                    updated_at: new Date().toISOString()
                }, { onConflict: idColumn });

            // Legacy organisers table wallet_balance sync
            if (type === 'event') {
                try {
                    const { data: orgData } = await supabaseAdmin
                        .from('organisers')
                        .select('wallet_balance')
                        .eq('id', providerId)
                        .maybeSingle();
                    if (orgData) {
                        await supabaseAdmin
                            .from('organisers')
                            .update({ wallet_balance: (orgData.wallet_balance || 0) + Number(baseAmount) })
                            .eq('id', providerId);
                    }
                } catch (e) { /* non-critical */ }
            }
        }

        // ── STEP 4: Wallet Transaction Record ──────────────────────────────────
        if (providerId && baseAmount > 0) {
            const { error: wtErr } = await supabaseAdmin.from('wallet_transactions').insert({
                organiser_id: type === 'event' ? providerId : null,
                provider_id: providerId,
                provider_type: type === 'event' ? 'organiser' : 'service',
                booking_id: referenceId,
                amount: Number(baseAmount),
                type: 'credit',
                description: description || `Earnings from ${type} booking #${referenceId?.slice(-8)?.toUpperCase()}`
            });
            if (wtErr) {
                errors.push(`wallet_transactions: ${wtErr.message}`);
                console.warn('[Payment] wallet_transactions insert error:', wtErr.message);
            }
        }

        // ── STEP 5: Organizer Revenue Ledger ──────────────────────────────────
        const { error: orlErr } = await supabaseAdmin.from('organizer_revenue_ledger').insert({
            organizer_id: providerId,
            booking_id: referenceId,
            gross_ticket_revenue: Number(totalAmount) || 0,
            discount_amount: 0,
            net_organizer_revenue: Number(baseAmount) || 0,
            settlement_credit_amount: Number(baseAmount) || 0,
            settlement_status: 'credited'
        });
        if (orlErr) {
            errors.push(`organizer_revenue_ledger: ${orlErr.message}`);
            console.warn('[Payment] organizer_revenue_ledger error:', orlErr.message);
        }

        // ── STEP 6: Admin Revenue Ledger ──────────────────────────────────────
        const { error: arlErr } = await supabaseAdmin.from('admin_revenue_ledger').insert({
            booking_id: referenceId,
            payment_id: paymentId || null,
            organizer_id: providerId,
            platform_fee: Number(platformFee) || 0,
            gst_amount: Number(gstAmount) || 0,
            gateway_charges: 0,
            admin_total: adminTotal
        });
        if (arlErr) {
            errors.push(`admin_revenue_ledger: ${arlErr.message}`);
            console.warn('[Payment] admin_revenue_ledger error:', arlErr.message);
        }

        // ── STEP 7: Tax Ledger (GST) ──────────────────────────────────────────
        if (gstAmount > 0) {
            const { error: tlErr } = await supabaseAdmin.from('tax_ledger').insert({
                booking_id: referenceId,
                organizer_id: providerId,
                tax_type: 'GST',
                tax_amount: Number(gstAmount) || 0,
                tax_rate: 18,
                taxable_amount: Number(platformFee) || 0,
                invoice_reference: referenceId ? `INV-${referenceId.slice(-8).toUpperCase()}` : null
            });
            if (tlErr) {
                errors.push(`tax_ledger: ${tlErr.message}`);
                console.warn('[Payment] tax_ledger error:', tlErr.message);
            }
        }

        // ── STEP 8: Settlement Reconciliation Log ─────────────────────────────
        const { error: srlErr } = await supabaseAdmin.from('settlement_reconciliation_logs').insert({
            booking_id: referenceId,
            organizer_id: providerId,
            customer_paid: Number(totalAmount) || 0,
            organizer_expected: Number(baseAmount) || 0,
            organizer_actual: Number(baseAmount) || 0,
            admin_expected: adminTotal,
            admin_actual: adminTotal,
            variance_amount: 0,
            verification_status: 'matched'
        });
        if (srlErr) {
            errors.push(`settlement_reconciliation_logs: ${srlErr.message}`);
            console.warn('[Payment] settlement_reconciliation_logs error:', srlErr.message);
        }

        // ── STEP 9: Organiser Transactions (earnings dashboard) ───────────────
        const { error: otErr } = await supabaseAdmin.from('organiser_transactions').insert({
            organiser_id: providerId,
            booking_id: referenceId,
            event_id: eventId || null,
            amount: Number(baseAmount) || 0,
            type: 'credit',
            description: description || `Booking earnings #${referenceId?.slice(-8)?.toUpperCase()}`,
            status: 'completed'
        });
        if (otErr) {
            errors.push(`organiser_transactions: ${otErr.message}`);
            console.warn('[Payment] organiser_transactions error:', otErr.message);
        }

        // ── STEP 10: Revenue Ledger (admin dashboard) ─────────────────────────
        const { error: rlErr } = await supabaseAdmin.from('revenue_ledger').insert({
            booking_id: referenceId,
            payment_id: paymentId || null,
            organizer_id: providerId,
            event_id: eventId || null,
            type: type || 'event',
            total_collected: Number(totalAmount) || 0,
            organizer_payout: Number(baseAmount) || 0,
            platform_fee: Number(platformFee) || 0,
            gst_amount: Number(gstAmount) || 0,
            net_platform_revenue: adminTotal,
            status: 'settled'
        });
        if (rlErr) {
            errors.push(`revenue_ledger: ${rlErr.message}`);
            console.warn('[Payment] revenue_ledger error:', rlErr.message);
        }

        // ── STEP 11: Platform Revenue ─────────────────────────────────────────
        if (paymentId) {
            const { error: prErr } = await supabaseAdmin.from('platform_revenue').insert({
                payment_id: paymentId,
                platform_fee: Number(platformFee) || 0,
                gst_amount: Number(gstAmount) || 0,
                total_revenue: adminTotal,
                partner_share: 0,
                net_platform_revenue: adminTotal
            });
            if (prErr) {
                errors.push(`platform_revenue: ${prErr.message}`);
                console.warn('[Payment] platform_revenue error:', prErr.message);
            }
        }

        if (errors.length > 0) {
            console.warn(`[Payment] Completed with ${errors.length} non-critical errors:`, errors);
        } else {
            console.log(`[Payment] ✅ All settlement steps completed successfully for booking ${referenceId}`);
        }

        return { success: true, errors };

    } catch (err) {
        console.error('[Payment] Critical Failure:', err.message);
        return { success: false, error: err.message, errors };
    }
}
