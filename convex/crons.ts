import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run expiry check every hour
crons.interval(
  "expire premium branding banners",
  { hours: 1 },
  internal.branding.expireSubscriptions
);

export default crons;
