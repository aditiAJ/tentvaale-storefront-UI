/**
 * The name of the httpOnly cookie that holds the customer's login token, and a helper to make the
 * cookie last exactly as long as the token. Used only on the server (the gateway route handler);
 * the browser's JavaScript never sees either.
 */
export const SESSION_COOKIE = "tv_session";

const FALLBACK_SECONDS = 7 * 24 * 60 * 60;

/**
 * Seconds until the token expires, read from its `exp` claim. The signature is not checked here:
 * this only sizes the cookie, and the backend is the one that decides whether the token is valid.
 */
export function readTokenLifetimeSeconds(token: string, nowSeconds = Math.floor(Date.now() / 1000)): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) as { exp?: number };
    if (typeof payload.exp === "number") {
      return Math.max(0, payload.exp - nowSeconds);
    }
  } catch {
    // fall through
  }
  return FALLBACK_SECONDS;
}
