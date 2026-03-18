import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const seedCategories = mutation({
    args: {},
    handler: async (ctx) => {
        const categories = [
            { name: "Live Concerts", slug: "live-concerts", icon: "🎵", count: 0, order: 1 },
            { name: "Standup Comedy", slug: "standup-comedy", icon: "🎭", count: 0, order: 2 },
            { name: "Sporting Events", slug: "sporting-events", icon: "🏆", count: 0, order: 3 },
            { name: "Movie Premieres", slug: "movie-premieres", icon: "🎬", count: 0, order: 4 },
            { name: "Workshops", slug: "workshops", icon: "🎪", count: 0, order: 5 },
            { name: "Podcasts Live", slug: "podcasts-live", icon: "🎙️", count: 0, order: 6 },
            { name: "Nightlife", slug: "nightlife", icon: "🎉", count: 0, order: 7 },
            { name: "Food Festivals", slug: "food-festivals", icon: "🍽️", count: 0, order: 8 },
            { name: "Exclusive Experiences", slug: "exclusive-experiences", icon: "✨", count: 0, order: 9 },
        ];

        const existing = await ctx.db.query("categories").collect();
        if (existing.length > 0) {
            console.log("Categories table already has data. Skipping seed.");
            return;
        }

        for (const cat of categories) {
            await ctx.db.insert("categories", {
                ...cat,
                updatedAt: Date.now(),
            });
        }
        console.log("Successfully seeded categories.");
    },
});
