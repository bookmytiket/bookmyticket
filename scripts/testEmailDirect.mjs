import { sendTemplatedEmail } from '../lib/emailService.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
    console.log("Testing templated email send...");
    try {
        const result = await sendTemplatedEmail({
            templateIdentifier: 'otp',
            to: 'v.raja2mail@gmail.com',
            variables: {
                otp: '123456',
                purpose: 'Test'
            }
        });
        console.log("Result:", result);
    } catch (err) {
        console.error("Fatal Error:", err);
    }
}

test();
