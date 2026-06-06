/**
 * Authentication - login endpoint (POST /login).
 *
 * Wave-1 hardening this spec re-verifies:
 *   - CSRF round-trip (commit 8773099cb): tiny-csrf is wired with the
 *     same secret cookieParser uses, so a POST with `_csrf` + signed cookie
 *     succeeds. A POST without `_csrf` is rejected with 403.
 *   - Zod input validation (commit 3f81c9cbb): username/password length caps
 *     and required-field checks reject oversized / empty inputs with 400 BEFORE
 *     the request reaches bcrypt.
 *   - Wrong password returns 401 (constant-time verify, no enumeration).
 *
 * The /login endpoint is excluded from CSRF protection by setup.ts (it's the
 * bootstrap path for getting a cookie in the first place), so the CSRF test
 * here targets `/api/auth/refresh` - a protected POST that exercises the same
 * tiny-csrf middleware. The auth-refresh spec covers refresh semantics; this
 * one only cares about the CSRF gate.
 */
import { test, expect } from '../fixtures';
import {
  startWebUI,
  mainFetch,
  fetchCsrfTicket,
  postJsonWithCsrf,
  extractSessionCookie,
  type WebUIInstance,
} from '../helpers/auth';

test.describe('Auth: POST /login', () => {
  let webui: WebUIInstance;

  test.beforeAll(async ({ page }) => {
    webui = await startWebUI(page);
  });

  test('happy path: valid credentials return session token + cookie', async ({ electronApp }) => {
    if (!webui.initialPassword) {
      test.skip(true, 'initial password unavailable - server already booted prior to test, password rotated');
      return;
    }

    const res = await mainFetch(electronApp, `${webui.localUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: webui.username, password: webui.initialPassword }),
    });

    expect(res.status, 'valid login returns 200').toBe(200);
    const parsed = JSON.parse(res.body) as { success: boolean; token?: string; user?: { username: string } };
    expect(parsed.success).toBe(true);
    expect(typeof parsed.token, 'login response carries a JWT').toBe('string');
    expect((parsed.token ?? '').length, 'JWT is non-empty').toBeGreaterThan(20);
    expect(parsed.user?.username, 'response echoes admin username').toBe(webui.username);

    const session = extractSessionCookie(res.headers['set-cookie']);
    expect(session, 'wayland-session cookie was set').not.toBeNull();
  });

  test('wrong password returns 401 (no user enumeration)', async ({ electronApp }) => {
    const res = await mainFetch(electronApp, `${webui.localUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: webui.username, password: 'this-is-the-wrong-password' }),
    });

    expect(res.status, 'wrong password returns 401').toBe(401);
    const parsed = JSON.parse(res.body) as { success: boolean; message: string };
    expect(parsed.success).toBe(false);
    // Message must be generic so an attacker can't tell "user exists" from "user doesn't".
    expect(parsed.message, 'generic credentials message').toMatch(/invalid.*username|password/i);
  });

  test('nonexistent user returns 401 with same shape (constant-time)', async ({ electronApp }) => {
    const res = await mainFetch(electronApp, `${webui.localUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'no-such-user-xyz', password: 'anything' }),
    });

    expect(res.status, 'unknown user returns 401').toBe(401);
    const parsed = JSON.parse(res.body) as { success: boolean; message: string };
    expect(parsed.success).toBe(false);
    expect(parsed.message, 'same generic message as wrong-password').toMatch(/invalid.*username|password/i);
  });

  test('zod input rejection: empty username (commit 3f81c9cbb)', async ({ electronApp }) => {
    const res = await mainFetch(electronApp, `${webui.localUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '', password: 'something' }),
    });

    expect(res.status, 'empty username rejected at validation layer (400)').toBe(400);
    const parsed = JSON.parse(res.body) as { success: boolean; error: string };
    expect(parsed.success).toBe(false);
    expect(parsed.error, 'validation error mentions required fields').toMatch(/required/i);
  });

  test('zod input rejection: oversized username (>32 chars)', async ({ electronApp }) => {
    const oversized = 'a'.repeat(64);
    const res = await mainFetch(electronApp, `${webui.localUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: oversized, password: 'something' }),
    });

    expect(res.status, 'username >32 chars rejected with 400').toBe(400);
    const parsed = JSON.parse(res.body) as { success: boolean; error: string };
    expect(parsed.success).toBe(false);
    // The middleware reports either the length-bounds error or a generic input-shape error.
    expect(parsed.error, 'validation error message present').toMatch(/length|invalid|required/i);
  });

  test('zod input rejection: oversized password (>128 chars)', async ({ electronApp }) => {
    const oversized = 'a'.repeat(256);
    const res = await mainFetch(electronApp, `${webui.localUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: webui.username, password: oversized }),
    });

    expect(res.status, 'password >128 chars rejected with 400').toBe(400);
  });

  test('zod input rejection: non-string types', async ({ electronApp }) => {
    const res = await mainFetch(electronApp, `${webui.localUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 1234, password: ['hax'] }),
    });

    expect(res.status, 'non-string credentials rejected with 400').toBe(400);
    const parsed = JSON.parse(res.body) as { error: string };
    expect(parsed.error, 'error cites string type').toMatch(/strings/i);
  });

  test('CSRF: protected POST with valid token + cookie succeeds (commit 8773099cb)', async ({ electronApp }) => {
    // /api/auth/refresh exercises the tiny-csrf middleware. Without a valid
    // session this returns 401 ("Invalid or expired token"), NOT 403 - which
    // is the proof the CSRF gate passed.
    const ticket = await fetchCsrfTicket(electronApp, webui.localUrl);
    const res = await postJsonWithCsrf(electronApp, webui.localUrl, '/api/auth/refresh', { token: 'whatever' }, ticket);
    expect(res.status, 'valid CSRF passed - request reaches auth layer (401, not 403)').toBe(401);
  });

  test('CSRF: protected POST without _csrf body field is rejected (regression guard for commit 8773099cb)', async ({
    electronApp,
  }) => {
    const ticket = await fetchCsrfTicket(electronApp, webui.localUrl);
    // Send the signed cookie but OMIT the `_csrf` body field. tiny-csrf must
    // 403 the request before AuthMiddleware runs.
    const res = await mainFetch(electronApp, `${webui.localUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ticket.cookie,
      },
      body: JSON.stringify({ token: 'whatever' }),
    });
    expect(res.status, 'missing _csrf body field is rejected with 403').toBe(403);
  });

  // bcrypt rate-limit / 503 path (commit referenced in routes/authRoutes.ts comment):
  // express-rate-limit's authRateLimiter is configured with `windowMs: 15min,
  // max: 5, skipSuccessfulRequests: true`. Triggering it cleanly in a singleton
  // Electron run pollutes the bucket for downstream tests (15-minute window).
  // We exercise the *bcrypt-busy* 503 surface via constant-load isn't safe in
  // a shared singleton; the express-rate-limit unit tests cover the cap. We
  // record the gap rather than flake the suite.
  test.skip('rate-limit trips after 5 failed attempts (windowMs=15m, max=5) - covered by unit test', () => {
    // No-op: see src/process/webserver/middleware/security.ts authRateLimiter.
    // Triggering at runtime would consume the 15-minute window in a singleton
    // worker and break sibling specs.
  });
});
