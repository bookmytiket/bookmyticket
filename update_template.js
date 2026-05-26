import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #f84464, #c026d3); padding: 40px 20px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; }
        .header p { margin: 10px 0 0; opacity: 0.9; font-size: 14px; font-weight: 500; }
        .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
        .greeting { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 20px; }
        .details-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 30px; }
        .detail-item { margin-bottom: 15px; }
        .detail-item:last-child { margin-bottom: 0; }
        .detail-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 4px; display: block; }
        .detail-value { font-size: 16px; font-weight: 700; color: #0f172a; }
        .btn-container { text-align: center; margin-top: 30px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #f84464, #c026d3); color: #ffffff !important; text-decoration: none; padding: 16px 36px; border-radius: 50px; font-weight: 800; font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 10px 20px rgba(248, 68, 100, 0.2); }
        .footer { padding: 30px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; background-color: #fafbfc; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Booking Confirmed! 🎉</h1>
            <p>Get ready for an amazing experience</p>
        </div>
        <div class="content">
            <div class="greeting">Hello {{name}},</div>
            <p>Your tickets for <strong>{{eventName}}</strong> have been successfully confirmed. We are thrilled to have you!</p>
            
            <div class="details-box">
                <div class="detail-item">
                    <span class="detail-label">Event Name</span>
                    <span class="detail-value">{{eventName}}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Event Date & Time</span>
                    <span class="detail-value">{{date}}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Ticket Code</span>
                    <span class="detail-value">{{ticketNumber}}</span>
                </div>
            </div>

            <p>Please keep this email safe. You can view your digital pass and QR code using the link below. Present it at the venue gates for seamless entry.</p>
            
            <div class="btn-container">
                <a href="https://bookmyticket.net/tickets/{{ticketNumber}}" class="btn">View Digital Ticket</a>
            </div>
        </div>
        <div class="footer">
            &copy; 2026 BookMyTicket. All rights reserved.<br>
            For support or queries, contact us at support@bookmyticket.net.
        </div>
    </div>
</body>
</html>`;

async function run() {
  const { data, error } = await supabase
    .from('email_templates')
    .update({ 
        html_content: htmlTemplate, 
        subject_template: "Tickets Confirmed: {{eventName}}! 🎉" 
    })
    .eq('template_key', 'booking');
    
  console.log("Update Error:", error);
}
run();
