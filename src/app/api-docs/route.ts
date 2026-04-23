/**
 * Renders the OpenAPI spec at /api/v1/openapi.json using ReDoc.
 *
 * Served as a Route Handler (not a Page) so it escapes the root layout and
 * owns the full viewport. Styled to match the DMI palette and IBM Plex
 * typography used by the rest of the app (see src/lib/dmi-theme.ts).
 *
 * Theming has three layers:
 *   1. `redocTheme` — ReDoc's own theme object (colors, typography, sidebar).
 *   2. `x-logo` in the OpenAPI spec — puts the DMI logo in the sidebar.
 *   3. A small <style> override for things the theme object can't reach
 *      (yellow accent on active sidebar items, scrollbar color, etc.).
 */

export const runtime = 'nodejs';

const REDOC_VERSION = '2.5.2';
const REDOC_SCRIPT = `https://cdn.redoc.ly/redoc/v${REDOC_VERSION}/bundles/redoc.standalone.js`;

// DMI palette (mirrors src/lib/dmi-theme.ts).
const DMI = {
  darkBlue: '#0a3660',
  mediumBlue: '#115491',
  yellow: '#ffba08',
  blueTint1: '#a3cdf4',
  blueTint2: '#daebfb',
  blueTint3: '#f6f9fd',
  darkGray: '#565656',
  lightGray: '#efefef',
  white: '#ffffff',
};

