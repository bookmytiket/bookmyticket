import { v } from "convex/values";
import { mutation, query, action, MutationCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { otpTemplate, resetPasswordTemplate } from "./emailTemplates";

export const forgotPassword = mutation({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const email = args.email.trim().toLowerCase();
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .unique();

        // Also check organisers if not found in users
        const organiser = user ? null : await ctx.db
            .query("organisers")
            .filter((q) => q.eq(q.field("userId"), args.email))
            .unique();

        // Also check serviceProviders if not found in users or organisers
        const serviceProvider = (user || organiser) ? null : await ctx.db
            .query("serviceProviders")
            .filter((q) => q.eq(q.field("userId"), args.email))
            .unique();

        if (!user && !organiser && !serviceProvider) {
            // We don't want to reveal if an email exists or not for security, 
            // but for this app's context, let's just return null if not found.
            return null;
        }

        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expires = Date.now() + 1800000; // 30 minutes

        await ctx.db.insert("passwordResetTokens", {
            email: args.email,
            token,
            expires,
        });

        const branding = await ctx.db.query("siteBranding").first();
        const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || branding?.siteUrl || "https://bookmyticket.net";
        const resetLink = `${siteUrl}/reset-password?token=${token}&email=${args.email}`;

        // Trigger the email action
        await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
            to: args.email,
            subject: `Reset Your Password`,
            html: resetPasswordTemplate(resetLink, branding),
        });

        // Store it in systemConfig for backward compatibility with testing if needed
        await ctx.db.insert("systemConfig", {
            key: `reset_link_${args.email}`,
            value: resetLink,
        });

        return true;
    },
});

export const verifyResetToken = query({
    args: { token: v.string(), email: v.string() },
    handler: async (ctx, args) => {
        const resetEntry = await ctx.db
            .query("passwordResetTokens")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .unique();

        if (!resetEntry || resetEntry.email !== args.email || resetEntry.expires < Date.now()) {
            return false;
        }
        return true;
    },
});

export const resetPassword = mutation({
    args: { token: v.string(), email: v.string(), newPassword: v.string() },
    handler: async (ctx, args) => {
        const resetEntry = await ctx.db
            .query("passwordResetTokens")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .unique();

        if (!resetEntry || resetEntry.email !== args.email || resetEntry.expires < Date.now()) {
            throw new Error("Invalid or expired reset token");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (user) {
            await ctx.db.patch(user._id, { password: args.newPassword });
        } else {
            const organiser = await ctx.db
                .query("organisers")
                .filter((q) => q.eq(q.field("userId"), args.email))
                .unique();
            if (organiser) {
                await ctx.db.patch(organiser._id, { password: args.newPassword });
            } else {
                const serviceProvider = await ctx.db
                    .query("serviceProviders")
                    .filter((q) => q.eq(q.field("userId"), args.email))
                    .unique();
                if (serviceProvider) {
                    await ctx.db.patch(serviceProvider._id, { password: args.newPassword });
                } else {
                    throw new Error("User not found");
                }
            }
        }

        // Cleanup token
        await ctx.db.delete(resetEntry._id);

        // Cleanup debug link
        const debugLink = await ctx.db.query("systemConfig").filter(q => q.eq(q.field("key"), `reset_link_${args.email}`)).first();
        if (debugLink) await ctx.db.delete(debugLink._id);

        return true;
    },
});

export const updateForcedPassword = mutation({
    args: { email: v.string(), newPassword: v.string() },
    handler: async (ctx, args) => {
        const email = args.email.trim().toLowerCase();
        const organiser = await ctx.db
            .query("organisers")
            .withIndex("by_userId", (q) => q.eq("userId", email))
            .unique();

        if (!organiser) {
            const serviceProvider = await ctx.db
                .query("serviceProviders")
                .withIndex("by_userId", (q) => q.eq("userId", email))
                .unique();
            
            if (!serviceProvider) throw new Error("Account not found");
            
            await ctx.db.patch(serviceProvider._id, { 
                password: args.newPassword,
                forcePasswordChange: false 
            });
            return true;
        }
        
        await ctx.db.patch(organiser._id, { 
            password: args.newPassword,
            forcePasswordChange: false 
        });

        return true;
    },
});

// Internal helper for OTP generation and delivery
async function internalSendOTP(ctx: MutationCtx, rawEmail: string, purpose: string) {
    const email = rawEmail.trim().toLowerCase();
    // Generate a strictly 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString().padStart(6, '0');
    const expires = Date.now() + 600000; // 10 minutes

    const existing = await ctx.db
        .query("otps")
        .withIndex("by_email", (q) => q.eq("email", email))
        .filter((q) => q.eq(q.field("purpose"), purpose))
        .collect();
    for (const doc of existing) await ctx.db.delete(doc._id);

    await ctx.db.insert("otps", { email, code: otp, expires, purpose });
    
    // Store in systemConfig for backward compatibility and easier debugging if email fails
    const configKey = `last_otp_${email}`;
    const existingConfig = await ctx.db.query("systemConfig").withIndex("by_key", q => q.eq("key", configKey)).first();
    if (existingConfig) {
        await ctx.db.patch(existingConfig._id, { value: otp });
    } else {
        await ctx.db.insert("systemConfig", { key: configKey, value: otp });
    }

    const branding = await ctx.db.query("siteBranding").first();
    const brandNameDisplay = branding?.name || "BookMyTicket";
    
    await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
        to: email,
        subject: `${otp} is your ${brandNameDisplay} verification code`,
        html: otpTemplate(otp, purpose === 'signup' ? 'Registration' : 'Login', branding),
    });
}

