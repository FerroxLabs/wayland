/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * E2E: accessibility gate (QA-01).
 *
 * Scans core surfaces with axe-core (WCAG 2.x A/AA) and fails only on NEW
 * `serious`/`critical` violations versus the committed per-surface baseline
 * (`tests/e2e/a11y/baseline.json`). This makes the suite a regression gate that
 * is honest about pre-existing debt rather than a red-from-birth all-or-nothing
 * check. Re-record the baseline after intentional a11y changes with:
 *
 *     UPDATE_A11Y_BASELINE=1 bun run test:e2e:a11y
 *
 * Navigation is best-effort: a surface whose route does not render is SKIPPED
 * (logged), never failed — a missing route is a navigation problem, not an a11y
 * finding, and must not produce a misleading a11y failure.
 */
import { test, expect } from '../fixtures';
import { navigateTo, waitForSettle } from '../helpers';
import {
  baselineFor,
  baselineHas,
  gatedViolationIds,
  isBaselineUpdateRun,
  newViolations,
  runAxe,
  updateBaseline,
} from '../helpers/axe';

type Surface = { key: string; hash: string; label: string };

const SURFACES: Surface[] = [
  { key: 'guid-home', hash: '#/guid', label: 'Chat home' },
  { key: 'settings-models', hash: '#/settings/models', label: 'Models & providers settings' },
  { key: 'settings-channels', hash: '#/settings/channels', label: 'Channels settings' },
  // B-02 coverage expansion: Voice settings (hosts the VOC-03 consent surface),
  // Assistants, and General. Cockpit Home/nav need shell activation the hash-nav
  // spec doesn't drive yet — tracked as a follow-on.
  { key: 'settings-voice', hash: '#/settings/voice', label: 'Voice settings' },
  { key: 'settings-assistants', hash: '#/settings/assistants', label: 'Assistants settings' },
  { key: 'settings-general', hash: '#/settings/general', label: 'General settings' },
];

// Floor guard: proves the suite actually scanned something. Without it, a
// regression that white-screens every surface could make all tests skip and
// the run exit green while asserting nothing.
let scannedCount = 0;

test.describe('accessibility (WCAG 2.x A/AA regression gate)', () => {
  test.afterAll(() => {
    // Not enforced during a baseline (re)record.
    if (isBaselineUpdateRun()) return;
    expect(scannedCount, 'a11y gate scanned zero surfaces — nothing was verified; the app likely failed to render').toBeGreaterThan(0);
  });

  for (const surface of SURFACES) {
    test(`${surface.label} has no new serious/critical a11y violations`, async ({ page }) => {
      // Best-effort navigation.
      let loaded = true;
      try {
        await navigateTo(page, surface.hash);
      } catch {
        loaded = false;
      }
      await waitForSettle(page, 4000);
      // Prefer a settled document before scanning so axe doesn't read a partial
      // DOM and miss a late-rendered violation. Residual limitation: async SPA
      // content (post-fetch lists, lazy modals) may still render after this;
      // the gate covers first-paint state, which is the high-value case.
      await page.waitForFunction(() => document.readyState === 'complete', undefined, { timeout: 5000 }).catch(() => {});
      const bodyLen = await page.evaluate(() => document.body.textContent?.length ?? 0).catch(() => 0);
      if (!loaded || bodyLen < 50) {
        // A baselined surface has rendered before, so a non-render now is a
        // REGRESSION (fail), not an absent surface (skip). Only a surface with
        // no baseline entry may skip.
        if (baselineHas(surface.key)) {
          throw new Error(
            `A11y surface "${surface.key}" (${surface.hash}) is in the baseline but did not render ` +
              `(loaded=${loaded}, bodyLen=${bodyLen}). Treating render death as a regression.`
          );
        }
        test.skip(true, `Surface ${surface.key} not in baseline and did not render (${surface.hash}); skipping.`);
        return;
      }

      const violations = await runAxe(page);
      scannedCount += 1;
      const gated = gatedViolationIds(violations);

      if (isBaselineUpdateRun()) {
        updateBaseline(surface.key, gated);
        console.log(`[a11y] baseline recorded for ${surface.key}: ${gated.join(', ') || '(none)'}`);
        return;
      }

      const regressions = newViolations(gated, baselineFor(surface.key));
      if (regressions.length > 0) {
        const detail = violations
          .filter((v) => regressions.includes(v.id))
          .map((v) => `  - ${v.id} [${v.impact}] ${v.help} (${v.nodeCount} node(s))`)
          .join('\n');
        console.error(`[a11y] NEW serious/critical violations on ${surface.key}:\n${detail}`);
      }
      expect(regressions, `New serious/critical a11y violations on ${surface.key}: ${regressions.join(', ')}`).toEqual(
        []
      );
    });
  }
});
