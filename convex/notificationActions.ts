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
    },
    handler: async (ctx, args) => {
        const { eventId, title, organiserName, date, location } = args;

        // 1. Fetch all recipients
        const [users, organisers, subscribers] = await Promise.all([
            ctx.runQuery(api.users.list),
            ctx.runQuery(api.organisers.list),
            ctx.runQuery(api.subscribers.list),
        ]);

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

        const branding = await ctx.runQuery(api.siteBranding.get) as any;
        const siteUrl = branding?.siteUrl || "https://bookmyticket.vercel.app";
        let brandLogo = branding?.logoUrl || "/logo.png";
        if (brandLogo.startsWith("/")) {
            brandLogo = `${siteUrl}${brandLogo}`;
        }
        const brandNameDisplay = branding?.name || "BookMyTicket";

        const eventLink = `${siteUrl}/event/${eventId}`;
        const message = `Hello! A new event "${title}" has been created by ${organiserName}. 
Date: ${date || "To be announced"}
Location: ${location || "To be announced"}
Check it out here: ${eventLink}`;

        const htmlMessage = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <img src="${brandLogo}" alt="${brandNameDisplay}" style="max-height: 70px; width: auto; margin-bottom: 25px; color: #333; font-size: 24px; font-weight: bold;">
                <h2 style="color: #f844a4;">New Event Alert!</h2>
                <p>Hello,</p>
                <p>We are excited to announce a new event on ${brandNameDisplay}:</p>
                <div style="background: #fdf2f8; padding: 15px; border-radius: 8px; border-left: 4px solid #f844a4;">
                    <strong style="font-size: 18px;">${title}</strong><br/>
                    Organised by: ${organiserName}<br/>
                    Date: ${date || "To be announced"}<br/>
                    Location: ${location || "To be announced"}
                </div>
                <p style="margin-top: 20px;">
                    <a href="${eventLink}" style="background: #f844a4; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Event Details</a>
                </p>
                <p>Best regards,<br/>The BookMyTicket Team</p>
            </div>
        `;

        // 2. Send Emails
        const emailPromises = Array.from(emailRecipients).map((to) => 
            ctx.runAction(api.emailActions.sendEmail, {
                to,
                subject: `New Event: ${title}`,
                html: htmlMessage,
                settings: emailSettings,
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

        await Promise.allSettled([...emailPromises, ...whatsappPromises]);

        return { success: true, emailCount: emailRecipients.size, whatsappCount: whatsappRecipients.size };
    },
});
