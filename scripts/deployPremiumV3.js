const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const templates = [
    {
        identifier: 'otp',
        subject: '{{otp}} is your BookMyTicket Secret Code 🔐',
        body: `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; padding: 0; font-family: 'Outfit', sans-serif; background-color: #0f172a; }
        .wrapper { max-width: 600px; margin: 40px auto; padding: 0 20px; }
        .glass-card { background: #ffffff; border-radius: 40px; overflow: hidden; box-shadow: 0 40px 100px -20px rgba(236, 72, 153, 0.4); }
        .header { background: linear-gradient(135deg, #312e81 0%, #a855f7 100%); padding: 60px 40px; text-align: center; position: relative; }
        .content { padding: 40px; text-align: center; color: #1e293b; }
        .otp-container { background: #fdf4ff; border: 4px solid #fce7f3; border-radius: 30px; padding: 40px; margin: 30px 0; position: relative; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); }
        .otp-number { font-size: 56px; font-weight: 800; letter-spacing: 15px; background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-family: monospace; display: block; margin-left: 15px; }
        .neon-glow { height: 4px; width: 60px; background: #ec4899; margin: 20px auto; border-radius: 10px; box-shadow: 0 0 15px #ec4899; }
        .footer { padding: 40px; background: #f8fafc; text-align: center; border-top: 1px solid #f1f5f9; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="glass-card">
            <div class="header">
                <img src="https://bookmyticket.net/logo.png" alt="BookMyTicket" style="height: 45px; filter: brightness(0) invert(1);">
                <h1 style="color: #fff; margin-top: 20px; font-size: 28px; font-weight: 800; letter-spacing: -1px;">Verify Identity</h1>
            </div>
            <div class="content">
                <p style="font-size: 18px; color: #64748b;">Your one-time password for <strong>{{purpose}}</strong></p>
                <div class="otp-container">
                    <span class="otp-number">{{otp}}</span>
                    <div class="neon-glow"></div>
                </div>
                <p style="font-size: 14px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px;">Expiring in 5 Minutes</p>
                <p style="margin-top: 30px; font-size: 13px; color: #cbd5e1;">If you didn't request this code, you can safely ignore this email.</p>
            </div>
            <div class="footer">
                <p style="margin: 0; color: #94a3b8; font-size: 12px;">&copy; 2026 BookMyTicket Premium. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>`
    },
    {
        identifier: 'booking',
        subject: 'Your Ticket is Ready! 🎟️ {{eventName}}',
        body: `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; padding: 0; font-family: 'Outfit', sans-serif; background-color: #f1f5f9; }
        .wrapper { max-width: 600px; margin: 40px auto; padding: 0 20px; }
        .ticket-card { background: #ffffff; border-radius: 40px; overflow: hidden; box-shadow: 0 50px 100px -20px rgba(0,0,0,0.15); border: 1px solid #e2e8f0; }
        .banner { height: 250px; background: url('{{eventImage}}') center/cover no-repeat; position: relative; }
        .banner-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); }
        .event-info { position: absolute; bottom: 30px; left: 30px; color: #fff; }
        .ticket-body { padding: 40px; }
        .qr-section { background: #fafafa; border-radius: 30px; padding: 30px; text-align: center; margin: 30px 0; border: 2px dashed #e2e8f0; }
        .info-grid { display: table; width: 100%; border-collapse: separate; border-spacing: 10px; }
        .info-item { display: table-cell; background: #f8fafc; padding: 20px; border-radius: 20px; border: 1px solid #f1f5f9; width: 50%; }
        .btn { display: block; background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: #ffffff !important; text-decoration: none; padding: 20px; border-radius: 20px; font-weight: 800; text-align: center; margin-top: 30px; box-shadow: 0 10px 20px rgba(236, 72, 153, 0.3); }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="ticket-card">
            <div class="banner">
                <div class="banner-overlay"></div>
                <div class="event-info">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 800;">{{eventName}}</h1>
                    <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">{{date}}</p>
                </div>
            </div>
            <div class="ticket-body">
                <h2 style="margin: 0; font-size: 22px; color: #0f172a;">You're all set, {{name}}!</h2>
                <p style="color: #64748b;">Your booking has been confirmed and your ticket is secured.</p>
                
                <div class="qr-section">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data={{bookingId}}" alt="QR Code" style="width: 150px; border-radius: 10px;">
                    <p style="margin: 15px 0 0 0; font-weight: 800; color: #1e293b; letter-spacing: 2px;">#{{bookingId}}</p>
                </div>

                <div class="info-grid">
                    <div class="info-item">
                        <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase;">Tickets</p>
                        <p style="margin: 5px 0 0 0; font-weight: 800; color: #1e293b;">{{ticketCount}} Pass(es)</p>
                    </div>
                    <div class="info-item">
                        <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase;">Total Paid</p>
                        <p style="margin: 5px 0 0 0; font-weight: 800; color: #ec4899;">₹{{amount}}</p>
                    </div>
                </div>

                <a href="{{site_url}}/my-bookings" class="btn">View in App</a>
            </div>
        </div>
    </div>
</body>
</html>`
    }
];

async function deploy() {
    console.log("Deploying Super Premium V3 templates...");
    for (const t of templates) {
        const { error } = await supabaseAdmin
            .from('email_templates')
            .upsert(t, { onConflict: 'identifier' });
        
        if (error) {
            console.error(`Error deploying ${t.identifier}:`, error);
        } else {
            console.log(`Successfully deployed ${t.identifier}`);
        }
    }
}

deploy();
