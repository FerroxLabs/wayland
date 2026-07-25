/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Accessibility (QA-01) harness helpers.
 *
 * Scans a rendered surface with axe-core (injected in-page — see `runAxe`; NOT
 * `@axe-core/playwright`, which cannot run in Electron) and gates on
 * regressions. We gate on `serious` + `critical` impact only — the severities
 * that block real users — and compare against a committed per-surface baseline
 * so pre-existing debt does not fail the build while any NEW serious/critical
 * violation does. Run with `UPDATE_A11Y_BASELINE=1` to (re)record the baseline.
 */
import fs from 'fs';
import path from 'path';
import type { Page } from '@playwright/test';
import axe, { type AxeResults } from 'axe-core';

// axe MUST run inside the page context via injected source, NOT via
// @axe-core/playwright's AxeBuilder: that helper spawns frames through CDP
// `Target.createTarget`, which Electron does not support ("Not supported").
// Injecting `axe.source` and calling `axe.run` in-page avoids new targets.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

declare global {
  interface Window {
    axe: typeof axe;
  }
}

/** Impact levels that fail the gate. `minor`/`moderate` are reported, not gated. */
export const GATED_IMPACTS = ['serious', 'critical'] as const;
export type GatedImpact = (typeof GATED_IMPACTS)[number];

const BASELINE_PATH = path.join(__dirname, '..', 'a11y', 'baseline.json');

export type AxeViolationSummary = {
  id: string;
  impact: string | null | undefined;
  help: string;
  nodeCount: number;
};

/** Run axe against the current page state and return every violation, summarized. */
export async function runAxe(page: Page): Promise<AxeViolationSummary[]> {
  // Define window.axe in the renderer, then run it there (WCAG 2.x A/AA).
  await page.evaluate(axe.source);
  const results = (await page.evaluate(
    async (tags) => await window.axe.run(document, { runOnly: { type: 'tag', values: tags } }),
    WCAG_TAGS
  )) as AxeResults;
  return results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodeCount: v.nodes.length,
  }));
}

/** The gate-level (serious/critical) violation ids, sorted and de-duplicated. */
export function gatedViolationIds(violations: AxeViolationSummary[]): string[] {
  const gated = violations.filter((v) => GATED_IMPACTS.includes(v.impact as GatedImpact)).map((v) => v.id);
  return [...new Set(gated)].sort();
}

type Baseline = Record<string, string[]>;

function readBaseline(): Baseline {
  try {
    return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8')) as Baseline;
  } catch {
    return {};
  }
}

/** The known/accepted gate-level violation ids for a surface (empty if none). */
export function baselineFor(surface: string): string[] {
  return readBaseline()[surface] ?? [];
}

/**
 * Whether a surface has a baseline entry at all. A surface present here has
 * proven it can render, so a later failure to render is a REGRESSION (fail),
 * not an absent surface (skip). Distinct from `baselineFor`, which returns `[]`
 * both for "known, no violations" and "unknown surface".
 */
export function baselineHas(surface: string): boolean {
  return Object.prototype.hasOwnProperty.call(readBaseline(), surface);
}

/**
 * Record the current gate-level ids for a surface into the baseline file. Only
 * used when `UPDATE_A11Y_BASELINE=1`; keeps the file deterministically sorted.
 */
export function updateBaseline(surface: string, ids: string[]): void {
  const baseline = readBaseline();
  baseline[surface] = [...ids].sort();
  const ordered = Object.fromEntries(
    Object.keys(baseline)
      .sort()
      .map((k) => [k, baseline[k]])
  );
  fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(ordered, null, 2) + '\n');
}

export const isBaselineUpdateRun = (): boolean => process.env.UPDATE_A11Y_BASELINE === '1';

/** Ids present now that are NOT in the baseline — i.e. regressions to fail on. */
export function newViolations(current: string[], baseline: string[]): string[] {
  const known = new Set(baseline);
  return current.filter((id) => !known.has(id));
}
