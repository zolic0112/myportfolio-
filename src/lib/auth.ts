// Uses Web Crypto (not Node's `crypto` module) so this works in both the
// Node.js runtime (API routes) and the Edge runtime (middleware).

export const ADMIN_COOKIE = "admin_session";

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not set");
  }
  return secret;
}

async function hmac(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return Buffer.from(signature).toString("hex");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function createSessionToken() {
  const expires = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
  const payload = `${expires}`;
  const signature = await hmac(payload, getSecret());
  return `${payload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null) {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = await hmac(payload, getSecret());
  if (!timingSafeEqual(signature, expected)) return false;

  const expires = Number(payload);
  return Number.isFinite(expires) && Date.now() < expires;
}

export function checkPassword(password: string) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error("ADMIN_PASSWORD is not set");
  }
  return timingSafeEqual(password, adminPassword);
}
