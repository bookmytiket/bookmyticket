import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run expiry check every hour
crons.interval(
  "expire premium branding banners",
  { hours: 1 },
  internal.branding.expireSubscriptions
);

crons.interval(
  "expire past events and meetings",
  { hours: 1 },
  internal.events.markExpiredEvents
);

export default crons;
