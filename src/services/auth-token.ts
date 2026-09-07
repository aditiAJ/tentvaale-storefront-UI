// JWT storage for the storefront customer identity (AccountType claim: Customer | EventPlanner).
// Separate from any admin auth — see ARCHITECTURE.md "Auth" section.
// Lives in services/ (not features/auth/) because api-client.ts depends on it
// to attach the Authorization header, and services must not depend on features.
const TOKEN_KEY = "tentvaale.storefront.token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}
