import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, readTokenLifetimeSeconds } from "@/services/session-cookie";

/**
 * The storefront's server side gateway to the backend (a "backend for frontend").
 *
 * The customer's login token never reaches the browser's JavaScript. On sign-in the backend's token
 * is placed in an httpOnly cookie; on every later call this handler reads that cookie and sends the
 * token to the backend as a bearer header. A script injected into a page therefore cannot steal the
 * session, and the backend (which never sees cookies) needs no cross-site-request defences of its
 * own.
 *
 * What this handler is, and is not:
 *  - it forwards only `/api/storefront/**`. Admin endpoints are not reachable through the public
 *    storefront address at all;
 *  - it forwards no cookie and no authorization header from the browser, only the one it builds;
 *  - because the browser sends the cookie automatically, every write must also carry the
 *    `X-Tentvaale-Client` header (a cross-site form or image cannot add one) and must not come from
 *    another origin. The cookie is also SameSite=Lax.
 */

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:8080";
const CLIENT_HEADER = "x-tentvaale-client";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
/** What a legitimate path segment looks like (words, slugs, ids). Anything else is never forwarded. */
const PLAIN_SEGMENT = /^[A-Za-z0-9_~-][A-Za-z0-9_.~-]*$/;

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: Context) {
  return handle(request, context);
}
export async function POST(request: NextRequest, context: Context) {
  return handle(request, context);
}
export async function PUT(request: NextRequest, context: Context) {
  return handle(request, context);
}
export async function PATCH(request: NextRequest, context: Context) {
  return handle(request, context);
}
export async function DELETE(request: NextRequest, context: Context) {
  return handle(request, context);
}

function problem(status: number, detail: string): NextResponse {
  return NextResponse.json({ status, detail }, { status, headers: { "cache-control": "no-store" } });
}

function sessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: readTokenLifetimeSeconds(token),
  });
}

function clearSession(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

/** True when a write arrives from a page on another origin. */
function crossOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host !== request.headers.get("host");
  } catch {
    return true;
  }
}

async function handle(request: NextRequest, { params }: Context): Promise<NextResponse> {
  const { path } = await params;
  const joined = path.join("/");

  // A segment such as "../admin" (arriving as ..%2Fadmin) would otherwise be joined into a path that
  // climbs out of /api/storefront, so every segment must be plain, not just free of "..".
  if (path.length < 2 || path[0] !== "storefront" || !path.every((segment) => PLAIN_SEGMENT.test(segment))) {
    return problem(404, "Not found.");
  }

  const method = request.method.toUpperCase();
  if (!SAFE_METHODS.has(method)) {
    if (request.headers.get(CLIENT_HEADER) !== "web" || crossOrigin(request)) {
      return problem(403, "This request was not accepted.");
    }
  }

  // Signing out needs no backend call: tokens are stateless, so forgetting the cookie ends it here.
  if (joined === "storefront/auth/logout" && method === "POST") {
    const response = new NextResponse(null, { status: 204, headers: { "cache-control": "no-store" } });
    clearSession(response);
    return response;
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("accept", request.headers.get("accept") ?? "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);

  let upstream: Response;
  try {
    upstream = await fetch(`${API_ORIGIN}/api/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`, {
      method,
      headers,
      body: SAFE_METHODS.has(method) ? undefined : await request.arrayBuffer(),
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    return problem(502, "The server could not be reached. Please try again in a moment.");
  }

  const raw = await upstream.arrayBuffer();

  // Signing in: keep the token in the cookie and hand the page only a confirmation.
  if ((joined === "storefront/auth/login" || joined === "storefront/auth/google") && method === "POST" && upstream.ok) {
    let accessToken: string | undefined;
    try {
      accessToken = (JSON.parse(new TextDecoder().decode(raw)) as { accessToken?: string }).accessToken;
    } catch {
      accessToken = undefined;
    }
    if (!accessToken) return problem(502, "The server gave an unexpected answer.");
    const response = NextResponse.json({ signedIn: true }, { headers: { "cache-control": "no-store" } });
    sessionCookie(response, accessToken);
    return response;
  }

  const out = new Headers({ "cache-control": "no-store" });
  const type = upstream.headers.get("content-type");
  if (type) out.set("content-type", type);
  const retryAfter = upstream.headers.get("retry-after");
  if (retryAfter) out.set("retry-after", retryAfter);

  const response = new NextResponse(upstream.status === 204 || upstream.status === 304 ? null : raw, {
    status: upstream.status,
    headers: out,
  });
  // The backend refused the token (expired, or the account was deactivated): drop the dead cookie.
  if (upstream.status === 401 && token) clearSession(response);
  return response;
}
