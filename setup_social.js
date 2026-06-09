const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const sql = `
    CREATE TABLE IF NOT EXISTS social_links (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        platform TEXT NOT NULL,
        title TEXT,
        url TEXT,
        icon_url TEXT,
        is_enabled BOOLEAN DEFAULT true,
        show_in_navbar BOOLEAN DEFAULT false,
        show_in_footer BOOLEAN DEFAULT true,
        show_on_event_page BOOLEAN DEFAULT true,
        show_on_booking_success BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Insert defaults
    INSERT INTO social_links (platform, title, url, is_enabled, show_in_navbar, show_in_footer, show_on_event_page, show_on_booking_success)
    SELECT 'whatsapp', 'WhatsApp Channel', 'https://whatsapp.com/channel/...', true, true, true, true, true
    WHERE NOT EXISTS (SELECT 1 FROM social_links WHERE platform = 'whatsapp');

    INSERT INTO social_links (platform, title, url, is_enabled, show_in_navbar, show_in_footer, show_on_event_page, show_on_booking_success)
    SELECT 'instagram', 'Instagram Community', 'https://instagram.com/...', true, true, true, true, true
    WHERE NOT EXISTS (SELECT 1 FROM social_links WHERE platform = 'instagram');
  `;
  const { data, error } = await supabaseAdmin.rpc('exec_sql', { query: sql });
  if (error) console.error("exec_sql Error:", error);
  else console.log("Success with exec_sql", data);
}
run();
