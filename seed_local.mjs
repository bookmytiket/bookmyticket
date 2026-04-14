import { ConvexHttpClient } from "convex/browser";
import crypto from "crypto";

const client = new ConvexHttpClient("http://localhost:3210"); 
// Wait, local HTTP client requires a valid endpoint. By default `npx convex dev` runs on port 3210.
// Let's just create an endpoint or just use another method... Wait!
