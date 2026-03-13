import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("users").collect();
    },
});

export const getByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();
    },
});

export const getByIdentifier = query({
    args: { identifier: v.string() },
    handler: async (ctx, args) => {
        const identifier = args.identifier.trim().toLowerCase();
        
        const emailMatch = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identifier))
            .unique();
        if (emailMatch) return emailMatch;

        return await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", identifier))
            .unique();
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        username: v.optional(v.string()),
        password: v.string(),
        role: v.string(),
        createdAt: v.string(),
    },
    handler: async (ctx, args) => {
        const email = args.email.trim().toLowerCase();
        const username = args.username?.trim().toLowerCase();

        const existingEmail = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .unique();
        if (existingEmail) {
            throw new Error("ACCOUNT_EXISTS");
        }
        if (username) {
            const existingUsername = await ctx.db
                .query("users")
                .withIndex("by_username", (q) => q.eq("username", username))
                .unique();
            if (existingUsername) {
                throw new Error("USERNAME_EXISTS");
            }
        }
        return await ctx.db.insert("users", { ...args, email, username });
    },
});

export const updatePassword = mutation({
    args: { email: v.string(), password: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();
        if (!user) {
            throw new Error("User not found");
        }
        await ctx.db.patch(user._id, { password: args.password });
    },
});
