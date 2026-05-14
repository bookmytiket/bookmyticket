
const fetch = require('node-fetch');

async function checkBranding() {
    try {
        const res = await fetch('http://localhost:3000/api/branding');
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body:', text.slice(0, 200));
    } catch (e) {
        console.error('Error:', e);
    }
}

checkBranding();
