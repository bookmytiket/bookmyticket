/**
 * Communication Service for handled SMS and WhatsApp via Fast2SMS and other providers.
 * Integrated with Supabase for logging and config fetching.
 */

const FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2";

export async function sendSMS({ phoneNumber, message, type = "TRANSACTIONAL" }) {
    try {
        // 1. Fetch Config from Supabase (Server Side)
        const responseData = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/communicationSettings?key=eq.fast2sms`, {
            headers: {
                'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            }
        }).then(res => res.json());

        // Raw fetch to PostgREST returns an array directly
        const config = Array.isArray(responseData) ? responseData[0]?.value : null;

        if (!config || !config.enabled || !config.apiKey) {
            console.warn("SMS service disabled or not configured.", { key: 'fast2sms', hasConfig: !!config });
            return { success: false, error: "NOT_CONFIGURED" };
        }

        // 2. Call Fast2SMS
        // Note: Using 'route': 'otp' for single messages or 'q' for bulk/transactional
        const response = await fetch(FAST2SMS_URL, {
            method: 'POST',
            headers: {
                "authorization": config.apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "route": "q",
                "message": message,
                "language": "english",
                "numbers": phoneNumber,
            })
        });

        const result = await response.json();

        // 3. Log to DB
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/smsLogs`, {
            method: 'POST',
            headers: {
                'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                phone_number: phoneNumber,
                message: message,
                type: type,
                status: result.return ? 'SUCCESS' : 'FAILED',
                response: result
            })
        });

        return { success: result.return, data: result };
    } catch (error) {
        console.error("CommService Error:", error);
        return { success: false, error: error.message };
    }
}

export async function sendWhatsApp({ phoneNumber, message }) {
    try {
        // 1. Fetch Config from Supabase
        const responseData = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/communicationSettings?key=eq.whatsapp`, {
            headers: {
                'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            }
        }).then(res => res.json());

        const config = Array.isArray(responseData) ? responseData[0]?.value : null;

        if (!config || !config.enabled || !config.apiKey || !config.senderNumber) {
            console.warn("WhatsApp service disabled or not configured.", { key: 'whatsapp', hasConfig: !!config });
            return { success: false, error: "NOT_CONFIGURED" };
        }

        // 2. Call Provider (Default: Meta Cloud API)
        let result;
        let success = false;

        if (config.provider === 'meta' || !config.provider) {
            // Meta Cloud API Implementation
            // Ensure phone number has country code for WhatsApp (defaulting to 91 if 10 digits)
            let formattedPhone = phoneNumber.replace(/\D/g, '');
            if (formattedPhone.length === 10) formattedPhone = '91' + formattedPhone;
            
            const response = await fetch(`https://graph.facebook.com/v17.0/${config.senderNumber}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: formattedPhone,
                    type: "text",
                    text: { body: message }
                })
            });
            result = await response.json();
            success = !!result.messages;
        } else {
            // Placeholder for Twilio / Gupshup
            console.log(`WhatsApp simulated for ${config.provider}: ${phoneNumber}`);
            result = { simulated: true };
            success = true;
        }

        // 3. Log to whatsappLogs
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/whatsappLogs`, {
            method: 'POST',
            headers: {
                'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone_number: phoneNumber,
                message: message,
                status: success ? 'SUCCESS' : 'FAILED',
                response: result
            })
        });

        return { success, data: result };
    } catch (error) {
        console.error("WhatsApp Service Error:", error);
        return { success: false, error: error.message };
    }
}
