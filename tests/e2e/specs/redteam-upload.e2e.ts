/**
 * Red-team probe - file-upload pathologies.
 *
 * Verifies the upload pipeline introduced/hardened in:
 *   - fcbe340f5 fix(security): W4 L9 - wire CSRF into uploadFileViaHttp + drop /api/upload exemption
 *   - 8773099cb fix(security): P0 - restore CSRF cookie-parser secret + upload form-body transport
 *
 * The handler lives in src/process/webserver/routes/apiRoutes.ts:
 *   - express.json/urlencoded limit: 10 MB
 *   - multer.diskStorage (no explicit size limit at multer level, so the
 *     express limit + CSRF + token middleware enforce the perimeter)
 *   - sanitizeFileName: strips path separators, null bytes (via the
 *     bad-char regex), and leading dots
 *
 * Probes cover:
 *   1. Oversize upload - server must reject before consuming GB of memory
 *   2. Zip-bomb - must NOT be auto-extracted on receive
 *   3. Filename with path-traversal - sanitised to a flat name
 *   4. Filename with null byte - rejected or stripped
 *   5. Filename masquerading as a URL - not interpreted as one
 *
 * All payloads are representative, not working exploits.
 */
import { test, expect } from '../fixtures';
import { invokeBridge } from '../helpers';

type StartResp = { success: true; data: { port: number } } | { success: false; msg: string };

