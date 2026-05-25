import nodemailer from 'nodemailer';
import { renderTemplate } from './templates';
import { generateTicketPDF } from './ticketGenerator';
import { createClient } from '@supabase/supabase-js';

// Cache the transporter and settings
let cachedTransporter = null;
let lastSettingsUpdate = 0;
let cachedFrom = '"BookMyTicket" <noreply@bookmyticket.net>';

async function getTransporter() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Refresh cache every 5 minutes
    if (cachedTransporter && (Date.now() - lastSettingsUpdate < 5 * 60 * 1000)) {
        return { transporter: cachedTransporter, from: cachedFrom };
    }

    try {
        const { data, error } = await supabase.from('email_settings').select('*').limit(1).single();
        
        let transportConfig;
        
        if (data) {
            cachedFrom = `"${data.from_name || 'BookMyTicket'}" <${data.from_email || data.user_name}>`;
            
            if (data.auth_method === 'OAuth2' && data.google_oauth2?.clientId) {
                transportConfig = {
                    service: 'gmail', // Fallback defaults for Gmail
                    host: data.host || 'smtp.gmail.com',
                    port: data.port || 465,
                    secure: true,
                    auth: {
                        type: 'OAuth2',
                        user: data.user_name,
                        clientId: data.google_oauth2.clientId,
                        clientSecret: data.google_oauth2.clientSecret,
                        refreshToken: data.google_oauth2.refreshToken
                    }
                };
            } else {
                transportConfig = {
                    host: data.host || 'smtp.ethereal.email',
                    port: parseInt(data.port || '587'),
                    secure: data.encryption === 'SSL' || data.port === 465,
                    auth: {
                        user: data.user_name,
                        pass: data.pass,
                    }
                };
            }
        } else {
            // Fallback to Env
            cachedFrom = process.env.SMTP_FROM || '"BookMyTicket" <noreply@bookmyticket.net>';
            transportConfig = {
                host: process.env.SMTP_HOST || 'smtp.ethereal.email',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                }
            };
        }

        cachedTransporter = nodemailer.createTransport(transportConfig);
        lastSettingsUpdate = Date.now();
        
        return { transporter: cachedTransporter, from: cachedFrom };
    } catch (err) {
        console.error("Failed to load DB email settings, falling back to ENV.", err);
        // Fallback to Env
        cachedFrom = process.env.SMTP_FROM || '"BookMyTicket" <noreply@bookmyticket.net>';
        cachedTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            }
        });
        lastSettingsUpdate = Date.now();
        return { transporter: cachedTransporter, from: cachedFrom };
    }
}

/**
 * Sends an email using the specified template and payload.
 */
export async function sendEmail({ to, subject, templateKey, payload, attachments = [] }) {
    try {
        const { html, text } = await renderTemplate(templateKey, payload);
        const { transporter, from } = await getTransporter();

        const mailOptions = {
            from: from,
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
            throw new Error(`PDF Generation failed: ${pdfError.message}`);
        }
    } else if (event_type === 'welcome' || event_type === 'welcome_registration') {
        templateKey = 'welcome_registration';
        subject = `Welcome to BookMyTicket, ${payload.username || payload.name || 'User'}!`;
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
