import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Mutation to handle organiser requests

export const create = mutation({
    args: {
        firstName: v.string(),
        lastName: v.string(),
        email: v.string(),
        phone: v.string(),
        category: v.string(),
        role: v.string(),
        remarks: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("organiserRequests", {
            ...args,
            status: "Pending",
            createdAt: Date.now(),
        });
    },
});

export const list = query({
    handler: async (ctx) => {
        return await ctx.db.query("organiserRequests").order("desc").collect();
    },
});

export const updateStatus = mutation({
    args: {
        id: v.id("organiserRequests"),
        status: v.string(), // "Approved" or "Rejected"
    },
    handler: async (ctx, args) => {
        return await ctx.db.patch(args.id, { status: args.status });
    },
});

export const approve = mutation({
    args: { id: v.id("organiserRequests") },
    handler: async (ctx, args) => {
        const request = await ctx.db.get(args.id);
        if (!request) throw new Error("Request not found");
        if (request.status !== "Pending") throw new Error("Request is not pending");

        // Generate a random 8-character temporary password
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
        let tempPassword = "";
        for (let i = 0; i < 8; i++) {
            tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Create the organiser account
        await ctx.db.insert("organisers", {
            userId: request.email,
            password: tempPassword,
            name: `${request.firstName} ${request.lastName}`,
            kycStatus: "Start Onboarding",
            walletBalance: 0,
        });

        // Update the request status
        await ctx.db.patch(args.id, { status: "Approved" });

        const branding = await ctx.db.query("siteBranding").first();
        const siteUrl = branding?.siteUrl || "https://bookmyticket.vercel.app";
        let brandLogo = branding?.logoUrl || "/logo.png";
        if (brandLogo.startsWith("/")) {
            brandLogo = `${siteUrl}${brandLogo}`;
        }
        const brandNameDisplay = branding?.name || "BookMyTicket";

        // Send Email with credentials
        await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
            to: request.email,
            subject: `Organiser Account Approved - ${brandNameDisplay}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px 20px; border: 1px solid #eee; border-radius: 12px; text-align: center;">
                <img src="${brandLogo}" alt="${brandNameDisplay}" style="max-height: 70px; width: auto; margin-bottom: 25px; color: #333; font-size: 24px; font-weight: bold;">
                    <h2 style="color: #333; margin-bottom: 20px;">Welcome to ${brandNameDisplay}!</h2>
                    <p style="color: #555; font-size: 16px; text-align: left;">Hi ${request.firstName},</p>
                    <p style="color: #555; font-size: 16px; text-align: left; margin-bottom: 25px;">Your request to become an organiser has been <strong>approved</strong>. You can now log in to your dashboard using these credentials:</p>
                    
                    <div style="background-color: #fdf2f8; padding: 20px; border-radius: 10px; margin-bottom: 25px; text-align: left; border: 1px solid #ff007f33;">
                        <p style="margin: 5px 0; color: #333;"><strong>Email:</strong> ${request.email}</p>
                        <p style="margin: 5px 0; color: #333;"><strong>Password:</strong> <code style="background: #fff; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>
                    </div>

                    <p style="color: #555; text-align: left; margin-bottom: 30px;">Please log in, update your password, and complete your KYC onboarding immediately.</p>
                    
                    <a href="${siteUrl}/signin" style="display: inline-block; background: linear-gradient(to right, #ff007f, #8000ff); color: white; padding: 14px 35px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 10px rgba(255, 0, 127, 0.2);">Go to Dashboard</a>
                </div>
            `
        });

        return tempPassword;
    },
});
