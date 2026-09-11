import { env, requireEnv } from "@/services/env";
import { getAuthToken } from "@/services/auth-token";

// Mirrors the admin backend's response envelope (Tentvaale_extracted ARCHITECTURE.md:
// "All endpoints return ApiResponse<T> ... writes return SaveResult"). The storefront
// backend (api/storefront/*) follows the same shared-kernel convention.
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface SaveResult {
  success: boolean;
  message: string;
  id?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiFetch<T>(
  path: string,
  { method = "GET", body, signal }: RequestOptions = {},
): Promise<T> {
  const apiBaseUrl = requireEnv("NEXT_PUBLIC_API_BASE_URL", env.apiBaseUrl);
  const token = getAuthToken();

  const res = await fetch(`${apiBaseUrl}/${path.replace(/^\//, "")}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  let payload: ApiResponse<T>;
  try {
    payload = await res.json();
  } catch {
    throw new ApiError(`Malformed response from ${path}`, res.status);
  }

  if (!res.ok || !payload.success) {
    throw new ApiError(payload.message ?? res.statusText, res.status);
  }

  return payload.data;
}
