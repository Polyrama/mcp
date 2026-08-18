import { z } from "zod";
import type { PolyramaClient } from "./client.js";

export type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

export interface ToolDefinition<Schema extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  schema: Schema;
  run: (args: z.infer<Schema>, client: PolyramaClient) => Promise<ToolResult>;
}

function formatOutput(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function defineTool<Schema extends z.ZodType>(
  definition: ToolDefinition<Schema>,
): ToolDefinition<z.ZodType> {
  return definition as unknown as ToolDefinition<z.ZodType>;
}

const emptySchema = z.object({}).strict();
const addressSchema = z.string().regex(/^0x[0-9a-fA-F]{40}$/, "Expected a 40-byte 0x wallet address");

export const tools: Array<ToolDefinition<z.ZodType>> = [
  defineTool({
    name: "polyrama_search_markets",
    description:
      "Search live prediction markets tracked by Polyrama across Polymarket and Kalshi. Filter by text or YES probability and sort by volume, movement, spread, or price.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Case-insensitive question or slug search." },
        limit: { type: "number", minimum: 1, maximum: 500, default: 25 },
        offset: { type: "number", minimum: 0, default: 0 },
        sort: {
          type: "string",
          enum: ["volume_24h", "spread", "yes_no_sum", "yes_mid", "change_1h", "change_24h", "trending", "end_date_iso", "updated_at"],
          default: "volume_24h",
        },
        priceMin: { type: "number", minimum: 0, maximum: 1 },
        priceMax: { type: "number", minimum: 0, maximum: 1 },
      },
      additionalProperties: false,
    },
    schema: z.object({
      query: z.string().min(1).optional(),
      limit: z.number().int().min(1).max(500).optional(),
      offset: z.number().int().min(0).optional(),
      sort: z.enum(["volume_24h", "spread", "yes_no_sum", "yes_mid", "change_1h", "change_24h", "trending", "end_date_iso", "updated_at"]).optional(),
      priceMin: z.number().min(0).max(1).optional(),
      priceMax: z.number().min(0).max(1).optional(),
    }).strict(),
    run: async (args, client) => formatOutput(await client.request("GET", "/markets", undefined, {
      search: args.query,
      limit: args.limit ?? 25,
      offset: args.offset ?? 0,
      sort: args.sort ?? "volume_24h",
      price_min: args.priceMin,
      price_max: args.priceMax,
    })),
  }),
  defineTool({
    name: "polyrama_get_market",
    description: "Get live odds, spread, volume, metadata, and history fields for one market by token id.",
    inputSchema: {
      type: "object",
      properties: { tokenId: { type: "string", minLength: 10 } },
      required: ["tokenId"],
      additionalProperties: false,
    },
    schema: z.object({ tokenId: z.string().min(10).max(120) }).strict(),
    run: async (args, client) => formatOutput(await client.request("GET", `/markets/${encodeURIComponent(args.tokenId)}`)),
  }),
  defineTool({
    name: "polyrama_top_traders",
    description: "Get the Polymarket wallet leaderboard with portfolio, P&L, volume, activity, and search filters.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", minimum: 1, maximum: 200, default: 50 },
        offset: { type: "number", minimum: 0, default: 0 },
        sort: {
          type: "string",
          enum: ["current_value", "networth", "total_pnl", "cash_pnl", "realized_pnl", "volume_7d", "trades_7d", "last_activity"],
          default: "current_value",
        },
        starredOnly: { type: "boolean", default: false },
        query: { type: "string", description: "Wallet address prefix or pseudonym." },
      },
      additionalProperties: false,
    },
    schema: z.object({
      limit: z.number().int().min(1).max(200).optional(),
      offset: z.number().int().min(0).optional(),
      sort: z.enum(["current_value", "networth", "total_pnl", "cash_pnl", "realized_pnl", "volume_7d", "trades_7d", "last_activity"]).optional(),
      starredOnly: z.boolean().optional(),
      query: z.string().min(1).optional(),
    }).strict(),
    run: async (args, client) => formatOutput(await client.request("GET", "/traders", undefined, {
      limit: args.limit ?? 50,
      offset: args.offset ?? 0,
      sort: args.sort ?? "current_value",
      starred_only: args.starredOnly ?? false,
      q: args.query,
    })),
  }),
  defineTool({
    name: "polyrama_get_trader",
    description: "Get one public Polymarket wallet's portfolio, positions, activity, history, and performance stats.",
    inputSchema: {
      type: "object",
      properties: {
        address: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" },
        activityLimit: { type: "number", minimum: 1, maximum: 5000, default: 200 },
      },
      required: ["address"],
      additionalProperties: false,
    },
    schema: z.object({ address: addressSchema, activityLimit: z.number().int().min(1).max(5000).optional() }).strict(),
    run: async (args, client) => formatOutput(await client.request("GET", `/traders/${args.address.toLowerCase()}`, undefined, {
      activity_limit: args.activityLimit ?? 200,
    })),
  }),
  defineTool({
    name: "polyrama_refresh_trader",
    description: "Refresh one public Polymarket wallet's positions and net worth. Requires a token with write:paper scope.",
    inputSchema: {
      type: "object",
      properties: { address: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" } },
      required: ["address"],
      additionalProperties: false,
    },
    schema: z.object({ address: addressSchema }).strict(),
    run: async (args, client) => formatOutput(await client.request("POST", `/traders/${args.address.toLowerCase()}/refresh`)),
  }),
  defineTool({
    name: "polyrama_recent_signals",
    description: "Get recent whale prints, volume spikes, price jolts, liquidity, wash-like trade, and market-mispricing signals.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", minimum: 1, maximum: 500, default: 50 },
        kinds: { type: "string", description: "Comma-separated signal kinds." },
        unacknowledgedOnly: { type: "boolean", default: false },
        sinceSeconds: { type: "number", minimum: 0 },
      },
      additionalProperties: false,
    },
    schema: z.object({
      limit: z.number().int().min(1).max(500).optional(),
      kinds: z.string().min(1).optional(),
      unacknowledgedOnly: z.boolean().optional(),
      sinceSeconds: z.number().min(0).optional(),
    }).strict(),
    run: async (args, client) => formatOutput(await client.request("GET", "/signals", undefined, {
      limit: args.limit ?? 50,
      kinds: args.kinds,
      unack: args.unacknowledgedOnly ?? false,
      since_s: args.sinceSeconds,
    })),
  }),
  defineTool({
    name: "polyrama_list_bots",
    description: "List the authenticated account's configured Polyrama bots and their current status.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    schema: emptySchema,
    run: async (_args, client) => formatOutput(await client.request("GET", "/bots")),
  }),
  defineTool({
    name: "polyrama_state_snapshot",
    description: "Get the full current Polyrama dashboard state, including quotes, positions, P&L, signals, wallets, and scanners.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    schema: emptySchema,
    run: async (_args, client) => formatOutput(await client.request("GET", "/state")),
  }),
  defineTool({
    name: "polyrama_run_backtest",
    description: "Run a Polyrama strategy against historical market data and return summary statistics, P&L series, and fills. Requires write:paper scope.",
    inputSchema: {
      type: "object",
      properties: {
        strategy: { type: "string", minLength: 1 },
        tokenId: { type: "string", minLength: 10 },
        params: { type: "object", additionalProperties: true },
        interval: { type: "string", enum: ["1h", "6h", "1d", "1w", "1m", "max"], default: "1w" },
        fidelity: { type: "number", minimum: 1, maximum: 1440, default: 60 },
      },
      required: ["strategy", "tokenId"],
      additionalProperties: false,
    },
    schema: z.object({
      strategy: z.string().min(1),
      tokenId: z.string().min(10).max(120),
      params: z.record(z.string(), z.unknown()).optional(),
      interval: z.enum(["1h", "6h", "1d", "1w", "1m", "max"]).optional(),
      fidelity: z.number().int().min(1).max(1440).optional(),
    }).strict(),
    run: async (args, client) => formatOutput(await client.request("POST", "/backtests", {
      strategy: args.strategy,
      token_id: args.tokenId,
      params: args.params ?? {},
      interval: args.interval ?? "1w",
      fidelity: args.fidelity ?? 60,
    })),
  }),
  defineTool({
    name: "polyrama_place_paper_order",
    description: "Record a paper-only trade in Polyrama. This tool never submits a live order. Requires write:paper scope.",
    inputSchema: {
      type: "object",
      properties: {
        botId: { type: "string", minLength: 1, maxLength: 64, pattern: "^[a-zA-Z0-9_-]+$" },
        tokenId: { type: "string", minLength: 10 },
        side: { type: "string", enum: ["BUY", "SELL"] },
        price: { type: "number", exclusiveMinimum: 0, exclusiveMaximum: 1 },
        size: { type: "number", exclusiveMinimum: 0 },
        marketQuestion: { type: "string" },
        strategy: { type: "string", minLength: 1, maxLength: 64, default: "mcp" },
      },
      required: ["botId", "tokenId", "side", "price", "size"],
      additionalProperties: false,
    },
    schema: z.object({
      botId: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/),
      tokenId: z.string().min(10).max(120),
      side: z.enum(["BUY", "SELL"]),
      price: z.number().gt(0).lt(1),
      size: z.number().gt(0),
      marketQuestion: z.string().optional(),
      strategy: z.string().min(1).max(64).optional(),
    }).strict(),
    run: async (args, client) => formatOutput(await client.request("POST", "/paper-orders", {
      bot_id: args.botId,
      token_id: args.tokenId,
      side: args.side,
      price: args.price,
      size: args.size,
      market_question: args.marketQuestion,
      strategy: args.strategy ?? "mcp",
    })),
  }),
];

export const toolByName = new Map(tools.map((tool) => [tool.name, tool]));
