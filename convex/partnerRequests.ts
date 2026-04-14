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
        const adminEmail = "bookmytiket.io@gmail.com";

        // Notify Admin
        await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
            to: adminEmail,
            subject: `New Partner Request: ${args.firstName} ${args.lastName}`,
            html: adminNotificationTemplate({
                title: "New Partner Application",
                fields: [
                    { label: "Type", value: args.type === "organiser" ? "Event Organiser" : "Professional Service" },
                    { label: "Name", value: `${args.firstName} ${args.lastName}` },
                    { label: "Email", value: args.email.toLowerCase() },
                    { label: "Phone", value: args.phone },
                    { label: "Category", value: args.category },
                ],
                actionText: "Review in Admin Panel"
            }, branding)
        });

        // Notify User
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

export const getById = query({
    args: { id: v.id("partnerRequests") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    }
});

export const getAll = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("partnerRequests").order("desc").collect();
    }
});

export const initiateKyc = mutation({
    args: { id: v.id("partnerRequests") },
    handler: async (ctx, args) => {
        const request = await ctx.db.get(args.id);
        if (!request) throw new Error("Request not found");
        if (request.type !== "organiser") throw new Error("KYC only required for Event Organisers");

        await ctx.db.patch(args.id, { status: "KYC Pending" });

        const branding = await ctx.db.query("siteBranding").first();
        const siteUrl = branding?.siteUrl || "https://bookmyticket.net";

        // Send KYC Invitation Email
        await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
            to: request.email,
            subject: "Action Required: Complete Your KYC Onboarding",
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>KYC Onboarding Required</h2>
                    <p>Hi ${request.firstName},</p>
                    <p>To proceed with your Event Organiser application, we need you to provide some additional verification documents.</p>
                    <div style="margin: 30px 0;">
                        <a href="${siteUrl}/partner-kyc/${args.id}" style="background: #8000ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Complete KYC Now</a>
                    </div>
                    <p>If you have any questions, please reply to this email.</p>
                </div>
            `
        });
    }
});

export const submitKycForRequest = mutation({
    args: {
        id: v.id("partnerRequests"),
        kycDetails: v.object({
            panNumber: v.optional(v.string()),
            panFile: v.optional(v.string()),
            aadharFile: v.optional(v.string()),
            chequeFile: v.optional(v.string()),
            beneficiaryName: v.optional(v.string()),
            bankName: v.optional(v.string()),
            accountNumber: v.optional(v.string()),
            ifscCode: v.optional(v.string()),
            accountType: v.optional(v.string()),
            agreementAccepted: v.boolean(),
        })
    },
    handler: async (ctx, args) => {
        const request = await ctx.db.get(args.id);
        if (!request) throw new Error("Request not found");

        await ctx.db.patch(args.id, {
            status: "KYC Completed",
            kycDetails: args.kycDetails
        });

        // Notify Admin of KYC completion
        const branding = await ctx.db.query("siteBranding").first();
        await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
            to: "bookmytiket.io@gmail.com",
            subject: `KYC Completed: ${request.firstName} ${request.lastName}`,
            html: `<p>Partner ${request.firstName} ${request.lastName} has submitted their KYC documents. Please review and approve in the admin panel.</p>`
        });
    }
});

export const approve = mutation({
    args: { 
        id: v.id("partnerRequests"),
        password: v.string()
    },
    handler: async (ctx, args) => {
        const request = await ctx.db.get(args.id);
        if (!request) throw new Error("Request not found");
        
        if (request.type === "organiser" && request.status !== "KYC Completed") {
            throw new Error("Event Organisers must complete KYC before approval");
        }

        const hashedPassword = await hashPassword(args.password);

        // 1. Create Organiser/Vendor Account
        await ctx.db.insert("organisers", {
            userId: request.email,
            password: hashedPassword,
            name: `${request.firstName} ${request.lastName}`,
            firstName: request.firstName,
            lastName: request.lastName,
            category: request.category,
            kycStatus: request.type === "organiser" ? "Verified" : "Active",
            isApproved: true,
            walletBalance: 0,
            kycDetails: request.kycDetails as any,
        });

        // 2. Update Request Status
        await ctx.db.patch(args.id, { status: "Approved" });

        // 3. Send Credentials
        await ctx.scheduler.runAfter(0, api.notificationActions.sendPartnerApprovalCredentials, {
            email: request.email,
            firstName: request.firstName,
            password: args.password,
            phone: request.phone,
        });

        return { success: true };
    },
});

export const remove = mutation({
    args: { id: v.id("partnerRequests") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
        return true;
    }
});
