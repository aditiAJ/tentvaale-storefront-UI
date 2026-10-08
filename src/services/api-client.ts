import { API_BASE_PATH } from "@/services/env";

/**
 * The Spring backend returns domain payloads bare: there is no ApiResponse<T> / SaveResult envelope
 * (the storefront's earlier client assumed one that never existed). Success is the HTTP status and
 * the body IS the data. Failures are shaped by the backend's GlobalExceptionHandler.
 */
interface ProblemBody {
  timestamp?: string;
  status?: number;
  error?: string;
  detail?: string;
}

/**
 * A failed request, carrying the status so callers can tell the cases apart.
 *
 * 422 is the backend's business-rule refusal: the request was well formed but the domain said no,
 * and its `detail` is written for the person, so the UI shows `message` verbatim. A 403 or a 500
 * gets generic copy instead (see defaultMessage).
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Fired when a request comes back 401: the customer is not (or no longer) signed in. The login token
 * is an httpOnly cookie this code cannot see, so the gateway is what drops a dead one; this module
 * only announces the fact. It has no router, so the session provider listens for the event. An event
 * keeps services/ free of any dependency on features/ or on Next's router.
 */
export const UNAUTHORIZED_EVENT = "tentvaale:storefront-unauthorized";

/**
 * @deprecated The old envelope's write result. Kept only so the not-yet-rewritten plans module
 * (features/plans/api) still compiles; it is deleted when that module is rewritten against the real
 * plan endpoints.
 */
export interface SaveResult {
  success: boolean;
  message: string;
  id?: string;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiFetch<T>(
  path: string,
  { method = "GET", body, signal }: RequestOptions = {},
): Promise<T> {
  // A file (FormData) is sent as it is: the browser writes its own multipart Content-Type, with the boundary.
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(`${API_BASE_PATH}/${path.replace(/^\/?(api\/)?/, "")}`, {
    method,
    // The gateway refuses writes without this header: a cross-site form or image cannot add one, so
    // it is what stops another site making the browser act on the customer's behalf.
    headers: {
      "X-Tentvaale-Client": "web",
      ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
    },
    credentials: "same-origin",
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    signal,
  });

  if (res.status === 401) {
    // Wrong passwords are a 422, never a 401, so a 401 always means "not signed in" (or expired).
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    throw new ApiError("Please sign in to continue.", 401);
  }

  const raw = await res.text();

  if (!res.ok) {
    // Spring's entry point and its 403 handler answer with an empty body, so `detail` exists for
    // domain errors but not for those.
    let detail: string | undefined;
    try {
      detail = (JSON.parse(raw) as ProblemBody).detail;
    } catch {
      detail = undefined;
    }
    throw new ApiError(detail ?? defaultMessage(res.status, res.statusText), res.status);
  }

  // 204 and any other empty success: calling JSON.parse on "" would throw.
  if (raw === "") return undefined as T;

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ApiError(`Malformed response from ${path}`, res.status);
  }
}

function defaultMessage(status: number, statusText: string): string {
  if (status === 403) return "You do not have permission to do that.";
  if (status === 404) return "Not found.";
  if (status >= 500) return "The server could not complete the request.";
  return statusText || "Request failed";
}
