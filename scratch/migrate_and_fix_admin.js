const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
    console.log("Starting Data Migration...");

    // 1. Admin Fix
    const adminId = 'e8f6c70c-5407-4cdb-a05f-825b476f21ea';
    const { error: adminProfileErr } = await supabase.from('profiles').upsert({
        id: adminId,
        email: 'hello@bookmyticket.net',
        full_name: 'System Admin',
        username: 'admin_hello',
        role: 'admin',
        status: 'Active'
    });
    if (adminProfileErr) console.error("Admin Profile Error:", adminProfileErr);
    else console.log("Admin Profile Restored.");

    const { error: adminTableErr } = await supabase.from('admins').upsert({
        id: adminId,
        role: 'Super Admin'
    });
    if (adminTableErr) console.error("Admin Table Error:", adminTableErr);
    else console.log("Admin record created in admins table.");

    // 2. Migrate Organisers to Vendors
    const { data: orgs, error: fetchOrgsErr } = await supabase.from('organisers').select('*');
    if (fetchOrgsErr) {
        console.error("Fetch Organisers Error:", fetchOrgsErr);
    } else {
        console.log(`Migrating ${orgs.length} organisers to vendors...`);
        for (const org of orgs) {
            const { error: vendorErr } = await supabase.from('vendors').upsert({
                id: org.id,
                business_name: org.business_name,
                type: org.type,
                kyc_status: org.kyc_status,
                is_approved: org.is_approved,
                wallet_balance: org.wallet_balance,
                kyc_details: org.kyc_details,
                lat: org.lat,
                lng: org.lng,
                updated_at: new Date().toISOString()
            });
            if (vendorErr) console.error(`Error migrating ${org.business_name}:`, vendorErr);
        }
    }

    // 3. Sync Service Providers
    const providers = [
        { id: '4d00a1da-7db8-4371-8f9b-916dc4797a0f', business_name: 'Kalaiselvi P', category: 'Event Organiser' },
        { id: '7f918d1f-57e2-48f9-a95d-d2a63387fcf1', business_name: 'Madu S', category: 'Mehendi Artist' },
        { id: 'c271599b-1b65-463f-a6ca-d1f9b0985993', business_name: 'Sriharini Mehendi Art', category: 'Mehendi Artist' },
        { id: 'ded3908d-be5b-4470-9e04-bcdf157641bb', business_name: 'Jasmine Fathima', category: 'Henna Artist' }
    ];

    for (const p of providers) {
        const { error: spErr } = await supabase.from('service_providers').upsert({
            id: p.id,
            business_name: p.business_name,
            category: p.category,
            status: 'Active',
            updated_at: new Date().toISOString()
        });
        if (spErr) console.error(`Error syncing service provider ${p.business_name}:`, spErr);
        else console.log(`Service Provider Synced: ${p.business_name}`);
    }

    console.log("Migration Script Finished.");
}

runMigration();
