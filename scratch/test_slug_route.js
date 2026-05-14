
const fetch = require('node-fetch');

async function checkSlug() {
    const slug = 'pollachi-trophy-2026-2a6133';
    try {
        const res = await fetch(`http://localhost:3000/events/${slug}`);
        console.log('Status:', res.status);
        const text = await res.text();
        if (text.includes('Slug Page Debug')) {
            console.log('SUCCESS: Found "Slug Page Debug" in response.');
        } else {
            console.log('FAILURE: "Slug Page Debug" NOT found in response.');
            console.log('Body snippet:', text.slice(0, 1000));
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

checkSlug();
