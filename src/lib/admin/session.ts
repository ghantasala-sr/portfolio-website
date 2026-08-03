/**
 * Admin session handling.
 *
 * Rules this file exists to enforce:
 *
 *  - The password lives only in ADMIN_PASSWORD, is read only on the server, and
 *    is never sent to the client or embedded in a bundle. It is not prefixed
 *    NEXT_PUBLIC_, which would expose it.
 *  - Comparison is constant time, over SHA-256 digests rather than raw strings,
 *    so response timing leaks neither the password nor its length.
 *  - The session cookie is a signed token, not a bare "admin=true". Without the
 *    HMAC anyone could set the cookie themselves and walk in.
 *  - Web Crypto only, so this works on the edge runtime as well as Node.
 */

export const SESSION_COOKIE = "pf_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

/** Return type is inferred on purpose: annotating it as plain `Uint8Array`
 *  widens the buffer to `ArrayBufferLike`, which crypto.subtle will not take. */
function enc(s: string) {
  return new TextEncoder().encode(s);
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(value: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", enc(value)));
}

/**
 * Constant time over equal-length hex digests. Comparing the digests rather than
 * the inputs means an early exit reveals nothing about the secret, and the
 * fixed length removes the length side channel that comparing raw passwords has.
 */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

export async function verifyPassword(candidate: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const [a, b] = await Promise.all([
    sha256Hex(candidate),
    sha256Hex(expected),
  ]);
  return timingSafeEqualHex(a, b);
}

async function hmac(payload: string): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");
  const key = await crypto.subtle.importKey(
    "raw",
    enc(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, enc(payload)));
}

/** Token is `<expiryMs>.<hmac>`, so a stolen cookie also expires. */
export async function createSessionToken(): Promise<{
  value: string;
  maxAge: number;
}> {
  const expiry = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = String(expiry);
  return {
    value: `${payload}.${await hmac(payload)}`,
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  const expiry = Number(payload);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;

  try {
    return timingSafeEqualHex(signature, await hmac(payload));
  } catch {
    return false;
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
