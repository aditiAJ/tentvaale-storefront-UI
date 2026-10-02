import type { NextConfig } from "next";

/**
 * The backend (Spring Boot, :8080) publishes no CORS configuration, and the customer's login token
 * must never reach the browser's JavaScript. So the browser only ever talks to this app's own
 * /api/* path, which is served by the gateway route handler in src/app/api/[...path]/route.ts: it
 * keeps the token in an httpOnly cookie and forwards storefront calls to the backend (API_ORIGIN)
 * on the server side, where CORS does not apply.
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
