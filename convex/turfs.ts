import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all turfs for a vendor
export const getByOrganiserId = query({
    args: { organiserId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("turfs")
            .withIndex("by_organiserId", (q) => q.eq("organiserId", args.organiserId))
            .collect();
    },
});

// For backward compatibility during migration
export const getByVendor = query({
    args: { organiserId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("turfs")
            .withIndex("by_organiserId", (q) => q.eq("organiserId", args.organiserId))
            .collect();
    },
});

// Get a single turf by ID
export const getById = query({
    args: { turfId: v.id("turfs") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.turfId);
    },
});

// Create or Update a turf
export const saveTurf = mutation({
    args: {
        id: v.optional(v.id("turfs")),
        organiserId: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        location: v.optional(v.string()),
        address: v.optional(v.string()),
        images: v.optional(v.array(v.string())),
        amenities: v.optional(v.array(v.string())),
        pricePerHour: v.number(),
        advanceAmount: v.optional(v.number()),
        
        // New Pricing Fields
        pricingType: v.optional(v.string()),
        maxCapacity: v.optional(v.number()),
        pricePerPerson: v.optional(v.number()),
        pricingTiers: v.optional(v.array(v.object({ 
            min: v.number(), 
            max: v.number(), 
            price: v.number() 
        }))),

        status: v.string(),
    },
    handler: async (ctx, args) => {
        const { id, ...fields } = args;
        const now = Date.now();

        if (id) {
            await ctx.db.patch(id, { ...fields, updatedAt: now });
            return id;
        } else {
            return await ctx.db.insert("turfs", {
                ...fields,
                createdAt: now,
                updatedAt: now,
            });
        }
    },
});

// Delete a turf (and its slots)
export const deleteTurf = mutation({
    args: { id: v.id("turfs") },
    handler: async (ctx, args) => {
        const slots = await ctx.db
            .query("turfSlots")
            .withIndex("by_turfId", (q) => q.eq("turfId", args.id))
            .collect();
        
        for (const slot of slots) {
            await ctx.db.delete(slot._id);
        }

        await ctx.db.delete(args.id);
    },
});

// --- Slot Management ---

// Get patterns (weekly slots) for a turf
export const getSlots = query({
    args: { turfId: v.id("turfs") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("turfSlots")
            .withIndex("by_turfId", (q) => q.eq("turfId", args.turfId))
            .collect();
    },
});

// Save a slot pattern
export const saveSlot = mutation({
    args: {
        id: v.optional(v.id("turfSlots")),
        turfId: v.id("turfs"),
        dayOfWeek: v.number(),
        startTime: v.string(),
        endTime: v.string(),
        priceOverride: v.optional(v.number()),
        isActive: v.boolean(),
    },
    handler: async (ctx, args) => {
        const { id, ...fields } = args;
        if (id) {
            await ctx.db.patch(id, fields);
            return id;
        } else {
            return await ctx.db.insert("turfSlots", fields);
        }
    },
});

// Delete a slot pattern
export const deleteSlot = mutation({
    args: { id: v.id("turfSlots") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

// List all active turfs (for user browsing)
export const listActive = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("turfs")
            .filter((q) => q.eq(q.field("status"), "active"))
            .collect();
    },
});
