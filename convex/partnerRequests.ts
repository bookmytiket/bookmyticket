import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { hashPassword } from "./utils";
import { partnerRequestReceivedTemplate, adminNotificationTemplate } from "./emailTemplates";

export const submitRequest = mutation({
    args: {
        type: v.string(), // "organiser" | "professional_service"
        firstName: v.string(),
        lastName: v.string(),
        email: v.string(),
        phone: v.string(),
        category: v.string(),
        role: v.string(),
        remarks: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        // 1. Insert into Database
        const requestId = await ctx.db.insert("partnerRequests", {
            type: args.type,
            firstName: args.firstName,
            lastName: args.lastName,
            email: args.email.toLowerCase(),
            phone: args.phone,
            category: args.category,
            role: args.role,
            remarks: args.remarks || "",
            status: "Pending",
            createdAt: Date.now(),
        });

        const branding = await ctx.db.query("siteBranding").first();
        const rawSiteUrl = branding?.siteUrl || "https://bookmyticket.net";
        const siteUrl = (rawSiteUrl.includes("localhost") || rawSiteUrl.includes("vercel.app")) ? "https://bookmyticket.net" : rawSiteUrl;
        
        const adminEmail = "bookmytiket.io@gmail.com";

        // 2. Notify the Admin asynchronously
        await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
            to: adminEmail,
            subject: `New Partner Request: ${args.firstName} ${args.lastName}`,
            html: adminNotificationTemplate({
                title: "New Partner Application",
                fields: [
                    { label: "Name", value: `${args.firstName} ${args.lastName}` },
                    { label: "Email", value: args.email.toLowerCase() },
                    { label: "Phone", value: args.phone },
                    { label: "Category", value: args.category },
                    { label: "Role Type", value: args.role },
                    { label: "Remarks", value: args.remarks || "None" },
                ],
                actionUrl: `${siteUrl}/admin`,
                actionText: "Review in Admin Panel"
            }, branding)
        });

        // 3. Schedule Email Notification to the User asynchronously
        await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
            to: args.email.toLowerCase(),
            subject: "Your Partner Request is Under Review",
            html: partnerRequestReceivedTemplate({
                firstName: args.firstName,
                lastName: args.lastName,
                category: args.category,
                role: args.role
            }, branding)
        });

        return requestId;
    }
});

// Admin Queries
export const getAll = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("partnerRequests")
            .order("desc")
            .collect();
    }
});

export const getByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const all = await ctx.db
            .query("partnerRequests")
            .order("desc")
            .collect();
        return all.filter(r =>
            r.email?.toLowerCase() === args.email.toLowerCase() ||
            r.phone?.toLowerCase() === args.email.toLowerCase()
        );
    }
});

export const updateStatus = mutation({
    args: {
        id: v.id("partnerRequests"),
        status: v.string(), // "Approved" | "Rejected"
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            status: args.status
        });
        return true;
    }
});

export const remove = mutation({
    args: { id: v.id("partnerRequests") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
        return true;
    }
});

export const approve = mutation({
    args: { 
        id: v.id("partnerRequests"),
        password: v.string()
    },
    handler: async (ctx, args) => {
        const { id, password } = args;
        const request = await ctx.db.get(id);
        if (!request) throw new Error("Request not found");
        if (request.status !== "Pending") throw new Error("Request is not pending or already processed");

        // Hash the manual password
        const hashedPassword = await hashPassword(password);

        // 1. Create Organiser Account
        await ctx.db.insert("organisers", {
            userId: request.email,
            password: hashedPassword,
            name: `${request.firstName} ${request.lastName}`,
            firstName: request.firstName,
            lastName: request.lastName,
            kycStatus: "KYC Pending",
            walletBalance: 0,
        });

        // 2. Update Request Status
        await ctx.db.patch(id, {
            status: "Approved",
        });

        // 3. Schedule Credentials Delivery (Email + SMS)
        await ctx.scheduler.runAfter(0, api.notificationActions.sendPartnerApprovalCredentials, {
            email: request.email,
            firstName: request.firstName,
            password: password, // Sending plain password to notification action for the email/sms
            phone: request.phone,
        });

        return { success: true };
    },
});
