"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

export const sendFailedLoginAlert = action({
    args: {
        identifier: v.string(),
        ip: v.string(),
        userAgent: v.string(),
        timestamp: v.number(),
    },
    handler: async (ctx, args) => {
        const { identifier, ip, userAgent, timestamp } = args;

        // 1. Cooldown Check: Don't send more than one alert every 5 minutes for the same identifier
        const fiveMinutesAgo = timestamp - (5 * 60 * 1000);
        const recentAttempts = await ctx.runQuery(api.auth.getRecentFailedAttempts, { 
            identifier, 
            since: fiveMinutesAgo 
        });

        // If there's more than 1 recent attempt (the current one is already logged), 
        // it means we might have already sent an alert recently.
        // To be safe, we only send the alert on the FIRST failure in a window, or every 5th, etc.
        // Requirement says "immediate email notification", so we'll send it if no alert was sent in last 5 mins.
        if (recentAttempts.length > 1) {
            console.log(`Skipping alert for ${identifier}: already sent one recently.`);
            return { success: true, skipped: true };
        }

        // 2. GeoIP Lookup
        let location = "Unknown Location";
        try {
            const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
            const geoData = await geoRes.json();
            if (geoData.status === "success") {
                location = `${geoData.city}, ${geoData.country}`;
            }
        } catch (err) {
            console.error("GeoIP lookup failed:", err);
        }

        // 3. Get User Email (Identifier might be username or email)
        const user = await ctx.runQuery(api.auth.getUserByIdentifier, { identifier });
        if (!user || !user.email) {
            console.error(`Could not find email for identifier: ${identifier}`);
            return { success: false, error: "User not found" };
        }

        const dateStr = new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        // 4. Send Email
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <div style="background: #f84464; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">Security Alert</h1>
                </div>
                <div style="padding: 30px; color: #1e293b; line-height: 1.6;">
                    <p>Hello,</p>
                    <p>We detected a failed login attempt on your <b>BookMyTicket</b> account.</p>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #cbd5e1;">
                        <p style="margin: 0 0 10px 0;"><b>Details of the attempt:</b></p>
                        <table style="width: 100%; font-size: 14px;">
                            <tr><td style="color: #64748b; width: 100px;">Date/Time:</td><td>${dateStr}</td></tr>
                            <tr><td style="color: #64748b;">IP Address:</td><td>${ip}</td></tr>
                            <tr><td style="color: #64748b;">Location:</td><td>${location}</td></tr>
                            <tr><td style="color: #64748b;">Device:</td><td>${userAgent}</td></tr>
                        </table>
                    </div>

                    <p>If this was you, you can safely ignore this email. Just make sure you're using the correct password.</p>
                    <p style="color: #ef4444; font-weight: bold;">If this wasn't you, your account might be under risk. We recommend changing your password immediately.</p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://bookmyticket.com/signin?mode=forgot" style="background: #1e293b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Secure My Account</a>
                    </div>
                </div>
                <div style="background: #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
                    © ${new Date().getFullYear()} BookMyTicket. All rights reserved.
                </div>
            </div>
        `;

        await ctx.runAction(api.emailActions.sendEmail, {
            to: user.email,
            subject: "Security Alert: Failed Login Attempt",
            html: html
        });

        return { success: true };
    },
});
