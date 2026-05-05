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

        if (providerId && baseAmount > 0) {
            // Fetch current balance
            const { data: walletData, error: walletFetchErr } = await supabaseAdmin
                .from(walletTable)
                .select('balance')
                .eq(idColumn, providerId)
                .maybeSingle();

            if (walletFetchErr) throw walletFetchErr;

            const newBalance = (walletData?.balance || 0) + Number(baseAmount);

            // Update balance
            const { error: walletUpdateErr } = await supabaseAdmin
                .from(walletTable)
                .upsert({
                    [idColumn]: providerId,
                    balance: newBalance,
                    updated_at: new Date().toISOString()
                }, { onConflict: idColumn });
            
            if (walletUpdateErr) throw walletUpdateErr;

            // 4. Record Wallet Transaction
            const { error: transErr } = await supabaseAdmin
                .from('wallet_transactions')
                .insert({
                    provider_type: type === 'event' ? 'organiser' : 'service',
                    provider_id: providerId,
                    amount: baseAmount,
                    type: 'credit',
                    reference_id: referenceId,
                    description: description || `Earnings from ${type} ${referenceId}`
                });
            
            if (transErr) console.warn("Transaction record error:", transErr.message);

            // 5. Legacy Sync (Optional - if Organisers table still used for balance)
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
            return { success: true, newBalance };
        }

        return { success: true };
    } catch (err) {
        console.error("[Payment] Critical Failure:", err.message);
        return { success: false, error: err.message };
    }
}
