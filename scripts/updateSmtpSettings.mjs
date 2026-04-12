import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const deploymentUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

if (!deploymentUrl) {
    console.error("❌ CONVEX_URL or NEXT_PUBLIC_CONVEX_URL not found in .env.local");
    process.exit(1);
}

const client = new ConvexHttpClient(deploymentUrl);

async function updateSettings() {
    const password = process.argv[2];
    
    if (!password) {
        console.warn("⚠️ No password provided as argument. Password will remain unchanged if settings exist.");
    }

    console.log("🔄 Updating SMTP settings for Microsoft 365 (hello@bookmyticket.net)...");

    const settings = {
        host: "smtp.office365.com",
        port: 587,
        user: "hello@bookmyticket.net",
        pass: password || "YOUR_PASSWORD_HERE", // User should provide this
        from: "hello@bookmyticket.net",
        fromName: "BookMyTicket",
        encryption: "TLS",
        authMethod: "Login"
    };

    try {
        await client.mutation(api.emailSettings.update, settings);
        console.log("✅ SMTP settings updated successfully!");
        console.log("📍 Host: smtp.office365.com");
        console.log("📍 Port: 587");
        console.log("📍 User: hello@bookmyticket.net");
    } catch (error) {
        console.error("❌ Failed to update SMTP settings:", error);
    }
}

updateSettings();
