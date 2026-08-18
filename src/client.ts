const DEFAULT_BASE_URL = "https://polyrama.io";
const DEFAULT_TIMEOUT_MS = 30_000;

export interface ClientConfig {
  apiToken: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export interface PolyramaApiErrorOptions {
  status: number;
  code?: string;
  details?: unknown;
}

export class PolyramaApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, options: PolyramaApiErrorOptions) {
    super(message);
    this.name = "PolyramaApiError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

type QueryValue = string | number | boolean | undefined;

function parseTimeout(value: number | undefined): number {
  const timeoutMs = value ?? DEFAULT_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("timeoutMs must be a positive finite number");
  }
  return timeoutMs;
}

function parseBaseUrl(value: string | undefined): string {
  const url = new URL(value ?? DEFAULT_BASE_URL);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("POLYRAMA_API_URL must use http or https");
  }
  return url.toString().replace(/\/$/, "");
}

function parseJson(text: string): unknown {
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function extractApiError(
  payload: unknown,
  fallback: string,
): { message: string; code?: string; details?: unknown } {
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail?: unknown }).detail;
    if (typeof detail === "string") return { message: detail };
    return { message: fallback, details: detail };
  }
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: unknown }).error;
    if (error && typeof error === "object") {
      const record = error as { message?: unknown; code?: unknown; details?: unknown };
      return {
        message: typeof record.message === "string" ? record.message : fallback,
        code: typeof record.code === "string" ? record.code : undefined,
        details: record.details,
      };
    }
  }
  return { message: typeof payload === "string" && payload ? payload : fallback };
}

export class PolyramaClient {
  private readonly apiToken: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(config: ClientConfig) {
    if (!config.apiToken.trim()) {
      throw new Error("POLYRAMA_API_TOKEN is required");
    }
    this.apiToken = config.apiToken;
    this.baseUrl = parseBaseUrl(config.baseUrl);
    this.timeoutMs = parseTimeout(config.timeoutMs);
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async request<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
    query?: Record<string, QueryValue>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}/api/v1${path}`);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method,
        headers: {
          "X-API-Token": this.apiToken,
          Accept: "application/json",
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new PolyramaApiError(`Polyrama API request timed out after ${this.timeoutMs}ms`, {
          status: 0,
          code: "request_timeout",
        });
      }
      throw new PolyramaApiError("Could not reach the Polyrama API", {
        status: 0,
        code: "network_error",
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      clearTimeout(timeout);
    }

    const text = await response.text();
    const payload = parseJson(text);
    if (!response.ok) {
      const apiError = extractApiError(payload, response.statusText || "Request failed");
      throw new PolyramaApiError(`Polyrama API ${response.status}: ${apiError.message}`, {
        status: response.status,
        code: apiError.code,
        details: apiError.details,
      });
    }
    return payload as T;
  }
}
