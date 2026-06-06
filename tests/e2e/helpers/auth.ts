/**
 * Test helpers for authentication / WebUI server flows.
 *
 * The WebUI HTTP server is NOT started automatically - it's gated behind the
 * user's "Enable WebUI" toggle. These helpers let the auth e2e specs:
 *
 *   1. Bring the server up via the `webui.start` bridge (returns port + initial
 *      password on first launch).
 *   2. Fetch a fresh CSRF token + signed cookie from `GET /` so subsequent
 *      POSTs satisfy the tiny-csrf gate.
 *   3. Run authenticated request flows from the main process (Node fetch) -
 *      easier than juggling cookies in the renderer and bypasses the renderer's
 *      same-origin restriction on the webserver origin.
 *
 * The handlers use `electronApp.evaluate` to issue HTTP calls from Node (the
 * main process can reach 127.0.0.1:<port> without the renderer's CORS dance).
 */
import type { ElectronApplication, Page } from '@playwright/test';
import { invokeBridge } from './bridge';

export interface WebUIInstance {
  port: number;
  localUrl: string;
  initialPassword?: string;
  /** Admin username - defaults to 'admin' when status doesn't expose it. */
  username: string;
}

interface WebuiStartResponse {
  success: boolean;
  data?: {
    port: number;
    localUrl: string;
    initialPassword?: string;
  };
  msg?: string;
}

interface WebuiGetStatusResponse {
  success: boolean;
  data?: {
    isRunning: boolean;
    port?: number;
    adminUsername?: string;
    initialPassword?: string;
  };
  msg?: string;
}

/**
 * Start the WebUI server (idempotent - calling when already running restarts it).
 *
 * The provider returns the actual bound port (may differ from preferred when
 * EADDRINUSE forces an auto-increment) and, on first launch, the bootstrap
 * `initialPassword` we need to log in.
 *
 * If `initialPassword` is absent (e.g. server was running from a prior test),
 * we fall through to status to read the admin username and trust that the
 * caller will provide credentials another way (or skip).
 */
export async function startWebUI(page: Page): Promise<WebUIInstance> {
  const startResp = await invokeBridge<WebuiStartResponse>(
    page,
    'webui.start',
    { allowRemote: false },
    20_000
  );

  if (!startResp.success || !startResp.data) {
    throw new Error(`webui.start failed: ${startResp.msg ?? 'unknown error'}`);
  }

  const statusResp = await invokeBridge<WebuiGetStatusResponse>(page, 'webui.get-status', undefined, 5_000);
  const username = statusResp.data?.adminUsername ?? 'admin';

  return {
    port: startResp.data.port,
    localUrl: startResp.data.localUrl,
    initialPassword: startResp.data.initialPassword,
    username,
  };
}

/** Stop the WebUI server, ignoring "not running" errors. */
export async function stopWebUI(page: Page): Promise<void> {
  try {
    await invokeBridge<{ success: boolean; msg?: string }>(page, 'webui.stop', undefined, 5_000);
  } catch {
    // best-effort - tests rely on test.afterAll to clean up
  }
}

export interface CsrfTicket {
  /** The CSRF token to include as `_csrf` body field. */
  token: string;
  /** The signed cookies (`_csrf=...`) the server expects on POST. */
  cookie: string;
}

interface FetchResult {
  status: number;
  body: string;
  headers: Record<string, string>;
}

/**
 * Run a fetch() call from the Electron main process against the WebUI server.
 *
 * Uses Node's global fetch (Electron 41 ships Chromium fetch in main too).
 */
export async function mainFetch(
  electronApp: ElectronApplication,
  url: string,
  init: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: string;
  } = {}
): Promise<FetchResult> {
  return electronApp.evaluate(async (_app, args) => {
    const res = await fetch(args.url, {
      method: args.method ?? 'GET',
      headers: args.headers ?? {},
      body: args.body,
    });
    const headers: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      // Preserve set-cookie verbatim (it may be present as a comma-joined list
      // in some Node versions - that's fine for our use).
      const existing = headers[key];
      headers[key] = existing ? `${existing}, ${value}` : value;
    });
    const body = await res.text();
    return { status: res.status, body, headers };
  }, { url, method: init.method, headers: init.headers, body: init.body });
}

/**
 * Acquire a CSRF token + signed cookie pair from the server.
 *
 * tiny-csrf signs `_csrf=<token>` into a cookie keyed on the CSRF_SECRET. The
 * server emits both:
 *   - `Set-Cookie: _csrf=<signed-value>` - must be echoed back on the POST.
 *   - `X-CSRF-Token: <token>` header (from attachCsrfToken middleware) - the
 *     `_csrf` body value the server will compare against.
 *
 * Any GET that runs through the csrf middleware mints both, but the auth-status
 * endpoint is the safest bet because it returns a small JSON payload (won't
 * fight with HTML parsing) and doesn't require an auth cookie itself.
 */
export async function fetchCsrfTicket(
  electronApp: ElectronApplication,
  baseUrl: string
): Promise<CsrfTicket> {
  const res = await mainFetch(electronApp, `${baseUrl}/api/auth/status`);
  const headerToken = res.headers['x-csrf-token'];
  if (!headerToken) {
    throw new Error('CSRF token missing from /api/auth/status response - middleware not wired?');
  }
  const setCookie = res.headers['set-cookie'];
  if (!setCookie) {
    throw new Error('Set-Cookie missing from /api/auth/status response - cookieParser not wired?');
  }
  // Extract the _csrf= chunk verbatim including any signed=s%3A... payload.
  // The cookie header is `name=value; Path=/; HttpOnly` etc.
  const csrfMatch = setCookie.match(/_csrf=([^;]+)/);
  if (!csrfMatch) {
    throw new Error(`Set-Cookie did not contain _csrf=: ${setCookie}`);
  }
  return {
    token: headerToken,
    cookie: `_csrf=${csrfMatch[1]}`,
  };
}

/**
 * POST a JSON body with a valid CSRF token + signed cookie attached.
 *
 * `extraCookies` lets the caller forward a session cookie acquired from /login.
 */
export async function postJsonWithCsrf(
  electronApp: ElectronApplication,
  baseUrl: string,
  path: string,
  body: Record<string, unknown>,
  ticket: CsrfTicket,
  extraCookies: string[] = []
): Promise<FetchResult> {
  const cookieHeader = [ticket.cookie, ...extraCookies].join('; ');
  return mainFetch(electronApp, `${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ ...body, _csrf: ticket.token }),
  });
}

/**
 * Extract the `wayland-session=<jwt>` cookie value from a Set-Cookie header.
 * Returns the full `wayland-session=<jwt>` chunk ready to splice into a Cookie
 * header, or null if not present.
 */
export function extractSessionCookie(setCookieHeader: string | undefined): string | null {
  if (!setCookieHeader) return null;
  const match = setCookieHeader.match(/wayland-session=([^;]+)/);
  return match ? `wayland-session=${match[1]}` : null;
}
