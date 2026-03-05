import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const migrateOrganisers = mutation({
    args: {},
    handler: async (ctx) => {
        const config = await ctx.db
            .query("systemConfig")
            .withIndex("by_key", (q) => q.eq("key", "admin_organizers"))
            .unique();

        if (!config || !config.value) return "No organisers to migrate";

        const organisers = Array.isArray(config.value) ? config.value : JSON.parse(config.value);

        for (const org of organisers) {
            // Check if already exists to avoid duplicates
            const existing = await ctx.db
                .query("organisers")
                .filter((q) => q.eq(q.field("userId"), org.email))
                .unique();

            if (!existing) {
                await ctx.db.insert("organisers", {
                    userId: org.email,
                    name: org.username,
                    kycStatus: org.status || "Active",
                    walletBalance: parseInt(String(org.balance || "0").replace(/[^\d]/g, "")) || 0,
                });
            }
        }

        // Optionally clear the old config to prevent re-migration
        // await ctx.db.delete(config._id);

        return `Migrated ${organisers.length} organisers`;
    },
});
