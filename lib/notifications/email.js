import nodemailer from 'nodemailer';
import { renderTemplate } from './templates';
import { generateTicketPDF } from './ticketGenerator';
import { createClient } from '@supabase/supabase-js';

// Initialize SMTP transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Sends an email using the specified template and payload.
 */
export async function sendEmail({ to, subject, templateKey, payload, attachments = [] }) {
    try {
        const { html, text } = await renderTemplate(templateKey, payload);

        const mailOptions = {
            from: process.env.SMTP_FROM || '"BookMyTicket" <noreply@bookmyticket.net>',
            to,
            subject: subject || payload.subject || 'Notification from BookMyTicket',
            text,
            html,
            attachments
        };

        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId, response: info.response };
    } catch (error) {
        console.error(`[EmailService] Failed to send email to ${to}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Process a specific notification job
 */
export async function processNotificationJob(job) {
    const { id, user_id, channel, event_type, payload } = job;
    
    if (channel !== 'email') {
        return { success: false, error: 'Unsupported channel' };
    }

    let attachments = [];
    let templateKey = event_type;
    let subject = payload.subject || 'BookMyTicket Notification';

    // Handle specific event types
    if (event_type === 'booking_confirmation') {
        templateKey = 'booking_confirmation';
        subject = `🎟️ Booking Confirmed: ${payload.event_name}`;
        
        try {
            // Generate PDF Ticket Attachment
            const pdfBuffer = await generateTicketPDF(payload);
            attachments.push({
                filename: `Ticket-${payload.booking_reference}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            });
        } catch (pdfError) {
            console.error(`[EmailService] Failed to generate PDF for job ${id}:`, pdfError);
            // We can decide to send the email without the PDF or fail the job
            // For now, we will fail the job to ensure the user gets their PDF
            throw new Error(`PDF Generation failed: ${pdfError.message}`);
        }
    } else if (event_type === 'welcome') {
        subject = `Welcome to BookMyTicket, ${payload.username}!`;
    }

    // Send the email
    return await sendEmail({
        to: payload.to,
        subject,
        templateKey,
        payload,
        attachments
    });
}
