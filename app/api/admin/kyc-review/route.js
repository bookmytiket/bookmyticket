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
        if (userError || !user || !['admin', 'super_admin'].includes(user.user_metadata?.role)) {
            return NextResponse.json({ error: "Unauthorized Admin" }, { status: 403 });
        }

        const { organizer_id, action, notes, reason } = await request.json();
        
        let kycStatus = 'under_review';
        let dashboardAccess = false;

        if (action === 'approve') {
            kycStatus = 'approved';
            dashboardAccess = true;
        } else if (action === 'reject') {
            kycStatus = 'rejected';
        } else if (action === 'reupload') {
            kycStatus = 'reupload_required';
        } else if (action === 'suspend') {
            kycStatus = 'suspended';
        }

        // 1. Update verification status
        const { error: statusError } = await supabaseAdmin.from('organizer_verification_status').update({
            kyc_status: kycStatus,
            dashboard_access: dashboardAccess,
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id,
            rejection_reason: reason || null,
            updated_at: new Date().toISOString()
        }).eq('organizer_id', organizer_id);

        if (statusError) throw statusError;

        // 2. Log audit
        await supabaseAdmin.from('admin_kyc_audit_logs').insert({
            organizer_id,
            admin_user_id: user.id,
            action,
            notes: notes || reason
        });

        // 3. Update organisers legacy table for backwards compatibility
        await supabaseAdmin.from('organisers').update({
            kyc_status: kycStatus === 'approved' ? 'Active' : 'Pending',
            status: kycStatus === 'approved' ? 'Active' : 'Pending'
        }).eq('id', organizer_id);
        
        // 4. Clean up partner_requests queue
        if (kycStatus === 'approved') {
            const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(organizer_id);
            if (targetUser?.user?.email) {
                await supabaseAdmin.from('partner_requests').update({
                    status: 'Active'
                }).eq('email', targetUser.user.email);
            }
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Admin KYC action error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
