/**
 * /mcp-connect — copy-paste configuration snippets for common MCP clients.
 *
 * Served as a Route Handler so it renders outside the app layout. The MCP URL
 * is substituted into each snippet client-side from `window.location.origin`,
 * so the page works in any environment (localhost, staging, production).
 *
 * Styling follows the DMI palette and IBM Plex typography used by the rest
 * of the app — see src/lib/dmi-theme.ts.
 */

export const runtime = 'nodejs';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Connect MCP — Ruimtemodel Stadslogistiek</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="Copy-paste configuration snippets to connect MCP clients to the Ruimtemodel Stadslogistiek server." />
  <link rel="icon" href="/icon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Condensed:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --dmi-dark-blue: #0a3660;
      --dmi-medium-blue: #115491;
      --dmi-yellow: #ffba08;
      --dmi-blue-tint-1: #a3cdf4;
      --dmi-blue-tint-2: #daebfb;
      --dmi-blue-tint-3: #f6f9fd;
      --dmi-dark-gray: #565656;
      --dmi-light-gray: #efefef;
      --dmi-white: #ffffff;
      --font-sans: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-condensed: 'IBM Plex Sans Condensed', 'IBM Plex Sans', sans-serif;
      --font-mono: 'IBM Plex Mono', Menlo, Consolas, monospace;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; color: var(--dmi-dark-gray); background: var(--dmi-blue-tint-3); font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }

    /* Header — matches DmiCockpitLayout */
    .site-header {
      background: var(--dmi-dark-blue);
      color: var(--dmi-white);
      padding: 16px 32px;
    }
    .site-header-inner { max-width: 1120px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .site-header h1 { font-family: var(--font-condensed); font-weight: 700; font-size: 1.5rem; margin: 0; color: var(--dmi-white); letter-spacing: -0.005em; }
    .site-header .kicker { font-family: var(--font-sans); color: var(--dmi-blue-tint-1); font-size: 0.875rem; margin: 4px 0 0; }
    .site-header a { color: var(--dmi-blue-tint-1); text-decoration: none; font-size: 0.8rem; font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.05em; }
    .site-header a:hover { color: var(--dmi-white); }

    /* Yellow accent bar under the header */
    .accent { height: 3px; background: var(--dmi-yellow); }

    main { max-width: 880px; margin: 0 auto; padding: 40px 24px 64px; }

    /* Intro block */
    .intro h2 { font-family: var(--font-condensed); font-weight: 700; color: var(--dmi-dark-blue); font-size: 1.5rem; margin: 0 0 8px; }
    .intro p { font-size: 0.95rem; line-height: 1.65; color: var(--dmi-dark-gray); margin: 0; max-width: 64ch; }

    .url-box {
      margin-top: 20px;
      padding: 14px 18px;
      border: 1px solid var(--dmi-blue-tint-2);
      border-left: 3px solid var(--dmi-yellow);
      border-radius: 8px;
      background: var(--dmi-white);
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .url-box .label { font-family: var(--font-mono); font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--dmi-medium-blue); font-weight: 500; }
    .url-box code { flex: 1; font-family: var(--font-mono); font-size: 0.88rem; color: var(--dmi-dark-blue); word-break: break-all; }

    /* Card sections */
    section.card {
      background: var(--dmi-white);
      border: 1px solid var(--dmi-blue-tint-2);
      border-radius: 10px;
      padding: 22px 26px;
      margin-top: 20px;
      box-shadow: 0 1px 3px rgba(10,54,96,0.04);
    }
    section.card h3 { font-family: var(--font-condensed); font-weight: 700; color: var(--dmi-dark-blue); font-size: 1.1rem; margin: 0 0 2px; }
    section.card .tag { font-family: var(--font-mono); font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--dmi-medium-blue); font-weight: 500; margin-bottom: 8px; }
    section.card .where { color: var(--dmi-dark-gray); font-size: 0.88rem; line-height: 1.6; margin: 0 0 14px; }
    section.card .where code { background: var(--dmi-blue-tint-3); padding: 1px 6px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.82em; color: var(--dmi-medium-blue); border: 1px solid var(--dmi-blue-tint-2); }

    /* Code snippet block */
    .snippet { position: relative; }
    .snippet pre {
      margin: 0;
      padding: 16px 18px;
      background: var(--dmi-dark-blue);
      color: var(--dmi-blue-tint-2);
      border-radius: 8px;
      font-family: var(--font-mono);
      font-size: 0.82rem;
      line-height: 1.6;
      overflow-x: auto;
      white-space: pre;
    }
    .copy-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(255,255,255,0.08);
      color: var(--dmi-white);
      border: 1px solid rgba(255,186,8,0.5);
      border-radius: 6px;
      padding: 4px 12px;
      font-size: 0.7rem;
      font-family: var(--font-mono);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    }
    .copy-btn:hover { background: var(--dmi-yellow); color: var(--dmi-dark-blue); border-color: var(--dmi-yellow); }
    .copy-btn.copied { background: var(--dmi-yellow); color: var(--dmi-dark-blue); border-color: var(--dmi-yellow); }

    .footer-note { margin-top: 40px; color: var(--dmi-dark-gray); font-size: 0.85rem; line-height: 1.65; text-align: center; }
    .footer-note a { color: var(--dmi-medium-blue); text-decoration: none; border-bottom: 1px solid var(--dmi-blue-tint-2); }
    .footer-note a:hover { color: var(--dmi-dark-blue); border-bottom-color: var(--dmi-dark-blue); }

    @media (max-width: 600px) {
      .site-header { padding: 14px 20px; }
      .site-header h1 { font-size: 1.15rem; }
      main { padding: 24px 16px 48px; }
      section.card { padding: 18px 18px; }
    }
  </style>
