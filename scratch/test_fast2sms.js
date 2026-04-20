
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testSMS() {
    console.log("Testing Fast2SMS Trigger...");
    const payload = {
        phoneNumber: "6381642221",
        type: "TEXT",
        data: { message: "Test message from BookMyTicket after Fast2SMS Top-up. Success!" }
    };

    try {
        const res = await fetch('http://localhost:3000/api/comm/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Fetch failed:", err.message);
    }
}

testSMS();
