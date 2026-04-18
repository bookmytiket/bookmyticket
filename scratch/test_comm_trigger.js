
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testTrigger() {
    console.log("Testing Comm Trigger API...");
    const payload = {
        phoneNumber: "916381642221",
        type: "SIGNUP",
        data: {}
    };

    try {
        const res = await fetch('http://localhost:3000/api/comm/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log("Response Status:", res.status);
        console.log("Response Body:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Fetch failed:", err.message);
    }
}

testTrigger();
