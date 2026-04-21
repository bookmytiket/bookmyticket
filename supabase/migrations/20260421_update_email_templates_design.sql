-- Update email templates with high-fidelity branded designs
-- Primary Theme: Pink (#f84464) and Purple (#a855f7)

-- Welcome Email
UPDATE public.email_templates
SET subject = 'Welcome to BookMyTicket, {{name}}! 🎉',
    body = '<div style="font-family: ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
    <div style="background: linear-gradient(135deg, #f84464 0%, #a855f7 100%); padding: 40px; text-align: center;">
      <img src="https://bookmyticket.net/logo.png" alt="BookMyTicket" style="height: 60px; filter: brightness(0) invert(1);">
    </div>
    <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
      <h2 style="margin-top: 0; color: #0f172a; font-size: 26px; font-weight: 800;">Welcome to the family! 🎉</h2>
      <p style="font-size: 16px;">Hi <strong>{{name}}</strong>,</p>
      <p style="font-size: 16px;">Your account has been successfully created. We''re thrilled to have you with us! You can now explore thousands of events, turfs, and professional services across the platform.</p>
      <div style="margin-top: 30px; text-align: center;">
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;margin:0 auto;">
          <tr>
            <td align="center" bgcolor="#f84464" role="presentation" style="border:none;border-radius:14px;cursor:auto;background:linear-gradient(135deg, #f84464 0%, #a855f7 100%);" valign="middle">
              <a href="{{site_url}}" style="display:inline-block;background:linear-gradient(135deg, #f84464 0%, #a855f7 100%);color:#ffffff;font-family:''Segoe UI'', Roboto, Helvetica, Arial, sans-serif;font-size:16px;font-weight:800;line-height:120%;margin:0;text-decoration:none;text-transform:none;padding:18px 36px;border-radius:14px;" target="_blank">
                Explore Events
              </a>
            </td>
          </tr>
        </table>
      </div>
      <p style="margin-top: 40px; font-size: 14px; color: #64748b;">If you have any questions, just reply to this email. We''re here to help!</p>
    </div>
    <div style="padding: 30px; text-align: center; background-color: #f8fafc; border-top: 1px solid #f1f5f9;">
      <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: 600;">Powered by BookMyTicket</p>
      <div style="margin-top: 15px;">
        <a href="https://bookmyticket.net" style="color: #f84464; text-decoration: none; font-weight: 700; font-size: 13px;">Website</a>
        <span style="color: #cbd5e1; margin: 0 10px;">•</span>
        <a href="https://bookmyticket.net/events" style="color: #a855f7; text-decoration: none; font-weight: 700; font-size: 13px;">Events</a>
      </div>
    </div>
  </div>
</div>'
WHERE identifier = 'welcome_registration';

-- Password Reset Email
UPDATE public.email_templates
SET subject = 'Reset Your BookMyTicket Password',
    body = '<div style="font-family: ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
    <div style="background: linear-gradient(135deg, #f84464 0%, #a855f7 100%); padding: 40px; text-align: center;">
      <img src="https://bookmyticket.net/logo.png" alt="BookMyTicket" style="height: 60px; filter: brightness(0) invert(1);">
    </div>
    <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
      <h2 style="margin-top: 0; color: #0f172a; font-size: 26px; font-weight: 800;">Reset Your Password</h2>
      <p style="font-size: 16px;">Hi <strong>{{name}}</strong>,</p>
      <p style="font-size: 16px;">We received a request to reset your password. If you didn''t make this request, you can safely ignore this email.</p>
      <div style="margin-top: 30px; text-align: center;">
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;margin:0 auto;">
          <tr>
            <td align="center" bgcolor="#f84464" role="presentation" style="border:none;border-radius:14px;cursor:auto;background:linear-gradient(135deg, #f84464 0%, #a855f7 100%);" valign="middle">
              <a href="{{reset_link}}" style="display:block;color:#ffffff;font-family:''Segoe UI'', Roboto, Helvetica, Arial, sans-serif;font-size:16px;font-weight:800;line-height:120%;margin:0;text-decoration:none;text-transform:none;padding:18px 36px;border-radius:14px;" target="_blank">
                Reset Password
              </a>
            </td>
          </tr>
        </table>
      </div>
      <p style="margin-top: 25px; font-size: 12px; color: #94a3b8; text-align: center;">
        Button not working? Copy and paste this link into your browser:<br>
        <span style="color: #a855f7; word-break: break-all;">{{reset_link}}</span>
      </p>
      <p style="margin-top: 20px; font-size: 13px; color: #94a3b8; text-align: center;">This link will expire in 24 hours for your security.</p>
    </div>
    <div style="padding: 30px; text-align: center; background-color: #f8fafc; border-top: 1px solid #f1f5f9;">
      <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: 600;">Powered by BookMyTicket</p>
    </div>
  </div>
</div>'
WHERE identifier = 'password_reset';

-- Booking Confirmation Email
UPDATE public.email_templates
SET subject = 'Booking Confirmed: {{eventName}} 🎟️',
    body = '<div style="font-family: ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
    <div style="background: linear-gradient(135deg, #f84464 0%, #a855f7 100%); padding: 40px; text-align: center;">
      <img src="https://bookmyticket.net/logo.png" alt="BookMyTicket" style="height: 60px; filter: brightness(0) invert(1);">
    </div>
    <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
      <h2 style="margin-top: 0; color: #0f172a; font-size: 26px; font-weight: 800;">Booking Confirmed! 🎟️</h2>
      <p style="font-size: 16px;">Hi <strong>{{name}}</strong>,</p>
      <p style="font-size: 16px;">Your booking for <strong>{{eventName}}</strong> is confirmed. Get ready for an amazing experience!</p>
      <div style="background: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="margin: 0 0 10px 0; font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Your Booking Summary</p>
        <p style="margin: 0; font-size: 16px; color: #1e293b;"><strong>Date:</strong> {{date}}</p>
        <p style="margin: 8px 0 0 0; font-size: 16px; color: #1e293b;"><strong>Booking ID:</strong> <code style="background: #fff; padding: 4px 10px; border-radius: 6px; border: 1px solid #e2e8f0; color: #f84464; font-weight: 700;">{{bookingId}}</code></p>
      </div>
      <div style="margin-top: 30px; text-align: center;">
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;margin:0 auto;">
          <tr>
            <td align="center" bgcolor="#f84464" role="presentation" style="border:none;border-radius:14px;cursor:auto;background:linear-gradient(135deg, #f84464 0%, #a855f7 100%);" valign="middle">
              <a href="{{ticket_url}}" style="display:inline-block;background:linear-gradient(135deg, #f84464 0%, #a855f7 100%);color:#ffffff;font-family:''Segoe UI'', Roboto, Helvetica, Arial, sans-serif;font-size:16px;font-weight:800;line-height:120%;margin:0;text-decoration:none;text-transform:none;padding:18px 36px;border-radius:14px;" target="_blank">
                View Digital Ticket
              </a>
            </td>
          </tr>
        </table>
      </div>
    </div>
    <div style="padding: 30px; text-align: center; background-color: #f8fafc; border-top: 1px solid #f1f5f9;">
      <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: 600;">Powered by BookMyTicket</p>
    </div>
  </div>
</div>'
WHERE identifier = 'booking';

-- OTP Verification Email
UPDATE public.email_templates
SET subject = '{{otp}} is your BookMyTicket OTP',
    body = '<div style="font-family: ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
    <div style="background: linear-gradient(135deg, #f84464 0%, #a855f7 100%); padding: 40px; text-align: center;">
      <img src="https://bookmyticket.net/logo.png" alt="BookMyTicket" style="height: 60px; filter: brightness(0) invert(1);">
    </div>
    <div style="padding: 40px; color: #1e293b; line-height: 1.6; text-align: center;">
      <h2 style="margin-top: 0; color: #0f172a; font-size: 26px; font-weight: 800;">Verification Code</h2>
      <p style="font-size: 16px;">Hi there, please use the following code to verify your action on BookMyTicket.</p>
      <div style="margin: 32px 0;">
        <div style="display: inline-block; padding: 24px 48px; background: #fdf4ff; border: 2px dashed #a855f7; border-radius: 20px;">
          <span style="font-size: 36px; font-weight: 900; letter-spacing: 12px; color: #f84464; font-family: ''Courier New'', Courier, monospace; margin-left: 12px;">{{otp}}</span>
        </div>
      </div>
      <p style="font-size: 14px; color: #94a3b8;">This code is valid for 5 minutes and should not be shared with anyone.</p>
    </div>
    <div style="padding: 30px; text-align: center; background-color: #f8fafc; border-top: 1px solid #f1f5f9;">
      <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: 600;">Powered by BookMyTicket</p>
    </div>
  </div>
</div>'
WHERE identifier = 'otp';
