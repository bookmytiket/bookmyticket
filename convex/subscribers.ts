import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { subscriptionWelcomeTemplate } from "./emailTemplates";

export const add = mutation({
    args: {
        email: v.string(),
        phone: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const email = args.email.trim().toLowerCase();
        const branding = await ctx.db.query("siteBranding").first();
        
        const existing = await ctx.db
            .query("subscribers")
            .withIndex("by_email", (q) => q.eq("email", email))
            .unique();

        if (existing) {
            if (existing.status === "Unsubscribed") {
                await ctx.db.patch(existing._id, { status: "Active", updatedAt: Date.now() } as any);
            }
            // Trigger standardized welcome email
            await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
                to: email,
                subject: `Welcome to the Club!`,
                html: subscriptionWelcomeTemplate(branding)
            });
            return existing._id;
        }

        const subscriberId = await ctx.db.insert("subscribers", {
            email,
            phone: args.phone,
            status: "Active",
            createdAt: Date.now(),
        });

        // Send welcome email to new subscribers
        await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
            to: email,
            subject: `Welcome to the Club!`,
            html: subscriptionWelcomeTemplate(branding)
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
