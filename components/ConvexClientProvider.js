"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";

// You'll need to set NEXT_PUBLIC_CONVEX_URL in your .env.local file.
// If it's missing, ConvexClientProvider will throw a useful error.
const url = process.env.NEXT_PUBLIC_CONVEX_URL || "https://example-url.convex.cloud";

const convex = new ConvexReactClient(url);

export default function ConvexClientProvider({ children }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
