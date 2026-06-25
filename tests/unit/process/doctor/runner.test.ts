/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { runDoctor } from '@process/doctor/runner';
import type { DoctorCheck } from '@process/doctor/types';

const check = (id: string, run: DoctorCheck['run']): DoctorCheck => ({
  id,
  titleKey: `title.${id}`,
  category: 'config',
  run,
});

describe('runDoctor', () => {
  it('aggregates counts and the worst overall status', async () => {
    const checks: DoctorCheck[] = [
      check('a', async () => ({ status: 'pass', detail: 'ok' })),
      check('b', async () => ({ status: 'warn', detail: 'meh', remediation: 'do x' })),
      check('c', async () => ({ status: 'fail', detail: 'broke', remediation: 'do y' })),
    ];

    const report = await runDoctor(checks);

    expect(report.counts).toEqual({ pass: 1, warn: 1, fail: 1 });
    expect(report.overall).toBe('fail');
    expect(report.results.map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(typeof report.ranAt).toBe('string');
  });

  it('reports overall=pass only when every check passes', async () => {
    const report = await runDoctor([
      check('a', async () => ({ status: 'pass', detail: 'ok' })),
      check('b', async () => ({ status: 'pass', detail: 'ok' })),
    ]);
    expect(report.overall).toBe('pass');
  });

  it('reports overall=warn when the worst is a warning', async () => {
    const report = await runDoctor([
      check('a', async () => ({ status: 'pass', detail: 'ok' })),
      check('b', async () => ({ status: 'warn', detail: 'meh' })),
    ]);
    expect(report.overall).toBe('warn');
  });

  it('converts a thrown check into a fail result without aborting the battery', async () => {
    const report = await runDoctor([
      check('throws', async () => {
        throw new Error('boom');
      }),
      check('ok', async () => ({ status: 'pass', detail: 'fine' })),
    ]);

    const thrown = report.results.find((r) => r.id === 'throws');
    expect(thrown?.status).toBe('fail');
    expect(thrown?.detail).toContain('boom');
    expect(report.results.find((r) => r.id === 'ok')?.status).toBe('pass');
  });

  it('fails a check that exceeds the timeout', async () => {
    const report = await runDoctor(
      [
        check('slow', () => new Promise(() => {})),
        check('fast', async () => ({ status: 'pass', detail: 'fine' })),
      ],
      20
    );

    const slow = report.results.find((r) => r.id === 'slow');
    expect(slow?.status).toBe('fail');
    expect(slow?.detail.toLowerCase()).toContain('timed out');
    expect(report.results.find((r) => r.id === 'fast')?.status).toBe('pass');
  });

  it('records a non-negative duration per check', async () => {
    const report = await runDoctor([check('a', async () => ({ status: 'pass', detail: 'ok' }))]);
    expect(report.results[0].durationMs).toBeGreaterThanOrEqual(0);
  });
});
