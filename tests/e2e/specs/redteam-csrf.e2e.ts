/**
 * Red-team probe - CSRF mitigation.
 *
 * Verifies the tiny-csrf transport contract introduced in:
 *   - fcbe340f5 fix(security): W4 L9 - wire CSRF into uploadFileViaHttp + drop /api/upload exemption
 *   - 8773099cb fix(security): P0 - restore CSRF cookie-parser secret + upload form-body transport
 *
 * tiny-csrf reads the token from `req.body._csrf` and the *signed* cookie set
 * via cookie-parser(secret). Probes attempt to bypass each leg of that
 * contract from the WebUI perspective.
 *
 * To reach the HTTP surface, the test boots the embedded webserver via the
 * `webui.start` bridge provider (registered in src/process/bridge/webuiBridge.ts).
 * If the bridge or webserver is unavailable in this run, the suite emits a
 * structured skip with the audit commit SHA so the gap stays visible.
 */
import { test, expect } from '../fixtures';
import { invokeBridge } from '../helpers';

type StartResp = { success: true; data: { port: number } } | { success: false; msg: string };

async function startWebUI(page: import('@playwright/test').Page): Promise<number | null> {
  // Use a high-port to avoid colliding with whatever happens to be running
  // on the user's machine; webserver auto-increments on EADDRINUSE.
  const resp = await invokeBridge<StartResp>(page, 'webui.start', { port: 35808, allowRemote: false }, 15_000).catch(
    (err: Error) => ({ success: false, msg: err.message }) as StartResp
  );
  if (!resp.success) return null;
  return resp.data.port;
}

async function stopWebUI(page: import('@playwright/test').Page): Promise<void> {
  await invokeBridge<unknown>(page, 'webui.stop', undefined, 5_000).catch(() => {
    /* best-effort */
  });
}

test.describe('Red-team: CSRF (commits fcbe340f5 + 8773099cb)', () => {
  let port: number | null = null;

  test.beforeAll(async ({ page }) => {
    port = await startWebUI(page);
  });

  test.afterAll(async ({ page }) => {
    if (port !== null) await stopWebUI(page);
  });

  test('POST without _csrf body field → rejected (no signed cookie either)', async ({ page }) => {
    test.skip(port === null, 'webserver not reachable; webui.start bridge unavailable in this run');
    const probe = await page.evaluate(async (p) => {
      // No cookies are sent because this fetch is from the renderer's origin,
      // not the webserver origin. We hit the protected endpoint anyway with
      // an empty body - tiny-csrf must reject the request.
      const res = await fetch(`http://localhost:${p}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      return { status: res.status };
    }, port);
    // tiny-csrf returns 403 on a missing/invalid token. A 200 here is a
    // P0 finding (CSRF bypass) - assert hard.
    expect(probe.status, 'POST without _csrf must be rejected').not.toBe(200);
    expect(probe.status, 'expected 403 from tiny-csrf').toBeGreaterThanOrEqual(400);
  });

  test('POST with _csrf in header instead of body → rejected (tiny-csrf only reads body)', async ({ page }) => {
    test.skip(port === null, 'webserver not reachable; webui.start bridge unavailable in this run');
    const probe = await page.evaluate(async (p) => {
      // Even if an attacker harvested a token from a previous response, putting
      // it in a header (the pattern that csurf and double-submit-cookie libs
      // support) does NOT satisfy tiny-csrf. Body-field is the only valid leg.
      const res = await fetch(`http://localhost:${p}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'attacker-controlled-or-stale-token',
          'csrf-token': 'attacker-controlled-or-stale-token',
        },
        body: JSON.stringify({}),
      });
      return { status: res.status };
    }, port);
    expect(probe.status, 'header-only CSRF token must be rejected').not.toBe(200);
    expect(probe.status, 'expected 403 from tiny-csrf').toBeGreaterThanOrEqual(400);
  });

  test('POST with crafted _csrf but no signed cookie → rejected (cookie-parser secret enforces signature)', async ({
    page,
  }) => {
    test.skip(port === null, 'webserver not reachable; webui.start bridge unavailable in this run');
    const probe = await page.evaluate(async (p) => {
      // tiny-csrf binds the body token to a signed cookie. Without
      // cookie-parser(secret) producing a valid signed cookie, even a
      // syntactically valid token fails the verify step. We post a string
      // that looks token-shaped - and explicitly omit credentials so no
      // cookie travels.
      const fakeToken = 'a'.repeat(64);
      const form = new URLSearchParams();
      form.set('_csrf', fakeToken);
      const res = await fetch(`http://localhost:${p}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
        credentials: 'omit',
      });
      return { status: res.status };
    }, port);
    expect(probe.status, 'unsigned cookie + crafted token must be rejected').not.toBe(200);
    expect(probe.status, 'expected 403 from tiny-csrf').toBeGreaterThanOrEqual(400);
  });

  test('Replay an old _csrf token across sessions → rejected (token rotates per cookie pair)', async ({ page }) => {
    test.skip(port === null, 'webserver not reachable; webui.start bridge unavailable in this run');
    // Step 1: harvest a token by hitting any GET endpoint (the
    // attachCsrfToken middleware sets x-csrf-token on responses).
    const harvest = await page.evaluate(async (p) => {
      const res = await fetch(`http://localhost:${p}/api/auth/status`, {
        method: 'GET',
        credentials: 'include',
      });
      return { token: res.headers.get('x-csrf-token'), status: res.status };
    }, port);
    // If the server didn't expose the header (it's behind same-origin
    // policy when the request is cross-origin), we cannot run this probe.
    test.skip(!harvest.token, 'CSRF token not exposed cross-origin - probe inconclusive');

    // Step 2: stop+restart the webserver so the signed cookie that backs
    // the harvested token is invalidated. tiny-csrf binds (token, signed-cookie);
    // a restart should rotate both.
    await stopWebUI(page);
    const newPort = await startWebUI(page);
    test.skip(newPort === null, 'webserver did not restart for replay-across-sessions probe');
    port = newPort;

    const replay = await page.evaluate(
      async ({ p, token }) => {
        const form = new URLSearchParams();
        form.set('_csrf', token!);
        const res = await fetch(`http://localhost:${p}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: form.toString(),
          credentials: 'omit',
        });
        return { status: res.status };
      },
      { p: port, token: harvest.token }
    );
    expect(replay.status, 'replayed cross-session CSRF token must be rejected').not.toBe(200);
    expect(replay.status, 'expected 403 from tiny-csrf').toBeGreaterThanOrEqual(400);
  });
});
