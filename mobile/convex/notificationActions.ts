"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

export const sendEventCreationNotifications = action({
    args: {
        eventId: v.id("events"),
        title: v.string(),
        organiserName: v.string(),
        date: v.optional(v.string()),
        location: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { eventId, title, organiserName, date, location, imageUrl } = args;

        // 1. Fetch all recipients
        console.log("Fetching recipients for event notification...");
        const [users, organisers, subscribers] = await Promise.all([
            ctx.runQuery((api.users as any).list, {}),
            ctx.runQuery((api.organisers as any).list, {}),
            ctx.runQuery((api.subscribers as any).list, {}),
        ]);
        console.log(`Found: ${users.length} users, ${organisers.length} organisers, ${subscribers.length} subscribers.`);

        const whatsappSettings = await ctx.runQuery(api.whatsappSettings.get) as any;
        const emailSettings = await ctx.runQuery(api.emailSettings.get) as any;

        const emailRecipients = new Set<string>();
        const whatsappRecipients = new Set<string>();

        // Organisers
        organisers.forEach((o: any) => {
            if (o.userId) emailRecipients.add(o.userId); // userId is email
            if (o.kycDetails?.mobile) whatsappRecipients.add(o.kycDetails.mobile);
        });

        // Users
        users.forEach((u: any) => {
            if (u.email) emailRecipients.add(u.email);
            if (u.phone) whatsappRecipients.add(u.phone);
        });

        // Subscribers
        subscribers.forEach((s: any) => {
            if (s.email) emailRecipients.add(s.email);
            if (s.phone) whatsappRecipients.add(s.phone);
        });

        console.log(`Unique recipients: ${emailRecipients.size} emails, ${whatsappRecipients.size} WhatsApp numbers.`);

        const branding = await ctx.runQuery(api.siteBranding.get) as any;
        const siteUrl = branding?.siteUrl || "https://bookmyticket.vercel.app";
        let brandLogo = branding?.logoUrl || "/logo.png";
        if (brandLogo.startsWith("/")) {
            brandLogo = `${siteUrl}${brandLogo}`;
        }
        const brandNameDisplay = branding?.name || "BookMyTicket";

        const eventLink = `${siteUrl}/events/detail?id=${eventId}`;
        const message = `Hello! A new event "${title}" has been created by ${organiserName}. 
Date: ${date || "To be announced"}
Location: ${location || "To be announced"}
Book your tickets here: ${eventLink}`;

        const htmlMessage = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    .email-container {
                        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border: 1px solid #e0e0e0;
                        border-radius: 16px;
                        overflow: hidden;
                    }
                    .header {
                        padding: 30px;
                        text-align: center;
                    }
                    .event-image {
                        width: 100%;
                        height: 300px;
                        object-fit: cover;
                        display: block;
                    }
                    .content {
                        padding: 30px;
                    }
                    .event-badge {
                        display: inline-block;
                        background: #fdf2f8;
                        color: #f844a4;
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 14px;
                        font-weight: 600;
                        margin-bottom: 12px;
                    }
                    .event-title {
                        font-size: 28px;
                        font-weight: 800;
                        color: #1a1a1a;
                        margin: 0 0 16px 0;
                        line-height: 1.2;
                    }
                    .details-card {
                        background: #f8f9fa;
                        border-radius: 12px;
                        padding: 20px;
                        margin-bottom: 25px;
                    }
                    .detail-row {
                        margin-bottom: 10px;
                        display: flex;
                        align-items: center;
                    }
                    .detail-label {
                        color: #666;
                        font-size: 14px;
                        width: 80px;
                        flex-shrink: 0;
                    }
                    .detail-value {
                        color: #333;
                        font-weight: 600;
                        font-size: 15px;
                    }
                    .cta-button {
                        display: block;
                        background: #f844a4; /* Fallback for older clients */
                        background: linear-gradient(135deg, #f844a4 0%, #a855f7 100%);
                        color: #ffffff !important;
                        text-align: center;
                        padding: 16px 32px;
                        text-decoration: none;
                        border-radius: 12px;
                        font-weight: 700;
                        font-size: 18px;
                        box-shadow: 0 4px 15px rgba(248, 68, 164, 0.3);
                        margin-top: 10px;
                    }
                    .footer {
                        padding: 24px;
                        background: #f8f9fa;
                        text-align: center;
                        color: #888;
                        font-size: 13px;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img src="${brandLogo}" alt="${brandNameDisplay}" style="max-height: 50px; width: auto;">
                    </div>
                    
                    ${imageUrl ? `<img src="${imageUrl}" class="event-image" alt="${title}">` : ''}
                    
                    <div class="content">
                        <span class="event-badge">NEW EVENT</span>
                        <h1 class="event-title">${title}</h1>
                        
                        <div class="details-card">
                            <div class="detail-row">
                                <span class="detail-label">Organiser</span>
                                <span class="detail-value">${organiserName}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Date</span>
                                <span class="detail-value">${date || "To be announced"}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Location</span>
                                <span class="detail-value">${location || "To be announced"}</span>
                            </div>
                        </div>
                        
                        <p style="color: #444; line-height: 1.6; margin-bottom: 24px;">
                            We have an exciting new event happening on <strong>${brandNameDisplay}</strong>! 
                            Don't miss out on this incredible experience. Get your tickets before they're gone!
                        </p>
                        
                        <a href="${eventLink}" class="cta-button">Book Now</a>
                    </div>
                    
                    <div class="footer">
                        <p>© 2026 ${brandNameDisplay}. All rights reserved.</p>
                        <p>You received this email because you are a registered member of ${brandNameDisplay}.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // 2. Send Emails
        const emailPromises = Array.from(emailRecipients).map((to) => 
            ctx.runAction(api.emailActions.sendEmail, {
                to,
                subject: `New Event: ${title}`,
                html: htmlMessage,
            })
        );

        // 3. Send WhatsApp Messages (Twilio example)
        let whatsappPromises: Promise<any>[] = [];
        if (whatsappSettings && whatsappSettings.isActive && whatsappSettings.accountSid && whatsappSettings.authToken) {
            whatsappPromises = Array.from(whatsappRecipients).map(async (phone) => {
                const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`; // Default to India if no prefix
                try {
                    const response = await fetch(
                        `https://api.twilio.com/2010-04-01/Accounts/${whatsappSettings.accountSid}/Messages.json`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded",
                                Authorization: "Basic " + Buffer.from(`${whatsappSettings.accountSid}:${whatsappSettings.authToken}`).toString("base64"),
                            },
                            body: new URLSearchParams({
                                To: `whatsapp:${formattedPhone}`,
                                From: whatsappSettings.fromNumber || "whatsapp:+14155238886", // Twilio sandbox number
                                Body: message,
                            }),
                        }
                    );
                    const result = await response.json();
                    if (!response.ok) console.error("WhatsApp error:", result);
                    return result;
                } catch (err) {
                    console.error("WhatsApp fetch error:", err);
                }
            });
        }

        const results = await Promise.allSettled([...emailPromises, ...whatsappPromises]);
        
        const failures = results.filter(r => r.status === "rejected");
        if (failures.length > 0) {
            console.error(`${failures.length} promises failed during notification dispatch.`);
            failures.forEach((f: any, i) => console.error(`Failure ${i}:`, f.reason));
        }

        const successes = results.filter(r => r.status === "fulfilled");
        console.log(`${successes.length} notifications dispatched successfully.`);

        return { success: true, emailCount: emailRecipients.size, whatsappCount: (whatsappRecipients as any).size };
    },
});

