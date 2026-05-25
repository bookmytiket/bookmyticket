import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

/**
 * Generates a PDF buffer for a ticket
 */
export async function generateTicketPDF(payload) {
    const doc = new jsPDF();
    
    const {
        customer_name = 'Guest',
        event_name = 'Event',
        booking_reference = '000000',
        event_date = 'TBD',
        event_time = 'TBD',
        venue_name = 'TBD',
        venue_address = 'TBD',
        seat_numbers = 'N/A',
        ticket_type = 'General Admission',
        ticket_count = 1,
        payment_amount = 0
    } = payload;

    // Brand Header
    doc.setFillColor(190, 24, 93); // Pink color
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('BookMyTicket', 20, 25);
    
    doc.setFontSize(12);
    doc.text('Official E-Ticket', 160, 25);

    // Event Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(22);
    doc.text(event_name, 20, 60);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Booking Reference: ${booking_reference}`, 20, 70);
    
    // Details Grid
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 80, 190, 80);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text('DATE & TIME', 20, 95);
    doc.setFontSize(12);
    doc.text(`${event_date}`, 20, 105);
    doc.text(`${event_time}`, 20, 112);

    doc.setFontSize(10);
    doc.text('VENUE', 100, 95);
    doc.setFontSize(12);
    doc.text(venue_name, 100, 105);
    
    // Line breaks for address manually if needed, simple for now
    doc.setFontSize(10);
    doc.text(venue_address.substring(0, 40), 100, 112);

    doc.line(20, 125, 190, 125);

    // Ticket Details
    doc.text('TICKET TYPE', 20, 140);
    doc.setFontSize(12);
    doc.text(`${ticket_count}x ${ticket_type}`, 20, 150);

    doc.setFontSize(10);
    doc.text('SEAT(S)', 100, 140);
    doc.setFontSize(12);
    doc.text(seat_numbers, 100, 150);

    doc.setFontSize(10);
    doc.text('GUEST', 160, 140);
    doc.setFontSize(12);
    doc.text(customer_name, 160, 150);

    doc.setDrawColor(200, 200, 200);
    doc.line(20, 165, 190, 165);

    // Amount
    doc.setFontSize(10);
    doc.text('TOTAL PAID', 20, 180);
    doc.setFontSize(14);
    doc.text(`Rs. ${payment_amount}`, 20, 190);

    // Generate QR Code
    try {
        const qrDataUrl = await QRCode.toDataURL(JSON.stringify({ booking_ref: booking_reference, type: 'validation' }), {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 80
        });
        doc.addImage(qrDataUrl, 'PNG', 120, 175, 50, 50);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Scan at entrance', 130, 230);
    } catch (e) {
        console.error('QR Generation failed', e);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('This ticket is strictly non-transferable. Valid ID may be required at the venue.', 20, 270);
    doc.text('For support, email support@bookmyticket.net', 20, 275);

    // Get as array buffer, then convert to Buffer
    const arrayBuffer = doc.output('arraybuffer');
    return Buffer.from(arrayBuffer);
}
