import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const token = request.headers.get("Authorization")?.split("Bearer ")[1];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user || !['admin', 'super_admin', 'system_admin'].includes(user.user_metadata?.role)) {
            return NextResponse.json({ error: "Unauthorized Admin" }, { status: 403 });
        }

        // Fetch all verification statuses
        const { data: verifications, error: vError } = await supabaseAdmin
            .from('organizer_verification_status')
            .select('*')
            .order('submitted_at', { ascending: false });

        if (vError) throw vError;

        // Fetch associated profiles
        const { data: profiles, error: pError } = await supabaseAdmin
            .from('organizer_profiles')
            .select('*');
        if (pError) throw pError;

        // Fetch documents
        const { data: docs, error: dError } = await supabaseAdmin
            .from('organizer_kyc_documents')
            .select('*');
        if (dError) throw dError;

        // Fetch bank details
        const { data: banks, error: bError } = await supabaseAdmin
            .from('organizer_bank_details')
            .select('*');
        if (bError) throw bError;

        // Merge data
        const mergedData = verifications.map(v => {
            const profile = profiles.find(p => p.organizer_id === v.organizer_id) || {};
            const doc = docs.find(d => d.organizer_id === v.organizer_id) || {};
            const bank = banks.find(b => b.organizer_id === v.organizer_id) || {};
            
            return {
                ...v,
                profile,
                documents: doc,
                bank
            };
        });

        return NextResponse.json({ kycList: mergedData });
    } catch (err) {
        console.error("Fetch KYC list error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
