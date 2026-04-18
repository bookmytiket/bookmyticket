import { sendSMS } from "@/lib/commService";

export async function POST(req) {
    try {
        const { phoneNumber, type, data } = await req.json();

        let message = "";
        if (type === "BOOKING") {
            message = `Booking Confirmed! Event: ${data.eventName}. Date: ${data.date}. Booking ID: ${data.bookingId}. Thanks for choosing BookMyTicket!`;
        } else if (type === "CANCELLATION") {
            message = `Your booking for ${data.eventName} (${data.bookingId}) has been cancelled successfully.`;
        } else if (type === "OTP") {
            message = `Your OTP for BookMyTicket is: ${data.otp}. Valid for 5 minutes.`;
        } else if (type === "SIGNUP") {
            message = `Welcome to BookMyTicket! Your account has been created successfully.`;
        } else {
            message = data.message;
        }

        const result = await sendSMS({ phoneNumber, message, type });
        return new Response(JSON.stringify(result), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
    }
}
