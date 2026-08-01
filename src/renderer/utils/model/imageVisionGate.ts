/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * IMG-01 — image/vision send gate.
 *
 * Before an image leaves the ordinary composer, prove the selected model can
 * actually read it. Without this the composer accepts an image and sends it to
 * whatever model is selected; a non-vision model silently drops it and the user
 * gets a text-only answer with no explanation (the reported failure).
 *
 * Enforcement is FAIL-CLOSED for concrete models — an image is only sent to a
 * model we can PROVE is vision-capable — with one deliberate exception: Flux
 * router aliases (flux-auto/-fast/-reasoning/-standard) route per request on the
 * server, so the desktop cannot know the leaf model here and must trust the
 * router to select a vision-capable target. (The Flux-side guarantee is the one
 * piece this desktop gate cannot enforce; see IMG-01 notes.)
 *
 * Capability resolution honors, in order: a user-set capability, a provider
 * rule, then a model-name pattern — so a vision model the pattern misses can be
 * unblocked by the user marking it vision-capable in model settings.
 */
import type { IProvider, TProviderWithModel } from '@/common/config/storage';
import { hasSpecificModelCapability } from '@/common/utils/modelCapabilities';
import { isFluxModelId } from '@/common/config/flux';
import { isImageFile } from '@renderer/services/FileService';

export type ImageVisionBlock = {
  /** i18n key for the honest, actionable block message. */
  reasonKey: string;
  /** Interpolation values for the message. */
  reasonParams: Record<string, string>;
  /** The model name that cannot read images (for logging/telemetry). */
  model: string;
};

/**
 * Decide whether a send carrying image files must be blocked because the
 * selected model cannot read images. Returns `null` when the send may proceed
 * (no image attached, no model yet, a Flux router, or a proven-vision model).
 */
export function resolveImageVisionBlock(
  currentModel: TProviderWithModel | undefined,
  files: readonly string[]
): ImageVisionBlock | null {
  const hasImage = files.some((file) => isImageFile(file));
  if (!hasImage) return null;

  // No model resolved yet is handled by the separate no-model gate; don't
  // double-report here.
  if (!currentModel?.useModel) return null;

  const useModel = currentModel.useModel;

  // Flux router aliases route to a leaf model server-side; trust the router to
  // pick a vision-capable target rather than block the default preview model.
  if (isFluxModelId(useModel)) return null;

  // Honor a user-marked capability first, so a vision model the name pattern
  // misses can be unblocked in model settings. Then fall back to name-based
  // resolution. `hasSpecificModelCapability` ignores the provider object (name
  // resolution is by model id) but the signature requires it; the cast is safe
  // because TProviderWithModel is an IProvider minus its `model[]` list.
  const userVision = currentModel.capabilities?.find((cap) => cap.type === 'vision')?.isUserSelected;
  const vision =
    userVision !== undefined
      ? userVision
      : hasSpecificModelCapability(currentModel as unknown as IProvider, useModel, 'vision');

  // Fail closed: only a PROVEN vision model may receive the image.
  if (vision === true) return null;

  return {
    reasonKey: 'conversation.imageVisionBlocked',
    reasonParams: { model: currentModel.name || useModel },
    model: useModel,
  };
}
