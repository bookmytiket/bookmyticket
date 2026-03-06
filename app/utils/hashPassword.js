/**
 * Hash a password using SHA-256 via the Web Crypto API.
 * Works in browser and Convex (V8 environment).
 * NOTE: For production, prefer bcrypt via a dedicated auth service.
 */
export async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
}
