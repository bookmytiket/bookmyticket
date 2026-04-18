/**
 * Communication Service for handled SMS and WhatsApp via Fast2SMS and other providers.
 * Integrated with Supabase for logging and config fetching.
 */

const FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2";

export async function sendSMS({ phoneNumber, message, type = "TRANSACTIONAL" }) {
    try {
        // 1. Fetch Config from Supabase (Server Side)
        const { data: configData } = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/communicationSettings?key=eq.fast2sms`, {
            headers: {
                'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            }
        }).then(res => res.json());

        const config = configData?.[0]?.value;
        if (!config || !config.enabled || !config.apiKey) {
            console.warn("SMS service disabled or not configured.");
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

export async function sendWhatsApp({ phoneNumber, message, templateId }) {
    // Placeholder for WhatsApp API integration (e.g. Wati, Twilio, Meta)
    console.log(`WhatsApp to ${phoneNumber}: ${message}`);
    return { success: true, message: "WhatsApp simulated" };
}
