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
 *
 * H4 - neither body may throw. This bridge cannot transport a rejection:
 * `buildProvider(...).invoke` is `new Promise(function(resolve){...})` with no
 * reject and no timeout, and the provider half has no `.catch`. Promotion
 * touches the filesystem, a journal, a lock and the cron store, so "it will not
 * throw" was never true - `promoteConversationWorkspace` rethrows on any copy or
 * verification failure by design. Both bodies are wrapped, and the failure
 * arrives as the refusal the UI already knows how to render.
 */

import { ipcBridge } from '@/common';
import type { IPromotionOffer, IPromotionResult } from '@/common/adapter/ipcBridge';
import { previewPromotion, runPromotion } from '@process/services/promotion/promotionService';

/** Neither shape has a rejection channel, so an unexpected throw becomes this. */
const FAILED_PREVIEW: IPromotionOffer = {
  eligible: false,
  refusal: 'promotion-failed',
  earlierRuns: [],
  earlierRunsTruncated: false,
};

const FAILED_PROMOTION: IPromotionResult = {
  ok: false,
  refusal: 'promotion-failed',
  skipped: [],
  imported: [],
  importFailed: [],
};

export function initPromotionBridge(): void {
  ipcBridge.promotion.preview.provider(async ({ conversationId, jobId }) => {
    try {
      const offer = await previewPromotion({ conversationId, jobId });
      return {
        eligible: offer.eligible,
        refusal: offer.refusal,
        sourceWorkspace: offer.sourceWorkspace,
        targetName: offer.targetName,
        earlierRuns: [...offer.earlierRuns],
        earlierRunsTruncated: offer.earlierRunsTruncated,
      };
    } catch (error) {
      console.error('[promotionBridge] preview failed:', error);
      return FAILED_PREVIEW;
    }
  });

  ipcBridge.promotion.promote.provider(async ({ conversationId, jobId, keep }) => {
    try {
      const { outcome, imported, importFailed } = await runPromotion({ conversationId, jobId, keep });
      const result: IPromotionResult =
        outcome.ok === true
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
    } catch (error) {
      console.error('[promotionBridge] promote failed:', error);
      return FAILED_PROMOTION;
    }
  });
}
