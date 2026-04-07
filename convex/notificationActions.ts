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
        const siteUrl = branding?.siteUrl || "https://bookmyticket.net";
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
        const siteUrl = branding?.siteUrl || "https://bookmyticket.net";
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
        const siteUrl = branding?.siteUrl || "https://bookmyticket.net";
        let brandLogo = branding?.logoUrl || "/logo.png";
        if (brandLogo.startsWith("/")) {
            brandLogo = `${siteUrl}${brandLogo}`;
        }
        const brandNameDisplay = branding?.name || "BookMyTicket";

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
                .header { background: linear-gradient(135deg, #f43f5e, #a855f7); padding: 40px 20px; text-align: center; }
                .logo { max-width: 150px; margin-bottom: 20px; }
                .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
                .content { padding: 40px 30px; }
                .message { font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 24px; white-space: pre-wrap; }
                .footer { background-color: #1e293b; padding: 30px 20px; text-align: center; }
                .footer-text { color: #94a3b8; font-size: 14px; margin-bottom: 16px; }
                .support-link { color: #38bdf8; text-decoration: none; font-weight: 600; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="${brandLogo}" alt="${brandNameDisplay} Logo" class="logo" onerror="this.style.display='none'">
                    <h1>${subject}</h1>
                </div>
                <div class="content">
                    <div class="message">${message.replace(/\n/g, '<br/>')}</div>
                </div>
                <div class="footer">
                    <div class="footer-text">
                        You are receiving this email because you subscribed to updates from ${brandNameDisplay}.
                    </div>
                    <div class="footer-text">
                        Need help? <a href="${siteUrl}/support" class="support-link">Contact Support</a>
                    </div>
                    <div class="footer-text" style="margin-bottom: 0; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} ${brandNameDisplay}. All rights reserved.
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        const promises = Array.from(emailRecipients).map(async (email) => {
            return await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
                to: email as string,
                subject,
                html: htmlContent
            });
        });

        await Promise.allSettled(promises);

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

export const sendSubscriptionWelcome = action({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args): Promise<any> => {
        const { email } = args;
        const branding = await ctx.runQuery(api.siteBranding.get) as any;
        const siteUrl = branding?.siteUrl || "https://bookmyticket.net";
        let brandLogo = branding?.logoUrl || "/logo.png";
        if (brandLogo.startsWith("/")) brandLogo = `${siteUrl}${brandLogo}`;
        const brandNameDisplay = "bookmyticket";

        // CLEAN MINIMAL VERSION - NO EMOJIS, SIMPLE INLINE STYLES, LOGO INCLUDED
        const welcomeHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <div style="background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                    <img src="${brandLogo}" alt="${brandNameDisplay}" style="max-height: 50px; width: auto;">
                </div>
                <div style="padding: 40px; color: #1e293b; line-height: 1.6; text-align: center;">
                    <h2 style="color: #0f172a; margin-top: 0; font-size: 24px;">Welcome to ${brandNameDisplay}!</h2>
                    <p style="font-size: 16px;">Thank you for subscribing to our newsletter.</p>
                    <p style="font-size: 16px; margin-bottom: 30px;">We're excited to have you in our community. You'll be the first to know about the most exciting events near you.</p>
                    
                    <a href="${siteUrl}/events" style="background-color: #f844a4; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 10px rgba(248, 68, 164, 0.2);">Browse Events</a>
                    
                    <div style="margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 30px;">
                        <p style="font-size: 14px; color: #64748b; margin: 0;">Join our network as a partner:</p>
                        <a href="${siteUrl}/signup" style="color: #f844a4; font-weight: 600; text-decoration: none;">Become a Partner →</a>
                    </div>
                </div>
                <div style="background-color: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9;">
                    © 2026 ${brandNameDisplay}. All rights reserved.<br/>
                    Visit us at <a href="${siteUrl}" style="color: #64748b; text-decoration: underline;">bookmyticket.net</a>
                </div>
            </div>
        `;

        console.log(`[Notification] Sending welcome email to ${email}...`);
        
        return await ctx.runAction(api.emailActions.sendEmail, {
            to: email,
            subject: `Welcome to ${brandNameDisplay}`,
            html: welcomeHtml,
        });
    },
});

export const sendToExistingSubscribers = action({
    args: {},
    handler: async (ctx): Promise<any> => {
        const subscribers = await ctx.runQuery(api.subscribers.list);
        console.log(`[Batch] Found ${subscribers.length} active subscribers.`);
        
        let successCount = 0;
        let failCount = 0;

        for (const sub of subscribers) {
            console.log(`[Batch] Sending to ${sub.email}...`);
            const result: any = await ctx.runAction(api.notificationActions.sendSubscriptionWelcome, { email: sub.email });
            if (result.success) {
                successCount++;
            } else {
                failCount++;
                console.error(`[Batch] Failed for ${sub.email}:`, result.error);
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        return { successCount, failCount };
    },
});

export const sendTurfBookingConfirmation = action({
    args: {
        bookingId: v.id("turfBookings"),
        email: v.string(),
        phone: v.string(),
        name: v.string(),
        turfName: v.string(),
        date: v.string(),
        time: v.string(),
        participantCount: v.number(),
        amountPaid: v.number(),
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { bookingId, email, phone, name, turfName, date, time, participantCount, amountPaid, lat, lng } = args;
        
        const branding = await ctx.runQuery(api.siteBranding.get) as any;
        const siteUrl = branding?.siteUrl || "https://bookmyticket.net";
        let brandLogo = branding?.logoUrl || "/logo.png";
        if (brandLogo.startsWith("/")) brandLogo = `${siteUrl}${brandLogo}`;
        const brandNameDisplay = branding?.name || "BookMyTicket";

        const mapsUrl = (lat && lng) ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : null;

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-bottom: 3px solid #f844a4;">
                    <img src="${brandLogo}" alt="${brandNameDisplay}" style="max-height: 50px; width: auto;">
                    <h2 style="color: #1e293b; margin-top: 20px;">Booking Confirmed! ✅</h2>
                </div>
                <div style="padding: 30px; color: #334155; line-height: 1.6;">
                    <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>
                    <p style="font-size: 16px;">Your booking for <strong>${turfName}</strong> has been confirmed successfully.</p>
                    
                    <div style="background-color: #f1f5f9; padding: 20px; border-radius: 10px; margin-top: 20px; margin-bottom: 25px;">
                        <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
                        <p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>
                        <p style="margin: 5px 0;"><strong>Participants:</strong> ${participantCount} players</p>
                        <p style="margin: 5px 0;"><strong>Paid Amount:</strong> ₹${amountPaid}</p>
                        <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${bookingId as string}</p>
                    </div>

                    ${mapsUrl ? `
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${mapsUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Navigate to Turf 📍</a>
                    </div>
                    ` : ''}
                </div>
                <div style="background-color: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 13px; border-top: 1px solid #f1f5f9;">
                    © 2026 ${brandNameDisplay}. All rights reserved.
                </div>
            </div>
        `;

        // 1. Send Email
        const emailPromise = ctx.runAction(api.emailActions.sendEmail, {
            to: email,
            subject: `Booking Confirmed: ${turfName}`,
            html: emailHtml,
        }).catch(err => console.error("Email failed:", err));

        // 2. Send WhatsApp
        let whatsappPromise = Promise.resolve();
        const whatsappSettings = await ctx.runQuery(api.whatsappSettings.get) as any;
        if (phone && whatsappSettings && whatsappSettings.isActive && whatsappSettings.accountSid && whatsappSettings.authToken) {
            const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
            
            let waMessage = `✅ *Booking Confirmed!*\n\nHi ${name}, your booking at *${turfName}* is confirmed.\n\n📅 Date: ${date}\n⏰ Time: ${time}\n👥 Players: ${participantCount}\n💰 Amount Paid: ₹${amountPaid}`;
            if (mapsUrl) waMessage += `\n\n📍 *Location:* ${mapsUrl}`;
            
            whatsappPromise = fetch(`https://api.twilio.com/2010-04-01/Accounts/${whatsappSettings.accountSid}/Messages.json`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: "Basic " + Buffer.from(`${whatsappSettings.accountSid}:${whatsappSettings.authToken}`).toString("base64"),
                },
                body: new URLSearchParams({
                    To: `whatsapp:${formattedPhone}`,
                    From: whatsappSettings.fromNumber || "whatsapp:+14155238886",
                    Body: waMessage,
                }),
            }).then(res => res.json()).catch(err => console.error("WhatsApp failed:", err));
        }

        await Promise.all([emailPromise, whatsappPromise]);
        return { success: true };
    },
});
