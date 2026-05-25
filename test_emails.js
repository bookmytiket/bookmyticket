const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_EMAIL = "rajavasu97@gmail.com";

const testJobs = [
    {
        channel: "email",
        event_type: "booking_confirmation",
        payload: {
            to: TEST_EMAIL,
            customer_name: "Raja Vasu",
            event_name: "AR Rahman Live Concert",
            booking_reference: "BMT-TEST-123",
            ticket_count: 2,
            event_date: "2026-06-15",
            event_time: "19:00",
            venue_name: "Jawaharlal Nehru Stadium",
            venue_address: "Chennai, India",
            seat_numbers: "A1, A2",
            ticket_type: "VIP",
            payment_amount: 5000,
            ticket_download_url: "https://bookmyticket.net/tickets/123",
            support_email: "support@bookmyticket.net",
            site_url: "https://bookmyticket.net"
        }
    },
    {
        channel: "email",
        event_type: "payment_success",
        payload: {
            to: TEST_EMAIL,
            amount: 5000,
            transaction_id: "TXN987654321",
            date: new Date().toISOString()
        }
    },
    {
        channel: "email",
        event_type: "canceled",
        payload: {
            to: TEST_EMAIL,
            event_name: "Standup Comedy Show",
            reason: "Artist unavailable",
            refund_amount: 1500
        }
    },
    {
        channel: "email",
        event_type: "welcome_registration",
        payload: {
            to: TEST_EMAIL,
            name: "Raja Vasu",
            username: "Raja Vasu",
            site_url: "https://bookmyticket.net"
        }
    },
    {
        channel: "email",
        event_type: "otp",
        payload: {
            to: TEST_EMAIL,
            otp: "847291"
        }
    },
    {
        channel: "email",
        event_type: "security_alert", // Will likely trigger fallback
        payload: {
            to: TEST_EMAIL,
            subject: "Security Alert: New Login",
            device: "MacBook Pro",
            location: "Chennai, India",
            time: new Date().toISOString()
        }
    }
];

async function run() {
    console.log(`Queueing ${testJobs.length} emails to ${TEST_EMAIL}...`);
    
    // Insert into DB
    const { data, error } = await supabase.from('notification_queue').insert(testJobs).select();
    
    if (error) {
        console.error("Failed to insert jobs:", error);
        return;
    }
    
    console.log(`Successfully queued ${data.length} jobs.`);
    
    // Trigger queue processor
    console.log("Triggering local queue processor...");
    try {
        const fetch = (await import('node-fetch')).default;
        const res = await fetch('http://localhost:3000/api/cron/process-emails', {
            method: 'GET'
        });
        const result = await res.json();
        console.log("Processor response:", result);
    } catch (e) {
        console.error("Processor failed (is local dev server running?):", e.message);
    }
}

run();
