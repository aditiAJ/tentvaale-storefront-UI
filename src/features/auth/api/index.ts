import { apiFetch } from "@/services/api-client";
import type { LoginPayload, SignupPayload, StorefrontAccount, UpdateProfilePayload } from "../types";

/**
 * Customer sign-up, sign-in and account. The login token never appears here: signing in makes the
 * storefront's gateway set an httpOnly cookie, and the gateway adds the token to every later call.
 */

/** Creates the account. It does not sign anyone in; call {@link login} next. */
export function signup(payload: SignupPayload): Promise<StorefrontAccount> {
  return apiFetch<StorefrontAccount>("storefront/auth/signup", { method: "POST", body: payload });
}

/**
 * 422 for a wrong email or password (the same answer for both, on purpose); 429 when there have been
 * too many wrong attempts for that email, with the wait in the message.
 */
export function login(payload: LoginPayload): Promise<void> {
  return apiFetch<void>("storefront/auth/login", { method: "POST", body: payload });
}

/** "Continue with Google": the ID token Google gave the browser. Signs in (or creates the account) and sets the same cookie. */
export function loginWithGoogle(idToken: string): Promise<void> {
  return apiFetch<void>("storefront/auth/google", { method: "POST", body: { idToken } });
}

/** Forgets the session cookie. There is nothing to call on the backend. */
export function logout(): Promise<void> {
  return apiFetch<void>("storefront/auth/logout", { method: "POST" });
}

/** Who is signed in. 401 when nobody is. */
export function getCurrentAccount(signal?: AbortSignal): Promise<StorefrontAccount> {
  return apiFetch<StorefrontAccount>("storefront/account", { signal });
}

/** Name and phone only; the email and account type cannot be changed here. */
export function updateAccount(payload: UpdateProfilePayload): Promise<StorefrontAccount> {
  return apiFetch<StorefrontAccount>("storefront/account", { method: "PUT", body: payload });
}

export const authKeys = {
  me: ["auth", "me"] as const,
};
