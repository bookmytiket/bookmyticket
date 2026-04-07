import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a manual block for a slot
export const create = mutation({
    args: {
        turfId: v.id("turfs"),
        date: v.string(),
        startTime: v.string(),
        endTime: v.string(),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Isolation check would be handled by common middleware or by the caller ensuring turfId is owned
        return await ctx.db.insert("turfManualBlocks", {
            ...args,
            createdAt: Date.now(),
        });
    },
});

// Delete a manual block
export const remove = mutation({
    args: { id: v.id("turfManualBlocks") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

// List blocks for a specific turf
export const listByTurf = query({
    args: { turfId: v.id("turfs") },
    handler: async (ctx, args) => {
        const blocks = await ctx.db
            .query("turfManualBlocks")
            .withIndex("by_turfId", (q) => q.eq("turfId", args.turfId))
            .collect();
        
        return blocks.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    },
});

// List blocks for a vendor's ALL turfs
export const listByVendor = query({
    args: { organiserId: v.string() },
    handler: async (ctx, args) => {
        const turfs = await ctx.db
            .query("turfs")
            .withIndex("by_organiserId", (q) => q.eq("organiserId", args.organiserId))
            .collect();
        
        const turfIds = turfs.map((t) => t._id);
        const allBlocks = await ctx.db.query("turfManualBlocks").collect();
        
        return allBlocks.filter((b) => turfIds.includes(b.turfId));
    },
});
