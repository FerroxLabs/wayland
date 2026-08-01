/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';

const { previewProvider } = vi.hoisted(() => ({ previewProvider: vi.fn() }));

vi.mock('@/common', () => ({
  ipcBridge: { waylandTransfer: { preview: { provider: previewProvider } } },
}));

import { initWaylandTransferBridge } from '@process/bridge/waylandTransferBridge';

describe('waylandTransferBridge', () => {
  it('registers exactly the injected read-only preview handler', () => {
    const preview = vi.fn();
    initWaylandTransferBridge(preview);

    expect(previewProvider).toHaveBeenCalledTimes(1);
    expect(previewProvider).toHaveBeenCalledWith(preview);
  });
});
