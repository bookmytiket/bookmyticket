const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const templates = [
    {
        identifier: 'otp',
        subject: '{{otp}} is your BookMyTicket Verification Code',
        body: `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; padding: 0; font-family: 'Outfit', sans-serif; background-color: #fdf2f8; }
        .wrapper { max-width: 600px; margin: 40px auto; padding: 0 20px; }
        .card { background: #ffffff; border-radius: 40px; overflow: hidden; box-shadow: 0 40px 80px -20px rgba(236, 72, 153, 0.2); border: 2px solid #fce7f3; }
        .header { background: #ffffff; padding: 50px 40px 30px 40px; text-align: center; }
        .content { padding: 40px; text-align: center; color: #1e293b; }
        .otp-box { background: #fdf4ff; border: 3px dashed #a855f7; border-radius: 30px; padding: 30px; margin: 40px 0; position: relative; }
        .otp-text { font-size: 48px; font-weight: 900; letter-spacing: 12px; color: #ec4899; font-family: 'Courier New', Courier, monospace; margin-left: 12px; }
        .expiry { color: #94a3b8; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        .footer { padding: 30px; background: #fafafa; border-top: 1px solid #f1f5f9; text-align: center; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="card">
            <div class="header">
                <img src="https://bookmyticket.net/logo.png" alt="BookMyTicket" style="height: 50px;">
            </div>
            <div class="content">
                <h2 style="font-size: 32px; font-weight: 800; color: #0f172a; margin-bottom: 10px;">Verification Code</h2>
                <p style="font-size: 16px; color: #64748b;">Please use the code below to complete your action.</p>
                
                <div class="otp-box">
                    <span class="otp-text">{{otp}}</span>
                </div>
                
                <p class="expiry">Valid for <span style="color: #a855f7;">5 Minutes</span></p>
                <div style="height: 1px; background: linear-gradient(to right, transparent, #e2e8f0, transparent); margin: 30px 0;"></div>
                <p style="font-size: 13px; color: #94a3b8; margin: 0;">This code was requested for <strong>{{purpose}}</strong>. If you didn't request this, please secure your account.</p>
            </div>
            <div class="footer">
                <p style="margin: 0; color: #cbd5e1; font-size: 11px;">Sent via BookMyTicket Secure Auth System</p>
            </div>
        </div>
    </div>
</body>
</html>`
    },
    {
        identifier: 'welcome_registration',
        subject: 'Welcome to BookMyTicket, {{name}}! 🎉',
        body: `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; padding: 0; font-family: 'Outfit', sans-serif; background-color: #f8fafc; }
        .wrapper { max-width: 600px; margin: 40px auto; padding: 0 20px; }
        .card { background: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 30px 60px -12px rgba(168, 85, 247, 0.15); border: 1px solid #f1f5f9; }
        .header { background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); padding: 60px 40px; text-align: center; }
        .content { padding: 50px 40px; color: #1e293b; line-height: 1.8; }
        .footer { background: #f8fafc; padding: 40px; text-align: center; border-top: 1px solid #e2e8f0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: #ffffff !important; text-decoration: none; padding: 20px 40px; border-radius: 20px; font-weight: 800; font-size: 16px; box-shadow: 0 10px 20px rgba(236, 72, 153, 0.3); transition: transform 0.3s ease; }
        h1 { margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: -1px; }
        h2 { margin: 0 0 20px 0; color: #0f172a; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
        p { font-size: 16px; margin: 0 0 20px 0; }
        .logo-container { background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); display: inline-block; padding: 15px 30px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.3); margin-bottom: 30px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="card">
            <div class="header">
                <div class="logo-container">
                    <img src="https://bookmyticket.net/logo.png" alt="BookMyTicket" style="height: 45px; width: auto;">
                </div>
                <h1>Welcome Home!</h1>
            </div>
            <div class="content">
                <h2>Hi {{name}},</h2>
                <p>Welcome to the premium family of <strong>BookMyTicket</strong>. We're thrilled to have you join our global community of event enthusiasts!</p>
                <p>You now have exclusive access to the best events, sports facilities, and professional services curated just for you.</p>
                <div style="text-align: center; margin: 40px 0;">
                    <a href="{{site_url}}" class="btn">Start Exploring Now</a>
                </div>
                <p style="color: #64748b; font-size: 14px; text-align: center;">Need any help? Just reply to this email, and our team will be there for you.</p>
            </div>
            <div class="footer">
                <p style="margin: 0; color: #94a3b8; font-size: 12px; font-weight: 600;">&copy; 2026 BookMyTicket. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>`
    }
];

async function deploy() {
    console.log("Deploying templates to Supabase...");
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
