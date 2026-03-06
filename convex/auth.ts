import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

export const forgotPassword = mutation({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        // Also check organisers if not found in users
        const organiser = user ? null : await ctx.db
            .query("organisers")
            .filter((q) => q.eq(q.field("userId"), args.email))
            .unique();

        if (!user && !organiser) {
            // We don't want to reveal if an email exists or not for security, 
            // but for this app's context, let's just return null if not found.
            return null;
        }

        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expires = Date.now() + 3600000; // 1 hour

        await ctx.db.insert("passwordResetTokens", {
            email: args.email,
            token,
            expires,
        });

        // In a real app, we'd trigger an email action here.
        // For now, we'll log it to a system configuration for "easy retrieval" during testing/demo.
        await ctx.db.insert("systemConfig", {
            key: `reset_link_${args.email}`,
            value: `http://localhost:3000/reset-password?token=${token}&email=${args.email}`,
        });

        console.log(`Reset link for ${args.email}: http://localhost:3000/reset-password?token=${token}&email=${args.email}`);

        return true;
    },
});

export const verifyResetToken = query({
    args: { token: v.string(), email: v.string() },
    handler: async (ctx, args) => {
        const resetEntry = await ctx.db
            .query("passwordResetTokens")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .unique();

        if (!resetEntry || resetEntry.email !== args.email || resetEntry.expires < Date.now()) {
            return false;
        }
        return true;
    },
});

export const resetPassword = mutation({
    args: { token: v.string(), email: v.string(), newPassword: v.string() },
    handler: async (ctx, args) => {
        const resetEntry = await ctx.db
            .query("passwordResetTokens")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .unique();

        if (!resetEntry || resetEntry.email !== args.email || resetEntry.expires < Date.now()) {
            throw new Error("Invalid or expired reset token");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (user) {
            await ctx.db.patch(user._id, { password: args.newPassword });
        } else {
            const organiser = await ctx.db
                .query("organisers")
                .filter((q) => q.eq(q.field("userId"), args.email))
                .unique();
            if (organiser) {
                await ctx.db.patch(organiser._id, { password: args.newPassword });
            } else {
                throw new Error("User not found");
            }
        }

        // Cleanup token
        await ctx.db.delete(resetEntry._id);

        // Cleanup debug link
        const debugLink = await ctx.db.query("systemConfig").filter(q => q.eq(q.field("key"), `reset_link_${args.email}`)).first();
        if (debugLink) await ctx.db.delete(debugLink._id);

        return true;
    },
});
