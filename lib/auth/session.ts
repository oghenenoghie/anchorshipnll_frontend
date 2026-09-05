// Signed admin session tokens using Web Crypto (works in both the Node
// server-action runtime and the Edge middleware runtime, unlike node:crypto).

export const ADMIN_SESSION_COOKIE = "anchorship_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12h

const encoder = new TextEncoder();
const decoder = new TextDecoder();

interface SessionPayload {
  exp: number;
}

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function requireSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set — see .env.example");
  return secret;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function createAdminSessionToken(): Promise<string> {
  const payload: SessionPayload = { exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  const payloadBytes = encoder.encode(JSON.stringify(payload));
  const key = await hmacKey(requireSecret());
  const signature = await crypto.subtle.sign("HMAC", key, payloadBytes as BufferSource);
  return `${base64url(payloadBytes)}.${base64url(new Uint8Array(signature))}`;
}

export async function verifyAdminSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;

  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) return false;

  try {
    const payloadBytes = base64urlDecode(payloadPart);
    const signatureBytes = base64urlDecode(signaturePart);
    const key = await hmacKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as BufferSource,
      payloadBytes as BufferSource,
    );
    if (!valid) return false;

    const payload = JSON.parse(decoder.decode(payloadBytes)) as SessionPayload;
    return typeof payload.exp === "number" && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export const ADMIN_SESSION_MAX_AGE_SECONDS = SESSION_TTL_SECONDS;
