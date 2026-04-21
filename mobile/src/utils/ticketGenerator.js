import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const generateTicketPDF = async (booking, event) => {
  const bookingId = booking.id || booking._id || 'N/A';
  const shortId = bookingId.slice(-8).toUpperCase();
  const eventName = event.title || 'Event';
  const date = event.date || 'TBA';
  const time = event.time || '';
  const location = event.location || 'Venue';
  const price = booking.total_price || 0;
  const qty = booking.ticket_count || 1;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${bookingId}`;
  
  // Public logo URL for expo-print compatibility
  const logoUrl = 'https://www.bookmyticket.net/logo.png'; 

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            padding: 40px;
            color: #1f2937;
            background-color: #ffffff;
          }
          .ticket {
            border: 2px solid #e5e7eb;
            border-radius: 24px;
            overflow: hidden;
            max-width: 800px;
            margin: 0 auto;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
          }
          .header {
            background-color: #facc15;
            padding: 30px;
            text-align: center;
          }
          .header img {
            height: 70px;
          }
          .content {
            padding: 40px;
            display: flex;
            justify-content: space-between;
          }
          .details {
            flex: 1;
          }
          .qr-section {
            text-align: center;
            margin-left: 40px;
          }
          .event-title {
            font-size: 28px;
            font-weight: 900;
            margin: 0 0 20px 0;
            line-height: 1.2;
          }
          .meta-item {
            margin-bottom: 15px;
          }
          .label {
            font-size: 10px;
            font-weight: 700;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 4px;
          }
          .value {
            font-size: 16px;
            font-weight: 700;
          }
          .qr-code {
            width: 150px;
            height: 150px;
            border: 1px solid #f3f4f6;
            border-radius: 12px;
            padding: 10px;
          }
          .booking-id {
            margin-top: 10px;
            font-family: monospace;
            font-size: 14px;
            color: #6b7280;
          }
          .footer {
            background-color: #111827;
            padding: 20px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #ffffff;
          }
          .footer-text {
            font-size: 12px;
            color: rgba(255,255,255,0.6);
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .powered-by {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .powered-label {
            font-size: 10px;
            color: rgba(255,255,255,0.4);
            font-weight: 800;
            text-transform: uppercase;
          }
          .powered-logo {
            height: 24px;
            filter: brightness(0) invert(1);
          }
          .price-section {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px dashed #e5e7eb;
            display: flex;
            justify-content: space-between;
          }
          .price-label {
            font-size: 14px;
            font-weight: 700;
          }
          .price-value {
            font-size: 20px;
            font-weight: 900;
            color: #10b981;
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <img src="${logoUrl}" alt="Logo" />
          </div>
          <div class="content">
            <div class="details">
              <h1 class="event-title">${eventName}</h1>
              <div class="meta-item">
                <div class="label">Date & Time</div>
                <div class="value">${date} ${time}</div>
              </div>
              <div class="meta-item">
                <div class="label">Location</div>
                <div class="value">${location}</div>
              </div>
              <div class="meta-item">
                <div class="label">Tickets</div>
                <div class="value">${qty} Ticket${qty > 1 ? 's' : ''}</div>
              </div>
              
              <div class="price-section">
                <span class="price-label">Total Amount Paid</span>
                <span class="price-value">₹${Number(price).toFixed(2)}</span>
              </div>
            </div>
            <div class="qr-section">
              <div class="label">Scan for Entry</div>
              <img src="${qrUrl}" class="qr-code" />
              <div class="booking-id">ID: #${shortId}</div>
            </div>
          </div>
          <div class="footer">
            <div class="footer-text">Valid with Government ID</div>
            <div class="powered-by">
              <span class="powered-label">Powered By</span>
              <img src="${logoUrl}" class="powered-logo" />
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
