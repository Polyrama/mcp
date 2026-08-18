import assert from "node:assert/strict";
import test from "node:test";
import { PolyramaApiError, PolyramaClient } from "../src/client.js";

test("sends token-authenticated JSON requests with query parameters", async () => {
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;
  const fetchImpl: typeof fetch = async (input, init) => {
    capturedUrl = String(input);
    capturedInit = init;
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const client = new PolyramaClient({
    apiToken: "placeholder_test_token",
    baseUrl: "https://example.test/",
    fetchImpl,
  });
  const result = await client.request<{ ok: boolean }>(
    "POST",
    "/backtests",
    { strategy: "market_maker" },
    { limit: 10, query: undefined, enabled: false },
  );

  assert.deepEqual(result, { ok: true });
  assert.equal(capturedUrl, "https://example.test/api/v1/backtests?limit=10&enabled=false");
  assert.equal(capturedInit?.method, "POST");
  assert.equal(new Headers(capturedInit?.headers).get("X-API-Token"), "placeholder_test_token");
  assert.equal(new Headers(capturedInit?.headers).get("Content-Type"), "application/json");
  assert.equal(capturedInit?.body, JSON.stringify({ strategy: "market_maker" }));
});

test("surfaces FastAPI errors without exposing the token", async () => {
  const fetchImpl: typeof fetch = async () =>
    new Response(JSON.stringify({ detail: "scope required: write:paper" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  const client = new PolyramaClient({ apiToken: "placeholder_private_value", fetchImpl });

  await assert.rejects(
    () => client.request("POST", "/paper-orders", {}),
    (error: unknown) => {
      assert.ok(error instanceof PolyramaApiError);
      assert.equal(error.status, 403);
      assert.match(error.message, /scope required/);
      assert.doesNotMatch(error.message, /placeholder_private_value/);
      return true;
    },
  );
});

test("aborts requests after the configured timeout", async () => {
  const fetchImpl: typeof fetch = async (_input, init) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    });
  const client = new PolyramaClient({
    apiToken: "placeholder_test_token",
    timeoutMs: 5,
    fetchImpl,
  });

  await assert.rejects(
    () => client.request("GET", "/health"),
    (error: unknown) => {
      assert.ok(error instanceof PolyramaApiError);
      assert.equal(error.status, 0);
      assert.equal(error.code, "request_timeout");
      return true;
    },
  );
});
