import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PACKAGE_VERSION } from "../src/index.js";
import { toolByName, tools } from "../src/tools.js";

test("publishes the expected ten unique tools", () => {
  const names = tools.map((tool) => tool.name);
  assert.equal(names.length, 10);
  assert.equal(new Set(names).size, names.length);
  assert.deepEqual(names, [
    "polyrama_search_markets",
    "polyrama_get_market",
    "polyrama_top_traders",
    "polyrama_get_trader",
    "polyrama_refresh_trader",
    "polyrama_recent_signals",
    "polyrama_list_bots",
    "polyrama_state_snapshot",
    "polyrama_run_backtest",
    "polyrama_place_paper_order",
  ]);
  for (const tool of tools) assert.equal(tool.inputSchema.additionalProperties, false);
});

test("wallet tools reject invalid addresses", () => {
  const schema = toolByName.get("polyrama_get_trader")?.schema;
  assert.ok(schema);
  assert.equal(schema.safeParse({ address: "not-a-wallet" }).success, false);
  assert.equal(schema.safeParse({ address: `0x${"a".repeat(40)}` }).success, true);
});

test("paper orders enforce side, price, and bot id constraints", () => {
  const schema = toolByName.get("polyrama_place_paper_order")?.schema;
  assert.ok(schema);
  const base = { botId: "research-bot", tokenId: "1234567890", side: "BUY", price: 0.42, size: 10 };
  assert.equal(schema.safeParse(base).success, true);
  assert.equal(schema.safeParse({ ...base, side: "LIVE" }).success, false);
  assert.equal(schema.safeParse({ ...base, price: 1 }).success, false);
});

test("server and package versions remain synchronized", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")) as {
    version: string;
    mcpName: string;
  };
  assert.equal(PACKAGE_VERSION, packageJson.version);
  assert.equal(packageJson.mcpName, "io.polyrama/mcp");
});
