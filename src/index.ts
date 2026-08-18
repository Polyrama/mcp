#!/usr/bin/env node

import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { PolyramaClient } from "./client.js";
import { toolByName, tools } from "./tools.js";

export const PACKAGE_VERSION = "1.0.1";

export interface ServerOptions {
  apiToken: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export function createServer(options: ServerOptions): Server {
  const client = new PolyramaClient(options);
  const server = new Server(
    { name: "polyrama-mcp", version: PACKAGE_VERSION },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: rawArgs } = request.params;
    const tool = toolByName.get(name);
    if (!tool) {
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
    }

    const parsed = tool.schema.safeParse(rawArgs ?? {});
    if (!parsed.success) {
      return {
        content: [{ type: "text", text: `Invalid arguments: ${parsed.error.message}` }],
        isError: true,
      };
    }

    try {
      return await tool.run(parsed.data, client);
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  });

  return server;
}

export async function main(): Promise<void> {
  const apiToken = process.env.POLYRAMA_API_TOKEN;
  if (!apiToken) {
    throw new Error("POLYRAMA_API_TOKEN is required. Create one at https://polyrama.io/api");
  }

  const timeoutValue = process.env.POLYRAMA_REQUEST_TIMEOUT_MS;
  const timeoutMs = timeoutValue === undefined ? undefined : Number(timeoutValue);
  const server = createServer({
    apiToken,
    baseUrl: process.env.POLYRAMA_API_URL,
    timeoutMs,
  });
  await server.connect(new StdioServerTransport());
}

const entryPoint = process.argv[1] ? pathToFileURL(realpathSync(process.argv[1])).href : undefined;
if (entryPoint === import.meta.url) {
  main().catch((error) => {
    console.error(`[polyrama-mcp] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
