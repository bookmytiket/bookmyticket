import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAvailability = query({
    args: { vendorId: v.string() },
    handler: async (ctx, args) => {
        const profile = await ctx.db
            .query("vendorProfiles")
            .withIndex("by_organiserId", (q) => q.eq("organiserId", args.vendorId))
            .unique();
        
        const bookings = await ctx.db
            .query("vendorBookings")
            .withIndex("by_vendorId", (q) => q.eq("vendorId", args.vendorId))
            .collect();

        return {
            blockedDates: profile?.blockedDates || [],
            confirmedBookings: bookings.filter(b => b.status === "confirmed"),
        };
    },
});

export const toggleBlockDate = mutation({
    args: { vendorId: v.string(), date: v.string() },
    handler: async (ctx, args) => {
        const profile = await ctx.db
            .query("vendorProfiles")
            .withIndex("by_organiserId", (q) => q.eq("organiserId", args.vendorId))
            .unique();
        
        if (!profile) throw new Error("Vendor profile not found");

        const blockedDates = profile.blockedDates || [];
        const newBlockedDates = blockedDates.includes(args.date)
            ? blockedDates.filter(d => d !== args.date)
            : [...blockedDates, args.date];

        await ctx.db.patch(profile._id, { blockedDates: newBlockedDates });
    },
});
