import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("pages").order("asc").collect();
    },
});

export const getPublished = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("pages")
            .filter((q) => q.eq(q.field("showInFooter"), true))
            .order("asc")
            .collect();
    },
});

export const getBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("pages")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();
    },
});

export const create = mutation({
    args: {
        title: v.string(),
        slug: v.string(),
        content: v.string(),
        showInFooter: v.boolean(),
        order: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("pages", {
            ...args,
            updatedAt: Date.now(),
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("pages"),
        title: v.optional(v.string()),
        slug: v.optional(v.string()),
        content: v.optional(v.string()),
        showInFooter: v.optional(v.boolean()),
        order: v.optional(v.number()),
    },
    handler: async (ctx, { id, ...args }) => {
        await ctx.db.patch(id, {
            ...args,
            updatedAt: Date.now(),
        });
    },
});

export const remove = mutation({
    args: { id: v.id("pages") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
