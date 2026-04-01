import { mutation } from "./_generated/server";

export default mutation(async (ctx) => {
    // 1. Create User
    const userId = await ctx.db.insert("users", {
        email: "mehendi@bookmyticket.com",
        password: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
        role: "organiser",
        createdAt: Date.now()
    });

    const user = await ctx.db.get(userId);

    // 2. Create Organiser record
    const orgId = await ctx.db.insert("organisers", {
        userId: "mehendi@bookmyticket.com",
        name: "Mehendi by Sara",
        category: "Mehandi Artist"
    });

    // 3. Create Vendor Profile
    await ctx.db.insert("vendorProfiles", {
        organiserId: "mehendi@bookmyticket.com",
        category: "Mehandi Artist",
        bio: "Expert in bridal and traditional Mehendi designs.",
        advancedSettings: {
            experience: "5",
            serviceLocations: "Mumbai, Pune",
            profileImage: "https://images.unsplash.com/photo-1596704017254-9b1210630b65?q=80&w=200&auto=format&fit=crop"
        },
        portfolio: [],
        pricing: [],
        updatedAt: Date.now()
    });

    return "Success";
});
