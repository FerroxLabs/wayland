/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { emit } = vi.hoisted(() => ({ emit: vi.fn() }));

vi.mock('@/common', () => ({
  ipcBridge: { modelRegistry: { listChanged: { emit } } },
}));

import { emitModelRegistryChanged } from '@process/providers/modelRegistryEvents';

describe('emitModelRegistryChanged', () => {
  beforeEach(() => emit.mockClear());

  it('uses the single authoritative renderer invalidation channel', () => {
    emitModelRegistryChanged();
    expect(emit).toHaveBeenCalledOnce();
  });
});
