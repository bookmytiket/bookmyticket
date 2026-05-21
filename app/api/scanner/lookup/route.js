import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifySecureQRToken } from "@/lib/security";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const isValidUUID = (uuid) => {
    if (!uuid || typeof uuid !== 'string') return false;
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
};

export async function POST(request) {
    try {
        const body = await request.json();
        let { 
            qrPayload, 
            deviceUuid, 
            deviceName = "Staff Scanner", 
            gateName = "Main Gate", 
            scannerUserId 
        } = body;

        if (scannerUserId && !isValidUUID(scannerUserId)) {
            console.warn(`[Scanner API] Received invalid UUID for scannerUserId: "${scannerUserId}". Nullifying.`);
            scannerUserId = null;
        }

        if (!qrPayload) {
            return NextResponse.json({ 
                status: "invalid", 
                message: "No QR code scanned" 
            }, { status: 400 });
        }

        // 1. Device Authorization Check (Fraud Protection)
        let deviceAuthorized = true;
        if (deviceUuid) {
            // Upsert device list and check active authorization status
            const { data: device, error: devError } = await supabaseAdmin
                .from('scanner_devices')
                .select('*')
                .eq('device_uuid', deviceUuid)
                .maybeSingle();

            if (devError) {
                console.error("[Scanner API] Device fetch error:", devError.message);
            }

            if (!device) {
                // Register newly seen device automatically as authorized by default
                await supabaseAdmin
                    .from('scanner_devices')
                    .insert({
                        device_uuid: deviceUuid,
                        device_name: deviceName,
                        status: 'authorized',
                        last_active: new Date().toISOString()
                    });
            } else {
                // Update device last active timestamp
                await supabaseAdmin
                    .from('scanner_devices')
                    .update({ last_active: new Date().toISOString() })
                    .eq('id', device.id);

                if (device.status === 'revoked') {
                    deviceAuthorized = false;
                }
            }
        }

        if (!deviceAuthorized) {
            // Log access violation in scan logs
            await supabaseAdmin.from('ticket_scan_logs').insert({
                ticket_code: qrPayload.slice(0, 50),
                scan_status: 'Blocked',
                gate_name: gateName,
                failure_reason: 'Revoked/Unauthorized Scanner Device attempted validation.',
                device_info: { deviceUuid, deviceName }
            });

            return NextResponse.json({
                status: "blocked",
                title: "UNAUTHORIZED SCANNER",
                message: "This device's scanning privileges have been revoked.",
                color: "red"
            });
        }

        // 2. Decode secure QR token with legacy fallback support
        let decoded = verifySecureQRToken(qrPayload);
        let ticketId = decoded?.t_id;
        let ticketNumber = decoded?.code;
        let eventId = decoded?.e_id;
        let bookingId = decoded?.b_id;

        let isLegacy = false;

        if (!decoded) {
            // Fallback for visual short code (e.g. "482D9AA8") or manual entry
            const cleanCode = String(qrPayload).trim().toUpperCase();
            
            let { data: legacyTicket, error: legacyErr } = await supabaseAdmin
                .from('tickets')
                .select('*, bookings(id, event_id, customer_details, events(title))')
                .eq('ticket_number', cleanCode)
                .maybeSingle();

            if (!legacyTicket) {
                // Fallback for visual ticket using booking ID suffix
                console.log(`[Scanner API] No ticket found matching ticket_number: "${cleanCode}". Searching 100 most recent tickets by booking ID suffix...`);
                const { data: recentTickets } = await supabaseAdmin
                    .from('tickets')
                    .select('*, bookings(id, event_id, customer_details, events(title))')
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (recentTickets) {
                    const matched = recentTickets.find(t => 
                        t.bookings?.id?.toLowerCase().endsWith(cleanCode.toLowerCase())
                    );
                    if (matched) {
                        console.log(`[Scanner API] In-memory suffix match found: "${matched.id}" for booking "${matched.bookings?.id}"`);
                        legacyTicket = matched;
                    }
                }
            }

            if (legacyTicket) {
                ticketId = legacyTicket.id;
                ticketNumber = legacyTicket.ticket_number;
                eventId = legacyTicket.bookings?.event_id;
                bookingId = legacyTicket.bookings?.id;
                isLegacy = true;
                decoded = { t_id: ticketId, code: ticketNumber, e_id: eventId, b_id: bookingId };
            }
        }

        // 3. If ticket not found, log & return INVALID
        if (!decoded || !ticketId) {
            await supabaseAdmin.from('ticket_scan_logs').insert({
                ticket_code: qrPayload.slice(0, 50),
                scan_status: 'Invalid',
                gate_name: gateName,
                failure_reason: 'Invalid QR format or ticket number does not exist.',
                device_info: { deviceUuid, deviceName }
            });

            return NextResponse.json({
                status: "invalid",
                title: "INVALID QR CODE",
                message: "No ticket matches the scanned QR code.",
                color: "red"
            });
        }

        // 4. Fetch the real, current Ticket status from DB
        const { data: ticket, error: ticketErr } = await supabaseAdmin
            .from('tickets')
            .select('*, bookings(*, events(*))')
            .eq('id', ticketId)
            .maybeSingle();

        if (ticketErr || !ticket) {
            return NextResponse.json({
                status: "invalid",
                title: "TICKET NOT FOUND",
                message: "The ticket associated with this QR no longer exists in our registry.",
                color: "red"
            });
        }

        const customerName = ticket.bookings?.customer_details?.name || "Attendee";
        const eventTitle = ticket.bookings?.events?.title || "Event";

        // Fetch Event Verification Settings
        const { data: verificationSettings } = await supabaseAdmin
            .from('event_verification_settings')
            .select('*')
            .eq('event_id', ticket.bookings?.event_id)
            .maybeSingle();

        // 5. Access Control Check: Make sure staff is authorized to scan for this specific event
        if (scannerUserId && eventId) {
            const { data: access } = await supabaseAdmin
                .from('event_access_control')
                .select('*')
                .eq('event_id', eventId)
                .eq('user_id', scannerUserId)
                .maybeSingle();

            // Note: If no custom gate rules are set up, we default allow event staff/admin or active organiser accounts.
            // But if there is a gate rule, we verify against it.
            if (access && access.role === 'blocked') {
                return NextResponse.json({
                    status: "blocked",
                    title: "ACCESS DENIED",
                    message: "You are not permitted to scan tickets for this gate.",
                    color: "red"
                });
            }
        }

        // 6. Check if ticket booking is cancelled
        if (ticket.bookings?.status === 'Cancelled' || ticket.bookings?.status === 'Refunded') {
            await supabaseAdmin.from('ticket_scan_logs').insert({
                ticket_id: ticketId,
                ticket_code: ticketNumber,
                scanned_by: scannerUserId,
                scan_status: 'Cancelled',
                gate_name: gateName,
                failure_reason: 'Ticket booking is Cancelled/Refunded.',
                device_info: { deviceUuid, deviceName }
            });

            return NextResponse.json({
                status: "invalid",
                title: "CANCELLED BOOKING",
                message: "This booking has been cancelled and refunded.",
                color: "red"
            });
        }

        // 7. Check for Double Scan (Fraud / Replay Protection)
        if (ticket.status === 'scanned') {
            await supabaseAdmin.from('ticket_scan_logs').insert({
                ticket_id: ticketId,
                ticket_code: ticketNumber,
                scanned_by: scannerUserId,
                scan_status: 'Duplicate',
                gate_name: gateName,
                failure_reason: `Ticket already scanned at ${ticket.scanned_at || 'earlier date'}.`,
                device_info: { deviceUuid, deviceName }
            });

            const scanTime = ticket.scanned_at 
                ? new Date(ticket.scanned_at).toLocaleTimeString() 
                : 'earlier';

            return NextResponse.json({
                status: "already_used",
                title: "DUPLICATE TICKET",
                message: `BLOCKED • Scanned at ${scanTime} (Gate: ${ticket.gate_name || 'Main Gate'})`,
                color: "yellow",
                attendee: customerName,
                event: eventTitle,
                scanned_at: ticket.scanned_at
            });
        }

        // 8. Success: Return requires_action state with full ticket details
        return NextResponse.json({
            status: "requires_action",
            title: "VERIFICATION REQUIRED",
            message: "Please verify ID and approve entry.",
            color: "blue",
            ticket_id: ticketId,
            booking_id: bookingId,
            attendee: customerName,
            ticket_code: ticketNumber,
            event: eventTitle,
            category: ticket.bookings?.ticket_category || "General Admission",
            verificationSettings: verificationSettings || {
                require_id_verification: false,
                accepted_id_types: ["Aadhaar", "PAN", "Passport", "Driving License", "Voter ID"]
            }
        });

    } catch (err) {
        console.error("[Scanner API] Unexpected validation error:", err);
        return NextResponse.json({
            status: "error",
            title: "SYSTEM ERROR",
            message: "An internal server error occurred during validation.",
            color: "red"
        }, { status: 500 });
    }
}
