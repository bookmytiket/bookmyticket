import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const get = query({
    handler: async (ctx) => {
        return await ctx.db.query("ticketSettings").first();
    },
});

export const update = mutation({
    args: {
        id: v.optional(v.id("ticketSettings")),
        companyName: v.string(),
        logoUrl: v.string(),
        importantInfo: v.string(),
        supportUrl: v.string(),
        sendViaEmail: v.boolean(),
        sendViaSms: v.boolean(),
        sendPdfWhatsApp: v.boolean(),
        autoApprove: v.boolean(),
        notifyOrganiser: v.boolean(),
        notifyUser: v.boolean(),
        invoicePrefix: v.string(),
    },
    handler: async (ctx, args) => {
        const { id, ...settings } = args;
        if (id) {
            await ctx.db.patch(id, { ...settings, updatedAt: Date.now() });
        } else {
            const existing = await ctx.db.query("ticketSettings").first();
            if (existing) {
                await ctx.db.patch(existing._id, { ...settings, updatedAt: Date.now() });
            } else {
                await ctx.db.insert("ticketSettings", { ...settings, updatedAt: Date.now() });
            }
        }
    },
});
