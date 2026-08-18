# Polyrama MCP Server

[![npm](https://img.shields.io/npm/v/@polyrama/mcp)](https://www.npmjs.com/package/@polyrama/mcp)
[![CI](https://github.com/Polyrama/mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Polyrama/mcp/actions/workflows/ci.yml)

The official [Model Context Protocol](https://modelcontextprotocol.io) server for
[Polyrama](https://polyrama.io), the real-time terminal for prediction markets. It gives
MCP-compatible assistants ten typed tools for researching Polymarket and Kalshi markets,
analyzing public Polymarket wallets, reading signals, and running paper-only workflows.

This repository contains only the public MCP adapter. The Polyrama application, trading engine,
backend, deployment configuration, and private credentials remain private.

## Prerequisites

- Node.js 20 or newer
- A Polyrama API token from [polyrama.io/api](https://polyrama.io/api)

Pass the token through your MCP client's environment settings. Never commit it to a repository,
paste it into an issue, or include it in screenshots and logs.

## Run with npx

You do not need a global installation. Use `npx` in any stdio-compatible MCP client.

### Claude Desktop

```json
{
  "mcpServers": {
    "polyrama": {
      "command": "npx",
      "args": ["-y", "@polyrama/mcp"],
      "env": {
        "POLYRAMA_API_TOKEN": "<your-token>"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add polyrama --env POLYRAMA_API_TOKEN=<your-token> -- npx -y @polyrama/mcp
```

### Codex

```toml
[mcp_servers.polyrama]
command = "npx"
args = ["-y", "@polyrama/mcp"]

[mcp_servers.polyrama.env]
POLYRAMA_API_TOKEN = "<your-token>"
```

Cursor, Windsurf, Cline, Goose, Zed, OpenClaw, and other stdio MCP clients use the same command
and environment variable.

## Tools

| Tool | Purpose | Scope |
| --- | --- | --- |
| `polyrama_search_markets` | Search live Polymarket and Kalshi markets | `read` |
| `polyrama_get_market` | Inspect one market by token id | `read` |
| `polyrama_top_traders` | Rank public Polymarket wallets | `read` |
| `polyrama_get_trader` | Read one wallet's positions and performance | `read` |
| `polyrama_refresh_trader` | Refresh one public wallet | `write:paper` |
| `polyrama_recent_signals` | Read whales, jolts, spikes, and mispricing signals | `read` |
| `polyrama_list_bots` | List configured bots and status | `read` |
| `polyrama_state_snapshot` | Read the full dashboard state | `read` |
| `polyrama_run_backtest` | Run a historical strategy backtest | `write:paper` |
| `polyrama_place_paper_order` | Record a paper-only trade | `write:paper` |

The public MCP package has no live-order tool and never calls a live-order endpoint. It cannot
move funds or submit an exchange order.

## Environment variables

| Variable | Required | Default |
| --- | --- | --- |
| `POLYRAMA_API_TOKEN` | Yes | — |
| `POLYRAMA_API_URL` | No | `https://polyrama.io` |
| `POLYRAMA_REQUEST_TIMEOUT_MS` | No | `30000` |

`POLYRAMA_API_URL` is intended for Polyrama development and staging deployments.

## Development

```bash
npm ci
npm run check
npm pack --dry-run
```

See [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Security reports should
follow [SECURITY.md](SECURITY.md).

## Links

- [Polyrama MCP overview](https://polyrama.io/mcp)
- [Polyrama documentation](https://polyrama.io/docs#mcp-what)
- [REST API](https://polyrama.io/api)
- [Markets](https://polyrama.io/markets)

## Disclaimer

Polyrama is for research and informational use only, not financial advice. Prediction markets
involve risk. Review source data and venue rules before acting on any result.

## License

MIT © 2026 Polyrama contributors
