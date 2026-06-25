/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure plain-text renderer for a {@link DoctorReport} — the "Copy report"
 * payload. Kept free of React/i18n machinery (it takes a `translate` callback)
 * so it is trivially unit-testable.
 */

import type { DoctorReport, DoctorStatus } from '@process/doctor/types';

/** Uppercase status tag used in the plain-text report. */
const STATUS_TAG: Record<DoctorStatus, string> = { pass: 'PASS', warn: 'WARN', fail: 'FAIL' };

/**
 * Render a Doctor report as a plain-text block suitable for pasting into a bug
 * report. `translate` resolves a check's title key to its display title.
 */
export function buildDoctorReportText(report: DoctorReport, translate: (key: string) => string): string {
  const lines: string[] = [];
  lines.push('Wayland Doctor report');
  lines.push(`Ran at: ${report.ranAt}`);
  lines.push(`Overall: ${STATUS_TAG[report.overall]}`);
  lines.push(`Summary: ${report.counts.pass} pass, ${report.counts.warn} warn, ${report.counts.fail} fail`);
  lines.push('');

  for (const result of report.results) {
    lines.push(`[${STATUS_TAG[result.status]}] ${translate(result.titleKey)}`);
    lines.push(`  ${result.detail}`);
    if (result.remediation) {
      lines.push(`  Fix: ${result.remediation}`);
    }
  }

  return lines.join('\n');
}
