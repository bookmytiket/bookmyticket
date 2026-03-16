import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createMemory = mutation({
    args: {
        imageUrl: v.string(),
        altText: v.string(),
    },
    handler: async (ctx, args) => {
        const memoryId = await ctx.db.insert("memories", {
            imageUrl: args.imageUrl,
            altText: args.altText,
            createdAt: Date.now(),
        });
        return memoryId;
    },
});

export const updateMemory = mutation({
    args: {
        id: v.id("memories"),
        imageUrl: v.optional(v.string()),
        altText: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...fields } = args;
        await ctx.db.patch(id, fields);
    },
});

export const deleteMemory = mutation({
    args: { id: v.id("memories") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const getMemories = query({
    handler: async (ctx) => {
        return await ctx.db
            .query("memories")
            .order("desc")
            .collect();
    },
});
