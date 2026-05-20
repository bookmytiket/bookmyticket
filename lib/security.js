import crypto from 'crypto';

function base64url(stringOrBuffer, encoding = 'utf8') {
    const base64 = typeof stringOrBuffer === 'string'
        ? Buffer.from(stringOrBuffer, encoding).toString('base64')
        : stringOrBuffer.toString('base64');
    return base64
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function base64urlDecode(str) {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf8');
}

export function signJWT(payload, secret, options = {}) {
    const header = {
        alg: "HS256",
        typ: "JWT"
    };
    
    const iat = Math.floor(Date.now() / 1000);
    const exp = options.expiresIn ? iat + options.expiresIn : iat + (24 * 60 * 60 * 30); // Default 30 days
    
    const jwtPayload = {
        ...payload,
        issued_at: iat,
        expires_at: exp,
        nonce: crypto.randomBytes(16).toString('hex')
    };
    
    const encodedHeader = base64url(JSON.stringify(header));
    const encodedPayload = base64url(JSON.stringify(jwtPayload));
    
    const tokenInput = `${encodedHeader}.${encodedPayload}`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(tokenInput);
    const signature = base64url(hmac.digest());
    
    return `${tokenInput}.${signature}`;
}

export function verifyJWT(token, secret) {
    try {
        if (!token) return null;
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        const [encodedHeader, encodedPayload, signature] = parts;
        const tokenInput = `${encodedHeader}.${encodedPayload}`;
        
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(tokenInput);
        const expectedSignature = base64url(hmac.digest());
        
        if (signature !== expectedSignature) {
            return null;
        }
        
        const payload = JSON.parse(base64urlDecode(encodedPayload));
        
        // Expiration check
        const now = Math.floor(Date.now() / 1000);
        if (payload.expires_at && now > payload.expires_at) {
            console.warn("[verifyJWT] Token expired");
            return null;
        }
        
        return payload;
    } catch (err) {
        console.error("[verifyJWT] Verification failure:", err.message);
        return null;
    }
}

/**
 * Generates a signed JWT QR code token for a ticket.
 */
export function generateSecureQRToken({ ticketId, bookingId, eventId, organizerId, userId, ticketCode, ticketType }) {
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bmt-secure-qr-signature-secret-key-2026';
    
    const payload = {
        ticket_id: ticketId,
        booking_id: bookingId,
        event_id: eventId,
        organizer_id: organizerId || null,
        user_id: userId || null,
        ticket_code: ticketCode,
        ticket_type: ticketType || "General Admission",
        status: "issued"
    };

    return signJWT(payload, secret);
}

/**
 * Verifies and decodes a JWT QR token with legacy fallback.
 */
export function verifySecureQRToken(token) {
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bmt-secure-qr-signature-secret-key-2026';
    
    // 1. Try standard JWT HS256 decode
    const decoded = verifyJWT(token, secret);
    if (decoded) {
        // Map to uniform keys for downstream logic
        return {
            ...decoded,
            t_id: decoded.ticket_id,
            b_id: decoded.booking_id,
            e_id: decoded.event_id,
            code: decoded.ticket_code,
            type: decoded.ticket_type
        };
    }
    
    // 2. Try legacy fallback check (2 parts dot-signature format)
    try {
        if (!token) return null;
        const parts = token.split('.');
        if (parts.length === 2) {
            const [base64Payload, signature] = parts;
            const hmac = crypto.createHmac('sha256', secret);
            hmac.update(base64Payload);
            const expectedSignature = hmac.digest('hex');
            
            if (signature === expectedSignature) {
                const decodedStr = Buffer.from(base64Payload, 'base64').toString('utf8');
                const legacy = JSON.parse(decodedStr);
                return {
                    ticket_id: legacy.t_id,
                    booking_id: legacy.b_id,
                    event_id: legacy.e_id,
                    ticket_code: legacy.code,
                    t_id: legacy.t_id,
                    b_id: legacy.b_id,
                    e_id: legacy.e_id,
                    code: legacy.code
                };
            }
        }
    } catch (err) {
        console.error('[verifySecureQRToken] Legacy fallback verification failed:', err.message);
    }
    
    return null;
}
