# Ruimtemodel Stadslogistiek — MCP server

The webapp exposes a [Model Context Protocol](https://modelcontextprotocol.io/)
server so AI agents (Claude Desktop, Claude Code, Cursor, IDE plugins, custom
LLM clients, …) can inspect the model and run simulations.

- **Transport:** Streamable HTTP (JSON-RPC 2.0 over HTTPS).
- **Endpoint:** `POST /api/mcp`
- **Protocol version:** `2025-03-26`
- **Auth:** none (public, read/compute only).

`GET /api/mcp` returns a small discovery document useful when hitting the URL
in a browser.

**Quickest way to wire up a client:** open **[`/mcp-connect`](/mcp-connect)**
— it renders ready-to-paste config blocks for Claude Desktop, Claude Code,
Cursor, Codex CLI, Windsurf, and VS Code, with the deployed MCP URL already
filled in and a Copy button per block.

---

## Tools

| Name                   | Purpose                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `get_model_info`       | Full metadata: vehicles, functions, distributions, defaults.     |
| `list_vehicles`        | 6 vehicle types with length in meters.                           |
| `list_functions`       | 12 urban function types.                                         |
| `list_distributions`   | 15 distribution / delivery profile types.                        |
| `get_delivery_profile` | Look up one delivery profile by function + distribution ID.      |
| `run_simulation`       | Run the Monte Carlo simulation; see REST API for input schema.   |

Each tool's `inputSchema` is returned by the standard `tools/list` method.

---

## Connecting from Claude Desktop / Claude Code

Claude clients speak MCP natively but (as of early 2026) the built-in stdio
client is what most people use. To bridge stdio ↔ HTTP use `mcp-remote`:

```jsonc
// claude_desktop_config.json
{
  "mcpServers": {
    "ruimtemodel": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://your-host/api/mcp"]
    }
  }
}
```

For Claude Code, run:

```bash
claude mcp add --transport http ruimtemodel https://your-host/api/mcp
```

## Connecting from a custom MCP client

Any client that speaks the Streamable HTTP transport can connect by POSTing
JSON-RPC 2.0 requests to `/api/mcp`. Minimal handshake:

```bash
# 1. initialize
curl -s -X POST https://your-host/api/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"example","version":"0.1"}}}'

# 2. list tools
curl -s -X POST https://your-host/api/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

# 3. call run_simulation
curl -s -X POST https://your-host/api/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"run_simulation","arguments":{"functionCounts":{"F1":362,"F2":2},"numSimulations":1000}}}'
```

`tools/call` responses wrap the tool output in a `content[]` array containing
a single `{type: "text", text: "<json-string>"}` entry per the MCP spec. The
JSON string is the same shape the REST API returns for `/api/v1/simulate`.

---

## Notes / limits

- The server is stateless — every request is independent; no Mcp-Session-Id
  is required. Clients that send one will get it echoed back.
- `numSimulations` is capped at 5000 to keep response times under a minute.
- Resources and prompts are not implemented; every capability is exposed as
  a tool.

See `src/app/api/mcp/route.ts` for the JSON-RPC dispatch logic and
`src/lib/api/mcp-tools.ts` for tool definitions.
