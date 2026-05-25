import { createClient } from '@supabase/supabase-js';

// Fallback templates in case the database doesn't have them
const FALLBACK_TEMPLATES = {
    booking_confirmation: {
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #fce7f3; padding: 20px; text-align: center;">
                <h1 style="color: #be185d; margin: 0;">Ticket Confirmation</h1>
            </div>
            <div style="padding: 20px;">
                <p>Hi {{customer_name}},</p>
                <p>Your booking for <strong>{{event_name}}</strong> is confirmed!</p>
                
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Booking ID:</strong> {{booking_reference}}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> {{event_date}} at {{event_time}}</p>
                    <p style="margin: 5px 0;"><strong>Venue:</strong> {{venue_name}}</p>
                    <p style="margin: 5px 0;"><strong>Tickets:</strong> {{ticket_count}}x {{ticket_type}}</p>
                    <p style="margin: 5px 0;"><strong>Seats:</strong> {{seat_numbers}}</p>
                    <p style="margin: 5px 0;"><strong>Total Paid:</strong> ₹{{payment_amount}}</p>
                </div>

                <p>Your e-ticket is attached as a PDF to this email. Please present the QR code at the venue for entry.</p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="{{ticket_download_url}}" style="background-color: #be185d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Booking Online</a>
                </div>
            </div>
            <div style="background-color: #111827; color: #9ca3af; padding: 15px; text-align: center; font-size: 12px;">
                <p>If you have any questions, contact us at <a href="mailto:{{support_email}}" style="color: #fce7f3;">{{support_email}}</a></p>
                <p>&copy; 2026 BookMyTicket. All rights reserved.</p>
            </div>
        </div>
        `,
        text: `Hi {{customer_name}},\n\nYour booking for {{event_name}} is confirmed!\n\nBooking ID: {{booking_reference}}\nDate: {{event_date}} at {{event_time}}\nVenue: {{venue_name}}\nTickets: {{ticket_count}}x {{ticket_type}}\nSeats: {{seat_numbers}}\nTotal Paid: ₹{{payment_amount}}\n\nYour e-ticket is attached to this email.\n\nView booking online: {{ticket_download_url}}`
    },
    welcome: {
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to BookMyTicket, {{username}}!</h2>
            <p>We're excited to have you on board. Discover the best events, concerts, and movies happening around you.</p>
        </div>
        `,
        text: `Welcome to BookMyTicket, {{username}}!\n\nWe're excited to have you on board.`
    }
};

/**
 * Replaces {{variables}} in a string with values from the payload object.
 */
function interpolate(templateString, payload) {
    if (!templateString) return '';
    return templateString.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const value = payload[key.trim()];
        return value !== undefined ? value : match;
    });
}

/**
 * Fetches template from DB or uses fallback, then interpolates with payload.
 */
export async function renderTemplate(templateKey, payload) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    let htmlTemplate = '';
    let textTemplate = '';

    try {
        const { data, error } = await supabase
            .from('email_templates')
            .select('html_content, text_content')
            .eq('template_key', templateKey)
            .eq('is_active', true)
            .single();

        if (data && !error) {
            htmlTemplate = data.html_content;
            textTemplate = data.text_content || '';
        }
    } catch (err) {
        console.warn(`[Template Engine] Failed to fetch template '${templateKey}' from DB, using fallback.`);
    }

    // Use fallback if DB fetch failed or template didn't exist
    if (!htmlTemplate && FALLBACK_TEMPLATES[templateKey]) {
        htmlTemplate = FALLBACK_TEMPLATES[templateKey].html;
        textTemplate = FALLBACK_TEMPLATES[templateKey].text;
    }

    if (!htmlTemplate) {
        // Ultimate fallback
        htmlTemplate = `<p>Notification details: <pre>${JSON.stringify(payload, null, 2)}</pre></p>`;
        textTemplate = JSON.stringify(payload, null, 2);
    }

    return {
        html: interpolate(htmlTemplate, payload),
        text: interpolate(textTemplate, payload)
    };
}
