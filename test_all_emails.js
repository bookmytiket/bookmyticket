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
            event_name: "Premium Concert 2026",
            booking_reference: "BMT-TEST-777",
            ticket_count: 2,
            event_date: "2026-08-15",
            event_time: "19:00",
            venue_name: "Jawaharlal Nehru Stadium",
            venue_address: "Chennai, India",
            seat_numbers: "A1, A2",
            ticket_type: "VIP",
            payment_amount: 5000,
            ticket_download_url: process.env.NEXT_PUBLIC_BASE_URL + "/tickets/BMT-TEST-777",
            support_email: "support@bookmyticket.net",
            site_url: process.env.NEXT_PUBLIC_BASE_URL
        }
    },
    {
        channel: "email",
        event_type: "payment_success", // Maps to payment_success template in DB if created, otherwise fallback
        payload: {
            to: TEST_EMAIL,
            subject: "Payment Failed for Premium Concert 2026",
            amount: 5000,
            transaction_id: "TXN987654321",
            date: new Date().toISOString()
        }
    },
    {
        channel: "email",
        event_type: "welcome_registration", // Subscribed / Welcome
        payload: {
            to: TEST_EMAIL,
            name: "Raja Vasu",
            username: "Raja Vasu",
            site_url: process.env.NEXT_PUBLIC_BASE_URL
        }
    },
    {
        channel: "email",
        event_type: "otp", // OTP
        payload: {
            to: TEST_EMAIL,
            otp: "847291"
        }
    },
    {
        channel: "email",
        event_type: "security_alert", // Security Alert
        payload: {
            to: TEST_EMAIL,
            subject: "Security Alert: New Login Detected",
            device: "MacBook Pro",
            location: "Chennai, India",
            time: new Date().toLocaleString()
        }
    }
];

async function run() {
    console.log(`Queueing ${testJobs.length} test emails to ${TEST_EMAIL}...`);
    
    // Insert into DB
    const { data, error } = await supabase.from('notification_queue').insert(testJobs).select();
    
    if (error) {
        console.error("Failed to insert jobs:", error);
        return;
    }
    
    console.log(`Successfully queued ${data.length} jobs.`);
    console.log(`\nPlease add SMTP credentials to .env.local to send the emails, then run:\n  curl http://localhost:3000/api/cron/process-emails\n`);
}

run();
