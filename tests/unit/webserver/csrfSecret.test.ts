/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * P0 regression coverage for the CSRF cookie-parser secret.
 *
 * Bug: setupBasicMiddleware previously called `cookieParser()` with no
 * secret. tiny-csrf transports its token via a *signed* cookie (it sets
 * `cookieParams.signed = true` internally), so without a secret
 * `req.signedCookies` is always {} and every protected POST throws 500.
 *
 * This test boots the real middleware stack against a live HTTP server
 * and proves the happy-path flow now works end-to-end:
 *   1. GET seeds a CSRF cookie + token in the response header.
 *   2. POST with that cookie + matching _csrf body field succeeds.
 *   3. POST without _csrf is rejected (proves CSRF is actually active -
 *      otherwise step 2 would pass for the wrong reason).
 */
import http from 'http';
import type { AddressInfo } from 'net';
import express from 'express';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setupBasicMiddleware } from '@process/webserver/setup';
import { CSRF_COOKIE_NAME } from '@process/webserver/config/constants';

type FetchResult = {
  status: number;
  headers: Record<string, string>;
  /** Raw, unjoined Set-Cookie entries (one per cookie) - Node keeps these as an array. */
  setCookies: string[];
  body: string;
};

function request(
  port: number,
  method: 'GET' | 'POST',
  path: string,
  headers: Record<string, string> = {},
  body?: string
): Promise<FetchResult> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        method,
        path,
        headers,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const flatHeaders: Record<string, string> = {};
          for (const [k, v] of Object.entries(res.headers)) {
            if (Array.isArray(v)) {
              flatHeaders[k] = v.join('; ');
            } else if (typeof v === 'string') {
              flatHeaders[k] = v;
            }
          }
          const rawSetCookie = res.headers['set-cookie'];
          resolve({
            status: res.statusCode ?? 0,
            headers: flatHeaders,
            setCookies: Array.isArray(rawSetCookie) ? rawSetCookie : rawSetCookie ? [rawSetCookie] : [],
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      }
    );
    req.on('error', reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}

describe('CSRF middleware - cookie-parser secret wiring (P0 regression)', () => {
  let server: http.Server;
  let port: number;

  beforeEach(async () => {
    // CSRF secret must be exactly 32 chars (AES-256-CBC requirement in tiny-csrf).
    process.env.CSRF_SECRET = 'a'.repeat(32);

    const app = express();
    setupBasicMiddleware(app);
    app.get('/csrf-seed', (_req, res) => {
      // Token is attached to the response header by attachCsrfToken middleware.
      res.json({ ok: true });
    });
    app.post('/protected', (_req, res) => {
      res.json({ ok: true });
    });

    server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = (server.address() as AddressInfo).port;
  });

  afterEach(async () => {
    delete process.env.CSRF_SECRET;
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  });

  it('signed CSRF cookie + matching _csrf body field allows POST through', async () => {
    // Step 1: seed token + cookie.
    const seed = await request(port, 'GET', '/csrf-seed');
    expect(seed.status).toBe(200);

    const token = seed.headers['x-csrf-token'];
    expect(token, 'attachCsrfToken middleware exposes token via response header').toBeTruthy();

    const setCookie = seed.headers['set-cookie'];
    expect(setCookie, 'tiny-csrf writes a signed cookie to set-cookie').toBeTruthy();
    // The signed-cookie format is `name=s:<value>.<signature>` - the `s:` prefix
    // is cookie-parser's marker for signed cookies. If cookie-parser had no
    // secret, tiny-csrf could not verify this signature and step 3 below would
    // throw EBADCSRFTOKEN.
    const cookieHeader = setCookie.split(/,(?=\s*[^;]+=)/)[0]; // first cookie only

    // Step 2: POST with cookie + matching _csrf body field - must succeed.
    const ok = await request(
      port,
      'POST',
      '/protected',
      {
        cookie: cookieHeader,
        'content-type': 'application/x-www-form-urlencoded',
      },
      `_csrf=${encodeURIComponent(token)}`
    );
    expect(ok.status, 'CSRF middleware allows POST when token is valid').toBe(200);
    expect(JSON.parse(ok.body)).toEqual({ ok: true });
  });

  it('POST without _csrf is rejected - proves CSRF is actually active', async () => {
    const seed = await request(port, 'GET', '/csrf-seed');
    const setCookie = seed.headers['set-cookie'];
    const cookieHeader = setCookie.split(/,(?=\s*[^;]+=)/)[0];

    const blocked = await request(
      port,
      'POST',
      '/protected',
      {
        cookie: cookieHeader,
        'content-type': 'application/x-www-form-urlencoded',
      },
      '' // no _csrf
    );
    // tiny-csrf throws EBADCSRFTOKEN; the default Express error handler
    // surfaces it as 5xx. We assert "not 2xx" to stay handler-agnostic.
    expect(blocked.status, 'missing _csrf must NOT succeed').not.toBe(200);
    expect(blocked.status).toBeGreaterThanOrEqual(400);
  });

  it('seeds a JS-readable CSRF cookie a browser client can echo back as _csrf (#681)', async () => {
    // Regression for #681: attachCsrfToken used to expose the token ONLY via
    // the x-csrf-token response header, which nothing ever read back into a
    // follow-up request. A real browser client (csrfClient.ts's
    // getCsrfToken()) reads a plain cookie, not a response header from a
    // previous unrelated request - so it always sent an empty `_csrf` and
    // tiny-csrf rejected every WebUI/headless POST.
    const seed = await request(port, 'GET', '/csrf-seed');
    const token = seed.headers['x-csrf-token'];

    const plainCookie = seed.setCookies.find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`));
    expect(plainCookie, 'a plain (non-signed) CSRF_COOKIE_NAME cookie must be set').toBeTruthy();
    expect(plainCookie).not.toMatch(/HttpOnly/i);

    const cookieValue = plainCookie!.split(';')[0].split('=')[1];
    expect(cookieValue, 'the cookie must carry the same raw token as the header').toBe(token);

    // Simulate the browser client: the browser sends every cookie for the
    // origin (HttpOnly only blocks JS *reads*, never transmission), while the
    // client JS itself only ever learns the token via the plain cookie above.
    const cookieHeader = seed.setCookies.map((c) => c.split(';')[0]).join('; ');
    const ok = await request(
      port,
      'POST',
      '/protected',
      {
        cookie: cookieHeader,
        'content-type': 'application/x-www-form-urlencoded',
      },
      `_csrf=${encodeURIComponent(cookieValue)}`
    );
    expect(ok.status, 'a POST using the JS-readable cookie value as _csrf must succeed').toBe(200);
  });
});
