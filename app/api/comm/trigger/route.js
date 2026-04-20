import { sendSMS, sendWhatsApp } from "@/lib/commService";

export async function POST(req) {
    try {
        const { phoneNumber, type, data } = await req.json();

        let message = "";
        let isWhatsAppEligible = false;

        if (type === "BOOKING") {
            message = `Booking Confirmed! Event: ${data.eventName}. Date: ${data.date}. Booking ID: ${data.bookingId}. Thanks for choosing BookMyTicket!`;
            isWhatsAppEligible = true;
        } else if (type === "CANCELLATION") {
            message = `Your booking for ${data.eventName} (${data.bookingId}) has been cancelled successfully.`;
        } else if (type === "OTP") {
            message = `Your OTP for BookMyTicket is: ${data.otp}. Valid for 5 minutes.`;
        } else if (type === "SIGNUP") {
            message = `Welcome to BookMyTicket! 🎉\n\nYour account has been successfully created.\n\nStart exploring events and book your tickets now:\nhttps://bookmyticket.net`;
            isWhatsAppEligible = true;
        } else {
            message = data.message;
        }

        // Send SMS
        const smsResult = await sendSMS({ phoneNumber, message, type });

        // Send WhatsApp (if configured and eligible)
        let whatsappResult = { success: false, skipped: true };
        if (isWhatsAppEligible) {
            whatsappResult = await sendWhatsApp({ phoneNumber, message });
        }

        return new Response(JSON.stringify({ 
            success: true, 
            sms: smsResult, 
            whatsapp: whatsappResult 
        }), { status: 200 });
    } catch (error) {
        console.error("Trigger API Error:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
    }
}