</head>
<body>
  <header class="site-header">
    <div class="site-header-inner">
      <div>
        <h1>Ruimtemodel Stadslogistiek</h1>
        <p class="kicker">MCP — Connect a client</p>
      </div>
      <a href="/">← Terug naar de app</a>
    </div>
  </header>
  <div class="accent"></div>

  <main>
    <div class="intro">
      <h2>Connect the Ruimtemodel MCP server</h2>
      <p>Paste one of the blocks below into your MCP client's configuration file. The URL has already been filled in for this deployment.</p>
      <div class="url-box">
        <span class="label">MCP URL</span>
        <code id="mcp-url">{{MCP_URL}}</code>
      </div>
    </div>

    <section class="card">
      <div class="tag">Claude Code — CLI</div>
      <h3>One-liner</h3>
      <p class="where">Run this once from any directory. Add <code>--scope user</code> for a global install; omit for project-local.</p>
      <div class="snippet">
        <pre><code data-tmpl>claude mcp add --transport http ruimtemodel {{MCP_URL}}</code></pre>
        <button class="copy-btn">Copy</button>
      </div>
    </section>

    <section class="card">
      <div class="tag">Claude Code — file</div>
      <h3>.mcp.json</h3>
      <p class="where">Drop in <code>.mcp.json</code> at the project root, or merge into <code>~/.claude.json</code>.</p>
      <div class="snippet">
        <pre><code data-tmpl>{
  "mcpServers": {
    "ruimtemodel": {
      "type": "http",
      "url": "{{MCP_URL}}"
    }
  }
}</code></pre>
        <button class="copy-btn">Copy</button>
      </div>
    </section>

    <section class="card">
      <div class="tag">Claude Desktop</div>
      <h3>claude_desktop_config.json</h3>
      <p class="where">Merge into <code>~/Library/Application Support/Claude/claude_desktop_config.json</code> (macOS) or <code>%APPDATA%\\Claude\\claude_desktop_config.json</code> (Windows). Uses <code>mcp-remote</code> to bridge stdio to HTTP — <code>npx</code> fetches it on first run.</p>
      <div class="snippet">
        <pre><code data-tmpl>{
  "mcpServers": {
    "ruimtemodel": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "{{MCP_URL}}"]
    }
  }
}</code></pre>
        <button class="copy-btn">Copy</button>
      </div>
    </section>

    <section class="card">
      <div class="tag">Cursor</div>
      <h3>mcp.json</h3>
      <p class="where">Merge into <code>~/.cursor/mcp.json</code> (global) or <code>.cursor/mcp.json</code> in a project.</p>
      <div class="snippet">
        <pre><code data-tmpl>{
  "mcpServers": {
    "ruimtemodel": {
      "url": "{{MCP_URL}}"
    }
  }
}</code></pre>
        <button class="copy-btn">Copy</button>
      </div>
    </section>

    <section class="card">
      <div class="tag">Codex CLI — OpenAI</div>
      <h3>config.toml</h3>
      <p class="where">Append to <code>~/.codex/config.toml</code>.</p>
      <div class="snippet">
        <pre><code data-tmpl>[mcp_servers.ruimtemodel]
