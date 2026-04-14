import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

/**
 * Fetch all active events for sitemap
 */
export async function getSitemapEvents() {
  try {
    return await convex.query(api.events.getActiveEvents, { isAdmin: false });
  } catch (error) {
    console.error("Error fetching sitemap events:", error);
    return [];
  }
}

export async function getSitemapVendors() {
  try {
    // Service providers are now in a dedicated table
    return await convex.query(api.serviceProviders.list, {});
  } catch (error) {
    console.error("Error fetching sitemap vendors:", error);
    return [];
  }
}

/**
 * Fetch all active turfs for sitemap
 */
export async function getSitemapTurfs() {
  try {
    return await convex.query(api.turfs.listActive, {});
  } catch (error) {
    console.error("Error fetching sitemap turfs:", error);
    return [];
  }
}
