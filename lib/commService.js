/**
 * Communication Service for handled SMS and WhatsApp via Fast2SMS and other providers.
 * Integrated with Supabase for logging and config fetching.
 */

const FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2";

export async function sendSMS({ phoneNumber, message, type = "TRANSACTIONAL" }) {
    try {
        // 1. Fetch Config from Supabase
        const responseData = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/communicationSettings?key=eq.sms_settings`, {
            headers: {
                'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            }
        }).then(res => res.json());

        const config = Array.isArray(responseData) ? responseData[0]?.value : null;

        if (!config || !config.enabled) {
            console.warn("SMS service disabled or not configured.");
            return { success: false, error: "NOT_CONFIGURED" };
        }

        let result;
        let success = false;

        if (config.provider === 'twilio') {
            const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
            const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    To: phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber.replace(/\D/g, '')}`,
                    From: config.fromNumber,
                    Body: message
                })
            });
            result = await response.json();
            success = !result.error_code;
        } else if (config.provider === 'fast2sms' || !config.provider) {
            const response = await fetch(FAST2SMS_URL, {
                method: 'POST',
                headers: {
                    "authorization": config.apiKey,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "route": "q",
                    "message": message,
                    "numbers": phoneNumber,
                })
            });
            result = await response.json();
            success = result.return;
        }

        // 3. Log to DB
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/smsLogs`, {
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
        console.error("SMS Error:", error);
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
        } else if (config.provider === 'twilio') {
            // Twilio WhatsApp Implementation
            const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
            let formattedPhone = phoneNumber.replace(/\D/g, '');
            if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) formattedPhone = '91' + formattedPhone;
            
            const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    To: `whatsapp:+${formattedPhone}`,
                    From: `whatsapp:${config.senderNumber}`,
                    Body: message
                })
            });
            result = await response.json();
            success = !result.error_code;
        } else if (config.provider === 'fast2sms') {
            // Fast2SMS WhatsApp Implementation
            let formattedPhone = phoneNumber.replace(/\D/g, '');
            if (formattedPhone.length === 10) formattedPhone = '91' + formattedPhone;

            const response = await fetch("https://www.fast2sms.com/dev/whatsapp", {
                method: 'POST',
                headers: {
                    "authorization": config.apiKey,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "route": "whatsapp",
                    "sender_id": config.senderId || "FSTSMS",
                    "message": message,
                    "numbers": formattedPhone,
                    "message_id": config.templateId // Added the required template ID
                })
            });
            result = await response.json();
            success = !!result.request_id;
        } else if (config.provider === 'bridge') {
            // Local Selenium Bridge Trigger
            try {
                const bridgeUrl = process.env.WHATSAPP_BRIDGE_URL || 'http://localhost:8000';
                const response = await fetch(`${bridgeUrl}/hook/booking`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        table: "manual_trigger",
                        record: { phone: phoneNumber, message: message }
                    })
                });
                result = await response.json();
                success = result.status === 'accepted';
            } catch (err) {
                result = { error: "Bridge not reachable", details: err.message };
                success = false;
            }
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
