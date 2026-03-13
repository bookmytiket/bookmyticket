import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const assignUsername = mutation({
    args: { userId: v.id("users"), username: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, { username: args.username });
    },
});
