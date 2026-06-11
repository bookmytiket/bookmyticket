export const welcomeEmailTemplate = (userName, loginLink) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-w: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333;">Welcome to BookMyTicket! 🎟️</h2>
        <p>Hi ${userName},</p>
        <p>We are thrilled to have you on board. Start exploring amazing events, marathons, sports, and concerts happening near you!</p>
        <a href="${loginLink}" style="display: inline-block; padding: 12px 25px; background: #ec4899; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px;">Explore Events</a>
        <p style="margin-top: 30px; font-size: 12px; color: #777;">If you have any questions, feel free to reply to this email or contact support.</p>
    </div>
</body>
</html>
`;

export const bookingConfirmationTemplate = ({
    userName, eventName, bookingId, date, time, venue, ticketType, category, qty, seatNumber, bibNumber, qrCodeUrl, amount, isFree
}) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-w: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #ec4899; text-align: center;">Booking Confirmed! 🎉</h2>
        <p>Hi ${userName},</p>
        <p>Your registration for <strong>${eventName}</strong> is confirmed!</p>
        
        <div style="background: #fdf2f8; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fbcfe8;">
            <p><strong>Booking ID:</strong> ${bookingId}</p>
            <p><strong>Date & Time:</strong> ${date} ${time ? 'at ' + time : ''}</p>
            <p><strong>Venue:</strong> ${venue}</p>
            <p><strong>Category:</strong> ${category} (${ticketType}) x ${qty}</p>
            ${seatNumber ? `<p><strong>Seat(s):</strong> ${seatNumber}</p>` : ''}
            ${bibNumber ? `<p><strong>BIB Number:</strong> <span style="font-size: 18px; font-weight: bold; color: #ec4899;">${bibNumber}</span></p>` : ''}
            ${!isFree ? `<p><strong>Amount Paid:</strong> ₹${amount}</p>` : ''}
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 12px; color: #666; margin-bottom: 10px;">Your Entry Pass QR Code:</p>
            ${qrCodeUrl ? `<img src="${qrCodeUrl}" alt="QR Code" style="width: 150px; height: 150px; border-radius: 10px; border: 1px solid #eee; padding: 5px;" />` : '<p><i>QR Code will be generated in your dashboard</i></p>'}
        </div>

        <p style="text-align: center; font-size: 14px;">You can also access your digital ticket from your BookMyTicket dashboard.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777; text-align: center;">
            <p>Looking forward to seeing you at the event!</p>
            <p>&copy; BookMyTicket Platform</p>
        </div>
    </div>
</body>
</html>
`;

export const organizerNotificationTemplate = ({
    organizerName, eventName, bookingId, participantName, category, qty, isFree, amount, bibNumber
}) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-w: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333;">New Booking Received! 📢</h2>
        <p>Hi ${organizerName},</p>
        <p>You have a new booking for your event <strong>${eventName}</strong>.</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <p><strong>Booking ID:</strong> ${bookingId}</p>
            <p><strong>Participant:</strong> ${participantName}</p>
            <p><strong>Category:</strong> ${category} x ${qty}</p>
            ${bibNumber ? `<p><strong>Assigned BIB:</strong> <span style="font-size: 16px; font-weight: bold; color: #ec4899;">${bibNumber}</span></p>` : ''}
            <p><strong>Status:</strong> ${isFree ? 'RSVP Confirmed' : `Paid (₹${amount})`}</p>
        </div>

        <p>Login to your organizer dashboard to view more details.</p>
    </div>
</body>
</html>
`;
