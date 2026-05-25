import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const token = request.headers.get("Authorization")?.split("Bearer ")[1];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        
        // 1. Insert/Update organizer_profiles
        const { error: profileError } = await supabaseAdmin
            .from('organizer_profiles')
            .upsert({
                id: user.id,
                user_id: user.id,
                full_name: body.full_name,
                phone: body.phone,
                dob: body.dob || null,
                business_name: body.business_name,
                business_type: body.business_type,
                company_registration_number: body.company_registration_number || null,
                gst_number: body.gst_number || null,
                pan_number: body.pan_number,
                website: body.website || null,
                business_address: body.business_address,
                city: body.city,
                state: body.state,
                pincode: body.pincode,
                country: body.country,
                updated_at: new Date().toISOString()
            });
        
        if (profileError) {
             // Let's create the tables via RPC trick if needed, but since we provided the migration, it will be handled.
             throw profileError;
        }

        // 2. Insert/Update organizer_bank_details
        await supabaseAdmin.from('organizer_bank_details').delete().eq('organizer_id', user.id);
        const { error: bankError } = await supabaseAdmin.from('organizer_bank_details').insert({
                organizer_id: user.id,
                account_holder_name: body.bank.account_holder_name,
                bank_name: body.bank.bank_name,
                account_number_encrypted: body.bank.account_number,
                ifsc_code: body.bank.ifsc_code,
                upi_id: body.bank.upi_id || null,
                cancelled_cheque_url: body.documents.bank
        });
        if (bankError) throw bankError;

        // 3. Insert organizer_kyc_documents
        await supabaseAdmin.from('organizer_kyc_documents').delete().eq('organizer_id', user.id);
        const docs = [];
        if (body.documents.identity) docs.push({ organizer_id: user.id, document_type: 'identity', document_name: 'Identity Proof', document_url: body.documents.identity });
        if (body.documents.business) docs.push({ organizer_id: user.id, document_type: 'business', document_name: 'Business Proof', document_url: body.documents.business });
        if (body.documents.address) docs.push({ organizer_id: user.id, document_type: 'address', document_name: 'Address Proof', document_url: body.documents.address });
        
        if (docs.length > 0) {
            const { error: docsError } = await supabaseAdmin.from('organizer_kyc_documents').insert(docs);
            if (docsError) throw docsError;
        }

        // 4. Update organizer_verification_status
        const { error: statusError } = await supabaseAdmin.from('organizer_verification_status').upsert({
            organizer_id: user.id,
            kyc_status: 'submitted',
            dashboard_access: false,
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }, { onConflict: 'organizer_id' });
        
        if (statusError) throw statusError;

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("KYC Submission error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