// ReDoc theme object — see https://redocly.com/docs/api-reference-docs/configuration/theming
const redocTheme = {
  spacing: {
    unit: 5,
    sectionHorizontal: 40,
    sectionVertical: 40,
  },
  colors: {
    primary: { main: DMI.darkBlue, light: DMI.mediumBlue },
    success: { main: DMI.mediumBlue },
    warning: { main: DMI.yellow, contrastText: DMI.darkBlue },
    error: { main: '#b00020' },
    text: { primary: DMI.darkBlue, secondary: DMI.darkGray },
    border: { dark: DMI.blueTint2, light: DMI.blueTint3 },
    responses: {
      success: { color: DMI.mediumBlue, backgroundColor: DMI.blueTint3 },
      error: { color: '#b00020', backgroundColor: '#fff5f5' },
      redirect: { color: DMI.mediumBlue, backgroundColor: DMI.blueTint3 },
      info: { color: DMI.mediumBlue, backgroundColor: DMI.blueTint3 },
    },
    http: {
      get: DMI.mediumBlue,
      post: DMI.darkBlue,
      put: '#d88f00',
      options: DMI.mediumBlue,
      patch: DMI.yellow,
      delete: '#b00020',
      basic: DMI.darkGray,
      link: DMI.mediumBlue,
      head: DMI.darkGray,
    },
  },
  typography: {
    fontSize: '15px',
    fontFamily: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    smoothing: 'antialiased',
    optimizeSpeed: true,
    headings: {
      fontFamily: '"IBM Plex Sans Condensed", "IBM Plex Sans", sans-serif',
      fontWeight: '700',
      lineHeight: '1.25',
    },
    code: {
      fontSize: '13px',
      fontFamily: '"IBM Plex Mono", Menlo, Consolas, monospace',
      lineHeight: '1.55',
      fontWeight: '500',
      color: DMI.darkBlue,
      backgroundColor: DMI.blueTint3,
      wrap: true,
    },
    links: { color: DMI.mediumBlue, visited: DMI.mediumBlue, hover: DMI.darkBlue, textDecoration: 'none', hoverTextDecoration: 'underline' },
  },
  sidebar: {
    width: '280px',
    backgroundColor: DMI.blueTint3,
    textColor: DMI.darkBlue,
    activeTextColor: DMI.darkBlue,
    groupItems: {
      activeBackgroundColor: DMI.blueTint2,
      activeTextColor: DMI.darkBlue,
      textTransform: 'uppercase',
    },
    level1Items: {
      activeBackgroundColor: DMI.white,
      activeTextColor: DMI.darkBlue,
      textTransform: 'none',
    },
    arrow: { size: '1.2em', color: DMI.mediumBlue },
  },
  logo: {
    gutter: '24px',
    maxHeight: '44px',
  },
  rightPanel: {
    backgroundColor: DMI.darkBlue,
    textColor: DMI.blueTint2,
    width: '38%',
    servers: {
      overlay: { backgroundColor: DMI.mediumBlue, textColor: DMI.white },
      url: { backgroundColor: 'rgba(255,255,255,0.08)' },
    },
  },
  codeBlock: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    tokens: {},
  },
  schema: {
    nestedBackground: DMI.blueTint3,
    linesColor: DMI.blueTint1,
    typeNameColor: DMI.mediumBlue,
    typeTitleColor: DMI.darkBlue,
    requireLabelColor: '#b00020',
    labelsTextSize: '0.82em',
    defaultDetailsWidth: '75%',
    caretColor: DMI.mediumBlue,
    caretSize: '1.2em',
  },
  fab: { backgroundColor: DMI.darkBlue, color: DMI.yellow },
};

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>API Reference — Ruimtemodel Stadslogistiek</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="OpenAPI reference for the Ruimtemodel Stadslogistiek REST API." />
  <link rel="icon" href="/icon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Condensed:wght@400;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --dmi-dark-blue: ${DMI.darkBlue};
      --dmi-medium-blue: ${DMI.mediumBlue};
      --dmi-yellow: ${DMI.yellow};
      --dmi-blue-tint-1: ${DMI.blueTint1};
      --dmi-blue-tint-2: ${DMI.blueTint2};
      --dmi-blue-tint-3: ${DMI.blueTint3};
      --dmi-dark-gray: ${DMI.darkGray};
      --dmi-white: ${DMI.white};
      --font-sans: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-condensed: 'IBM Plex Sans Condensed', 'IBM Plex Sans', sans-serif;
      --font-mono: 'IBM Plex Mono', Menlo, Consolas, monospace;
    }
    html, body { margin: 0; padding: 0; font-family: var(--font-sans); -webkit-font-smoothing: antialiased; background: var(--dmi-blue-tint-3); }

    /* DMI header bar */
    .site-header {
      background: var(--dmi-dark-blue);
      color: var(--dmi-white);
      padding: 14px 32px;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .site-header-inner { max-width: 1600px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .site-header h1 { font-family: var(--font-condensed); font-weight: 700; font-size: 1.3rem; margin: 0; color: var(--dmi-white); letter-spacing: -0.005em; }
    .site-header .kicker { font-family: var(--font-sans); color: var(--dmi-blue-tint-1); font-size: 0.82rem; margin: 3px 0 0; }
    .site-header a { color: var(--dmi-blue-tint-1); text-decoration: none; font-size: 0.75rem; font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.06em; }
    .site-header a + a { margin-left: 20px; }
    .site-header a:hover { color: var(--dmi-yellow); }
    .accent { height: 3px; background: var(--dmi-yellow); position: sticky; top: 54px; z-index: 99; }

    /* -- ReDoc DMI overrides ------------------------------------------------ */
    /* ReDoc renders to regular DOM; these rules refine what the theme object can't reach. */

    /* Yellow left-edge accent on the active sidebar item */
    .menu-content li[data-item-id].active > label,
    .menu-content li.active > label[role="menuitem"],
    .menu-content label[role="menuitem"].active {
      box-shadow: inset 3px 0 0 var(--dmi-yellow);
    }

    /* Sidebar search box — round it and match DMI tokens */
    .menu-content input[type="text"] {
      border: 1px solid var(--dmi-blue-tint-2) !important;
      border-radius: 6px !important;
      background: var(--dmi-white) !important;
      color: var(--dmi-dark-blue) !important;
      font-family: var(--font-sans) !important;
    }

    /* HTTP method "POST/GET" badges — tighten typography */
    .operation-type {
      font-family: var(--font-mono) !important;
      font-weight: 600 !important;
      letter-spacing: 0.04em !important;
      border-radius: 4px !important;
    }

    /* "Download" spec button — DMI pill */
    a[download], a[href$=".json"][target="_blank"] {
      border-radius: 999px !important;
    }

    /* Schema required-asterisk color consistency */
    .redoc-json code { font-family: var(--font-mono) !important; }

    /* Custom scrollbar on WebKit */
    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-track { background: var(--dmi-blue-tint-3); }
    ::-webkit-scrollbar-thumb { background: var(--dmi-blue-tint-1); border-radius: 5px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--dmi-medium-blue); }

    /* Headings: subtle yellow underline under h1 for each tag/operation group */
    h1[data-section-id] {
      border-bottom: 2px solid var(--dmi-yellow);
      padding-bottom: 6px;
      display: inline-block;
    }

    /* Fenced-code blocks in markdown descriptions (e.g. "Quick start") —
       ReDoc renders these in the main content column, NOT the right panel,
       so a narrow selector here can't affect the response samples. */
    .api-info pre,
    .redoc-markdown pre {
      background: var(--dmi-dark-blue) !important;
      color: var(--dmi-blue-tint-2) !important;
      border-radius: 8px !important;
      padding: 14px 18px !important;
      font-family: var(--font-mono) !important;
      font-size: 0.82rem;
      line-height: 1.55;
      box-shadow: none !important;
      overflow-x: auto;
    }
    .api-info pre code,
    .redoc-markdown pre code {
      background: transparent !important;
      color: inherit !important;
      padding: 0 !important;
      font-family: inherit !important;
    }

    @media (max-width: 600px) {
      .site-header { padding: 12px 20px; }
      .site-header h1 { font-size: 1.05rem; }
    }
  </style>
</head>
<body>
  <header class="site-header">
    <div class="site-header-inner">
      <div>
        <h1>Ruimtemodel Stadslogistiek</h1>
        <p class="kicker">REST API — OpenAPI reference</p>
      </div>
      <nav>
        <a href="/mcp-connect">MCP instellen</a>
        <a href="/">Terug naar app</a>
      </nav>
    </div>
  </header>
  <div class="accent"></div>
  <redoc spec-url="/api/v1/openapi.json"
         expand-responses="200"
         hide-download-button="false"
         theme='${JSON.stringify(redocTheme)}'></redoc>
  <script src="${REDOC_SCRIPT}"></script>
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
