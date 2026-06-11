import fs from 'fs';

// Mock the template function since we can't easily import from lib without babel/next setup
function getBookingConfirmationTemplate(params) {
    const {
        userName, eventName, bookingId, date, time, venue, 
        ticketType, category, qty, seatNumber, bibNumber, 
        qrCodeUrl, amount, isFree
    } = params;
    
    return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #1a1a1a; margin: 0; font-size: 24px;">Booking Confirmed!</h1>
                <p style="color: #ec4899; font-weight: bold; margin-top: 5px;">${eventName}</p>
            </div>
            
            <p style="color: #4a4a4a; font-size: 16px;">Hi ${userName},</p>
            <p style="color: #4a4a4a; font-size: 16px;">Your registration is successful. Here are your details:</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${bookingId}</p>
                <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${date} at ${time}</p>
                <p style="margin: 5px 0;"><strong>Venue:</strong> ${venue}</p>
                <p style="margin: 5px 0;"><strong>Category:</strong> ${category}</p>
                ${bibNumber ? `<p style="margin: 5px 0;"><strong>BIB Number:</strong> <span style="font-size: 18px; font-weight: bold; color: #ec4899;">${bibNumber}</span></p>` : ''}
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <p style="color: #6b7280; font-size: 14px;">Present your digital ticket at the venue.</p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Powered by BookMyTicket</p>
            </div>
        </div>
    </div>
    `;
}

const html = getBookingConfirmationTemplate({
    userName: "Raja Vasudevan",
    eventName: "Chennai Marathon 2026",
    bookingId: "d9808763",
    date: "Dec 15, 2026",
    time: "05:00 AM",
    venue: "Marina Beach, Chennai",
    ticketType: "Runner",
    category: "10 KM Run",
    qty: 1,
    bibNumber: "TEST-0001",
    qrCodeUrl: "dummy",
    amount: "₹500",
    isFree: false
});

fs.writeFileSync('public/test-email.html', html);
console.log('Saved test email to public/test-email.html');
