import { sendSMS, sendWhatsApp } from "@/lib/commService";
import { sendTemplatedEmail } from "@/lib/emailService";

export async function POST(req) {
    try {
        const { phoneNumber, email, type, data } = await req.json();

        let message = "";
        let isWhatsAppEligible = false;
        let emailTemplate = null;

        if (type === "BOOKING") {
            message = `Booking Confirmed! Event: ${data.eventName}. Date: ${data.date}. Booking ID: ${data.bookingId}. Thanks for choosing BookMyTicket!`;
            isWhatsAppEligible = true;
            emailTemplate = "booking";
        } else if (type === "CANCELLATION") {
            message = `Your booking for ${data.eventName} (${data.bookingId}) has been cancelled successfully.`;
            emailTemplate = "canceled";
        } else if (type === "OTP") {
            message = `Your OTP for BookMyTicket is: ${data.otp}. Valid for 5 minutes.`;
            emailTemplate = "otp";
        } else if (type === "SIGNUP") {
            message = `Welcome to BookMyTicket! 🎉\n\nYour account has been successfully created.\n\nStart exploring events and book your tickets now:\nhttps://bookmyticket.net`;
            isWhatsAppEligible = true;
            emailTemplate = "welcome_registration";
        } else {
            message = data.message;
        }

        // Send SMS
        let smsResult = { success: false, skipped: true };
        if (phoneNumber) {
            smsResult = await sendSMS({ phoneNumber, message, type });
        }

        // Send WhatsApp (if configured and eligible)
        let whatsappResult = { success: false, skipped: true };
        if (isWhatsAppEligible && phoneNumber) {
            whatsappResult = await sendWhatsApp({ phoneNumber, message });
        }

        // Send Email (if configured)
        let emailResult = { success: false, skipped: true };
        if (email && emailTemplate) {
            emailResult = await sendTemplatedEmail({
                templateIdentifier: emailTemplate,
                to: email,
                variables: {
                    name: data.name || "User",
                    ...data
                }
            });
        }

        return new Response(JSON.stringify({ 
            success: true, 
            sms: smsResult, 
            whatsapp: whatsappResult,
            email: emailResult
        }), { status: 200 });
    } catch (error) {
        console.error("Trigger API Error:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
    }
}
