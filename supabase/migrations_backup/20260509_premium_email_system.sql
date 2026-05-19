-- PREMIUM BRANDED EMAIL SYSTEM OVERHAUL
-- Theme: Pink (#ec4899) and Purple (#a855f7)
-- Styles: Glassmorphism, Rounded Cards, Animated-style gradients

-- 1. BASE STYLES AND LAYOUT
-- We define common parts as variables for cleaner SQL if needed, but here we'll provide full HTML for each template for simplicity and performance.

-- WELCOME REGISTRATION
UPDATE public.email_templates
SET subject = 'Welcome to BookMyTicket, {{name}}! 🎉',
    body = '<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; padding: 0; font-family: ''Outfit'', sans-serif; background-color: #f8fafc; }
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
                <p>Welcome to the premium family of <strong>BookMyTicket</strong>. We''re thrilled to have you join our global community of event enthusiasts!</p>
                <p>You now have exclusive access to the best events, sports facilities, and professional services curated just for you.</p>
                <div style="text-align: center; margin: 40px 0;">
                    <a href="{{site_url}}" class="btn">Start Exploring Now</a>
                </div>
                <p style="color: #64748b; font-size: 14px; text-align: center;">Need any help? Just reply to this email, and our team will be there for you.</p>
            </div>
            <div class="footer">
                <p style="margin: 0; color: #94a3b8; font-size: 12px; font-weight: 600;">&copy; 2026 BookMyTicket. All rights reserved.</p>
                <div style="margin-top: 20px;">
                    <a href="{{site_url}}" style="color: #ec4899; text-decoration: none; font-weight: 800; font-size: 13px; margin: 0 15px;">Website</a>
                    <a href="{{site_url}}/events" style="color: #a855f7; text-decoration: none; font-weight: 800; font-size: 13px; margin: 0 15px;">Events</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>'
WHERE identifier = 'welcome_registration';

-- OTP VERIFICATION
UPDATE public.email_templates
SET subject = '{{otp}} is your BookMyTicket Verification Code',
    body = '<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; padding: 0; font-family: ''Outfit'', sans-serif; background-color: #fdf2f8; }
        .wrapper { max-width: 600px; margin: 40px auto; padding: 0 20px; }
        .card { background: #ffffff; border-radius: 40px; overflow: hidden; box-shadow: 0 40px 80px -20px rgba(236, 72, 153, 0.2); border: 2px solid #fce7f3; }
        .header { background: #ffffff; padding: 50px 40px 30px 40px; text-align: center; }
        .content { padding: 40px; text-align: center; color: #1e293b; }
        .otp-box { background: #fdf4ff; border: 3px dashed #a855f7; border-radius: 30px; padding: 30px; margin: 40px 0; position: relative; }
        .otp-text { font-size: 48px; font-weight: 900; letter-spacing: 12px; color: #ec4899; font-family: ''Courier New'', Courier, monospace; margin-left: 12px; }
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
                <p style="font-size: 13px; color: #94a3b8; margin: 0;">This code was requested for <strong>{{purpose}}</strong>. If you didn''t request this, please secure your account.</p>
            </div>
            <div class="footer">
                <p style="margin: 0; color: #cbd5e1; font-size: 11px;">Sent via BookMyTicket Secure Auth System</p>
            </div>
        </div>
    </div>
</body>
</html>'
WHERE identifier = 'otp';

-- BOOKING CONFIRMATION
UPDATE public.email_templates
SET subject = 'Confirmed: {{eventName}} 🎟️',
    body = '<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; padding: 0; font-family: ''Outfit'', sans-serif; background-color: #f1f5f9; }
        .wrapper { max-width: 600px; margin: 40px auto; padding: 0 20px; }
        .card { background: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1); }
        .ticket-header { background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); padding: 40px; text-align: center; color: #fff; }
        .event-banner { width: 100%; height: 200px; object-fit: cover; }
        .details { padding: 40px; }
        .invoice-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .invoice-table th { text-align: left; font-size: 12px; color: #94a3b8; text-transform: uppercase; padding-bottom: 10px; }
        .invoice-table td { padding: 12px 0; border-top: 1px solid #f1f5f9; font-size: 15px; }
        .total-row { border-top: 2px solid #ec4899 !important; font-weight: 800; font-size: 18px !important; color: #ec4899; }
        .qr-placeholder { background: #fafafa; border: 2px dashed #e2e8f0; border-radius: 20px; padding: 30px; text-align: center; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="card">
            <div class="ticket-header">
                <img src="https://bookmyticket.net/logo.png" alt="Logo" style="height: 40px; filter: brightness(0) invert(1);">
                <h1 style="margin: 20px 0 0 0; font-size: 24px;">Booking Confirmed!</h1>
            </div>
            
            <img src="{{eventImage}}" class="event-banner" alt="Event Banner">
            
            <div class="details">
                <h2 style="margin: 0; color: #0f172a; font-size: 24px;">{{eventName}}</h2>
                <p style="color: #64748b; margin: 5px 0 25px 0;">Booking ID: <span style="color: #a855f7; font-weight: 800;">#{{bookingId}}</span></p>
                
                <table class="invoice-table">
                    <tr>
                        <th>Item</th>
                        <th style="text-align: right;">Amount</th>
                    </tr>
                    <tr>
                        <td>{{ticketCount}}x Event Tickets</td>
                        <td style="text-align: right;">₹{{amount}}</td>
                    </tr>
                    <tr>
                        <td>Platform Fee + GST</td>
                        <td style="text-align: right;">Included</td>
                    </tr>
                    <tr class="total-row">
                        <td>Total Paid</td>
                        <td style="text-align: right;">₹{{amount}}</td>
                    </tr>
                </table>
                
                <div class="qr-placeholder">
                    <p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">Digital Access QR Code</p>
                    <div style="margin: 20px 0; font-size: 40px;">🎟️</div>
                    <p style="margin: 0; color: #0f172a; font-weight: 600;">Scan at Venue Entry</p>
                </div>
                
                <div style="text-align: center; margin-top: 40px;">
                    <a href="{{site_url}}/tickets/{{bookingId}}" style="display: inline-block; background: #ec4899; color: #fff; text-decoration: none; padding: 15px 30px; border-radius: 15px; font-weight: 800;">Download E-Ticket</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>'
WHERE identifier = 'booking';

-- CREATE NEW TEMPLATES FOR MISSING WORKFLOWS
INSERT INTO public.email_templates (identifier, name, subject, body, category, auto_send)
VALUES 
('organiser_new_booking', 'Organiser: New Booking Alert', 'New Booking Received: {{eventName}} 🚀', '{{body}}', 'Notification', true),
('turf_booking_confirmed', 'Turf: Booking Confirmed', 'Your Turf is Booked: {{turfName}} ⚽', '{{body}}', 'Notification', true),
('organiser_new_turf_booking', 'Organiser: New Turf Booking', 'New Turf Booking: {{turfName}} 🏟️', '{{body}}', 'Notification', true),
('vendor_booking_confirmed', 'Vendor: Booking Confirmed', 'Professional Service Booked: {{serviceType}} ✨', '{{body}}', 'Notification', true)
ON CONFLICT (identifier) DO NOTHING;
