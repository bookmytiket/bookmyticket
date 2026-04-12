"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { securityAlertTemplate } from "./emailTemplates";

export const sendFailedLoginAlert = action({
    args: {
        identifier: v.string(),
        ip: v.string(),
        userAgent: v.string(),
        timestamp: v.number(),
    },
    handler: async (ctx, args) => {
        const { identifier, ip, userAgent, timestamp } = args;

        // 1. Audit Log: Record that we are processing a security alert
        await ctx.runMutation(api.systemLogs.create, {
            type: "auth_alert",
            message: `Processing failed login alert for identifier: ${identifier}`,
            details: { ip, userAgent, timestamp }
        });

        // 2. GeoIP Lookup with Timeout Safeguard
        let location = "Unknown Location";
        try {
            const geoPromise = fetch(`http://ip-api.com/json/${ip}`).then(async res => {
                const data = await res.json();
                return data.status === "success" ? `${data.city}, ${data.country}` : "Unknown Location";
            });

            const timeoutPromise = new Promise<string>((resolve) => 
                setTimeout(() => resolve("Location Lookup Timeout"), 3000)
            );

            location = await Promise.race([geoPromise, timeoutPromise]);
            console.log(`📍 [SECURITY ALERT] Location determined: ${location}`);
        } catch (err) {
            console.error("❌ [SECURITY ALERT] GeoIP lookup failed:", err);
            location = "Lookup Error";
        }

        // 3. Get User Email (Identifier might be username or email)
        const user = await ctx.runQuery(api.auth.getUserByIdentifier, { identifier });
        if (!user || !user.email) {
            console.log(`ℹ️  [SECURITY ALERT] No alert sent: identifier "${identifier}" does not correspond to a valid active user.`);
            return { success: false, error: "User not found" };
        }

        console.log(`🛡️  [SECURITY ALERT] Preparing failed login alert for ${user.email}...`);
        const dateStr = new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        // 4. Get branding for the template (logo + gradient header)
        const branding = await ctx.runQuery(api.siteBranding.get);

        // 5. Build email using the centralized template
        const html = securityAlertTemplate({ dateStr, ip, location, userAgent }, branding);

        await ctx.runAction(api.emailActions.sendEmail, {
            to: user.email,
            subject: "Unrecognised sign-in attempt on your BookMyTicket account",
            html: html
        });

        return { success: true };
    },
});
