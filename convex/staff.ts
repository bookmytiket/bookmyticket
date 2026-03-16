import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
const crypto = (globalThis as any).crypto;

async function hashPassword(password: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const list = query({
    args: { organiserId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("staff")
            .withIndex("by_organiserId", (q) => q.eq("organiserId", args.organiserId))
            .collect();
    },
});

export const createStaff = mutation({
    args: {
        email: v.string(),
        password: v.string(),
        name: v.string(),
        organiserId: v.string(),
    },
    handler: async (ctx, args) => {
        const email = args.email.trim().toLowerCase();
        const existing = await ctx.db
            .query("staff")
            .withIndex("by_email", (q) => q.eq("email", email))
            .unique();
        if (existing) {
            throw new Error("Staff with this email already exists");
        }
        const hashedPassword = await hashPassword(args.password);
        return await ctx.db.insert("staff", {
            ...args,
            email,
            password: hashedPassword,
            createdAt: Date.now(),
        });
    },
});

export const updateStaff = mutation({
    args: {
        id: v.id("staff"),
        email: v.optional(v.string()),
        password: v.optional(v.string()),
        name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        if (updates.password) {
            updates.password = await hashPassword(updates.password);
        }
        await ctx.db.patch(id, updates);
    },
});

export const deleteStaff = mutation({
    args: { id: v.id("staff") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const verifyCredentials = query({
    args: { email: v.string(), password: v.string() },
    handler: async (ctx, args) => {
        const email = args.email.trim().toLowerCase();
        const staff = await ctx.db
            .query("staff")
            .withIndex("by_email", (q) => q.eq("email", email))
            .unique();
        if (staff && staff.password === args.password) {
            return { success: true, staff };
        }
        return { success: false, error: "Invalid email or password" };
    },
});
