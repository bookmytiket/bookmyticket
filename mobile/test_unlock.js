const fetch = require('node-fetch');

async function testUnlock() {
    const res = await fetch('http://localhost:3000/api/seats/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            eventId: '3d6b43f6-2af4-47e7-87fc-e3a27bcb8bc4',
            seatId: 'VIP-G-10',
            userId: 'f831918a-b902-4037-90f5-19042d5f876e',
            showtimeId: null
        })
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data:", data);
}

testUnlock();
