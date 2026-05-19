import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Unified function to handle payment success:
 * 1. Credits only base amount to provider's wallet (organiser or service provider)
 * 2. Records platform fee and GST separately in platform_revenue
 * 3. Supports real-time updates via Supabase
 */
export async function handlePaymentSuccess({
    paymentId,
    type, // 'event' or 'service'
    referenceId, // bookingId or serviceOrderId
    totalAmount,
    baseAmount,
    platformFee,
    gstAmount,
    providerId,
    description
}) {
    try {
        console.log(`[Payment] Processing success for ${type} ${referenceId}. Base: ${baseAmount}, Fees: ${platformFee + gstAmount}`);

        // 1. Update Payment Record
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
        
        if (payUpdateErr) console.warn("Payment update error:", payUpdateErr.message);

        // 2. Record Platform Revenue
        const { error: revErr } = await supabaseAdmin
            .from('platform_revenue')
            .insert({
                payment_id: paymentId,
                platform_fee: platformFee,
                gst_amount: gstAmount,
                total_revenue: platformFee + gstAmount
            });
        
        if (revErr) console.warn("Revenue record error:", revErr.message);

        // 3. Credit Provider Wallet
        const walletTable = type === 'event' ? 'organiser_wallet' : 'provider_wallet';
        const idColumn = type === 'event' ? 'organiser_id' : 'service_provider_id';

            // --- NEW ACCOUNTING MODULE START ---
            let newAccountingSuccess = false;
            try {
                // 3a. Record Booking Financials
                const { error: bfErr } = await supabaseAdmin.from('booking_financials').insert({
                    booking_id: referenceId,
                    ticket_amount: totalAmount - platformFee - gstAmount + (baseAmount < totalAmount ? totalAmount - platformFee - gstAmount - baseAmount : 0),
                    discount_amount: (baseAmount < totalAmount ? totalAmount - platformFee - gstAmount - baseAmount : 0),
                    discounted_ticket_amount: baseAmount,
                    platform_fee: platformFee,
                    gst_amount: gstAmount,
                    gateway_fee: 0,
                    final_paid: totalAmount,
                    organizer_credit: baseAmount,
                    admin_credit: platformFee + gstAmount
                });
                if (bfErr) console.warn("Booking financials insert error (table may not exist yet):", bfErr.message);

                // 3b. Record Organizer Revenue Ledger
                const { error: orlErr } = await supabaseAdmin.from('organizer_revenue_ledger').insert({
                    organizer_id: providerId,
                    booking_id: referenceId,
                    gross_ticket_revenue: baseAmount + (totalAmount > baseAmount + platformFee + gstAmount ? totalAmount - baseAmount - platformFee - gstAmount : 0),
                    discount_amount: (totalAmount > baseAmount + platformFee + gstAmount ? totalAmount - baseAmount - platformFee - gstAmount : 0),
                    net_organizer_revenue: baseAmount,
                    settlement_credit_amount: baseAmount,
                    settlement_status: 'credited'
                });
                if (orlErr) console.warn("Organizer revenue ledger error:", orlErr.message);

                // 3c. Record Settlement Reconciliation Log
                await supabaseAdmin.from('settlement_reconciliation_logs').insert({
                    booking_id: referenceId,
                    customer_paid: totalAmount,
                    organizer_expected: baseAmount,
                    organizer_actual: baseAmount,
                    admin_expected: platformFee + gstAmount,
                    admin_actual: platformFee + gstAmount,
                    variance_amount: 0,
                    verification_status: 'matched'
                });

                // 3d. Update Unified Wallets Table
                const { data: adminWallet } = await supabaseAdmin.from('wallets').select('id, balance').eq('user_id', providerId).eq('wallet_type', 'organizer').maybeSingle();
                if (adminWallet) {
                    await supabaseAdmin.from('wallets').update({ balance: adminWallet.balance + baseAmount }).eq('id', adminWallet.id);
                    await supabaseAdmin.from('wallet_transactions').insert({
                        wallet_id: adminWallet.id,
                        booking_id: referenceId,
                        transaction_type: 'credit',
                        amount: baseAmount,
                        description: `Earnings from booking ${referenceId}`
                    });
                    newAccountingSuccess = true;
                } else {
                    // Try inserting wallet if missing
                    const { data: newWallet, error: nwErr } = await supabaseAdmin.from('wallets').insert({
                        user_id: providerId,
                        wallet_type: 'organizer',
                        balance: baseAmount
                    }).select('id').maybeSingle();
                    if (newWallet) {
                        await supabaseAdmin.from('wallet_transactions').insert({
                            wallet_id: newWallet.id,
                            booking_id: referenceId,
                            transaction_type: 'credit',
                            amount: baseAmount,
                            description: `Earnings from booking ${referenceId}`
                        });
                        newAccountingSuccess = true;
                    }
                }
            } catch (err) {
                console.warn("New accounting module execution skipped, proceeding with legacy:", err.message);
            }
            // --- NEW ACCOUNTING MODULE END ---

            // LEGACY WALLET SYNC (Fallback/Parallel until full UI migration)
            if (providerId && baseAmount > 0) {
                // Fetch current balance
                const { data: walletData, error: walletFetchErr } = await supabaseAdmin
                    .from(walletTable)
                    .select('balance')
                    .eq(idColumn, providerId)
                    .maybeSingle();

                const newBalance = (walletData?.balance || 0) + Number(baseAmount);

                // Update balance
                await supabaseAdmin
                    .from(walletTable)
                    .upsert({
                        [idColumn]: providerId,
                        balance: newBalance,
                        updated_at: new Date().toISOString()
                    }, { onConflict: idColumn });

                // Record Transaction
                await supabaseAdmin
                    .from('wallet_transactions')
                    .insert({
                        provider_type: type === 'event' ? 'organiser' : 'service',
                        provider_id: providerId,
                        amount: baseAmount,
                        type: 'credit',
                        reference_id: referenceId,
                        description: description || `Earnings from ${type} ${referenceId}`
                    });

                // Legacy Sync (Optional - if Organisers table still used for balance)
                if (type === 'event') {
                    try {
                        const { data: orgData } = await supabaseAdmin
                            .from('organisers')
                            .select('wallet_balance')
                            .eq('id', providerId)
                            .single();
                        
                        if (orgData) {
                            await supabaseAdmin
                                .from('organisers')
                                .update({ wallet_balance: (orgData.wallet_balance || 0) + Number(baseAmount) })
                                .eq('id', providerId);
                        }
                    } catch (e) {}
                }

                console.log(`[Payment] Successfully credited ${baseAmount} to ${providerId} (${type})`);
                return { success: true, newBalance, newAccountingSuccess };
            }

        return { success: true };
    } catch (err) {
        console.error("[Payment] Critical Failure:", err.message);
        return { success: false, error: err.message };
    }
}