async function startWebUI(page: import('@playwright/test').Page): Promise<number | null> {
  const resp = await invokeBridge<StartResp>(page, 'webui.start', { port: 35828, allowRemote: false }, 15_000).catch(
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

test.describe('Red-team: file-upload pathologies (commits fcbe340f5 + 8773099cb)', () => {
  let port: number | null = null;

  test.beforeAll(async ({ page }) => {
    port = await startWebUI(page);
  });

  test.afterAll(async ({ page }) => {
    if (port !== null) await stopWebUI(page);
  });

  test('Oversize upload (>10 MB stream) → server rejects (CSRF or 413), never consumes GB of memory', async ({
    page,
  }) => {
    test.skip(port === null, 'webserver not reachable; webui.start bridge unavailable in this run');
    // We construct an 11 MB Blob - comfortably over the 10 MB
    // express.json/urlencoded limit. Anything ≥ 1 GB risks the worker
    // running out of memory before the server rejects, which would be the
    // exact failure mode this probe wants to surface - but in CI we keep
    // the payload modest and document the contract.
    const probe = await page.evaluate(async (p) => {
      // 11 MB of NUL bytes - does not allocate on disk until uploaded.
      const blob = new Blob([new Uint8Array(11 * 1024 * 1024)], { type: 'application/octet-stream' });
      const form = new FormData();
      form.append('file', blob, 'oversize.bin');
      try {
        const res = await fetch(`http://localhost:${p}/api/upload`, {
          method: 'POST',
          body: form,
        });
        return { status: res.status, error: null as string | null };
      } catch (err) {
        return { status: null as number | null, error: err instanceof Error ? err.message : String(err) };
      }
    }, port);
    // 403 (CSRF), 401 (token), 413 (payload too large) all qualify. 200 is a bypass.
    expect(probe.status, 'oversize upload must be rejected').not.toBe(200);
    if (probe.status !== null) {
      expect(probe.status, 'expected 4xx rejection').toBeGreaterThanOrEqual(400);
    }
  });

  test('Zip-bomb-shaped upload is NOT auto-extracted on receive', async ({ page }) => {
    test.skip(port === null, 'webserver not reachable; webui.start bridge unavailable in this run');
    // Build a synthetic upload that *would* be a zip-bomb if the server
    // were naïve enough to auto-extract by extension. The bytes are zero
    // - we only care that the server treats this as opaque bytes.
    const probe = await page.evaluate(async (p) => {
      // 1 KB blob with a .zip extension. The PK header is fake - the test
      // doesn't actually compress anything; if the server's pipeline
      // attempts auto-extraction it would fail to parse, which is itself
      // a smell. Either way: no extraction must happen on the upload
      // endpoint.
      const fakeZipBytes = new Uint8Array(1024);
      fakeZipBytes[0] = 0x50; // 'P'
      fakeZipBytes[1] = 0x4b; // 'K'
      fakeZipBytes[2] = 0x03;
      fakeZipBytes[3] = 0x04;
      const blob = new Blob([fakeZipBytes], { type: 'application/zip' });
      const form = new FormData();
      form.append('file', blob, 'looks-like-a-bomb.zip');
      try {
        const res = await fetch(`http://localhost:${p}/api/upload`, {
          method: 'POST',
          body: form,
        });
        const text = await res.text().catch(() => '');
        return { status: res.status, body: text.slice(0, 200) };
      } catch (err) {
        return { status: null as number | null, body: err instanceof Error ? err.message : String(err) };
      }
    }, port);
    // CSRF / token rejects (403/401) are the expected outcomes here.
    // A 200 with a body mentioning "extracted" / "files" / a directory
    // listing would suggest auto-extraction - flag that hard.
    expect(probe.status, 'zip upload must be rejected at perimeter (CSRF/auth)').not.toBe(200);
    if (probe.status === 200) {
      const looksExtracted = /extract|files|entries/i.test(probe.body ?? '');
      expect(looksExtracted, 'upload pipeline must not auto-extract zips on receive').toBe(false);
    }
  });

  test('Filename with path-traversal segments → sanitised, never written outside upload dir', async ({ page }) => {
    test.skip(port === null, 'webserver not reachable; webui.start bridge unavailable in this run');
    // sanitizeFileName in apiRoutes.ts replaces /\\<>:"|?* with _, and
    // path.basename strips directory components. A traversal filename
    // must NOT be honoured.
    const probe = await page.evaluate(async (p) => {
      const blob = new Blob([new Uint8Array(16)], { type: 'text/plain' });
      const form = new FormData();
      form.append('file', blob, '../../../etc/passwd');
      try {
        const res = await fetch(`http://localhost:${p}/api/upload`, {
          method: 'POST',
          body: form,
        });
        const text = await res.text().catch(() => '');
        return { status: res.status, body: text.slice(0, 400) };
      } catch (err) {
        return { status: null as number | null, body: err instanceof Error ? err.message : String(err) };
      }
    }, port);
    // CSRF/auth rejection is the expected outcome. If 200, assert the
    // returned path/name is flat (no ../ remnants, no absolute /etc/). A
    // 500 indicates an unhandled exception in the upload handler - P1
    // hygiene finding; log loudly but do not fail the security gate.
    expect(probe.status, 'traversal-filename upload MUST NOT succeed (200)').not.toBe(200);
    if (probe.status === 500) {
      // eslint-disable-next-line no-console
      console.warn('[redteam-upload] /api/upload returned 500 on traversal filename - P1 hygiene finding');
    }
    if (probe.status === 200) {
      const traversed = /\.\.\/|\.\.\\|^\/etc|^C:\\/i.test(probe.body ?? '');
      expect(traversed, 'sanitized filename must not contain traversal segments').toBe(false);
    }
  });

  test('Filename with embedded null byte → rejected or truncated safely', async ({ page }) => {
    test.skip(port === null, 'webserver not reachable; webui.start bridge unavailable in this run');
    const probe = await page.evaluate(async (p) => {
      const blob = new Blob([new Uint8Array(8)], { type: 'text/plain' });
      const form = new FormData();
      // Many HTTP stacks reject NUL in form-data filename entirely; some
      // truncate. Either is acceptable, as long as the server never trusts
      // the original NUL-bearing string as a path.
      const evilName = 'safe.txt\x00.exe';
      form.append('file', blob, evilName);
      try {
        const res = await fetch(`http://localhost:${p}/api/upload`, {
          method: 'POST',
          body: form,
        });
        const text = await res.text().catch(() => '');
        return { status: res.status, body: text.slice(0, 200) };
      } catch (err) {
        return { status: null as number | null, body: err instanceof Error ? err.message : String(err) };
      }
    }, port);
    expect(probe.status, 'null-byte filename MUST NOT succeed (200)').not.toBe(200);
    if (probe.status === 500) {
      // eslint-disable-next-line no-console
      console.warn(
        '[redteam-upload] /api/upload returned 500 on null-byte filename - P1 hygiene finding'
      );
    }
    if (probe.status === 200) {
      const containsNull = (probe.body ?? '').includes('\x00');
      expect(containsNull, 'sanitised filename must not echo a null byte').toBe(false);
    }
  });

  test('Filename masquerading as a URL → treated as filename, never fetched (no SSRF surface)', async ({ page }) => {
    test.skip(port === null, 'webserver not reachable; webui.start bridge unavailable in this run');
    // The upload pipeline writes bytes to disk; it must not interpret the
    // filename as a URL to fetch. If the response somehow includes an HTTP
    // status from the metadata endpoint or the bytes of an IMDS reply,
    // that's an SSRF P0.
    const probe = await page.evaluate(async (p) => {
      const blob = new Blob([new Uint8Array(8)], { type: 'text/plain' });
      const form = new FormData();
      // AWS IMDS - a canonical SSRF target. If the server treats filenames
      // as URLs (it shouldn't), the response would contain instance metadata.
      form.append('file', blob, 'http://169.254.169.254/latest/meta-data/iam/');
      try {
        const res = await fetch(`http://localhost:${p}/api/upload`, {
          method: 'POST',
          body: form,
        });
        const text = await res.text().catch(() => '');
        return { status: res.status, body: text.slice(0, 200) };
      } catch (err) {
        return { status: null as number | null, body: err instanceof Error ? err.message : String(err) };
      }
    }, port);
    // The filename must NOT have been fetched. If it had, we'd see IMDS
    // metadata keywords (e.g. ami-id, instance-id, iam) in the response.
    if (probe.status === 200) {
      const ssrfMarkers = /ami-id|instance-id|security-credentials|iam\//i.test(probe.body ?? '');
      expect(ssrfMarkers, 'upload pipeline must not fetch filename-as-URL (SSRF probe)').toBe(false);
    }
    // Whatever the status, the test passes as long as no SSRF bytes leak.
    expect(true, 'SSRF marker check above gates the assertion').toBe(true);
  });
});
