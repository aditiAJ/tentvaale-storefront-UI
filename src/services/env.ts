// Not validated eagerly here: this module is reachable at import time from
// every features/*/index.ts barrel (export * from "./api"), so throwing at
// module evaluation would crash any page that imports an unrelated sibling
// export (e.g. AuthForm) whenever NEXT_PUBLIC_API_BASE_URL isn't set — which
// it never is today, since the app runs on the mock store, not this real-API
// layer. requireEnv is still here for api-client.ts to call at the point an
// actual request is attempted, so the failure stays loud once this layer is
// wired to a real backend.
export function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
};