export const sendSignupGreeting = action({
    args: {
        email: v.string(),
        fullName: v.string(),
    },
    handler: async (ctx, args) => {
        const { email, fullName } = args;
        const branding = await ctx.runQuery(api.siteBranding.get) as any;
        const siteUrl = branding?.siteUrl || "https://bookmyticket.vercel.app";
        let brandLogo = branding?.logoUrl || "/logo.png";
        if (brandLogo.startsWith("/")) {
            brandLogo = `${siteUrl}${brandLogo}`;
        }
        const brandNameDisplay = branding?.name || "BookMyTicket";

        const htmlMessage = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
                <img src="${brandLogo}" alt="${brandNameDisplay}" style="max-height: 70px; width: auto; margin-bottom: 25px;">
                <h2 style="color: #ff007f;">Welcome to ${brandNameDisplay}!</h2>
                <p>Hello ${fullName},</p>
                <p>Thank you for joining ${brandNameDisplay}. We're thrilled to have you with us!</p>
                <p>You can now browse and book tickets for the most exciting events happening around you.</p>
                <p style="margin-top: 20px;">
                    <a href="${siteUrl}" style="background: #f844a4; background: linear-gradient(135deg, #f844a4 0%, #a855f7 100%); color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block;">Start Exploring Events</a>
                </p>
                <p style="margin-top: 30px;">Best regards,<br/>The ${brandNameDisplay} Team</p>
            </div>
        `;

        await ctx.runAction(api.emailActions.sendEmail, {
            to: email,
            subject: `Welcome to ${brandNameDisplay}!`,
            html: htmlMessage,
        });

        return { success: true };
    },
});

export const sendBulkGreetingToAll = action({
    args: {
        subject: v.string(),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        const { subject, message } = args;

        const [users, organisers, subscribers] = await Promise.all([
            ctx.runQuery((api.users as any).list, {}),
            ctx.runQuery((api.organisers as any).list, {}),
            ctx.runQuery((api.subscribers as any).list, {}),
        ]);

        const emailRecipients = new Set<string>();
        organisers.forEach((o: any) => { if (o.userId) emailRecipients.add(o.userId); });
        users.forEach((u: any) => { if (u.email) emailRecipients.add(u.email); });
        subscribers.forEach((s: any) => { if (s.email) emailRecipients.add(s.email); });

        const branding = await ctx.runQuery(api.siteBranding.get) as any;
        const siteUrl = branding?.siteUrl || "https://bookmyticket.vercel.app";
        let brandLogo = branding?.logoUrl || "/logo.png";
        if (brandLogo.startsWith("/")) {
            brandLogo = `${siteUrl}${brandLogo}`;
        }
        const brandNameDisplay = branding?.name || "BookMyTicket";

        const htmlMessage = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
                <img src="${brandLogo}" alt="${brandNameDisplay}" style="max-height: 70px; width: auto; margin-bottom: 25px;">
                <h2 style="color: #333;">${subject}</h2>
                <p>Hello,</p>
                <p>${message.replace(/\n/g, '<br/>')}</p>
                <p style="margin-top: 30px;">Best regards,<br/>The ${brandNameDisplay} Team</p>
            </div>
        `;

        const emailPromises = Array.from(emailRecipients).map((to) => 
            ctx.runAction(api.emailActions.sendEmail, {
                to,
                subject,
                html: htmlMessage,
            })
        );

        await Promise.allSettled(emailPromises);

        return { success: true, recipientCount: emailRecipients.size };
    },
});

export const testLatestEventNotification = action({
    args: {},
    handler: async (ctx): Promise<any> => {
        const events = await ctx.runQuery(api.events.getActiveEvents, {}) as any[];
        if (events.length === 0) return { success: false, error: "No events found" };
        
        // Sort by creation time descending if possible, or just take the last one
        const latestEvent = events[events.length - 1];
        
        const organizers = await ctx.runQuery((api.organisers as any).list, {}) as any[];
        const organiser = organizers.find((o: any) => o.userId === latestEvent.organiserId);

        return await ctx.runAction(api.notificationActions.sendEventCreationNotifications, {
            eventId: latestEvent._id,
            title: latestEvent.title,
            organiserName: organiser?.name || "An Organiser",
            date: latestEvent.date,
            location: latestEvent.location,
            imageUrl: latestEvent.img || latestEvent.bannerPreview,
        });
    },
});
