# Security policy

## Reporting a vulnerability

Please do not open a public issue for suspected security vulnerabilities.

Email **support@polyrama.io** with a concise description, reproduction steps, the affected
package version, and any suggested mitigation. We will coordinate disclosure after a fix is
available.

## Token safety

Polyrama API tokens are secrets. Pass them through `POLYRAMA_API_TOKEN` or a client's secure MCP
configuration. Never place a token in source control, issue reports, screenshots, or shared logs.

The public MCP package intentionally exposes no live-order tool. Its only order-writing tool
records a paper trade in Polyrama and cannot submit an exchange order or move funds.
