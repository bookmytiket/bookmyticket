import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findBooking() {
    const { data, error } = await supabase
        .from('bookings')
        .select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Total Bookings:', data.length);
    if (data.length > 0) {
        console.log('Latest Booking:', JSON.stringify(data[data.length - 1], null, 2));
        
        const targetId = '654024';
        const found = data.find(b => b.id.toUpperCase().endsWith(targetId));
        if (found) {
            console.log('Target Booking Found:', JSON.stringify(found, null, 2));
        } else {
            console.log(`Booking ending with ${targetId} not found.`);
        }
    }
}

findBooking();
