const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    const sql = `
        ALTER TABLE events ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
        ALTER TABLE events ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
        ALTER TABLE events ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
        ALTER TABLE events ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN DEFAULT true;
        ALTER TABLE events ADD COLUMN IF NOT EXISTS show_on_mobile BOOLEAN DEFAULT true;
        ALTER TABLE events ADD COLUMN IF NOT EXISTS show_in_search BOOLEAN DEFAULT true;
        ALTER TABLE events ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

        -- Migrate existing data
        UPDATE events 
        SET is_approved = true 
        WHERE approval_status = 'approved' OR status IN ('approved', 'published', 'active', 'expired');

        UPDATE events 
        SET is_published = true, published_at = NOW() 
        WHERE publish_status = 'published' OR status IN ('published', 'active', 'expired');

        UPDATE events
        SET show_on_homepage = true, show_on_mobile = true, show_in_search = true, is_public = true;
    `;

    console.log("Running migration...");
    const { data, error } = await supabaseAdmin.rpc('exec_raw_sql', { sql: sql });
    
    if (error) {
        console.error("RPC Error:", error);
        console.log("Trying fallback exec_sql...");
        const { error: e2 } = await supabaseAdmin.rpc('exec_sql', { query: sql });
        if (e2) console.error("Fallback Error:", e2);
        else console.log("Migration successful via fallback.");
    } else {
        console.log("Migration successful.");
    }
}

run();
