/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * P2-4 promotion IPC. Two providers, both taking IDs only.
 *
 * `preview` is the OFFER: it reports whether this chat can be promoted, what
 * would be copied, and which files earlier runs left behind - and changes
 * nothing. `promote` is the ACCEPT. There is deliberately no path anywhere in
 * either signature: main resolves every workspace from the job's own
 * conversations, so a compromised renderer cannot aim the copy.
 */

import { ipcBridge } from '@/common';
import type { IPromotionResult } from '@/common/adapter/ipcBridge';
import { previewPromotion, runPromotion } from '@process/services/promotion/promotionService';

export function initPromotionBridge(): void {
  ipcBridge.promotion.preview.provider(async ({ conversationId, jobId }) => {
    const offer = await previewPromotion({ conversationId, jobId });
    return {
      eligible: offer.eligible,
      refusal: offer.refusal,
      sourceWorkspace: offer.sourceWorkspace,
      targetName: offer.targetName,
      earlierRuns: [...offer.earlierRuns],
      earlierRunsTruncated: offer.earlierRunsTruncated,
    };
  });

  ipcBridge.promotion.promote.provider(async ({ conversationId, jobId, keep }) => {
    const { outcome, imported, importFailed } = await runPromotion({ conversationId, jobId, keep });
    const result: IPromotionResult = outcome.ok === true
      ? {
          ok: true,
          workspace: outcome.workspace,
          alreadyPromoted: outcome.alreadyPromoted,
          skipped: [...outcome.skipped],
          imported: [...imported],
          importFailed: [...importFailed],
        }
      : { ok: false, refusal: outcome.refusal, skipped: [], imported: [], importFailed: [] };
    return result;
  });
}
