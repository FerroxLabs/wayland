/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { buildDoctorReportText } from '@renderer/pages/settings/DoctorSettings/reportText';
import type { DoctorReport } from '@process/doctor/types';

const report: DoctorReport = {
  ranAt: '2026-06-11T00:00:00.000Z',
  overall: 'fail',
  counts: { pass: 1, warn: 1, fail: 1 },
  results: [
    {
      id: 'a',
      titleKey: 'k.a',
      category: 'providers',
      status: 'pass',
      detail: 'all good',
      durationMs: 10,
    },
    {
      id: 'b',
      titleKey: 'k.b',
      category: 'mcp',
      status: 'fail',
      detail: 'server broke',
      remediation: 'disable it',
      durationMs: 20,
    },
  ],
};

describe('buildDoctorReportText', () => {
  it('renders a plain-text report with status tags, details and remediations', () => {
    const text = buildDoctorReportText(report, (key) => `T(${key})`);
    expect(text).toContain('Wayland Doctor report');
    expect(text).toContain('Overall: FAIL');
    expect(text).toContain('1 pass, 1 warn, 1 fail');
    expect(text).toContain('[PASS] T(k.a)');
    expect(text).toContain('all good');
    expect(text).toContain('[FAIL] T(k.b)');
    expect(text).toContain('Fix: disable it');
  });

  it('omits the Fix line when there is no remediation', () => {
    const text = buildDoctorReportText(report, (key) => key);
    const passSection = text.split('[FAIL]')[0];
    expect(passSection).not.toContain('Fix:');
  });
});
