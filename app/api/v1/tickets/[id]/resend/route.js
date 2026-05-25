import { NextResponse } from 'next/server';
import { getBearerUser, jsonError, jsonOk, readProfileRole } from "@/lib/shared/supabaseServer";

export async function POST(request, { params }) {
    const { supabase, user, error } = await getBearerUser(request);
    if (error) return error;

    try {
        const bookingId = params.id;
        if (!bookingId) {
            return jsonError("Booking ID is required", 400);
        }

        // Fetch booking to verify ownership and get details
        const { data: booking, error: bookingError } = await supabase
            .from("bookings")
            .select("*, events(title, date, start_date, time, start_time, venue, address), tickets(*), booking_items(*)")
            .eq("id", bookingId)
            .single();

        if (bookingError || !booking) {
            return jsonError("Booking not found", 404);
        }

        const role = await readProfileRole(supabase, user.id);
        
        // Only owner or admin can resend
        if (booking.user_id !== user.id && role !== 'admin') {
            return jsonError("Unauthorized to resend this ticket", 403);
        }

        if (booking.payment_status !== 'paid' && booking.status !== 'Confirmed') {
            return jsonError("Cannot send ticket for unconfirmed or unpaid booking", 400);
        }

        // Get seats and tickets
        let seatNumbers = "N/A";
        if (booking.selected_seats && Array.isArray(booking.selected_seats)) {
            seatNumbers = booking.selected_seats.map(s => s.id || s.seat_number).join(', ');
        } else if (booking.booking_items && booking.booking_items.length > 0) {
            seatNumbers = booking.booking_items.map(bi => bi.seat_id).filter(Boolean).join(', ');
        }

        const customerName = booking.customer_details?.name || user.user_metadata?.full_name || 'Guest';
        const eventName = booking.events?.title || 'Event';
        
        // Re-queue the email
        const { error: queueError } = await supabase.from("notification_queue").insert({
            user_id: booking.user_id,
            channel: "email",
            event_type: "booking_confirmation",
            payload: {
                to: user.email, // Send to the person requesting it
                user_id: user.id,
                customer_name: customerName,
                event_name: eventName,
                booking_reference: booking.booking_ref,
                ticket_count: booking.ticket_count,
                event_date: booking.events?.date || booking.events?.start_date || "TBD",
                event_time: booking.events?.time || booking.events?.start_time || "TBD",
                venue_name: booking.events?.venue || "TBD",
                venue_address: booking.events?.address || "TBD",
                seat_numbers: seatNumbers || "N/A",
                ticket_type: booking.customer_details?.category_name || "General Admission",
                payment_amount: booking.total_price,
                invoice_number: `INV-${booking.booking_ref}`,
                ticket_download_url: `${process.env.NEXT_PUBLIC_BASE_URL}/tickets/${booking.id}`,
                qr_ticket_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/tickets/${booking.id}/qr`,
                support_email: "support@bookmyticket.net"
            }
        });

        if (queueError) {
            throw queueError;
        }

        return jsonOk({ success: true, message: "Ticket email has been queued for sending." });
    } catch (err) {
        console.error("[api/v1/tickets/resend] failed:", err);
        return jsonError(err.message || "Failed to resend ticket");
    }
}
