/**
 * Authentication - logout endpoint (POST /logout).
 *
 * Verifies:
 *   - POST /logout blacklists the session token AND revokes its family.
 *   - Subsequent authenticated GET with the same session cookie returns 401.
 *   - Refreshing the blacklisted token also fails (family revocation, H5).
 *
 * Requires a fresh login first to obtain a valid session cookie + JWT. Tests
 * are scoped so each spec acquires its own session (avoids cross-test pollution
 * once a token is blacklisted).
 */
import { test, expect } from '../fixtures';
import {
  startWebUI,
  mainFetch,
  fetchCsrfTicket,
  postJsonWithCsrf,
  extractSessionCookie,
  type CsrfTicket,
  type WebUIInstance,
} from '../helpers/auth';

interface LoginResult {
  jwt: string;
  sessionCookie: string;
  ticket: CsrfTicket;
}

async function loginFresh(
  electronApp: import('@playwright/test').ElectronApplication,
  webui: WebUIInstance
): Promise<LoginResult | null> {
  if (!webui.initialPassword) return null;

  const res = await mainFetch(electronApp, `${webui.localUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: webui.username, password: webui.initialPassword }),
  });
  if (res.status !== 200) return null;

  const parsed = JSON.parse(res.body) as { token?: string };
  const session = extractSessionCookie(res.headers['set-cookie']);
  if (!parsed.token || !session) return null;

  const ticket = await fetchCsrfTicket(electronApp, webui.localUrl);
  return { jwt: parsed.token, sessionCookie: session, ticket };
}

test.describe('Auth: POST /logout', () => {
  let webui: WebUIInstance;

  test.beforeAll(async ({ page }) => {
    webui = await startWebUI(page);
  });

  test('logout invalidates session - subsequent authenticated GET returns 401', async ({ electronApp }) => {
    const session = await loginFresh(electronApp, webui);
    if (!session) {
      test.skip(true, 'could not establish a baseline session (initial password unavailable)');
      return;
    }

    // Sanity check: cookie works before logout.
    const beforeLogout = await mainFetch(electronApp, `${webui.localUrl}/api/auth/user`, {
      method: 'GET',
      headers: { Cookie: session.sessionCookie },
    });
    expect(beforeLogout.status, 'authenticated /api/auth/user works pre-logout').toBe(200);

    // Issue logout.
    const logoutRes = await postJsonWithCsrf(
      electronApp,
      webui.localUrl,
      '/logout',
      {},
      session.ticket,
      [session.sessionCookie]
    );
    expect(logoutRes.status, 'logout returns 200').toBe(200);
    const logoutBody = JSON.parse(logoutRes.body) as { success: boolean };
    expect(logoutBody.success).toBe(true);

    // After logout, the same cookie must be rejected.
    const afterLogout = await mainFetch(electronApp, `${webui.localUrl}/api/auth/user`, {
      method: 'GET',
      headers: { Cookie: session.sessionCookie },
    });
    expect(afterLogout.status, 'blacklisted token rejected on next request').toBe(401);
  });

  test('blacklisted token cannot be refreshed (family revocation, H5)', async ({ electronApp }) => {
    const session = await loginFresh(electronApp, webui);
    if (!session) {
      test.skip(true, 'could not establish a baseline session (initial password unavailable)');
      return;
    }

    // Capture the JWT before logout - we'll try to refresh it AFTER blacklisting.
    const stolenJwt = session.jwt;

    const logoutRes = await postJsonWithCsrf(
      electronApp,
      webui.localUrl,
      '/logout',
      {},
      session.ticket,
      [session.sessionCookie]
    );
    expect(logoutRes.status, 'logout completed').toBe(200);

    // Try to exchange the now-blacklisted token for a fresh one. The refresh
    // path checks isTokenBlacklisted FIRST and also re-verifies the family is
    // not revoked - both checks should fire.
    const ticket = await fetchCsrfTicket(electronApp, webui.localUrl);
    const refreshRes = await postJsonWithCsrf(
      electronApp,
      webui.localUrl,
      '/api/auth/refresh',
      { token: stolenJwt },
      ticket
    );
    expect(refreshRes.status, 'refresh with blacklisted token rejected with 401').toBe(401);
    const parsed = JSON.parse(refreshRes.body) as { success: boolean; error: string };
    expect(parsed.success).toBe(false);
    expect(parsed.error, 'error cites invalid/expired token').toMatch(/invalid|expired/i);
  });

  test('logout requires authentication - anonymous POST /logout returns 401', async ({ electronApp }) => {
    const ticket = await fetchCsrfTicket(electronApp, webui.localUrl);
    // No session cookie attached. Logout is gated by authenticateToken middleware.
    const res = await postJsonWithCsrf(electronApp, webui.localUrl, '/logout', {}, ticket);
    expect(res.status, 'unauthenticated logout is rejected with 401').toBe(401);
  });
});
