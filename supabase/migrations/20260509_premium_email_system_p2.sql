-- PREMIUM BRANDED EMAIL SYSTEM - PART 2
-- Completing the workflow with Organiser, Security, and Payment templates

-- 1. PASSWORD RESET
UPDATE public.email_templates
SET subject = 'Reset Your BookMyTicket Password 🔒',
    body = '<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; padding: 0; font-family: ''Outfit'', sans-serif; background-color: #f8fafc; }
        .wrapper { max-width: 600px; margin: 40px auto; padding: 0 20px; }
        .card { background: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 30px 60px -12px rgba(0,0,0,0.1); border: 1px solid #f1f5f9; }
        .header { background: linear-gradient(135deg, #312e81 0%, #a855f7 100%); padding: 60px 40px; text-align: center; }
        .content { padding: 50px 40px; color: #1e293b; line-height: 1.8; text-align: center; }
        .footer { background: #f8fafc; padding: 40px; text-align: center; border-top: 1px solid #e2e8f0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: #ffffff !important; text-decoration: none; padding: 18px 36px; border-radius: 18px; font-weight: 800; font-size: 16px; box-shadow: 0 10px 20px rgba(236, 72, 153, 0.3); }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="card">
            <div class="header">
                <img src="https://bookmyticket.net/logo.png" alt="BookMyTicket" style="height: 40px; filter: brightness(0) invert(1);">
                <h1 style="color: #fff; margin-top: 20px; font-size: 24px; font-weight: 800;">Password Security</h1>
            </div>
            <div class="content">
                <h2 style="font-size: 26px; color: #0f172a;">Reset your password?</h2>
                <p>No worries! It happens to the best of us. Click the button below to choose a new password and get back to the action.</p>
                <div style="margin: 40px 0;">
                    <a href="{{reset_link}}" class="btn">Reset Password</a>
                </div>
                <p style="font-size: 13px; color: #94a3b8;">This link will expire in 2 hours. If you didn''t request this, you can safely ignore this email.</p>
            </div>
            <div class="footer">
                <p style="margin: 0; color: #94a3b8; font-size: 12px;">Powered by BookMyTicket Secure Cloud</p>
            </div>
        </div>
    </div>
</body>
</html>'
WHERE identifier = 'password_reset';

-- 2. KYC STATUS UPDATE
INSERT INTO public.email_templates (identifier, name, subject, body, category, auto_send)
VALUES 
('kyc_status_update', 'Organiser: KYC Update', 'Action Required: Your KYC Status on BookMyTicket', '<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; padding: 0; font-family: ''Outfit'', sans-serif; background-color: #f8fafc; }
        .wrapper { max-width: 600px; margin: 40px auto; padding: 0 20px; }
        .card { background: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 30px 60px -12px rgba(0,0,0,0.1); }
        .header { background: {{color}}; padding: 40px; text-align: center; color: #fff; }
        .content { padding: 40px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="card">
            <div class="header">
                <h1 style="margin: 0; font-size: 22px;">KYC Verification Update</h1>
            </div>
            <div class="content">
                <h2 style="color: #0f172a;">Status: {{status}}</h2>
                <p>Hello, your KYC application has been reviewed.</p>
                <div style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="margin: 0; font-weight: 700;">Admin Notes:</p>
                    <p style="margin: 10px 0 0 0; color: #64748b;">{{notes}}</p>
                </div>
                <p>Please login to your organiser dashboard to see the full details.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="{{site_url}}/organiser" style="display: inline-block; background: #a855f7; color: #fff; text-decoration: none; padding: 15px 30px; border-radius: 12px; font-weight: 800;">Go to Dashboard</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>', 'System', true),

-- 3. WITHDRAW REQUEST STATUS
('withdraw_status_update', 'Organiser: Payout Update', 'Payout Request: {{status}} 💸', '<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; padding: 0; font-family: ''Outfit'', sans-serif; background-color: #f0fdf4; }
        .wrapper { max-width: 600px; margin: 40px auto; padding: 0 20px; }
        .card { background: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 30px 60px -12px rgba(22, 163, 74, 0.1); }
        .header { background: #16a34a; padding: 40px; text-align: center; color: #fff; }
        .content { padding: 40px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="card">
            <div class="header">
                <h1 style="margin: 0; font-size: 22px;">Withdrawal {{status}}</h1>
            </div>
            <div class="content">
                <h2 style="color: #0f172a;">Amount: ₹{{amount}}</h2>
                <p>Great news! Your withdrawal request has been updated.</p>
                <div style="background: #f8fafc; padding: 20px; border-radius: 16px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #64748b;"><strong>Request ID:</strong> #{{requestId}}</p>
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #64748b;"><strong>Status:</strong> <span style="color: #16a34a; font-weight: 800;">{{status}}</span></p>
                </div>
                <p>Funds usually reflect in your bank account within 2-3 business days.</p>
            </div>
        </div>
    </div>
</body>
</html>', 'System', true)
ON CONFLICT (identifier) DO NOTHING;
