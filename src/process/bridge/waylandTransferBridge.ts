/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type {
  WaylandTransferPreflight,
  WaylandTransferPreflightRequest,
} from '@/common/types/transfer';

export type WaylandTransferPreview = (
  request: WaylandTransferPreflightRequest
) => Promise<WaylandTransferPreflight>;

/**
 * Register only the read-only preflight. Export/import publication gets a
 * separate authority-bearing bridge after the transfer format is proven.
 */
export function initWaylandTransferBridge(preview: WaylandTransferPreview): void {
  ipcBridge.waylandTransfer.preview.provider(preview);
}
