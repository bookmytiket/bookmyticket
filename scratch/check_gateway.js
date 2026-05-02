import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGateway() {
    const { data, error } = await supabase
        .from('payment_gateways')
        .select('*')
        .eq('name', 'Razorpay')
        .maybeSingle();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Razorpay Gateway:', JSON.stringify(data, null, 2));
}

checkGateway();
