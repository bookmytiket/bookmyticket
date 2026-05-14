
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSlugRaw() {
    const slug = 'pollachi-trophy-2026-2a6133';
    
    const { data, error } = await supabase
        .from('events')
        .select('id, title, slug')
        .ilike('slug', `%${slug}%`);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Results found:', data.length);
    data.forEach(item => {
        console.log(`- ID: ${item.id}, Slug: [${item.slug}], Length: ${item.slug.length}`);
        if (item.slug === slug) {
            console.log('  EXACT MATCH FOUND');
        } else {
            console.log('  NOT AN EXACT MATCH');
        }
    });
}

checkSlugRaw();
