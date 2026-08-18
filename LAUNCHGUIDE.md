# Polyrama

## Tagline
Prediction-market research for Polymarket and Kalshi, directly in your AI client.

## Description
Polyrama is an open-source Model Context Protocol server for researching live
prediction markets. It gives compatible AI clients typed tools for Polymarket
and Kalshi market search, live odds and spreads, public-wallet analytics,
trader leaderboards, whale and mispricing signals, dashboard snapshots, and
historical backtests. Its only order-writing workflow records paper trades;
the server does not expose a live-order tool.

## Setup Requirements
- `POLYRAMA_API_TOKEN` (required): A Polyrama access token supplied locally to the MCP process. See https://polyrama.io/api

## Category
Data & Analytics

## Features
- Search live Polymarket and Kalshi markets
- Filter markets by text or YES probability
- Sort markets by volume, movement, spread, price, or end date
- Inspect live odds, spread, volume, metadata, and history for one market
- Explore public Polymarket wallet portfolios and performance
- Rank traders by portfolio value, P&L, volume, activity, and other metrics
- Retrieve whale prints, volume spikes, price jolts, and liquidity signals
- Retrieve wash-like trade and market-mispricing signals
- Inspect the current Polyrama dashboard state
- Run strategies against historical market data
- Record paper-only orders without live trade execution

## Getting Started
- "Find the most active Polymarket and Kalshi markets right now."
- "Show recent whale and market-mispricing signals."
- "Compare the top public Polymarket traders by seven-day volume."
- "Run a historical backtest for this market and summarize the result."
- Tool: `polyrama_search_markets` — Search and rank live prediction markets.
- Tool: `polyrama_get_trader` — Inspect one public Polymarket wallet.
- Tool: `polyrama_recent_signals` — Retrieve recent market and trader signals.
- Tool: `polyrama_run_backtest` — Run a paper strategy against historical data.

## Tags
mcp, prediction-markets, polymarket, kalshi, market-data, live-odds, trader-analytics, whale-tracking, signals, backtesting, paper-trading, ai-agents

## Documentation URL
https://polyrama.io/mcp
