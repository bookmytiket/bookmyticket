import { mutation } from "./_generated/server";
import { hashPassword } from "./utils";

export const createLocalTestUser = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("organisers").filter(q => q.eq(q.field("userId"), "sriharini5501@gmail.com")).first();
    if (existing) {
        // If they already somehow exist, try migrating them to the new type just in case
        await ctx.db.patch(existing._id, { type: "professional_service", kycStatus: "Active" });
        return "User existed, patched them to professional_service";
    }

    await ctx.db.insert("organisers", {
      userId: "sriharini5501@gmail.com",
      password: await hashPassword("A@123b@123"),
      name: "Sri Harini",
      firstName: "Sri",
      lastName: "Harini",
      type: "professional_service",
      category: "Photography",
      kycStatus: "Active",
      isApproved: true,
      walletBalance: 0,
      kycDetails: {} as any,
    });
    return "Local test user sriharini5501@gmail.com created!";
  }
});
