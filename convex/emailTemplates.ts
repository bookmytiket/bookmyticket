import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Centralized email templates for BookMyTicket

/**
 * Standard Email Wrapper with BookMyTicket Branding
 */
export const baseTemplate = (content: string, branding: any) => {
    // Always enforce production domain. Strip localhost or vercel.app URLs from branding.
    const rawSiteUrl = branding?.siteUrl || "https://bookmyticket.net";
    const siteUrl = (rawSiteUrl.includes("localhost") || rawSiteUrl.includes("vercel.app"))
        ? "https://bookmyticket.net"
        : rawSiteUrl;
    let brandLogo = branding?.logoUrl || "/logo.png";
    if (brandLogo.startsWith("/")) brandLogo = `${siteUrl}${brandLogo}`;
    const brandNameDisplay = branding?.name || "BookMyTicket";

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Inter', -apple-system, system-ui, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
        .wrapper { padding: 40px 10px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.06); }
        .header { background: linear-gradient(135deg, #f43f5e, #a855f7); padding: 50px 20px; text-align: center; }
        .logo { max-height: 40px; filter: brightness(0) invert(1); }
        .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
        .footer { background-color: #f1f5f9; padding: 30px 20px; text-align: center; color: #94a3b8; font-size: 13px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #f43f5e, #a855f7); color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 700; margin-top: 20px; }
        .footer-link { color: #f43f5e; text-decoration: none; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <img src="${brandLogo}" alt="${brandNameDisplay}" class="logo">
            </div>
            <div class="content">
                ${content}
            </div>
            <div class="footer">
                <p>© ${new Date().getFullYear()} ${brandNameDisplay}. All rights reserved.</p>
                <p>Support: <a href="mailto:hello@bookmyticket.net" class="footer-link">hello@bookmyticket.net</a></p>
            </div>
        </div>
    </div>
</body>
</html>`;
};

/**
 * OTP Template
 */
export const otpTemplate = (otp: string, purpose: string, branding: any) => {
    const content = `
        <h2 style="color: #1e293b; font-size: 24px; font-weight: 800; margin-bottom: 8px;">Verification Code</h2>
        <p>You requested a code for <strong>${purpose}</strong>. Please use the 6-digit code below:</p>
        <div style="background: #f8fafc; border: 2px dashed #cbd5e1; padding: 30px; border-radius: 16px; text-align: center; margin: 30px 0;">
            <span style="font-size: 36px; font-weight: 900; letter-spacing: 12px; color: #0f172a;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #64748b;">This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
    `;
    return baseTemplate(content, branding);
};

/**
 * Reset Password Template
 */
export const resetPasswordTemplate = (url: string, branding: any) => {
    const content = `
        <h2 style="color: #1e293b; font-size: 24px; font-weight: 800;">Reset Your Password</h2>
        <p>We received a request to reset your password. Click the button below to continue:</p>
        <div style="text-align: center; margin: 40px 0;">
            <a href="${url}" class="btn">Reset Password</a>
        </div>
        <p style="font-size: 14px; color: #64748b;">If you didn't request this, please contact our support immediately.</p>
    `;
    return baseTemplate(content, branding);
};

/**
 * Welcome Template
 */
export const welcomeTemplate = (name: string, branding: any) => {
    const rawSiteUrl = branding?.siteUrl || "https://bookmyticket.net";
    const siteUrl = (rawSiteUrl.includes("localhost") || rawSiteUrl.includes("vercel.app"))
        ? "https://bookmyticket.net"
        : rawSiteUrl;
    const content = `
        <h2 style="color: #1e293b; font-size: 24px; font-weight: 800;">Welcome to the Family! 🎊</h2>
        <p>Hi ${name},</p>
        <p>We're thrilled to have you join our community. Your account is now active and ready to go.</p>
        <p>Start discovering amazing events and experiences happening around you!</p>
        <div style="text-align: center; margin: 40px 0;">
            <a href="${siteUrl}/events" class="btn">Browse Events</a>
        </div>
    `;
    return baseTemplate(content, branding);
};

/**
 * Event Notification Template
 */
export const eventNotificationTemplate = (args: any, branding: any) => {
    const { title, organiserName, date, location, imageUrl, eventLink } = args;
    const content = `
        <span style="display: inline-block; background: #fdf2f8; color: #f844a4; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 12px;">NEW EVENT</span>
        <h1 style="font-size: 28px; font-weight: 800; color: #1a1a1a; margin: 0 0 16px 0; line-height: 1.2;">${title}</h1>
        
        ${imageUrl ? `<img src="${imageUrl}" style="width: 100%; height: 250px; object-fit: cover; border-radius: 12px; margin-bottom: 20px;" alt="${title}">` : ''}

        <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
            <p><strong>Organiser:</strong> ${organiserName}</p>
            <p><strong>Date:</strong> ${date || "To be announced"}</p>
            <p><strong>Location:</strong> ${location || "To be announced"}</p>
        </div>
        
        <p>A new event has been created! Don't miss out on this incredible experience.</p>
        <div style="text-align: center;">
            <a href="${eventLink}" class="btn">Book Now</a>
        </div>
    `;
    return baseTemplate(content, branding);
};

/**
 * Partner Approval Template
 */
export const partnerApprovalTemplate = (args: any, branding: any) => {
    const { firstName, email, password, loginUrl } = args;
    const content = `
        <h2 style="color: #1e293b; font-size: 24px; font-weight: 800;">Approved & Ready! 🎟️</h2>
        <p>Hi ${firstName},</p>
        <p>Your partner account is now active. You can start managing events immediately.</p>
        
        <div style="background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 24px; margin: 24px 0;">
            <p><strong>Login:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
        </div>
        
        <div style="text-align: center;">
            <a href="${loginUrl}" class="btn">Access Dashboard</a>
        </div>
        <p style="color: #e11d48; font-size: 13px; font-weight: 600; margin-top: 20px;">⚠️ Please update your temporary password immediately upon login.</p>
    `;
    return baseTemplate(content, branding);
};

/**
 * Booking Confirmation Template
 */
export const bookingConfirmationTemplate = (args: any, branding: any) => {
    const { customerName, itemName, totalAmount, bookingId, details } = args;
    const content = `
        <h2 style="color: #1e293b; font-size: 24px; font-weight: 800;">Booking Confirmed! ✅</h2>
        <p>Hi ${customerName},</p>
        <p>Your booking for <strong>${itemName}</strong> is confirmed. Thank you for choosing us!</p>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p><strong>Booking ID:</strong> ${bookingId}</p>
            <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
            ${details ? `<p><strong>Details:</strong> ${details}</p>` : ''}
        </div>
        
        <p>You can view your digital ticket in your profile section on our app or website.</p>
    `;
    return baseTemplate(content, branding);
};

/**
 * Partner Request Received Template (For Applicants)
 */
export const partnerRequestReceivedTemplate = (args: { firstName: string; lastName: string; category: string; role: string }, branding: any) => {
    const { firstName, lastName, category, role } = args;
    const content = `
        <h2 style="color: #1e293b; font-size: 24px; font-weight: 800;">Partner Request Received</h2>
        <div class="greeting">Hi ${firstName} ${lastName},</div>
        <div class="message">
            Thank you for applying to become a Partner! Your request has been successfully submitted and is currently under review by our administration team.
            We aim to process all applications rapidly and will reach out to you within 24-48 hours.
        </div>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
                <span style="font-size: 14px; font-weight: 600; color: #64748b; text-transform: uppercase;">Category</span>
                <span style="font-size: 15px; font-weight: 700; color: #0f172a;">${category}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
                <span style="font-size: 14px; font-weight: 600; color: #64748b; text-transform: uppercase;">Role Type</span>
                <span style="font-size: 15px; font-weight: 700; color: #0f172a;">${role}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span style="font-size: 14px; font-weight: 600; color: #64748b; text-transform: uppercase;">Status</span>
                <span style="font-size: 15px; font-weight: 700; color: #f59e0b;">Under Review</span>
            </div>
        </div>
        
        <p>If you have any immediate questions, feel free to contact our partner support team. We look forward to working with you!</p>
    `;
    return baseTemplate(content, branding);
};

/**
 * Admin Notification Template (Internal)
 */
export const adminNotificationTemplate = (args: { title: string; fields: { label: string; value: string }[]; actionUrl?: string; actionText?: string }, branding: any) => {
    const { title, fields, actionUrl, actionText } = args;
    const content = `
        <h2 style="color: #1e293b; font-size: 20px; font-weight: 800; margin-bottom: 20px;">${title}</h2>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
            ${fields.map(f => `
                <div style="margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
                    <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">${f.label}</div>
                    <div style="font-size: 15px; font-weight: 700; color: #0f172a;">${f.value}</div>
                </div>
            `).join('')}
        </div>
        ${actionUrl ? `
            <div style="text-align: center;">
                <a href="${actionUrl}" class="btn">${actionText || 'Review Details'}</a>
            </div>
        ` : ''}
    `;
    return baseTemplate(content, branding);
};

/**
 * KYC Invitation Template
 */
export const kycInvitationTemplate = (args: { firstName: string; kycUrl: string }, branding: any) => {
    const content = `
        <h2 style="color: #1e293b; font-size: 24px; font-weight: 800;">Action Required: Verification 🛡️</h2>
        <p>Hi ${args.firstName},</p>
        <p>Thank you for your interest in becoming an Event Organiser on our platform.</p>
        <p>To proceed with your application, we require you to complete the KYC (Know Your Customer) verification process. This helps us ensure a safe and trusted environment for all users.</p>
        
        <div style="text-align: center; margin: 40px 0;">
            <a href="${args.kycUrl}" class="btn">Complete KYC Check</a>
        </div>
        
        <div style="background: #fefce8; border: 1px solid #fef08a; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #854d0e; font-size: 14px;"><strong>Note:</strong> You will need your PAN card, Aadhar card, and bank details ready to complete the submission.</p>
        </div>
        
        <p style="font-size: 14px; color: #64748b;">If you have any questions, feel free to reply to this email.</p>
    `;
    return baseTemplate(content, branding);
};

/**
 * KYC Completion Notification (For Admin)
 */
export const kycCompletedNotificationTemplate = (args: { name: string; email: string }, branding: any) => {
    const siteUrl = branding?.siteUrl || "https://bookmyticket.net";
    const content = `
        <h2 style="color: #1e293b; font-size: 20px; font-weight: 800;">KYC Documents Received</h2>
        <p>Partner <strong>${args.name}</strong> (${args.email}) has submitted their KYC documents.</p>
        <p>Please review the application and approve or reject it in the admin dashboard.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${siteUrl}/admin" class="btn">Review Application</a>
        </div>
    `;
    return baseTemplate(content, branding);
};

/**
 * Subscription Welcome Template
 */
export const subscriptionWelcomeTemplate = (branding: any) => {
    const content = `
        <h2 style="color: #1e293b; font-size: 24px; font-weight: 800;">You're on the list! ✉️</h2>
        <p>Thanks for subscribing to our newsletter! You'll now be the first to know about:</p>
        <ul style="color: #475569; line-height: 1.6; margin: 20px 0;">
            <li>Early bird ticket access</li>
            <li>Exclusive partner discounts</li>
            <li>New event launches in your city</li>
        </ul>
        <p>We promise not to spam you. Welcome to the BookMyTicket community!</p>
    `;
    return baseTemplate(content, branding);
};

/**
 * Security Alert Template
 */
export const securityAlertTemplate = (args: { dateStr: string; ip: string; location: string; userAgent: string }, branding: any) => {
    const { dateStr, ip, location, userAgent } = args;
    const safeUserAgent = userAgent.length > 80 ? userAgent.substring(0, 80) + '...' : userAgent;
    const content = `
        <h2 style="color: #1e293b; font-size: 24px; font-weight: 800;">Suspicious Sign-in Attempt 🔒</h2>
        <p>We noticed a failed sign-in attempt on your BookMyTicket account. Below are the details:</p>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                <tr>
                    <td style="color: #64748b; padding: 8px 0; width: 110px; vertical-align: top;"><strong>Date & Time</strong></td>
                    <td style="color: #1e293b; padding: 8px 0;">${dateStr} IST</td>
                </tr>
                <tr>
                    <td style="color: #64748b; padding: 8px 0; vertical-align: top;"><strong>IP Address</strong></td>
                    <td style="color: #1e293b; padding: 8px 0;">${ip}</td>
                </tr>
                <tr>
                    <td style="color: #64748b; padding: 8px 0; vertical-align: top;"><strong>Location</strong></td>
                    <td style="color: #1e293b; padding: 8px 0;">${location}</td>
                </tr>
                <tr>
                    <td style="color: #64748b; padding: 8px 0; vertical-align: top;"><strong>Device</strong></td>
                    <td style="color: #1e293b; padding: 8px 0;">${safeUserAgent}</td>
                </tr>
            </table>
        </div>

        <p>If this was you, no action is needed. If you do not recognise this activity, we recommend securing your account immediately.</p>
        
        <div style="text-align: center; margin: 40px 0;">
            <a href="https://bookmyticket.net/signin?mode=forgot" class="btn">Secure My Account</a>
        </div>
        <p style="font-size: 14px; color: #64748b;">This is an automated security notification. If you need help, contact us at <a href="mailto:hello@bookmyticket.net" style="color: #f43f5e; text-decoration: none;">hello@bookmyticket.net</a></p>
    `;
    return baseTemplate(content, branding);
};

export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("emailTemplates").collect();
    },
});

export const add = mutation({
    args: {
        identifier: v.string(),
        name: v.string(),
        subject: v.string(),
        body: v.string(),
        autoSend: v.boolean(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("emailTemplates", {
            ...args,
            updatedAt: Date.now(),
        });
    },
});

export const patch = mutation({
    args: {
        id: v.id("emailTemplates"),
        identifier: v.optional(v.string()),
        name: v.optional(v.string()),
        subject: v.optional(v.string()),
        body: v.optional(v.string()),
        autoSend: v.optional(v.boolean()),
    },
    handler: async (ctx, { id, ...args }) => {
        return await ctx.db.patch(id, {
            ...args,
            updatedAt: Date.now(),
        });
    },
});

export const remove = mutation({
    args: { id: v.id("emailTemplates") },
    handler: async (ctx, args) => {
        return await ctx.db.delete(args.id);
    },
});
