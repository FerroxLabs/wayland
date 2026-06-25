/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { RunawayMonitor } from '../../src/process/services/runaway/RunawayMonitor';

const read = (output: string, success = true) => ({ name: 'Read', success, outputText: output });
const bash = (success: boolean) => ({ name: 'Bash', success, outputText: '' });

describe('RunawayMonitor - loop detection (circuit-breaker P2)', () => {
  it('trips repeated_read on the 5th identical read output', () => {
    const m = new RunawayMonitor();
    const content = 'export const x = 1;\nexport const y = 2;\n';
    expect(m.observe(read(content))).toBeNull(); // 1
    expect(m.observe(read(content))).toBeNull(); // 2
    expect(m.observe(read(content))).toBeNull(); // 3
    expect(m.observe(read(content))).toBeNull(); // 4
    const trip = m.observe(read(content)); // 5
    expect(trip).toEqual({ kind: 'repeated_read', count: 5 });
  });

  it('does NOT trip when reads return different content (healthy browsing)', () => {
    const m = new RunawayMonitor();
    for (let i = 0; i < 8; i++) {
      expect(m.observe(read(`file number ${i} unique body`))).toBeNull();
    }
  });

  it('trips failing_command on the 4th consecutive shell failure', () => {
    const m = new RunawayMonitor();
    expect(m.observe(bash(false))).toBeNull(); // 1
    expect(m.observe(bash(false))).toBeNull(); // 2
    expect(m.observe(bash(false))).toBeNull(); // 3
    expect(m.observe(bash(false))).toEqual({ kind: 'failing_command', count: 4 }); // 4
  });

  it('resets the consecutive-failure run on a success', () => {
    const m = new RunawayMonitor();
    m.observe(bash(false));
    m.observe(bash(false));
    m.observe(bash(false));
    expect(m.observe(bash(true))).toBeNull(); // success resets
    expect(m.observe(bash(false))).toBeNull(); // 1 again, not 4
    expect(m.observe(bash(false))).toBeNull(); // 2
  });

  it('only trips a kind once per turn, and resetTurn clears it', () => {
    const m = new RunawayMonitor();
    const c = 'same content';
    for (let i = 0; i < 5; i++) m.observe(read(c));
    expect(m.observe(read(c))).toBeNull(); // already tripped this turn
    m.resetTurn();
    for (let i = 0; i < 4; i++) expect(m.observe(read(c))).toBeNull();
    expect(m.observe(read(c))).toEqual({ kind: 'repeated_read', count: 5 }); // trips again after reset
  });

  it('respects custom thresholds', () => {
    const m = new RunawayMonitor({ repeatedReadThreshold: 3, failingCommandThreshold: 2 });
    m.observe(read('x'));
    m.observe(read('x'));
    expect(m.observe(read('x'))).toEqual({ kind: 'repeated_read', count: 3 });
    m.resetTurn();
    m.observe(bash(false));
    expect(m.observe(bash(false))).toEqual({ kind: 'failing_command', count: 2 });
  });
});
