import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    handler: async (ctx) => {
        return await ctx.db.query("notifications").order("desc").collect();
    },
});

export const send = mutation({
    args: {
        subject: v.string(),
        message: v.string(),
        target: v.string(),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("notifications", {
            subject: args.subject,
            message: args.message,
            target: args.target,
            timestamp: Date.now(),
        });
        return id;
    },
});
