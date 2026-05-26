/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contract test for ijfwSystemService — verifies the service exposes the
 * five Wave 1 methods and the result/runtime-mode types.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getVersion: () => '0.6.3',
    getPath: (key: string) => `/tmp/wayland-test-${key}`,
  },
}));

// eslint-disable-next-line import/first
import { ijfwSystemService } from '@process/services/ijfwSystemService';

describe('ijfwSystemService — contract', () => {
  it('exposes detectLocalInstall', () => {
    expect(typeof ijfwSystemService.detectLocalInstall).toBe('function');
  });

  it('exposes getLatestPublished', () => {
    expect(typeof ijfwSystemService.getLatestPublished).toBe('function');
  });

  it('exposes bootstrap', () => {
    expect(typeof ijfwSystemService.bootstrap).toBe('function');
  });

  it('exposes applyPendingUpgrade', () => {
    expect(typeof ijfwSystemService.applyPendingUpgrade).toBe('function');
  });

  it('exposes getRuntimeMode', () => {
    expect(typeof ijfwSystemService.getRuntimeMode).toBe('function');
  });

  it('getRuntimeMode returns one of the documented modes', () => {
    const mode = ijfwSystemService.getRuntimeMode();
    expect(['disabled', 'enabled', 'pending_activation']).toContain(mode);
  });
});
