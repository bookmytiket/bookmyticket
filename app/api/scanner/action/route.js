import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    try {
        const body = await request.json();
        const { 
            ticketId,
            bookingId,
            ticketCode,
            action, // 'approve' or 'reject'
            idType,
            idNumberMasked,
            rejectionReason,
            deviceUuid, 
            deviceName = "Staff Scanner", 
            gateName = "Main Gate", 
            scannerUserId 
        } = body;

        if (!ticketId || !action) {
            return NextResponse.json({ status: "error", message: "Missing required fields" }, { status: 400 });
        }

        // 1. Verify Ticket Current Status
        const { data: ticket, error: ticketErr } = await supabaseAdmin
            .from('tickets')
            .select('*')
            .eq('id', ticketId)
            .maybeSingle();

        if (ticketErr || !ticket) {
            return NextResponse.json({ status: "error", message: "Ticket not found" }, { status: 404 });
        }

        if (ticket.status === 'scanned' && action === 'approve') {
             return NextResponse.json({ status: "already_used", message: "Ticket already scanned!" }, { status: 400 });
        }

        // 2. Perform DB Updates based on Action
        let updatePayload = {
            scanned_by: scannerUserId,
            gate_name: gateName
        };

        let scanStatus = action === 'approve' ? 'Success' : 'Rejected';

        if (action === 'approve') {
            updatePayload.status = 'scanned';
            updatePayload.checkin_status = 'checked_in';
            updatePayload.scanned_at = new Date().toISOString();
            updatePayload.scan_count = (ticket.scan_count || 0) + 1;
        } else {
            updatePayload.checkin_status = 'rejected';
        }

        const { error: updateErr } = await supabaseAdmin
            .from('tickets')
            .update(updatePayload)
            .eq('id', ticketId);

        if (updateErr) throw updateErr;

        // 3. Log ID Verification
        if (idType) {
            await supabaseAdmin.from('id_verification_logs').insert({
                booking_id: bookingId,
                ticket_id: ticketId,
                staff_user_id: scannerUserId,
                id_type: idType,
                id_number_masked: idNumberMasked,
                verification_status: action === 'approve' ? 'Verified' : 'Rejected',
                remarks: rejectionReason || ''
            });
        }

        // 4. Log the Final Scan Result
        await supabaseAdmin.from('ticket_scan_logs').insert({
            ticket_id: ticketId,
            ticket_code: ticketCode || ticket.ticket_number,
            scanned_by: scannerUserId,
            scan_status: scanStatus,
            gate_name: gateName,
            device_info: { deviceUuid, deviceName },
            approval_status: action,
            rejection_reason: action === 'reject' ? rejectionReason : null,
            failure_reason: action === 'reject' ? rejectionReason : null
        });

        return NextResponse.json({
            status: action === 'approve' ? 'valid' : 'rejected',
            message: action === 'approve' ? "Entry Approved" : "Entry Rejected"
        });

    } catch (err) {
        console.error("[Scanner Action API] Unexpected error:", err);
        return NextResponse.json({
            status: "error",
            message: "An internal server error occurred."
        }, { status: 500 });
    }
}