type = "http"
url = "{{MCP_URL}}"</code></pre>
        <button class="copy-btn">Copy</button>
      </div>
    </section>

    <section class="card">
      <div class="tag">Windsurf — Codeium</div>
      <h3>mcp_config.json</h3>
      <p class="where">Merge into <code>~/.codeium/windsurf/mcp_config.json</code>.</p>
      <div class="snippet">
        <pre><code data-tmpl>{
  "mcpServers": {
    "ruimtemodel": {
      "serverUrl": "{{MCP_URL}}"
    }
  }
}</code></pre>
        <button class="copy-btn">Copy</button>
      </div>
    </section>

    <section class="card">
      <div class="tag">VS Code — Copilot / MCP</div>
      <h3>.vscode/mcp.json</h3>
      <p class="where">Create <code>.vscode/mcp.json</code> in your workspace, or merge into user settings.</p>
      <div class="snippet">
        <pre><code data-tmpl>{
  "servers": {
    "ruimtemodel": {
      "type": "http",
      "url": "{{MCP_URL}}"
    }
  }
}</code></pre>
        <button class="copy-btn">Copy</button>
      </div>
    </section>

    <section class="card">
      <div class="tag">Verify</div>
      <h3>Quick test with curl</h3>
      <p class="where">Lists the tools exposed by the server — useful to verify reachability before wiring up a client.</p>
      <div class="snippet">
        <pre><code data-tmpl>curl -s -X POST {{MCP_URL}} \\
  -H 'Content-Type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'</code></pre>
        <button class="copy-btn">Copy</button>
      </div>
    </section>

    <p class="footer-note">
      Full transport and tool reference: <a href="/api-docs">API docs</a>.<br />
      Raw discovery endpoint: <a href="/api/mcp">/api/mcp</a>.
    </p>
  </main>

  <script>
    (function () {
      var url = window.location.origin + '/api/mcp';
      document.querySelectorAll('[data-tmpl], #mcp-url').forEach(function (el) {
        el.textContent = el.textContent.replace(/\\{\\{MCP_URL\\}\\}/g, url);
      });
      document.querySelectorAll('.copy-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var code = btn.parentElement.querySelector('code');
          var text = code.textContent;
          var done = function () {
            btn.classList.add('copied');
            btn.textContent = 'Copied';
            setTimeout(function () {
              btn.classList.remove('copied');
              btn.textContent = 'Copy';
            }, 1400);
          };
          if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(done).catch(function () {
              fallbackCopy(text, done);
            });
          } else {
            fallbackCopy(text, done);
          }
        });
      });
      function fallbackCopy(text, done) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (e) { /* silent */ }
        document.body.removeChild(ta);
      }
    })();
  </script>
</body>
</html>
`;

export function GET() {
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
