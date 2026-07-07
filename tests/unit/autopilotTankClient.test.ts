/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  allItemsOk,
  firstLine,
  isQueueFinished,
  type TankQueueItem,
} from '@process/services/autopilot/tankClient';

const item = (status: TankQueueItem['status']): TankQueueItem => ({ id: '1', seq: 1, title: 't', status });

describe('autopilot tank client — completion logic', () => {
  it('is not finished while any item is pending/running/awaiting_input', () => {
    expect(isQueueFinished([item('done'), item('running')])).toBe(false);
    expect(isQueueFinished([item('done'), item('pending')])).toBe(false);
    expect(isQueueFinished([item('done'), item('awaiting_input')])).toBe(false);
  });

  it('is finished when every item reached a terminal status', () => {
    expect(isQueueFinished([item('done'), item('failed'), item('blocked')])).toBe(true);
  });

  it('empty queue is not "finished" (nothing ran yet)', () => {
    expect(isQueueFinished([])).toBe(false);
  });

  it('allItemsOk is true only when every item is done', () => {
    expect(allItemsOk([item('done'), item('done')])).toBe(true);
    expect(allItemsOk([item('done'), item('failed')])).toBe(false);
    expect(allItemsOk([])).toBe(false);
  });

  it('firstLine takes the trimmed first line and caps length', () => {
    expect(firstLine('  fix the bug\nmore detail  ')).toBe('fix the bug');
    expect(firstLine('')).toBe('Autopilot task');
    expect(firstLine('x'.repeat(200)).length).toBe(120);
  });
});
