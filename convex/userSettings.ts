import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const updateLocation = mutation({
    args: {
        userId: v.string(), // identifier (email/username)
        city: v.string(),
        hierarchy: v.optional(v.object({
            country: v.optional(v.string()),
            state: v.optional(v.string()),
            district: v.optional(v.string()),
            city: v.optional(v.string()),
            lat: v.optional(v.number()),
            lng: v.optional(v.number()),
        })),
    },
    handler: async (ctx, args) => {
        const identifier = args.userId.trim().toLowerCase();
        
        // Find user by email or username
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identifier))
            .unique() || 
            await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", identifier))
            .unique();

        if (user) {
            await ctx.db.patch(user._id, {
                selectedCity: args.city,
                locationHierarchy: args.hierarchy
            });
            return { success: true };
        }

        // If it's an organiser, we can also store their preference if wanted, 
        // but typically search location is for public users.
        const organiser = await ctx.db
            .query("organisers")
            .withIndex("by_userId", (q) => q.eq("userId", identifier))
            .unique();
        
        if (organiser) {
            // Logic for organiser if needed
            return { success: true, message: "Organiser preference handled" };
        }

        return { success: false, error: "User not found" };
    },
});
