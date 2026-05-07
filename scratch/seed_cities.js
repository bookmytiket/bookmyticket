const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use SERVICE ROLE KEY to bypass RLS
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedCities() {
    const data = [
        { city: 'Coimbatore', state: 'Tamil Nadu', country: 'India', district: 'Coimbatore' },
        { city: 'Pollachi', state: 'Tamil Nadu', country: 'India', district: 'Coimbatore' },
        { city: 'Chennai', state: 'Tamil Nadu', country: 'India', district: 'Chennai' },
        { city: 'Bengaluru', state: 'Karnataka', country: 'India', district: 'Bangalore' },
        { city: 'Mumbai', state: 'Maharashtra', country: 'India', district: 'Mumbai' },
        { city: 'New Delhi', state: 'Delhi', country: 'India', district: 'New Delhi' },
        { city: 'Abohar', state: 'Punjab', country: 'India', district: 'Fazilka' },
        { city: 'Hyderabad', state: 'Telangana', country: 'India', district: 'Hyderabad' },
        { city: 'Kochi', state: 'Kerala', country: 'India', district: 'Ernakulam' },
        { city: 'Kolkata', state: 'West Bengal', country: 'India', district: 'Kolkata' },
    ];

    console.log("Seeding cities with Service Role...");
    for (const item of data) {
        console.log(`Processing ${item.city}...`);
        
        // 1. Get/Create Country
        let { data: country } = await supabase.from('countries').select('id').eq('name', item.country).maybeSingle();
        if (!country) {
            const { data: newCountry, error: cErr } = await supabase.from('countries').insert({ name: item.country, code: item.country.substring(0, 2).toUpperCase() }).select().single();
            if (cErr) { console.error("Country Insert Error:", cErr); continue; }
            country = newCountry;
        }

        // 2. Get/Create State
        let { data: state } = await supabase.from('states').select('id').eq('name', item.state).eq('country_id', country.id).maybeSingle();
        if (!state) {
            const { data: newState, error: sErr } = await supabase.from('states').insert({ name: item.state, country_id: country.id }).select().single();
            if (sErr) { console.error("State Insert Error:", sErr); continue; }
            state = newState;
        }

        // 3. Get/Create District
        let { data: district } = await supabase.from('districts').select('id').eq('name', item.district).eq('state_id', state.id).maybeSingle();
        if (!district) {
            const { data: newDistrict, error: dErr } = await supabase.from('districts').insert({ name: item.district, state_id: state.id }).select().single();
            if (dErr) { console.error("District Insert Error:", dErr); continue; }
            district = newDistrict;
        }

        // 4. Upsert City
        const { error: cityErr } = await supabase.from('cities').upsert({ 
            name: item.city, 
            district_id: district.id 
        }, { onConflict: 'district_id, name' });
        
        if (cityErr) console.error("City Upsert Error:", cityErr);
    }
    console.log("Seeding complete.");
}

seedCities();
