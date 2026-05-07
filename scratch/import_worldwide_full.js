const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function importWorldwideData() {
    console.log("🚀 Starting Worldwide Full Data Import (High Performance)...");

    try {
        const url = 'https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries+states+cities.json';
        console.log("📥 Fetching global dataset from GitHub...");
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const countries = await res.json();
        console.log(`✅ Loaded ${countries.length} countries.`);

        // Limit to top countries first to prevent massive hangs, then can be extended
        const TOP_COUNTRIES = ['India', 'United Arab Emirates', 'United States', 'Singapore', 'Malaysia', 'United Kingdom', 'Germany', 'Australia', 'Canada', 'Thailand'];
        const selectedCountries = countries.filter(c => TOP_COUNTRIES.includes(c.name));

        for (const cData of selectedCountries) {
            console.log(`🌍 Processing ${cData.name}...`);
            
            // 1. Country
            let { data: country, error: cErr } = await supabase.from('countries')
                .upsert({ name: cData.name, code: cData.iso2, flag: cData.emoji }, { onConflict: 'name' })
                .select().single();
            if (cErr) { console.error("Error upserting country:", cErr); continue; }

            // 2. States
            for (const sData of cData.states) {
                console.log(`   📍 State: ${sData.name}`);
                let { data: state, error: sErr } = await supabase.from('states')
                    .upsert({ country_id: country.id, name: sData.name }, { onConflict: 'country_id, name' })
                    .select().single();
                if (sErr) { console.error("Error upserting state:", sErr); continue; }

                // 3. Districts & Cities
                // Since dr5hn doesn't have a district level always, we'll create a "Default District" or use the city name as a district
                // For India, we could be more specific, but for international, a state-level district is fine.
                
                // Group cities into chunks of 100 for batch insertion
                const citiesToInsert = sData.cities || [];
                const chunks = [];
                for (let i = 0; i < citiesToInsert.length; i += 100) {
                    chunks.push(citiesToInsert.slice(i, i + 100));
                }

                for (const chunk of chunks) {
                    // We need a district_id. We'll create ONE district per state for international, 
                    // or just use the state name as the district name.
                    let districtName = sData.name + " District";
                    let { data: district } = await supabase.from('districts')
                        .upsert({ state_id: state.id, name: districtName }, { onConflict: 'state_id, name' })
                        .select().single();
                    
                    if (!district) continue;

                    const cityRows = chunk.map(city => ({
                        district_id: district.id,
                        name: city.name
                    }));

                    const { error: cityErr } = await supabase.from('cities')
                        .upsert(cityRows, { onConflict: 'district_id, name' });
                    
                    if (cityErr) console.error("   ❌ Error inserting city chunk:", cityErr.message);
                }
            }
        }

        console.log("🎉 Worldwide Data Import Complete!");

    } catch (err) {
        console.error("💥 Import failed:", err);
    }
}

importWorldwideData();
