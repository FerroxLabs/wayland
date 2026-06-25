/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Doctor IPC bridge (issue #35).
 *
 * Wires `ipcBridge.doctor.runDoctor` to the Doctor runner: builds the live
 * check registry and runs the full diagnostic battery, returning the aggregated
 * {@link DoctorReport}. The runner never throws (every check is guarded), but
 * the handler still wraps the registry-build so a registry construction failure
 * degrades to a single-fail report instead of an unhandled rejection.
 */

import { clipboard } from 'electron';
import { ipcBridge } from '@/common';
import { runDoctor } from '@process/doctor/runner';
import { buildDoctorChecks } from '@process/doctor/registry';
import type { DoctorReport } from '@process/doctor/types';

export function initDoctorBridge(): void {
  // Write the report text to the OS clipboard from MAIN. The renderer's
  // `navigator.clipboard` is unreliable on Windows; Electron's `clipboard`
  // writes natively and always works (#269).
  ipcBridge.doctor.copyText.provider(async ({ text }) => {
    clipboard.writeText(text);
  });

  ipcBridge.doctor.runDoctor.provider(async () => {
    try {
      return await runDoctor(buildDoctorChecks());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const report: DoctorReport = {
        ranAt: new Date().toISOString(),
        overall: 'fail',
        counts: { pass: 0, warn: 0, fail: 1 },
        results: [
          {
            id: 'doctor.bootstrap',
            titleKey: 'settings.doctor.checks.bootstrap',
            category: 'config',
            status: 'fail',
            detail: `The Doctor could not start: ${message}`,
            remediation: 'Restart the app and re-run. Report this if it persists.',
            durationMs: 0,
          },
        ],
      };
      return report;
    }
  });
}
