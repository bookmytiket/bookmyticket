// Apply About Event tables via Supabase REST API
require('dotenv').config({ path: '.env.local' });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runSQL(sql) {
    const res = await fetch(`${URL}/rest/v1/rpc/exec_raw_sql`, {
        method: 'POST',
        headers: {
            'apikey': KEY,
            'Authorization': `Bearer ${KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql })
    });
    const text = await res.text();
    return { status: res.status, body: text.substring(0, 200) };
}

async function main() {
    const sqls = [
        `CREATE TABLE IF NOT EXISTS event_descriptions (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            event_id uuid REFERENCES events(id) ON DELETE CASCADE,
            overview text, special_note text, highlights jsonb DEFAULT '[]',
            rules text, terms text, benefits jsonb DEFAULT '[]',
            important_info jsonb DEFAULT '[]', schedule jsonb DEFAULT '[]',
            venue_info text, contact_info jsonb DEFAULT '{}', version integer DEFAULT 1,
            created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
            UNIQUE(event_id)
        )`,
        `CREATE TABLE IF NOT EXISTS event_highlights (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            event_id uuid REFERENCES events(id) ON DELETE CASCADE,
            icon text NOT NULL DEFAULT '🎖', title text NOT NULL,
            display_order integer DEFAULT 0, created_at timestamptz DEFAULT now()
        )`,
        `CREATE TABLE IF NOT EXISTS event_faqs (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            event_id uuid REFERENCES events(id) ON DELETE CASCADE,
            question text NOT NULL, answer text NOT NULL,
            display_order integer DEFAULT 0, created_at timestamptz DEFAULT now()
        )`,
        `CREATE INDEX IF NOT EXISTS idx_event_descriptions_event_id ON event_descriptions(event_id)`,
        `CREATE INDEX IF NOT EXISTS idx_event_highlights_event_id ON event_highlights(event_id)`,
        `CREATE INDEX IF NOT EXISTS idx_event_faqs_event_id ON event_faqs(event_id)`,
    ];

    for (const sql of sqls) {
        const r = await runSQL(sql);
        console.log(`[${r.status}]`, r.body.substring(0, 80));
    }

    // Apply RLS via Supabase Management API
    console.log('\nAll SQL statements executed. Please apply RLS policies manually in Supabase dashboard if needed.');
    console.log('Tables created: event_descriptions, event_highlights, event_faqs');
}

main().catch(console.error);