export const sendOTP = mutation({
    args: { email: v.string(), purpose: v.string() }, // "signup" | "login"
    handler: async (ctx, args) => {
        const email = args.email.trim().toLowerCase();
        await internalSendOTP(ctx, email, args.purpose);
        return true;
    },
});

export const testOTP = mutation({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        await internalSendOTP(ctx, args.email, "test");
        return "Check the Convex dashboard or terminal logs for the 6-digit OTP.";
    },
});

export const verifyOTPOnly = mutation({
    args: { email: v.string(), code: v.string(), purpose: v.string() },
    handler: async (ctx, args) => {
        const email = args.email.trim().toLowerCase();
        const otpEntry = await ctx.db
            .query("otps")
            .withIndex("by_email", (q) => q.eq("email", email))
            .filter((q) => q.eq(q.field("code"), args.code))
            .filter((q) => q.eq(q.field("purpose"), args.purpose))
            .unique();

        if (!otpEntry || otpEntry.expires < Date.now()) {
            throw new Error("Invalid or expired code.");
        }
        return true;
    },
});

export const verifyOTPAndCreateAccount = mutation({
    args: { 
        email: v.string(), 
        code: v.string(), 
        password: v.string(),
        fullName: v.string(),
        username: v.string(),
    },
    handler: async (ctx, args) => {
        const email = args.email.trim().toLowerCase();
        const otpEntry = await ctx.db
            .query("otps")
            .withIndex("by_email", (q) => q.eq("email", email))
            .filter((q) => q.eq(q.field("code"), args.code))
            .filter((q) => q.eq(q.field("purpose"), "signup"))
            .unique();

        if (!otpEntry || otpEntry.expires < Date.now()) {
            throw new Error("Invalid or expired OTP");
        }

        // Cleanup OTP
        await ctx.db.delete(otpEntry._id);

        // Check if user already exists
        const existing = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", args.email)).first();
        if (existing) throw new Error("Email already registered");

        // Create User
        const userId = await ctx.db.insert("users", {
            fullName: args.fullName,
            username: args.username,
            email: args.email,
            password: args.password, // Frontend should hash this before sending
            role: "user",
            status: "Active",
            createdAt: Date.now(),
        });

        await ctx.scheduler.runAfter(0, api.notificationActions.sendSignupGreeting, {
            email: args.email,
            fullName: args.fullName,
        });

        return userId;
    },
});

