// Builds a fake Supabase session and the localStorage key the client reads it
// from, so authenticated e2e tests never need a real user or network. The app's
// AuthProvider calls supabase.auth.getSession(), which just reads this key from
// storage (it does not verify the JWT), so a well-shaped fake is enough.

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? "https://localhost.supabase.co";

// The backend origin the app talks to. Routes are scoped to this so stubs never
// intercept the dev server's own Vite modules (some live under `api/` folders).
export const API_URL = process.env.VITE_API_URL ?? "http://localhost:4000";

function projectRef(url: string): string {
  try {
    return new URL(url).hostname.split(".")[0];
  } catch {
    return "localhost";
  }
}

// supabase-js persists the session under `sb-<project-ref>-auth-token`.
export const STORAGE_KEY = `sb-${projectRef(SUPABASE_URL)}-auth-token`;

export const TEST_USER = {
  id: "e2e00000-0000-4000-8000-000000000000",
  email: "e2e@example.com",
  name: "E2E Tester",
};

function base64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

// A decodable (but unsigned) JWT — getSession never verifies the signature.
function fakeJwt(payload: Record<string, unknown>): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  return `${header}.${body}.${base64url("e2e-signature")}`;
}

export function fakeSessionValue(): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const oneYear = 60 * 60 * 24 * 365;
  const expiresAt = nowSec + oneYear;
  const iso = new Date().toISOString();

  // Far-future expiry keeps supabase-js from attempting a token refresh.
  const accessToken = fakeJwt({
    sub: TEST_USER.id,
    email: TEST_USER.email,
    role: "authenticated",
    aud: "authenticated",
    iat: nowSec,
    exp: expiresAt,
  });

  const session = {
    access_token: accessToken,
    token_type: "bearer",
    expires_in: oneYear,
    expires_at: expiresAt,
    refresh_token: "e2e-refresh-token",
    user: {
      id: TEST_USER.id,
      aud: "authenticated",
      role: "authenticated",
      email: TEST_USER.email,
      email_confirmed_at: iso,
      phone: "",
      confirmed_at: iso,
      last_sign_in_at: iso,
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: { name: TEST_USER.name },
      identities: [],
      created_at: iso,
      updated_at: iso,
    },
  };

  return JSON.stringify(session);
}
