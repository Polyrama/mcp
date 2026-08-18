# Contributing

Thanks for helping improve the Polyrama MCP server.

1. Fork the repository and create a focused branch.
2. Install dependencies with `npm ci`.
3. Make the smallest change that solves the problem.
4. Run `npm run check` and `npm pack --dry-run`.
5. Open a pull request that explains the behavior change and validation performed.

Do not include API tokens, private Polyrama application code, exchange credentials, customer
data, trading secrets, or deployment configuration. Changes to tool inputs must stay compatible
with the public Polyrama API and should update the README and tests in the same pull request.
