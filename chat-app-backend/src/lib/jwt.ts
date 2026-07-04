import { jwtVerify, createRemoteJWKSet, type JWTPayload } from "jose";
import { SUPABASE_URL } from "@/config/app.config";
import { createLogger } from "@/lib/logger";

/**
 * Local Supabase access-token verification — replaces a per-request network
 * round-trip to `supabase.auth.getUser()`.
 *
 * Supabase signs access tokens with asymmetric keys (ES256), so tokens are
 * verified against the project's public JWKS endpoint. `jose` validates the
 * signature, expiry (`exp`), and `nbf` automatically; we additionally require
 * the `authenticated` audience and a `sub` (user id).
 */
const log = createLogger("Auth");

const AUDIENCE = "authenticated";

// Lazy remote key set — no network call until the first token is verified; jose
// caches keys and handles rotation via the JWKS `kid`.
const jwks = createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`));

log.info("🔑 Local JWT verification ready (JWKS)");

export interface VerifiedToken {
  authId: string;
  payload: JWTPayload;
}

export async function verifySupabaseToken(token: string): Promise<VerifiedToken> {
  const { payload } = await jwtVerify(token, jwks, { audience: AUDIENCE });

  if (!payload.sub) {
    throw new Error("Token is missing the subject (sub) claim");
  }

  return { authId: payload.sub, payload };
}
