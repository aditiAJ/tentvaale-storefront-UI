// The browser never receives an API origin. Every request the client makes is same-origin against
// /api/*, which next.config.ts rewrites to the Spring backend on the server side. That is why there
// is no NEXT_PUBLIC_API_BASE_URL: exposing one would invite direct cross-origin calls that the
// backend has no CORS configuration to permit.
export const API_BASE_PATH = "/api";

export const env = {
  razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
};
