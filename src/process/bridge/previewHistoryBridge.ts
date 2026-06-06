/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { PreviewHistoryTarget } from '@/common/types/preview';
import { previewHistoryService } from '../services/previewHistoryService';

export function initPreviewHistoryBridge(): void {
  // List history snapshots for the provided target
  ipcBridge.previewHistory.list.provider(({ target }) => {
    return previewHistoryService.list(target as PreviewHistoryTarget);
  });

  // Persist new snapshot content for the target
  ipcBridge.previewHistory.save.provider(({ target, content }) => {
    return previewHistoryService.save(target as PreviewHistoryTarget, content);
  });

  // Fetch the content payload of a specific snapshot
  ipcBridge.previewHistory.getContent.provider(async ({ target, snapshotId }) => {
    const result = await previewHistoryService.getContent(target as PreviewHistoryTarget, snapshotId);
    if (!result) {
      return null;
    }
    return result;
  });
}
