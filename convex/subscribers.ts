import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

export const add = mutation({
    args: {
        email: v.string(),
        phone: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const email = args.email.trim().toLowerCase();
        
        const existing = await ctx.db
            .query("subscribers")
            .withIndex("by_email", (q) => q.eq("email", email))
            .unique();

        if (existing) {
            if (existing.status === "Unsubscribed") {
                await ctx.db.patch(existing._id, { status: "Active", updatedAt: Date.now() } as any);
            }
            return existing._id;
        }

        const subscriberId = await ctx.db.insert("subscribers", {
            email,
            phone: args.phone,
            status: "Active",
            createdAt: Date.now(),
        });

        // Construct welcome email (matching the successful OTP flow)
        const branding = await ctx.db.query("siteBranding").first();
        const siteUrl = branding?.siteUrl || "https://www.bookmyticket.net";
        let brandLogo = branding?.logoUrl || "/logo.png";
        if (brandLogo.startsWith("/")) brandLogo = `${siteUrl}${brandLogo}`;
        const brandNameDisplay = branding?.name || "Nexvant Technologies";

        const welcomeHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; color: #1e293b;">
                <!-- Hero Section -->
                <div style="background: linear-gradient(135deg, #f844a4 0%, #a855f7 100%); padding: 50px 30px; text-align: center; color: #ffffff;">
                    <img src="${brandLogo}" alt="${brandNameDisplay}" style="height: 50px; margin-bottom: 20px; filter: brightness(0) invert(1);">
                    <h1 style="font-size: 28px; font-weight: 800; margin: 0 0 10px; letter-spacing: -0.01em;">Welcome to the Club! 🎉</h1>
                    <p style="font-size: 16px; opacity: 0.9; margin: 0;">We're thrilled to have you with us.</p>
                </div>
                
                <!-- Content Section -->
                <div style="padding: 40px 30px; line-height: 1.6;">
                    <p style="font-size: 16px; margin-bottom: 25px;">Hello! Thank you for subscribing to <strong>${brandNameDisplay}</strong>. You'll now receive exclusive updates on the best events happening in your city.</p>
                    
                    <div style="background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #f1f5f9; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px; font-size: 18px; color: #0f172a;">Ready to Explore?</h4>
                        <p style="margin: 0 0 20px; font-size: 14px; color: #64748b;">Browse thousands of upcoming events, from intimate gigs to major festivals.</p>
                        <a href="${siteUrl}/events" style="display: inline-block; padding: 12px 25px; background: #f844a4; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 14px;">Browse Events Now</a>
                    </div>

                    <div style="background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #f1f5f9; border-left: 4px solid #a855f7;">
                        <h4 style="margin: 0 0 10px; font-size: 18px; color: #0f172a;">Become a Partner</h4>
                        <p style="margin: 0 0 20px; font-size: 14px; color: #64748b;">Organise events or provide services? Join our network of professional vendors.</p>
                        <a href="${siteUrl}/signup" style="display: inline-block; padding: 12px 25px; border: 2px solid #a855f7; color: #a855f7; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 14px;">Join as Partner</a>
                    </div>
                </div>
                
                <!-- Footer Section -->
                <div style="padding: 30px; text-align: center; color: #94a3b8; font-size: 12px; background: #fcfcfc; border-top: 1px solid #f1f5f9;">
                    <p style="margin: 0;">© 2026 ${brandNameDisplay}. All rights reserved.</p>
                    <p style="margin: 5px 0;">This email was sent to you because you subscribed at <a href="${siteUrl}" style="color: #6366f1; text-decoration: none;">${brandNameDisplay}</a></p>
                </div>
            </div>
        `;

        await ctx.db.insert("notificationsLog", {
            subject: `Welcome to ${brandNameDisplay}! 🎉`,
            message: `Sent welcome email to ${email}`,
            target: "users",
            timestamp: Date.now()
        });

        await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, { 
            to: email,
            subject: `Welcome to ${brandNameDisplay}`,
            html: welcomeHtml
        });

        return subscriberId;
    },
});

export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("subscribers")
            .filter((q) => q.eq(q.field("status"), "Active"))
            .collect();
    },
});

export const unsubscribe = mutation({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const email = args.email.trim().toLowerCase();
        const existing = await ctx.db
            .query("subscribers")
            .withIndex("by_email", (q) => q.eq("email", email))
            .unique();
        if (existing) {
            await ctx.db.patch(existing._id, { status: "Unsubscribed" });
        }
    },
});

export const remove = mutation({
    args: { id: v.id("subscribers") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
