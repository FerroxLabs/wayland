/**
 * Red-team probe - wayland-asset:// path containment.
 *
 * Verifies the C2 (W1) + H2 (commit f0923bdc9) containment fix for the
 * custom protocol handler. Containment is implemented in
 * src/process/extensions/protocol/assetAllowlist.ts via
 * `resolveAllowedAssetPath` → `isPathWithinDirectory`, which canonicalises
 * symlinks and rejects anything that resolves outside the allowlist.
 *
 * The 7 probes below cover the canonical traversal vectors:
 *   1. naked ../ relative escape
 *   2. URL-encoded ../ (%2e%2e%2f)
 *   3. double-URL-encoded ../ (%252e%252e%252f)
 *   4. absolute-path injection (//etc/passwd)
 *   5. mixed traversal with ./ noise
 *   6. symlink-escape from inside the allowed root
 *   7. prefix confusion (allow-root + suffix that masquerades as sibling)
 *
 * All probes run from the renderer's fetch() context, exactly where a
 * malicious LLM-rendered string would land.
 */
import { test, expect } from '../fixtures';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

test.describe('Red-team: wayland-asset:// path traversal (commit f0923bdc9 H2 + C2/W1)', () => {
  // ── String-only traversal probes ─────────────────────────────────────────
  // These never need a filesystem fixture - they exercise the URL parser +
  // allowlist resolver. A 2xx response on any of these means containment
  // failed and an attacker can read arbitrary host files. P0 finding.
  test('wayland-asset:// rejects 5 traversal-string variants', async ({ page }) => {
    const attempts = [
      // 1. Naked relative escape with double-slash prefix
      'wayland-asset://asset/../../../../etc/passwd',
      // 2. URL-encoded ../ - the URL parser may decode before the allowlist check
      'wayland-asset://asset/%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      // 3. Double-URL-encoded - bites naive single-decode normalisers
      'wayland-asset://asset/%252e%252e%252f%252e%252e%252fetc%252fpasswd',
      // 4. Absolute path: URL author wants to bypass the host segment
      'wayland-asset://asset//etc/passwd',
      // 5. Mixed ./../ noise - the slow-canonicaliser case
      'wayland-asset://asset/foo/./../../../../etc/passwd',
    ];

    const results = await page.evaluate(async (urls) => {
      // Issue all probes in parallel - they're independent and the protocol
      // handler is concurrency-safe.
      const probes = urls.map(async (url) => {
        try {
          const res = await fetch(url);
          // Read a tiny prefix - if containment failed, /etc/passwd starts
          // with "root:". We don't pin to that string in the assertion (the
          // OS may differ), but we ship the bytes back for the test to inspect.
          const txt = await res.text().catch(() => '');
          return { url, status: res.status, error: (txt.slice(0, 32) || null) as string | null };
        } catch (err) {
          return {
            url,
            status: null as number | null,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      });
      return Promise.all(probes);
    }, attempts);

    for (const r of results) {
      const blocked = r.status === null || r.status >= 400;
      // Soft P0 hint: if status is 2xx and body looks like a known
      // sensitive file (starts with "root:" or contains "shadow"), the
      // bypass is real and exploitable.
      const looksLikePasswd =
        r.status !== null && r.status < 400 && r.error !== null && /^root:|^bin:|^daemon:/.test(r.error);
      expect(
        blocked,
        `path traversal must be rejected - ${r.url} got status=${r.status ?? 'network-error'}` +
          (looksLikePasswd ? ' - *** BYPASS: body looks like /etc/passwd ***' : '')
      ).toBe(true);
    }
  });

  // ── Prefix confusion ─────────────────────────────────────────────────────
  // The contains-check must compare on path.sep boundaries. If it uses a
  // bare `startsWith`, then `<allowed-root>-evil` is read as "inside the
  // allowed root" when it is in fact a sibling directory.
  test('wayland-asset:// rejects prefix-confusion attack (path.sep boundary)', async ({ page }) => {
    // We can't easily synthesise a real <root>-evil dir without knowing
    // the runtime allowlist roots, so this probe constructs a URL that
    // *would* succeed under naive startsWith and asserts it is still
    // rejected.
    const attempt = 'wayland-asset://asset/Users/shared-evil/secrets.txt';
    const result = await page.evaluate(async (url) => {
      try {
        const res = await fetch(url);
        return { status: res.status, body: (await res.text().catch(() => '')).slice(0, 32) };
      } catch (err) {
        return { status: null, body: err instanceof Error ? err.message : String(err) };
      }
    }, attempt);
    const blocked = result.status === null || result.status >= 400;
    expect(blocked, `prefix confusion must be rejected - got status=${result.status ?? 'network-error'}`).toBe(true);
  });

  // ── Symlink escape ───────────────────────────────────────────────────────
  // Create a temp file, symlink it from a path that looks like it sits
  // inside an allowed root, request via wayland-asset://, then assert
  // realpathSync canonicalisation kicks the resolved-outside target.
  // This probe runs in the main process via electronApp.evaluate so we
  // can use fs from Node.
  test('wayland-asset:// rejects symlink-escape (realpathSync canonicalisation)', async ({ electronApp, page }) => {
    // Step 1: set up the symlink in the Playwright test-runner process
    // (Node ESM). The Electron main process shares the host filesystem,
    // so a symlink created here is visible to the protocol handler.
    const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'redteam-symlink-'));
    const realFile = path.join(sandboxRoot, 'real-secret.txt');
    fs.writeFileSync(realFile, 'CANARY-SECRET-IF-YOU-SEE-THIS-CONTAINMENT-FAILED');

    // Place the symlink inside the running app's userData dir - close
    // enough to an allowed-ish location that the test exercises the
    // canonicalisation path; the allowlist still rejects it because
    // userData is not an extension root.
    const userData = await electronApp.evaluate(({ app }) => app.getPath('userData'));
    const link = path.join(userData, 'redteam-escape.txt');
    try {
      fs.unlinkSync(link);
    } catch {
      /* ignore */
    }
    try {
      fs.symlinkSync(realFile, link);
    } catch (err) {
      // On some Windows CI runners symlink creation requires elevated
      // privileges; skip the probe rather than fail spuriously.
      test.skip(true, `symlink creation unsupported in this environment: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }

    const probe = await page.evaluate(async (linkPath) => {
      // Drive-letter-safe path normalisation: wayland-asset://asset/<absolute>
      const url = `wayland-asset://asset/${linkPath.replace(/\\/g, '/')}`;
      try {
        const res = await fetch(url);
        return { status: res.status, body: (await res.text().catch(() => '')).slice(0, 64) };
      } catch (err) {
        return { status: null, body: err instanceof Error ? err.message : String(err) };
      }
    }, link);

    // Cleanup the symlink + sandbox regardless of probe outcome.
    try {
      fs.unlinkSync(link);
    } catch {
      /* ignore */
    }
    try {
      fs.rmSync(sandboxRoot, { recursive: true, force: true });
    } catch {
      /* ignore */
    }

    const blocked = probe.status === null || probe.status >= 400;
    const leaked = typeof probe.body === 'string' && probe.body.includes('CANARY-SECRET');
    expect(blocked, `symlink escape must be rejected - status=${probe.status ?? 'network-error'}`).toBe(true);
    expect(leaked, 'symlink target bytes must not be served via wayland-asset://').toBe(false);
  });
});
