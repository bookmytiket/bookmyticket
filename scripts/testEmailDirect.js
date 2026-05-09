const { sendTemplatedEmail } = require('./lib/emailService');
require('dotenv').config({ path: '.env.local' });

async function test() {
    console.log("Testing templated email send...");
    const result = await sendTemplatedEmail({
        templateIdentifier: 'otp',
        to: 'v.raja2mail@gmail.com',
        variables: {
            otp: '123456',
            purpose: 'Test'
        }
    });

    console.log("Result:", result);
}

test();