export const login = mutation({
    args: { 
        identifier: v.string(), 
        password: v.string(),
        ip: v.optional(v.string()),
        userAgent: v.optional(v.string()),
    }, // password is hashed
    handler: async (ctx, args) => {
        const identifier = args.identifier.trim().toLowerCase();
        const ip = args.ip || "Unknown IP";
        const userAgent = args.userAgent || "Unknown Device";
        const timestamp = Date.now();

        const logFailedAttempt = async () => {
            await ctx.db.insert("failedLoginAttempts", {
                identifier,
                ip,
                userAgent,
                timestamp,
            });
            // Schedule the security alert action
            await ctx.scheduler.runAfter(0, api.securityActions.sendFailedLoginAlert, {
                identifier,
                ip,
                userAgent,
                timestamp,
            });
        };

        // 1. PRIORITY: Check Admins table first (by username OR email)
        const teamMemberByUsername = await ctx.db
            .query("admins")
            .withIndex("by_username", (q) => q.eq("username", identifier))
            .unique();

        const teamMemberByEmail = !teamMemberByUsername ? await ctx.db
            .query("admins")
            .withIndex("by_email", (q) => q.eq("email", identifier))
            .unique() : null;

        const teamMember = teamMemberByUsername || teamMemberByEmail;

        if (teamMember) {
            if (teamMember.password === args.password) {
                if (teamMember.status === "Inactive") {
                    throw new Error("Account is inactive.");
                }
                await ctx.db.patch(teamMember._id, { lastLogin: Date.now() });
                const activeRole = teamMember.role === "Admin" ? "admin" : "admin_team";
                return { success: true, role: activeRole, data: teamMember };
            } else {
                await logFailedAttempt();
            }
        }

        // 2. PRIORITY: Check Staff table
        const staff = await ctx.db
            .query("staff")
            .withIndex("by_email", (q) => q.eq("email", identifier))
            .unique();

        if (staff) {
            if (staff.password === args.password) {
                return { success: true, role: "staff", data: staff };
            } else {
                await logFailedAttempt();
            }
        }

        // 3. PRIORITY: Check Organisers table — must come before Users
        // This prevents organisers who also have a user record from being
        // correctly routed through the OTP flow.
        const organiser = await ctx.db
            .query("organisers")
            .withIndex("by_userId", (q) => q.eq("userId", identifier))
            .unique();

        if (organiser) {
            if (organiser.password === args.password) {
                if (!organiser.isApproved) {
                    return { success: false, error: "Account approval is pending." };
                }
                if (organiser.kycStatus === "Banned" || organiser.kycStatus === "Rejected") {
                    return { success: false, error: "Account is restricted." };
                }
                return { success: true, role: "organiser", data: organiser };
            } else {
                await logFailedAttempt();
            }
        }

        // 3.5 PRIORITY: Check serviceProviders table
        const serviceProvider = await ctx.db
            .query("serviceProviders")
            .withIndex("by_userId", (q) => q.eq("userId", identifier))
            .unique();

        if (serviceProvider) {
            if (serviceProvider.password === args.password) {
                if (!serviceProvider.isApproved) {
                    return { success: false, error: "Account approval is pending." };
                }
                if (serviceProvider.kycStatus === "Banned" || serviceProvider.kycStatus === "Rejected") {
                    return { success: false, error: "Account is restricted." };
                }
                // Return 'organiser' role for service providers too, as they share the vendor-style dashboards
                // but we can distinguish them by their category/data if needed.
                return { success: true, role: "organiser", data: serviceProvider };
            } else {
                await logFailedAttempt();
            }
        }

        // 4. Check Users table last — triggers OTP for regular users
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identifier))
            .unique() ||
            await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", identifier))
            .unique();

        if (user) {
            if (user.password === args.password) {
                if (user.status === "Banned" || user.status === "Inactive") {
                    throw new Error("Account is restricted.");
                }
                // Trigger login OTP for regular users
                await internalSendOTP(ctx, user.email, "login");
                return { success: true, needsOtp: true, email: user.email };
            } else {
                await logFailedAttempt();
            }
        }

        return { success: false, error: "Invalid username / email or password." };
    },
});

