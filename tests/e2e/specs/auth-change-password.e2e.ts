/**
 * Authentication - change-password endpoint (POST /api/auth/change-password).
 *
 * Verifies W4 L4 hardening (zxcvbn strength requirement) plus the standard
 * gates:
 *   - Authenticated session required (401 without cookie).
 *   - Wrong currentPassword → 401, password not rotated.
 *   - New password too weak (zxcvbn score < 3) → 400, error cites strength.
 *   - Empty / oversized new password → zod validation 400.
 *
 * We deliberately do NOT exercise the happy-path rotation in this spec - it
 * would mutate the admin password mid-suite and break every downstream spec
 * that relies on the bootstrap credentials. The unit test in
 * tests/unit/process/webserver/routes/authRoutes.spec.ts covers the success
 * path against an isolated DB.
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
  const sessionCookie = extractSessionCookie(res.headers['set-cookie']);
  if (!parsed.token || !sessionCookie) return null;
  const ticket = await fetchCsrfTicket(electronApp, webui.localUrl);
  return { jwt: parsed.token, sessionCookie, ticket };
}

test.describe('Auth: POST /api/auth/change-password', () => {
  let webui: WebUIInstance;

  test.beforeAll(async ({ page }) => {
    webui = await startWebUI(page);
  });

  test('requires authentication: anonymous POST → 401', async ({ electronApp }) => {
    const ticket = await fetchCsrfTicket(electronApp, webui.localUrl);
    const res = await postJsonWithCsrf(
      electronApp,
      webui.localUrl,
      '/api/auth/change-password',
      { currentPassword: 'whatever', newPassword: 'something-strong' },
      ticket
    );
    expect(res.status, 'no session cookie → 401').toBe(401);
  });

  test('wrong currentPassword → 401, password unchanged', async ({ electronApp }) => {
    const session = await loginFresh(electronApp, webui);
    if (!session) {
      test.skip(true, 'could not establish a baseline session');
      return;
    }

    const ticket = await fetchCsrfTicket(electronApp, webui.localUrl);
    const res = await postJsonWithCsrf(
      electronApp,
      webui.localUrl,
      '/api/auth/change-password',
      {
        currentPassword: 'this-is-definitely-not-the-current-password',
        // Pick a strong new password so zxcvbn doesn't short-circuit before
        // the wrong-current-password check.
        newPassword: 'Tr0ub4dor&3-correct-horse-battery-staple',
      },
      ticket,
      [session.sessionCookie]
    );

    expect(res.status, 'wrong currentPassword returns 401').toBe(401);
    const parsed = JSON.parse(res.body) as { success: boolean; error: string };
    expect(parsed.success).toBe(false);
    expect(parsed.error, 'error cites current-password mismatch').toMatch(/current password|incorrect/i);

    // Verify the original password still works - i.e. the rotation didn't
    // partially succeed.
    if (webui.initialPassword) {
      const verifyLogin = await mainFetch(electronApp, `${webui.localUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: webui.username, password: webui.initialPassword }),
      });
      expect(verifyLogin.status, 'original password still valid → rotation did not occur').toBe(200);
    }
  });

  test('new password too weak (zxcvbn score < 3) → 400 with strength error', async ({ electronApp }) => {
    const session = await loginFresh(electronApp, webui);
    if (!session) {
      test.skip(true, 'could not establish a baseline session');
      return;
    }

    const ticket = await fetchCsrfTicket(electronApp, webui.localUrl);
    const res = await postJsonWithCsrf(
      electronApp,
      webui.localUrl,
      '/api/auth/change-password',
      {
        // currentPassword can be wrong here - strength gate runs BEFORE
        // verifyPassword. The route validates new-password strength first.
        currentPassword: 'placeholder',
        // "password123" is a known top-tier weak password; zxcvbn scores it 0.
        newPassword: 'password123',
      },
      ticket,
      [session.sessionCookie]
    );

    expect(res.status, 'weak new password rejected with 400').toBe(400);
    const parsed = JSON.parse(res.body) as { success: boolean; error: string; details?: string[] };
    expect(parsed.success).toBe(false);
    expect(parsed.error, 'error mentions security/strength').toMatch(/security|strength|requirements/i);
    if (parsed.details) {
      const reason = parsed.details.join(' ');
      expect(reason, 'detail cites length, predictability, or common-password').toMatch(
        /PASSWORD_TOO_(SHORT|PREDICTABLE|COMMON)/
      );
    }
  });

  test('new password too short → 400 (length gate)', async ({ electronApp }) => {
    const session = await loginFresh(electronApp, webui);
    if (!session) {
      test.skip(true, 'could not establish a baseline session');
      return;
    }

    const ticket = await fetchCsrfTicket(electronApp, webui.localUrl);
    const res = await postJsonWithCsrf(
      electronApp,
      webui.localUrl,
      '/api/auth/change-password',
      { currentPassword: 'placeholder', newPassword: 'short' },
      ticket,
      [session.sessionCookie]
    );

    expect(res.status, 'short new password rejected with 400').toBe(400);
  });

  test('empty fields → 400 (zod required)', async ({ electronApp }) => {
    const session = await loginFresh(electronApp, webui);
    if (!session) {
      test.skip(true, 'could not establish a baseline session');
      return;
    }

    const ticket = await fetchCsrfTicket(electronApp, webui.localUrl);
    const res = await postJsonWithCsrf(
      electronApp,
      webui.localUrl,
      '/api/auth/change-password',
      { currentPassword: '', newPassword: '' },
      ticket,
      [session.sessionCookie]
    );

    expect(res.status, 'empty fields rejected with 400').toBe(400);
  });

  // The HTTP route uses `authenticatedActionLimiter` (windowMs=60s, max=20)
  // keyed by user. Triggering 20+ requests in a tight loop within the
  // singleton worker would block the same user from any other authenticated
  // call for a full minute and disrupt downstream tests in this file.
  test.skip('authenticatedActionLimiter trips at >20 req/min - covered by unit test on the limiter directly', () => {
    // No-op: src/process/webserver/middleware/security.ts authenticatedActionLimiter.
  });

  // The webui-direct-* IPC channel `webui-direct-change-password` is gated by
  // a NATIVE main-process confirmation dialog (dialog.showMessageBox). The
  // dialog blocks main-process event loop until the user clicks, which a
  // headless Playwright run cannot satisfy without main-process mocking. The
  // gate is exercised by tests/unit/process/bridge/webuiDirectAuth.spec.ts.
  test.skip('webui-direct-change-password native dialog gate - covered by unit test on requireConfirmation', () => {
    // No-op: src/process/bridge/webuiDirectAuth.ts requireConfirmation.
  });
});
