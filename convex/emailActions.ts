"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

export const sendEmail = action({
    args: {
        to: v.string(),
        subject: v.string(),
        html: v.string(),
    },
    handler: async (ctx, args) => {
        // Audit: Track the attempt
        const logId = await ctx.runMutation(api.systemLogs.create, {
            type: "email_attempt",
            message: `Attempting to send email: "${args.subject}" to ${args.to}`,
            details: { recipient: args.to, subject: args.subject }
        });

        // Enforce centralized email settings from the database
        const settings = await ctx.runQuery(api.emailSettings.get) as any;
        
        if (!settings || settings.provider !== "MICROSOFT_365" || !settings.microsoft365) {
            console.error("❌ [EMAIL ERROR] Microsoft 365 is not configured in the Admin Panel.");
            return { success: false, error: "Email service not configured. Please set up Microsoft 365 in Admin Panel." };
        }

        const { clientId, tenantId, clientSecret } = settings.microsoft365;
        // Centralized Shared Mailbox
        const fromEmail = "hello@bookmyticket.net";

        try {
            console.log(`📡 [GRAPH API] Sending email to ${args.to} via ${fromEmail}...`);
            
            // 1. Get Access Token (Client Credentials Flow)
            const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: clientId,
                    client_secret: clientSecret,
                    scope: 'https://graph.microsoft.com/.default'
                })
            });

            if (!tokenResponse.ok) {
                const error = await tokenResponse.json();
                console.error("❌ [GRAPH AUTH ERROR]", JSON.stringify(error, null, 2));
                throw new Error(`Failed to get access token: ${error.error_description || error.error}`);
            }

            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;

            // 2. Send Email via Graph API
            const sendMailResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: {
                        subject: args.subject,
                        body: {
                            contentType: 'HTML',
                            content: args.html
                        },
                        toRecipients: [
                            { emailAddress: { address: args.to.trim().toLowerCase() } }
                        ]
                    },
                    saveToSentItems: 'true'
                })
            });

            if (!sendMailResponse.ok) {
                const error = await sendMailResponse.json();
                console.error("❌ [GRAPH SEND ERROR]", JSON.stringify(error, null, 2));
                
                // Detailed error mapping
                const errorCode = error.error?.code || "UnknownError";
                const errorMsg = error.error?.message || "No specific error message provided";
                
                if (errorCode === "ErrorAccessDenied") {
                    throw new Error("M365 Access Denied: Ensure the Azure App has 'Mail.Send' Application permissions and Admin Consent is granted.");
                } else if (errorCode === "ResourceNotFound") {
                    throw new Error(`M365 Resource Not Found: Check if mailbox '${fromEmail}' exists and is accessible.`);
                }
                
                throw new Error(`Graph API sendMail failed: [${errorCode}] ${errorMsg}`);
            }

            console.log(`✅ [EMAIL SUCCESS] Sent to ${args.to}`);
            return { success: true };

        } catch (error: any) {
            console.error("❌ [SYSTEM EMAIL ERROR]:", error);
            await ctx.runMutation(api.systemLogs.create, {
                type: "email_error",
                message: `Failed to send email to ${args.to}: ${error.message || error}`,
                details: { error: String(error), stack: error.stack }
            });
            return { success: false, error: String(error.message || error) };
        }
    },
});
