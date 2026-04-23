import { MCP_TOOLS, MCP_TOOLS_BY_NAME } from '@/lib/api/mcp-tools';
import { corsPreflight, corsRaw } from '@/lib/api/cors';

/**
 * Model Context Protocol (MCP) endpoint — Streamable HTTP transport.
 *
 * This implements a minimal compliant MCP server over HTTP using JSON-RPC 2.0.
 * It supports both single requests/responses and batched requests.
 *
 * Spec reference:
 *   https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http
 *
 * Supported methods:
 *   - initialize
 *   - ping
 *   - tools/list
 *   - tools/call
 *   - notifications/initialized (no response, per spec)
 *
 * Resources and prompts are not implemented; clients that require them should
 * fall back to tools (every resource is also exposed as a tool).
 *
 * Transport: we return plain `application/json` responses. The spec also
 * permits `text/event-stream`, but this stateless handler has no server-
 * initiated messages, so simple JSON is sufficient and widely supported.
 */

export const runtime = 'nodejs';
export const maxDuration = 60;

const PROTOCOL_VERSION = '2025-03-26';

const SERVER_INFO = {
  name: 'ruimtemodel-stadslogistiek',
  version: '1.0.0',
};

const CAPABILITIES = {
  tools: { listChanged: false },
};

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: unknown;
}

interface JsonRpcSuccess {
  jsonrpc: '2.0';
  id: string | number | null;
  result: unknown;
}

interface JsonRpcError {
  jsonrpc: '2.0';
  id: string | number | null;
  error: { code: number; message: string; data?: unknown };
}

type JsonRpcResponse = JsonRpcSuccess | JsonRpcError;

const ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
};

function isJsonRpcRequest(x: unknown): x is JsonRpcRequest {
  return (
    typeof x === 'object' &&
    x !== null &&
    (x as { jsonrpc?: unknown }).jsonrpc === '2.0' &&
    typeof (x as { method?: unknown }).method === 'string'
  );
}

function success(id: string | number | null, result: unknown): JsonRpcSuccess {
  return { jsonrpc: '2.0', id, result };
}

function failure(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcError {
  return { jsonrpc: '2.0', id, error: { code, message, ...(data !== undefined && { data }) } };
}

function handleRequest(req: JsonRpcRequest): JsonRpcResponse | null {
  const id = req.id ?? null;

  // Notifications (no id) get no response.
  const isNotification = req.id === undefined || req.id === null;

  try {
    switch (req.method) {
      case 'initialize': {
        // Client supplies { protocolVersion, capabilities, clientInfo }. We ignore
        // the requested protocolVersion and reply with our supported version; the
        // client is responsible for compatibility. Per spec we may negotiate, but
        // sticking to one version keeps this server simple.
        if (isNotification) return null;
        return success(id, {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: CAPABILITIES,
          serverInfo: SERVER_INFO,
        });
      }
      case 'notifications/initialized': {
        return null;
      }
      case 'ping': {
        if (isNotification) return null;
        return success(id, {});
      }
      case 'tools/list': {
        if (isNotification) return null;
        return success(id, {
          tools: MCP_TOOLS.map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
          })),
        });
      }
      case 'tools/call': {
        if (isNotification) return null;
        const params = (req.params ?? {}) as { name?: unknown; arguments?: unknown };
        if (typeof params.name !== 'string') {
          return failure(id, ERROR_CODES.INVALID_PARAMS, 'tools/call requires params.name (string)');
        }
        const tool = MCP_TOOLS_BY_NAME[params.name];
        if (!tool) {
          return failure(id, ERROR_CODES.METHOD_NOT_FOUND, `Unknown tool: ${params.name}`);
        }
        const args = (params.arguments ?? {}) as Record<string, unknown>;
        try {
          const out = tool.handler(args);
          return success(id, {
            content: [{ type: 'text', text: JSON.stringify(out) }],
            isError: false,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return success(id, {
            content: [{ type: 'text', text: message }],
            isError: true,
          });
        }
      }
      default: {
        if (isNotification) return null;
        return failure(id, ERROR_CODES.METHOD_NOT_FOUND, `Unknown method: ${req.method}`);
      }
    }
  } catch (err) {
    if (isNotification) return null;
    const message = err instanceof Error ? err.message : String(err);
    return failure(id, ERROR_CODES.INTERNAL_ERROR, message);
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return corsRaw(
      JSON.stringify(failure(null, ERROR_CODES.PARSE_ERROR, 'Invalid JSON')),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Handle batched requests
  if (Array.isArray(body)) {
    if (body.length === 0) {
      return corsRaw(
        JSON.stringify(failure(null, ERROR_CODES.INVALID_REQUEST, 'Empty batch')),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const responses: JsonRpcResponse[] = [];
    for (const item of body) {
      if (!isJsonRpcRequest(item)) {
        const id = (item as { id?: string | number | null } | null)?.id ?? null;
        responses.push(failure(id, ERROR_CODES.INVALID_REQUEST, 'Invalid JSON-RPC request'));
        continue;
      }
      const res = handleRequest(item);
      if (res) responses.push(res);
    }
    // If every request was a notification, respond 202 with empty body per spec.
    if (responses.length === 0) {
      return corsRaw(null, { status: 202 });
    }
    return corsRaw(JSON.stringify(responses), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!isJsonRpcRequest(body)) {
    return corsRaw(
      JSON.stringify(failure(null, ERROR_CODES.INVALID_REQUEST, 'Invalid JSON-RPC request')),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const response = handleRequest(body);
  if (!response) {
    // Notification — no body, 202 Accepted per spec.
    return corsRaw(null, { status: 202 });
  }

  return corsRaw(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function GET() {
  // The Streamable HTTP transport allows GET for server-initiated SSE streams.
  // This server is stateless and has no such stream, so we return a small
  // discovery payload to help humans who hit the URL in a browser.
  return corsRaw(
    JSON.stringify({
      service: SERVER_INFO.name,
      version: SERVER_INFO.version,
      protocolVersion: PROTOCOL_VERSION,
      transport: 'streamable-http',
      endpoint: '/api/mcp',
      method: 'POST with JSON-RPC 2.0 body',
      tools: MCP_TOOLS.map((t) => t.name),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

export function OPTIONS() {
  return corsPreflight();
}
