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

// Helper for hashing in Convex (V8)
async function hashPassword(password: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const hashExistingPasswords = mutation({
    args: {},
    handler: async (ctx) => {
        const organisers = await ctx.db.query("organisers").collect();
        let orgCount = 0;
        for (const org of organisers) {
            if (org.password && org.password.length !== 64) {
                const hashed = await hashPassword(org.password);
                await ctx.db.patch(org._id, { password: hashed });
                orgCount++;
            }
        }

        const staffList = await ctx.db.query("staff").collect();
        let staffCount = 0;
        for (const staff of staffList) {
            if (staff.password && staff.password.length !== 64) {
                const hashed = await hashPassword(staff.password);
                await ctx.db.patch(staff._id, { password: hashed });
                staffCount++;
            }
        }

        const userList = await ctx.db.query("users").collect();
        let userCount = 0;
        for (const user of userList) {
            if (user.password && user.password.length !== 64) {
                const hashed = await hashPassword(user.password);
                await ctx.db.patch(user._id, { password: hashed });
                userCount++;
            }
        }

        return {
            organisersHashed: orgCount,
            staffHashed: staffCount,
            usersHashed: userCount
        };
    },
});
