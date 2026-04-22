const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role key for migrations

if (!supabaseKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    const sql = fs.readFileSync('supabase/migrations/20260422_create_memories_storage.sql', 'utf8');
    
    // Supabase JS client doesn't have a direct 'runSql' method for raw SQL
    // We usually use the RPC or a custom function if available, or just use the API to create buckets.
    // However, we can create the bucket using the storage API.
    
    console.log('Creating memories bucket via storage API...');
    const { data, error } = await supabase.storage.createBucket('memories', {
        public: true,
        fileSizeLimit: 5242880,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
    });

    if (error && error.message !== 'Bucket already exists') {
        console.error('Error creating bucket:', error);
    } else {
        console.log('Bucket created or already exists.');
    }
}

applyMigration();
