import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
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
    handler: async (ctx, args) => {
        const { id, ...fields } = args;
        await ctx.db.patch(id, {
            ...fields,
            updatedAt: Date.now(),
        });
    },
});

export const remove = mutation({
    args: { id: v.id("emailTemplates") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const deduplicate = mutation({
    args: {},
    handler: async (ctx) => {
        const allTemplates = await ctx.db.query("emailTemplates").collect();
        const seen = new Map();
        let deletedCount = 0;

        // Sort by updatedAt descending to keep the most recent
        const sortedTemplates = allTemplates.sort((a, b) => b.updatedAt - a.updatedAt);

        for (const template of sortedTemplates) {
            if (seen.has(template.identifier)) {
                await ctx.db.delete(template._id);
                deletedCount++;
            } else {
                seen.set(template.identifier, true);
            }
        }
        return { deletedCount };
    },
});
