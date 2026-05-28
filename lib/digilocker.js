/**
 * DigiLocker OAuth2 Service – BookMyTicket
 * Production-ready MeriPehchaan authentication integration
 * 
 * Client ID: TW8046006B
 * Auth Server: https://digilocker.meripehchaan.gov.in
 * 
 * SECURITY: All tokens are server-side only. NEVER expose to client.
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ─── Configuration ───────────────────────────────────────────────────────────

const DIGILOCKER_CLIENT_ID = process.env.DIGILOCKER_CLIENT_ID;
const DIGILOCKER_CLIENT_SECRET = process.env.DIGILOCKER_CLIENT_SECRET;
const DIGILOCKER_REDIRECT_URI = process.env.DIGILOCKER_REDIRECT_URI;
const DIGILOCKER_BASE_URL = process.env.DIGILOCKER_BASE_URL || 'https://digilocker.meripehchaan.gov.in';

// OAuth Endpoints
const AUTHORIZE_URL = `${DIGILOCKER_BASE_URL}/public/oauth2/1/authorize`;
const TOKEN_URL = `${DIGILOCKER_BASE_URL}/public/oauth2/1/token`;
const USERINFO_URL = `${DIGILOCKER_BASE_URL}/public/oauth2/1/user`;
const DOCUMENTS_URL = `${DIGILOCKER_BASE_URL}/public/oauth2/1/files`;

// Required OAuth Scopes (from DigiLocker partner config)
const DIGILOCKER_SCOPES = [
  'openid',
  'profile',
].join(' ');

// ─── Encryption Utilities ─────────────────────────────────────────────────────

const ENCRYPTION_KEY = process.env.DIGILOCKER_ENCRYPTION_KEY
  ? (process.env.DIGILOCKER_ENCRYPTION_KEY.length === 64 ? Buffer.from(process.env.DIGILOCKER_ENCRYPTION_KEY, 'hex') : crypto.createHash('sha256').update(process.env.DIGILOCKER_ENCRYPTION_KEY).digest())
  : crypto.createHash('sha256').update(process.env.SUPABASE_SERVICE_ROLE_KEY || 'bmt-digilocker-fallback').digest();

/**
 * Encrypt sensitive data (tokens, URIs) before DB storage
 */
export function encryptToken(plaintext) {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('[DigiLocker] Encryption error:', err.message);
    throw new Error('Token encryption failed');
  }
}

/**
 * Decrypt stored token for server-side API use
 */
export function decryptToken(ciphertext) {
  try {
    const [ivHex, encrypted] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[DigiLocker] Decryption error:', err.message);
    throw new Error('Token decryption failed');
  }
}

// ─── PKCE Helpers ─────────────────────────────────────────────────────────────

/**
 * Generate PKCE code verifier + challenge for secure OAuth
 */
export function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
  return { verifier, challenge };
}

/**
 * Generate a cryptographically secure state token (CSRF protection)
 */
export function generateStateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a unique verification request ID
 */
