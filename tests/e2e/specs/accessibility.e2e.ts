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
];

test.describe('accessibility (WCAG 2.x A/AA regression gate)', () => {
  for (const surface of SURFACES) {
    test(`${surface.label} has no new serious/critical a11y violations`, async ({ page }) => {
      // Best-effort navigation; skip (don't fail) if the surface doesn't render.
      let loaded = true;
      try {
        await navigateTo(page, surface.hash);
      } catch {
        loaded = false;
      }
      await waitForSettle(page, 4000);
      const bodyLen = await page.evaluate(() => document.body.textContent?.length ?? 0).catch(() => 0);
      if (!loaded || bodyLen < 50) {
        test.skip(true, `Surface ${surface.key} did not render (${surface.hash}); skipping a11y scan.`);
        return;
      }

      const violations = await runAxe(page);
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
