import { createClient } from '@supabase/supabase-js';
import { sendEmail } from './emailService.js';
import { welcomeEmailTemplate, bookingConfirmationTemplate, organizerNotificationTemplate } from './emailTemplates.js';
import QRCode from 'qrcode';

// Helper to log emails
const logEmail = async (supabase, logData) => {
    try {
        await supabase.from('email_logs').insert(logData);
    } catch (e) {
        console.error("Failed to log email to Supabase:", e.message);
    }
};

// Common Supabase Admin Client
const getAdminClient = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const sendWelcomeEmail = async (userId, userEmail, userName) => {
    const supabase = getAdminClient();
    const loginLink = "https://bookmyticket.net/auth"; // Change as needed
    const html = welcomeEmailTemplate(userName || "User", loginLink);
    const subject = "Welcome to BookMyTicket! 🎉";

    const result = await sendEmail({ to: userEmail, subject, html });

    await logEmail(supabase, {
        user_id: userId,
        email_type: 'WELCOME',
        recipient_email: userEmail,
        subject,
        delivery_status: result.success ? 'sent' : 'failed',
        error_message: result.error || null,
        provider: result.provider || 'SMTP',
        sent_at: result.success ? new Date().toISOString() : null
    });

    if (result.success) {
        await supabase.from('profiles').update({ welcome_email_sent: true }).eq('id', userId);
    }

    return result;
};

export const sendBookingConfirmationEmail = async (bookingId) => {
    const supabase = getAdminClient();
    
    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*, event:events(*), user:profiles!bookings_user_id_fkey(*)')
        .eq('id', bookingId)
        .single();

    if (bookingError || !booking) {
        console.error("Booking not found for email:", bookingId);
        return { success: false, error: "Booking not found" };
    }

    const { event, user } = booking;
    const recipientEmail = user?.email || booking.customer_details?.email || booking.customer_email || booking.email;
    const userName = user?.full_name || booking.customer_details?.name || booking.customer_name || "Participant";

    if (!recipientEmail) {
        return { success: false, error: "User email not found" };
    }

    // Generate QR Code URL Data URI
    let qrCodeUrl = null;
    try {
        qrCodeUrl = await QRCode.toDataURL(bookingId, { errorCorrectionLevel: 'H', margin: 1 });
    } catch (e) {
        console.error("Failed to generate QR Code:", e);
    }

    const html = bookingConfirmationTemplate({
        userName: userName,
        eventName: event.title,
        bookingId: booking.id,
        date: event.event_start_date || event.startDate || event.event_date || event.date || "TBA",
        time: event.event_start_time || event.startTime || event.event_time || event.time,
        venue: event.venue || event.location || 'TBA',
        ticketType: booking.payment_status === 'RSVP' || event.price === 0 ? 'RSVP' : 'Ticket',
        category: booking.ticket_category || booking.package_name || 'General',
        qty: booking.quantity || 1,
        seatNumber: booking.seat_numbers ? booking.seat_numbers.join(', ') : null,
        bibNumber: booking.bib_number || booking.customer_details?.bib_number || null,
        qrCodeUrl,
        amount: booking.total_amount,
        isFree: booking.payment_status === 'RSVP' || booking.total_amount === 0
    });

    const subject = `Booking Confirmed: ${event.title}`;

    // Here we could also generate PDF and attach using nodemailer attachments if implemented in emailService
    // For now, we rely on the HTML ticket with QR Code.

    const result = await sendEmail({ to: recipientEmail, subject, html });

    await logEmail(supabase, {
        user_id: user?.id || null,
        event_id: event.id,
        booking_id: booking.id,
        email_type: 'BOOKING_CONFIRMATION',
        recipient_email: recipientEmail,
        subject,
        delivery_status: result.success ? 'sent' : 'failed',
        error_message: result.error || null,
        provider: result.provider || 'SMTP',
        sent_at: result.success ? new Date().toISOString() : null
    });

    if (result.success) {
        await supabase.from('bookings').update({ confirmation_email_sent: true }).eq('id', bookingId);
        
        // Trigger organizer notification asynchronously
        if (event.organiser_id || event.organiserId) {
            sendOrganizerNotificationEmail(bookingId).catch(console.error);
        }
    }

    return result;
};

export const sendOrganizerNotificationEmail = async (bookingId) => {
    const supabase = getAdminClient();
    
    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*, event:events(*), user:profiles!bookings_user_id_fkey(*)')
        .eq('id', bookingId)
        .single();

    if (bookingError || !booking) return;

    const { event, user } = booking;
    const orgId = event.organiser_id || event.organiserId;
    
    if (!orgId) return;

    const { data: organizer } = await supabase.from('profiles').select('*').eq('id', orgId).single();
    
    if (!organizer || !organizer.email) return;

    const participantName = user?.full_name || booking.customer_details?.name || booking.customer_name || user?.email || booking.customer_details?.email || "Guest User";
    const bibNumber = booking.bib_number || booking.customer_details?.bib_number || null;

    const html = organizerNotificationTemplate({
        organizerName: organizer.full_name || organizer.company_name || "Organizer",
        eventName: event.title,
        bookingId: booking.id,
        participantName: participantName,
        category: booking.ticket_category || booking.package_name || 'General',
        qty: booking.quantity || 1,
        isFree: booking.payment_status === 'RSVP' || booking.total_amount === 0,
        amount: booking.total_amount,
        bibNumber: bibNumber
    });

    const subject = `New Booking: ${event.title}`;

    const result = await sendEmail({ to: organizer.email, subject, html });

    await logEmail(supabase, {
        user_id: orgId,
        event_id: event.id,
        booking_id: booking.id,
        email_type: 'ORGANIZER_NOTIFICATION',
        recipient_email: organizer.email,
        subject,
        delivery_status: result.success ? 'sent' : 'failed',
        error_message: result.error || null,
        provider: result.provider || 'SMTP',
        sent_at: result.success ? new Date().toISOString() : null
    });

    return result;
};
