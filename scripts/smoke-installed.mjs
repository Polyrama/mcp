import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const command = process.argv[2];
if (!command) throw new Error("Pass the installed polyrama-mcp executable path");

const client = new Client({ name: "polyrama-package-smoke", version: "1.0.0" });
const transport = new StdioClientTransport({
  command,
  env: {
    ...Object.fromEntries(Object.entries(process.env).filter((entry) => entry[1] !== undefined)),
    POLYRAMA_API_TOKEN: "placeholder_for_stdio_smoke_only",
  },
});

try {
  await client.connect(transport);
  const result = await client.listTools();
  assert.equal(result.tools.length, 10);
  assert.ok(result.tools.some((tool) => tool.name === "polyrama_search_markets"));
  console.log(`Installed package exposed ${result.tools.length} MCP tools.`);
} finally {
  await client.close();
}
