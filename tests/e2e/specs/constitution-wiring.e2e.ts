/**
 * E2E: Constitution feature - runtime/integration gate.
 *
 * Verifies the Constitution wiring at runtime (unit tests + code audit already
 * passed - this is the boot + IPC roundtrip check):
 *
 *   1. The app boots cleanly with all the new backend wiring and the
 *      Settings → Constitution page renders the TipTap editor + token counter.
 *   2. `constitution:read` returns the active Constitution markdown.
 *   3. `constitution:readWithOverlay` works end-to-end: renderer → preload →
 *      main-process bridge → `{ constitution, overlay }`. If any link in that
 *      chain (A1 IPC handler, preload binding, bridge fn) were broken, the
 *      call would throw or return undefined.
 *
 * The harness machine has a real `~/.wayland/CONSTITUTION.md` (~4900 bytes) and
 * no `~/.wayland/specialists/` dir, so reads are non-empty and the overlay for a
 * nonexistent specialist is `null`.
 *
 * Idiom modeled on `teams-library-load.e2e.ts` (singleton fixture, hash-route
 * navigation via the `navigateTo` UI-click helper, `page.evaluate` for bridge
 * calls). Test 1 first warms the settings layout with a `navigateTo` to a known
 * builtin tab so the lazy settings chunk + `SettingsSider` are mounted, then
 * clicks the `[data-settings-path="constitution"]` sider item directly - this
 * avoids the cold-boot race where the helper's 10s visibility wait fires before
 * the settings layout has finished its first lazy load.
 */

import { test, expect } from '../fixtures';
import { navigateTo } from '../helpers';

type OverlayResult = { constitution: string; overlay: string | null };

test.describe('Constitution wiring', () => {
  test('app boots and Settings → Constitution page renders', async ({ page }) => {
    test.setTimeout(60_000);

    // Warm-up: enter the Settings layout via the helper (handles the
    // sider-footer escape from /guid). `about` is a builtin tab that always
    // exists; reaching it guarantees the lazy settings chunk + SettingsSider
    // have mounted before we go after the Constitution tab.
    await navigateTo(page, '#/settings/about');

    // The Constitution sider item is builtin (BUILTIN_TAB_IDS) and renders the
    // `data-settings-path="constitution"` attribute. Click it directly now that
    // the sider is warm.
    const constitutionNav = page.locator('[data-settings-path="constitution"]');
    await constitutionNav.waitFor({ state: 'visible', timeout: 20_000 });
    await constitutionNav.click();
    await page.waitForFunction(() => window.location.hash.includes('/settings/constitution'), {
      timeout: 15_000,
    });

    // The page loads the Constitution async then mounts a TipTapMarkdownEditor,
    // which renders a `.ProseMirror` contenteditable. Its presence proves the
    // page rendered without a crash from the new backend wiring.
    const editor = page.locator('.ProseMirror').first();
    await expect(editor).toBeVisible({ timeout: 20_000 });

    // The token counter renders the i18n key `settings.constitutionPage.tokenCount`
    // → English "{{value}} tokens" (value is `approxTokens.toLocaleString()`).
    const tokenCounter = page.getByText(/\d[\d,]* tokens/).first();
    await expect(tokenCounter).toBeVisible({ timeout: 10_000 });
  });

  test('constitution:read IPC returns the active Constitution', async ({ page }) => {
    test.setTimeout(30_000);

    const result = await page.evaluate(async () => {
      const api = (window as unknown as { electronAPI?: { readConstitution?: () => Promise<string> } })
        .electronAPI;
      if (!api?.readConstitution) {
        return { error: 'readConstitution not exposed on electronAPI - preload binding missing' };
      }
      return { value: await api.readConstitution() };
    });

    expect(result.error, result.error).toBeUndefined();
    expect(typeof result.value).toBe('string');
    expect((result.value as string).length).toBeGreaterThan(0);
    // Robust marker - don't hard-code the full text (the user may have edited it).
    expect(result.value).toContain('Constitution');
    expect(result.value).toMatch(/^#{1,2}\s+/m); // at least one markdown heading
  });

  test('constitution:readWithOverlay IPC roundtrip works end-to-end', async ({ page }) => {
    test.setTimeout(30_000);

    const result = await page.evaluate(async () => {
      const api = (
        window as unknown as {
          electronAPI?: {
            readConstitutionWithOverlay?: (
              assistantId?: string
            ) => Promise<{ constitution: string; overlay: string | null }>;
          };
        }
      ).electronAPI;
      if (typeof api?.readConstitutionWithOverlay !== 'function') {
        return {
          error:
            'readConstitutionWithOverlay not exposed on electronAPI - preload binding missing',
        };
      }
      // No `~/.wayland/specialists/e2e-nonexistent-specialist-xyz.md` exists,
      // so overlay must come back null while constitution is still populated.
      const value = await api.readConstitutionWithOverlay('e2e-nonexistent-specialist-xyz');
      return { value };
    });

    // Fail loudly if the preload binding is missing - do NOT silently skip.
    expect(result.error, result.error).toBeUndefined();

    const value = result.value as OverlayResult | undefined;
    expect(value, 'readConstitutionWithOverlay returned undefined').toBeDefined();
    expect(typeof value).toBe('object');

    // Return shape: { constitution: string, overlay: string | null }.
    expect(typeof value!.constitution).toBe('string');
    expect(value!.constitution.length).toBeGreaterThan(0);
    expect(value!.constitution).toContain('Constitution');

    // No overlay file for this specialist → overlay is null (proves the
    // path-existence branch ran in the main process, not just a stub).
    expect(value!.overlay).toBeNull();
  });
});