export const verifyLoginOTP = mutation({
    args: { email: v.string(), code: v.string() },
    handler: async (ctx, args) => {
        const otpEntry = await ctx.db
            .query("otps")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .filter((q) => q.eq(q.field("code"), args.code))
            .filter((q) => q.eq(q.field("purpose"), "login"))
            .unique();

        if (!otpEntry || otpEntry.expires < Date.now()) {
            throw new Error("Invalid or expired OTP");
        }

        // Cleanup OTP
        await ctx.db.delete(otpEntry._id);

        // Check Users table
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (user) {
            await ctx.db.patch(user._id, { lastLogin: Date.now() });
            
            // Even if found in users, check if they are an active organiser
            const organiser = await ctx.db
                .query("organisers")
                .withIndex("by_userId", (q) => q.eq("userId", args.email))
                .unique();
            
            if (
                organiser &&
                organiser.isApproved &&
                organiser.kycStatus !== "Banned" &&
                organiser.kycStatus !== "Rejected" &&
                (organiser.type !== "event_organiser" || organiser.kycStatus === "Verified")
            ) {
                return { success: true, role: "organiser", data: organiser };
            }

            return { success: true, role: "user", data: user };
        }

        // If not in users, check Organisers table specifically
        const organiserOnly = await ctx.db
            .query("organisers")
            .withIndex("by_userId", (q) => q.eq("userId", args.email))
            .unique();

        if (organiserOnly) {
            if (!organiserOnly.isApproved) {
                throw new Error("Account approval is pending.");
            }
            if (organiserOnly.kycStatus === "Banned" || organiserOnly.kycStatus === "Rejected") {
                throw new Error("Account is restricted.");
            }
            return { success: true, role: "organiser", data: organiserOnly };
        }

        // If not in organisers, check serviceProviders specifically
        const serviceProviderOnly = await ctx.db
            .query("serviceProviders")
            .withIndex("by_userId", (q) => q.eq("userId", args.email))
            .unique();

        if (serviceProviderOnly) {
            if (!serviceProviderOnly.isApproved) {
                throw new Error("Account approval is pending.");
            }
            if (serviceProviderOnly.kycStatus === "Banned" || serviceProviderOnly.kycStatus === "Rejected") {
                throw new Error("Account is restricted.");
            }
            return { success: true, role: "organiser", data: serviceProviderOnly };
        }

        throw new Error("User not found");
    },
});

export const getRecentFailedAttempts = query({
    args: { identifier: v.string(), since: v.number() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("failedLoginAttempts")
            .withIndex("by_identifier", (q) => q.eq("identifier", args.identifier))
            .filter((q) => q.gte(q.field("timestamp"), args.since))
            .collect();
    },
});

export const getUserByIdentifier = query({
    args: { identifier: v.string() },
    handler: async (ctx, args) => {
        const identifier = args.identifier.trim().toLowerCase();
        
        // Check all roles
        const admin = await ctx.db.query("admins").withIndex("by_username", (q) => q.eq("username", identifier)).unique()
                      || await ctx.db.query("admins").withIndex("by_email", (q) => q.eq("email", identifier)).unique();
        if (admin) return admin;

        const staff = await ctx.db.query("staff").withIndex("by_email", (q) => q.eq("email", identifier)).unique();
        if (staff) return staff;

        const organiser = await ctx.db.query("organisers").withIndex("by_userId", (q) => q.eq("userId", identifier)).unique();
        if (organiser) return { ...organiser, email: organiser.userId };

        const serviceProvider = await ctx.db.query("serviceProviders").withIndex("by_userId", (q) => q.eq("userId", identifier)).unique();
        if (serviceProvider) return { ...serviceProvider, email: serviceProvider.userId };

        const user = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", identifier)).unique()
                     || await ctx.db.query("users").withIndex("by_username", (q) => q.eq("username", identifier)).unique();
        if (user) return user;

        return null;
    },
});



