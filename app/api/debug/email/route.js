import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/emailService';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const to = searchParams.get('email') || 'hello@bookmyticket.net';

    console.log(`[DEBUG] Triggering test email to: ${to}`);
    
    const result = await sendEmail({
        to,
        subject: 'BookMyTicket - Debug Test Email',
        html: `
            <div style="font-family: sans-serif; padding: 20px;">
                <h1>Debug Test Email</h1>
                <p>This is a test email triggered from the <code>/api/debug/email</code> endpoint.</p>
                <p>Time: ${new Date().toISOString()}</p>
            </div>
        `
    });

    return NextResponse.json({
        timestamp: new Date().toISOString(),
        test_email: to,
        ...result
    });
}
