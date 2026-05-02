import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findBooking() {
    const { data, error } = await supabase
        .from('bookings')
        .select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    const booking = data.find(b => b.id.toUpperCase().endsWith('654024'));
    if (booking) {
        console.log('Found Booking:', JSON.stringify(booking, null, 2));
    } else {
        console.log('Booking not found. Latest 5 bookings:');
        console.log(JSON.stringify(data.slice(-5), null, 2));
    }
}

findBooking();