export function generateVerificationRequestId() {
  return `bmt-kyc-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
}

// ─── OAuth Authorization URL Builder ─────────────────────────────────────────

/**
 * Build the DigiLocker MeriPehchaan OAuth2 authorization URL
 */
export function buildAuthorizationUrl({ stateToken, codeChallenge }) {
  if (!DIGILOCKER_CLIENT_ID) throw new Error('DIGILOCKER_CLIENT_ID not configured');
  if (!DIGILOCKER_REDIRECT_URI) throw new Error('DIGILOCKER_REDIRECT_URI not configured');

  const params = new URLSearchParams({
    client_id: DIGILOCKER_CLIENT_ID,
    redirect_uri: DIGILOCKER_REDIRECT_URI,
    response_type: 'code',
    state: stateToken,
    // PKCE
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `${AUTHORIZE_URL}?${params.toString().replace(/\+/g, '%20')}`;
}

// ─── Token Exchange ───────────────────────────────────────────────────────────

/**
 * Exchange authorization code for access token
 * Called server-side only after callback
 */
export async function exchangeCodeForToken({ code, codeVerifier }) {
  if (!DIGILOCKER_CLIENT_ID || !DIGILOCKER_CLIENT_SECRET) {
    throw new Error('DigiLocker credentials not configured');
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: DIGILOCKER_REDIRECT_URI,
    client_id: DIGILOCKER_CLIENT_ID,
    client_secret: DIGILOCKER_CLIENT_SECRET,
    code_verifier: codeVerifier,
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[DigiLocker] Token exchange failed:', data);
    throw new Error(data.error_description || data.error || 'Token exchange failed');
  }

  return {
    access_token: data.access_token,
    token_type: data.token_type || 'Bearer',
    expires_in: data.expires_in || 3600,
    expires_at: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
  };
}

// ─── User Info Fetch ──────────────────────────────────────────────────────────

/**
 * Fetch organizer identity from DigiLocker userinfo endpoint
 */
export async function fetchDigiLockerUserInfo(accessToken) {
  const response = await fetch(USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error_description || `UserInfo fetch failed: ${response.status}`);
  }

  const data = await response.json();

  const rawDob = data.birthdate || data.dob;
  let formattedDob = null;
  if (rawDob) {
    if (rawDob.includes('-')) {
      const parts = rawDob.split('-');
      if (parts[0].length === 2 && parts[2].length === 4) { // DD-MM-YYYY
        formattedDob = `${parts[2]}-${parts[1]}-${parts[0]}`;
      } else {
        formattedDob = rawDob;
      }
    } else if (rawDob.length === 8 && !isNaN(rawDob)) {
      // DDMMYYYY without dashes
      const dd = rawDob.substring(0, 2);
      const mm = rawDob.substring(2, 4);
      const yyyy = rawDob.substring(4, 8);
      formattedDob = `${yyyy}-${mm}-${dd}`;
    } else {
      formattedDob = rawDob;
    }
  }

  // Normalize DigiLocker response fields
  return {
    digilocker_user_id: data.sub || data.digilockerid,
    verified_name: data.name,
    verified_dob: formattedDob,
    verified_email: data.email,
    verified_mobile: data.phone_number || data.mobile,
    verified_gender: data.gender,
    profile_photo_url: data.picture || null,
    verified_address: data.address ? {
      house: data.address.house || '',
      street: data.address.street || '',
      city: data.address.locality || data.address.city || '',
      state: data.address.region || data.address.state || '',
      pincode: data.address.postal_code || data.address.pincode || '',
      country: data.address.country || 'India',
    } : null,
    email_verified: data.email_verified === true,
    phone_verified: data.phone_number_verified === true,
  };
}

// ─── Issued Documents Fetch ───────────────────────────────────────────────────

/**
 * Fetch issued documents list from DigiLocker
 */
export async function fetchIssuedDocuments(accessToken) {
  const response = await fetch(DOCUMENTS_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error_description || `Documents fetch failed: ${response.status}`);
  }

  const data = await response.json();
  const items = data.items || data.issued || [];

  return items.map((doc) => ({
    document_type: doc.doctype || doc.type,
    document_name: doc.name || doc.description,
    document_uri: doc.uri,
    issuer: doc.issuerid || doc.issuer,
    issue_date: doc.date || null,
    expiry_date: doc.validdate || null,
    document_data: {
      id: doc.uid || doc.id,
      number: doc.docnumber || doc.number,
    },
  }));
}

// ─── Fraud & Duplicate Detection ──────────────────────────────────────────────

/**
 * Run auto-validation checks against existing organizer records
 */
export async function runKYCValidation({ organizerId, verifiedData, documents }) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const fraudFlags = [];
  let riskScore = 0;

  // 1. Duplicate DigiLocker user ID check
  if (verifiedData.digilocker_user_id) {
    const { data: dupCheck } = await supabaseAdmin
      .from('digilocker_kyc_records')
      .select('organizer_id')
      .eq('digilocker_user_id', verifiedData.digilocker_user_id)
      .neq('organizer_id', organizerId)
      .limit(1);

    if (dupCheck && dupCheck.length > 0) {
      fraudFlags.push('DUPLICATE_IDENTITY');
      riskScore += 50;
    }
  }

  // 2. Duplicate verified email check
  if (verifiedData.verified_email) {
    const { data: emailCheck } = await supabaseAdmin
      .from('digilocker_kyc_records')
      .select('organizer_id')
      .eq('verified_email', verifiedData.verified_email)
      .neq('organizer_id', organizerId)
      .limit(1);

    if (emailCheck && emailCheck.length > 0) {
      fraudFlags.push('DUPLICATE_EMAIL');
      riskScore += 25;
    }
  }

  // 3. Age verification (must be 18+)
  let ageVerified = false;
  let ageAtVerification = null;
  if (verifiedData.verified_dob) {
    const dob = new Date(verifiedData.verified_dob);
    const today = new Date();
    ageAtVerification = Math.floor((today - dob) / (365.25 * 24 * 60 * 60 * 1000));
    ageVerified = ageAtVerification >= 18;
    if (!ageVerified) {
      fraudFlags.push('AGE_RESTRICTION');
      riskScore += 40;
    }
  }

  // 4. Check blacklist
  const { data: blacklist } = await supabaseAdmin
    .from('digilocker_kyc_records')
    .select('blacklisted')
    .eq('organizer_id', organizerId)
    .single();

  if (blacklist?.blacklisted) {
    fraudFlags.push('BLACKLISTED');
    riskScore = 100;
  }

  // 5. Aadhaar / PAN presence check
  const aadhaarVerified = documents.some(
    (d) => d.document_type === 'ADHAR' && d.verification_status !== 'failed'
  );
  const panVerified = documents.some(
    (d) => d.document_type === 'PANCR' && d.verification_status !== 'failed'
  );

  if (!aadhaarVerified) { fraudFlags.push('NO_AADHAAR'); riskScore += 15; }
  if (!panVerified) { fraudFlags.push('NO_PAN'); riskScore += 10; }

  return {
    fraudFlags,
    riskScore: Math.min(riskScore, 100),
    isDuplicate: fraudFlags.includes('DUPLICATE_IDENTITY') || fraudFlags.includes('DUPLICATE_EMAIL'),
    ageVerified,
    ageAtVerification,
    aadhaarVerified,
    panVerified,
    autoApprove: riskScore === 0 && ageVerified && aadhaarVerified,
  };
}
