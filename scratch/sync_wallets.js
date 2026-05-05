const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncWallets() {
    console.log("Starting wallet synchronization...");

    // 1. Fetch all organisers with a balance
    const { data: organisers, error: orgError } = await supabase
        .from('organisers')
        .select('id, business_name, wallet_balance')
        .gt('wallet_balance', 0);

    if (orgError) {
        console.error("Error fetching organisers:", orgError.message);
        return;
    }

    console.log(`Found ${organisers.length} organisers with balances to sync.`);

    for (const org of organisers) {
        console.log(`Syncing ${org.business_name} (${org.id}) - Balance: ${org.wallet_balance}`);

        // 2. Upsert into wallets table
        const { error: walletError } = await supabase
            .from('wallets')
            .upsert({
                organiser_id: org.id,
                balance: org.wallet_balance,
                updated_at: new Date().toISOString()
            }, { onConflict: 'organiser_id' });

        if (walletError) {
            console.error(`  Failed to sync wallet for ${org.id}:`, walletError.message);
            continue;
        }

        // 3. Create a "Migration/Sync" transaction if no transactions exist
        const { data: txs } = await supabase
            .from('wallet_transactions')
            .select('id')
            .eq('organiser_id', org.id)
            .limit(1);

        if (txs && txs.length === 0) {
            await supabase.from('wallet_transactions').insert({
                organiser_id: org.id,
                amount: org.wallet_balance,
                type: 'credit',
                description: 'Initial balance synchronization from legacy system'
            });
            console.log(`  Created initial transaction record.`);
        }
    }

    console.log("Synchronization complete.");
}

syncWallets();
