
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEventBySlug() {
    const slug = 'pollachi-trophy-2026-2a6133';
    console.log('Checking slug:', slug);
    
    const { data, error } = await supabase
        .from('events')
        .select('id, title, slug, type')
        .eq('slug', slug)
        .maybeSingle();
    
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    if (!data) {
        console.log('No event found with slug:', slug);
        // Try searching by title
        const { data: byTitle, error: titleError } = await supabase
            .from('events')
            .select('id, title, slug, type')
            .ilike('title', '%Pollachi%');
        
        if (byTitle && byTitle.length > 0) {
            console.log('Found ' + byTitle.length + ' events by title:');
            for (const e of byTitle) {
                console.log('ID: ' + e.id + ', Title: ' + e.title + ', Slug: ' + e.slug + ', Type: ' + e.type);
            }
        } else {
            console.log('No events found with title containing Pollachi');
        }
    } else {
        console.log('Found event:');
        console.log('ID:', data.id);
        console.log('Title:', data.title);
        console.log('Slug:', data.slug);
        console.log('Type:', data.type);
    }
}

checkEventBySlug();
