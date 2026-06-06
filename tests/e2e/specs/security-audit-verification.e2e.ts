/**
 * Security audit verification - W1-W4 runtime gate.
 *
 * The feat/audit-hardening branch closed 80 audit findings via code-level review.
 * This spec re-verifies the load-bearing fixes against a *running* Electron app,
 * so we have evidence-not-assertions that the production hardening still holds.
 *
 * Each `test()` block proves one (or a tight group of) finding(s). Tests are
 * independent: none of them require an external CLI (Claude / Codex / Gemini).
 *
 * Findings that cannot be exercised at runtime in dev mode (e.g. production-only
 * CSP, source-level refactors) are recorded with `test.skip(...)` plus the
 * commit SHA where the code-level verification lives, so the gap is documented
 * rather than silently dropped.
 */
import { test, expect } from '../fixtures';
import { invokeBridge } from '../helpers';

test.describe('Security audit verification (W1-W4 runtime gate)', () => {
  // ── C4: Electron 41.x ────────────────────────────────────────────────────
  // commit 8f6f550f9 - Electron upgrade from 39 to 41 closes the Chrome
  // CVE backlog that 39 had accumulated.
  test('C4: Electron version is 41.x', async ({ electronApp }) => {
    const versions = await electronApp.evaluate(async () => ({
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
    }));

    expect(versions.electron, 'Electron runtime version').toMatch(/^41\./);
    // Chrome bundled with Electron 41 is in the 13x line; assert non-empty
    // to avoid coupling the test to a specific minor we don't control.
    expect(versions.chrome.length, 'Chromium version present').toBeGreaterThan(0);
  });

  // ── C6: BrowserWindow security flags ─────────────────────────────────────
  // commit 893e3e3b2 - sandbox:true, contextIsolation:true, nodeIntegration:false.
  // We verify both from the main process (BrowserWindow inventory) and from
  // the renderer (no Node globals exposed).
  test('C6: BrowserWindow sandbox + contextIsolation + nodeIntegration:false', async ({ electronApp, page }) => {
    // Main-process side: at least one non-destroyed BrowserWindow exists and
    // its webContents reports a configuration consistent with sandboxing.
    // Electron does not expose getWebPreferences() in stable, but we can prove
    // sandboxing indirectly by observing that the renderer cannot reach Node
    // globals - which is the property the audit cares about.
    const windowCount = await electronApp.evaluate(async ({ BrowserWindow }) => {
      return BrowserWindow.getAllWindows().filter((w) => !w.isDestroyed()).length;
    });
    expect(windowCount, 'at least one live BrowserWindow').toBeGreaterThan(0);

    // Renderer side: with sandbox+contextIsolation+nodeIntegration:false the
    // renderer must not see `require`, `module`, `global`, or Node's `process`
    // object. The preload exposes `electronAPI` via contextBridge - that
    // remains visible. A failure here means an audit fix regressed.
    const rendererSurface = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      return {
        hasRequire: typeof w.require !== 'undefined',
        hasModule: typeof w.module !== 'undefined',
        hasGlobal: typeof w.global !== 'undefined',
        hasNodeProcess: typeof w.process !== 'undefined' && !!(w.process as { versions?: unknown }).versions,
        hasElectronAPI: typeof w.electronAPI !== 'undefined',
      };
    });

    expect(rendererSurface.hasRequire, 'nodeIntegration:false - no require()').toBe(false);
    expect(rendererSurface.hasModule, 'nodeIntegration:false - no module').toBe(false);
    expect(rendererSurface.hasNodeProcess, 'no Node process leaked to renderer').toBe(false);
    expect(rendererSurface.hasElectronAPI, 'preload bridge still exposed via contextBridge').toBe(true);
  });

  // ── C1: IPC bridge allowlist ─────────────────────────────────────────────
  // commit 287b0c42d - every renderer→main bridge event name must be declared
  // via buildProvider/buildEmitter. A forged name must be rejected with a
  // "Bridge event not allowed" error before the dispatcher touches it.
  test('C1: IPC bridge rejects non-allowlisted event names', async ({ page }) => {
    // Attempt 1: raw electronAPI.emit with a forged provider name. The handler
    // in src/common/adapter/main.ts rejects the promise with a known message.
    const forged = await page.evaluate(async () => {
      const api = (window as unknown as {
        electronAPI?: { emit?: (n: string, d: unknown) => Promise<unknown> };
      }).electronAPI;
      if (!api?.emit) return { reachable: false } as const;
      try {
        const result = await api.emit('subscribe-forged.not-an-allowlisted-key', {
          id: 'e2e_forged',
          data: {},
        });
        return { reachable: true, rejected: false, result } as const;
      } catch (err) {
        return {
          reachable: true,
          rejected: true,
          message: err instanceof Error ? err.message : String(err),
        } as const;
      }
    });

    expect(forged.reachable, 'electronAPI.emit is exposed via preload').toBe(true);
    expect(forged.rejected, 'forged subscribe-* must be rejected').toBe(true);
    if (forged.rejected) {
      expect(forged.message, 'rejection cites bridge allowlist').toMatch(/not allowed|Bridge event/i);
    }

    // Attempt 2: also confirm an allowlisted call still works end-to-end -
    // otherwise the allowlist could pass by trivially rejecting everything.
    const okResult = await invokeBridge<unknown>(page, 'auto-update.get-status', undefined, 5_000).catch(
      (e: Error) => ({ __error: e.message })
    );
    expect(okResult, 'allowlisted call still succeeds').not.toMatchObject({ __error: expect.any(String) });
  });

  // ── C2: wayland-asset:// path containment ────────────────────────────────
  // commit 3229399bb - the asset protocol handler enforces an allowlist
  // (resolveAllowedAssetPath). Path-traversal and absolute-system-path
  // attempts must be rejected with 403 (or a network error if the URL
  // doesn't parse to a candidate at all).
  test('C2: wayland-asset:// rejects path traversal + arbitrary reads', async ({ page }) => {
    const attempts = [
      'wayland-asset://asset//etc/passwd',
      'wayland-asset://asset/../../../etc/passwd',
      'wayland-asset://asset/../../../../Users/Shared',
    ];

    const results = await page.evaluate(async (urls) => {
      const out: Array<{ url: string; status: number | null; error: string | null }> = [];
      for (const url of urls) {
        try {
          const res = await fetch(url);
          out.push({ url, status: res.status, error: null });
        } catch (err) {
          out.push({
            url,
            status: null,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
      return out;
    }, attempts);

    for (const r of results) {
      // Either the fetch must be rejected at the network layer OR the handler
      // must return a non-2xx status. A 2xx response means containment failed.
      const blocked = r.error !== null || (r.status !== null && r.status >= 400);
      expect(
        blocked,
        `path traversal must be rejected - ${r.url} got status=${r.status ?? 'network-error'} (${r.error ?? 'ok'})`
      ).toBe(true);
    }
  });

  // ── H4: CSP excludes unsafe-inline ───────────────────────────────────────
  // commit 73a9e5bce - production CSP drops 'unsafe-inline' from script-src
  // and uses per-request nonces. This is enforced by the embedded webserver
  // (src/process/webserver/config/constants.ts), NOT by the Electron renderer
  // (which loads via electron-vite dev / file:// in packaged mode and has no
  // CSP meta tag in src/renderer/index.html). Runtime verification in dev
  // mode isn't meaningful - verified via source.
  test.skip('H4: CSP excludes unsafe-inline (production webserver) - verified in commit 73a9e5bce', () => {
    // No-op: production-only CSP, see src/process/webserver/config/constants.ts:215-225.
  });

  // ── H11: uncaughtException + unhandledRejection handlers installed ───────
  // commit e39610467 - both global Node handlers must be attached so the
  // app never crashes silently. We assert via process.listenerCount() in the
  // main process.
  test('H11: uncaughtException + unhandledRejection handlers installed', async ({ electronApp }) => {
    const counts = await electronApp.evaluate(async () => ({
      uncaught: process.listenerCount('uncaughtException'),
      unhandled: process.listenerCount('unhandledRejection'),
    }));

    expect(counts.uncaught, 'uncaughtException handler attached').toBeGreaterThan(0);
    expect(counts.unhandled, 'unhandledRejection handler attached').toBeGreaterThan(0);
  });

  // ── L17: auto-updater getStatus bridge ───────────────────────────────────
  // commit 78c6b90c9 - surface auto-updater bootstrap status so the System
  // settings tab can warn when updates are disabled. We assert the bridge is
  // wired and returns the documented shape: { available: boolean, error?: string }.
  test('L17: autoUpdate.getStatus bridge returns documented shape', async ({ page }) => {
    const status = await invokeBridge<{ available: boolean; error?: string }>(
      page,
      'auto-update.get-status',
      undefined,
      5_000
    );

    expect(status, 'getStatus returned a value').toBeDefined();
    expect(typeof status.available, '`available` is boolean').toBe('boolean');
    // In dev (WAYLAND_DISABLE_AUTO_UPDATE=1 set by fixtures) the channel
    // defaults to available:true because the global is only flipped on
    // explicit import success/failure. Either value is acceptable.
    if (!status.available) {
      expect(typeof status.error, 'error field present when unavailable').toBe('string');
    }
  });

  // ── L20: AgentRegistry getLoadErrors bridge ──────────────────────────────
  // commit 78c6b90c9 - sub-detector load failures surface to renderer so the
  // UI can show "remote agents failed to load: <reason>" instead of an empty
  // list. We assert the bridge returns IBridgeResponse<string[]>.
  test('L20: acpConversation.getLoadErrors bridge returns string[] envelope', async ({ page }) => {
    type LoadErrorsResp = { success: true; data: string[] } | { success: false; msg: string };
    const resp = await invokeBridge<LoadErrorsResp>(page, 'acp.get-load-errors', undefined, 5_000);

    expect(resp, 'getLoadErrors returned a value').toBeDefined();
    expect(typeof resp.success, 'success is boolean').toBe('boolean');
    if (resp.success) {
      expect(Array.isArray(resp.data), 'data is an array').toBe(true);
      // Errors array may be empty in a clean dev launch - that's fine.
      for (const entry of resp.data) {
        expect(typeof entry, 'each entry is a string').toBe('string');
      }
    } else {
      expect(typeof resp.msg, 'failure carries human-readable message').toBe('string');
    }
  });

  // ── Source-only findings: no runtime surface to exercise ─────────────────
  //
  // The audit closed several findings whose fix lives entirely in static code
  // paths that the running app does not re-enter in a way Playwright can
  // observe. Recording them here so the runtime spec is honest about what it
  // does and does not prove.
  //
  // - L4 (commit 69e5c632e): getPublicIP no longer shells out to `curl`.
  //   Verified by reading src/process/webserver/index.ts: the function now
  //   uses Node's `https` module. No runtime side effect distinguishes the
  //   patched version unless we strace the process, which is out of scope
  //   for an Electron e2e suite.
  // - L5 (commit d440968f6): shellBridge no longer wraps Windows commands
  //   with `cmd.exe /c start`. Verified at source in
  //   src/process/bridge/shellBridge.ts; the wrapper is unconditionally
  //   skipped. Reproducing this at runtime requires Windows + a benign
  //   shell command, which our cross-platform suite cannot guarantee.
  // - H13 (commit ac3529e3e): React error boundaries are mounted at the
  //   route layer. Forcing a renderer crash to verify the catch path would
  //   destabilise the singleton Electron app the rest of the suite shares.
  //   Boundary presence is asserted by the unit-test suite under
  //   src/renderer/components/__tests__/ErrorBoundary.test.tsx.
  // - L31 (commit 22557b448): Lucide test-id stamping is a test-infra change
  //   verified by the unit tests in tests/unit/* - no runtime semantics.
  test.skip('L4: getPublicIP uses Node https (no curl) - verified in commit 69e5c632e', () => {});
  test.skip('L5: shellBridge no cmd.exe /c start wrapper - verified in commit d440968f6', () => {});
  test.skip('H13: React error boundaries - verified via ErrorBoundary unit tests in commit ac3529e3e', () => {});
  test.skip('L31: Lucide TESTID stamping - verified via unit tests in commit 22557b448', () => {});
});
