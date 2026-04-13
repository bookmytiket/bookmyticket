import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { eventNotificationTemplate, welcomeTemplate, partnerApprovalTemplate, bookingConfirmationTemplate, subscriptionWelcomeTemplate } from "./emailTemplates";

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
        const rawSiteUrl = branding?.siteUrl || "https://bookmyticket.net";
        const siteUrl = (rawSiteUrl.includes("localhost") || rawSiteUrl.includes("vercel.app")) ? "https://bookmyticket.net" : rawSiteUrl;
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

        const htmlMessage = eventNotificationTemplate({
            title,
            organiserName,
            date,
            location,
            imageUrl,
            eventLink,
        }, branding);

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
        const rawSiteUrl = branding?.siteUrl || "https://bookmyticket.net";
        const siteUrl = (rawSiteUrl.includes("localhost") || rawSiteUrl.includes("vercel.app")) ? "https://bookmyticket.net" : rawSiteUrl;
        let brandLogo = branding?.logoUrl || "/logo.png";
        if (brandLogo.startsWith("/")) {
            brandLogo = `${siteUrl}${brandLogo}`;
        }
        const brandNameDisplay = branding?.name || "BookMyTicket";

        const htmlMessage = welcomeTemplate(fullName, branding);

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
        const rawSiteUrl = branding?.siteUrl || "https://bookmyticket.net";
        const siteUrl = (rawSiteUrl.includes("localhost") || rawSiteUrl.includes("vercel.app")) ? "https://bookmyticket.net" : rawSiteUrl;
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
                        Need help? <a href="mailto:hello@bookmyticket.net" class="support-link">hello@bookmyticket.net</a>
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
        const brandNameDisplay = branding?.name || "BookMyTicket";

        console.log(`[Notification] Sending welcome email to ${email}...`);
        
        const result: any = await ctx.runAction(api.emailActions.sendEmail, {
            to: email,
            subject: `Welcome to ${brandNameDisplay}`,
            html: subscriptionWelcomeTemplate(branding),
        });

        if (result.success) {
            await ctx.runMutation(api.notifications.send, {
                subject: `Email Sent: ${email}`,
                message: `Successfully sent welcome email to ${email}.`,
                target: "users"
            });
        }
        return result;
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

        const htmlContent = bookingConfirmationTemplate({
            customerName: name,
            itemName: turfName,
            totalAmount: amountPaid,
            bookingId: bookingId,
            details: `Slot: ${date} at ${time} (${participantCount} players)`
        }, branding);

        // 1. Send Email
        const emailPromise = ctx.runAction(api.emailActions.sendEmail, {
            to: email,
            subject: `Booking Confirmed: ${turfName}`,
            html: htmlContent,
        }).catch(err => console.error("Email failed:", err));

        // 2. Send WhatsApp
        let whatsappPromise = Promise.resolve();
        const whatsappSettings = await ctx.runQuery(api.whatsappSettings.get) as any;
        if (phone && whatsappSettings && whatsappSettings.isActive && whatsappSettings.accountSid && whatsappSettings.authToken) {
            const mapsUrl = (lat && lng) ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : null;
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

export const sendPartnerApprovalCredentials = action({
    args: {
        email: v.string(),
        firstName: v.string(),
        password: v.string(),
        phone: v.string(),
    },
    handler: async (ctx, args) => {
        const { email, firstName, password, phone } = args;

        const branding = await ctx.runQuery(api.siteBranding.get) as any;
        const rawSiteUrl = branding?.siteUrl || "https://bookmyticket.net";
        const siteUrl = (rawSiteUrl.includes("localhost") || rawSiteUrl.includes("vercel.app")) ? "https://bookmyticket.net" : rawSiteUrl;
        let brandLogo = branding?.logoUrl || "/logo.png";
        if (brandLogo && brandLogo.startsWith("/")) brandLogo = `${siteUrl}${brandLogo}`;
        const brandNameDisplay = branding?.name || "BookMyTicket";

        // 1. Email Notification (Premium Gradient-Based Template)
        const emailHtml = partnerApprovalTemplate({
            firstName,
            email,
            password,
            loginUrl: `${siteUrl}/signin`,
        }, branding);

        await ctx.runAction(api.emailActions.sendEmail, {
            to: email,
            subject: `Welcome to ${brandNameDisplay} - Your Partner Account Credentials`,
            html: emailHtml,
        });

        // 2. SMS Notification (via Twilio)
        const settings = await ctx.runQuery(api.whatsappSettings.get) as any;
        if (settings && settings.isActive && settings.accountSid && settings.authToken && settings.fromNumber) {
            const smsMessage = `Your ${brandNameDisplay} partner account is approved!\nLogin: ${email}\nPassword: ${password}\nLogin here: ${siteUrl}/signin`;
            
            try {
                const cleanPhone = phone.replace(/\D/g, "");
                const formattedPhone = cleanPhone.startsWith("+") ? cleanPhone : `+${cleanPhone}`;
                
                const auth = Buffer.from(`${settings.accountSid}:${settings.authToken}`).toString("base64");
                await fetch(`https://api.twilio.com/2010-04-01/Accounts/${settings.accountSid}/Messages.json`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Authorization": `Basic ${auth}`
                    },
                    body: new URLSearchParams({
                        To: formattedPhone,
                        From: settings.fromNumber, // Assuming fromNumber is set in settings
                        Body: smsMessage
                    })
                });
                console.log(`✅ Credentials SMS sent to ${formattedPhone}`);
            } catch (smsError) {
                console.error("❌ Failed to send credentials SMS:", smsError);
            }
        }

        return { success: true };
    },
});
