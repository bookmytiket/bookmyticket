import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    handler: async (ctx) => {
        return await ctx.db.query("admins").order("desc").collect();
    },
});

export const create = mutation({
    args: {
        fullName: v.string(),
        username: v.string(),
        password: v.string(),
        email: v.string(),
        role: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("admins")
            .withIndex("by_username", (q) => q.eq("username", args.username))
            .unique();
        if (existing) throw new Error("Username already exists");

        return await ctx.db.insert("admins", {
            ...args,
            status: "Active",
            createdAt: Date.now(),
        });
    },
});

export const updateStatus = mutation({
    args: {
        id: v.id("admins"),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { status: args.status });
    },
});

export const remove = mutation({
    args: { id: v.id("admins") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const seedInitialAdmin = mutation({
    args: {},
    handler: async (ctx) => {
        const username = "bookmyticket-admin";
        const password = "D0n+$h@rE2k26"; // In a real app, this should be pre-hashed or set via secure env
        
        const existing = await ctx.db
            .query("admins")
            .withIndex("by_username", (q) => q.eq("username", username))
            .unique();
            
        if (!existing) {
            await ctx.db.insert("admins", {
                fullName: "Master Admin",
                username: username,
                password: password,
                email: "admin@bookmyticket.com",
                role: "Admin",
                status: "Active",
                createdAt: Date.now(),
            });
            return "Master admin seeded successfully";
        }
        return "Master admin already exists";
    },
});
