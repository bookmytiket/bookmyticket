import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Supabase configuration is missing on server' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { data: gateways, error } = await supabase
            .from('payment_gateways')
            .select('*');

        if (error) throw error;

        // Securely strip sensitive credential keys (secretKey, secret_key, webhook_secret) before returning to client
        const safeGateways = (gateways || []).map(g => {
            const config = { ...g.config };
            if (config) {
                delete config.secretKey;
                delete config.secret_key;
                delete config.webhook_secret;
                delete config.secret;
            }
            return {
                ...g,
                config
            };
        });

        return NextResponse.json(safeGateways);
    } catch (error) {
        console.error('Payment Gateways API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
