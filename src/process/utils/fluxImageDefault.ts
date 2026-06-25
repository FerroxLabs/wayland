/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * When FluxRouter is the connected provider and the user has NOT chosen an
 * image-generation model, default the built-in image MCP to a Flux arm so it
 * "just works" without setup. Pure resolution logic (deps injected) so it can
 * be unit-tested without the DB; the boot wiring in `initStorage` supplies the
 * real `model.config` rows and the decrypted Flux key.
 *
 * Invariant: only ever SEEDS - it never overrides an explicit user choice and
 * never fires unless Flux is genuinely connected (a key is present).
 */

import type { IProvider, IConfigStorageRefer } from '@/common/config/storage';
import { FLUX_SURFACE } from '@/common/config/flux';
import { FLUX_DEFAULT_IMAGE_ARM, isFluxProviderRow } from '@/common/config/imageModels';

type ImageGenConfig = IConfigStorageRefer['tools.imageGenerationModel'];

export type FluxImageDefaultDeps = {
  /** Current `tools.imageGenerationModel`, or undefined when never set. */
  current: ImageGenConfig | undefined;
  /** Legacy `model.config` provider rows. */
  providers: IProvider[];
  /** The connected Flux key, or undefined when Flux isn't connected. */
  fluxKey: string | undefined;
};

/**
 * Returns a seed `tools.imageGenerationModel` pointed at Flux, or null to leave
 * things unchanged. Seeds ONLY when: the user has no image model chosen
 * (`!current.useModel`), Flux is connected (`fluxKey` present), AND a Flux row
 * exists in `model.config` (so the picker shows it and the Tools "sync by id"
 * effect won't immediately wipe the seed).
 */
export function resolveFluxImageDefault(deps: FluxImageDefaultDeps): ImageGenConfig | null {
  const { current, providers, fluxKey } = deps;
  if (current?.useModel) return null;
  if (!fluxKey) return null;

  const row = (providers || []).find(isFluxProviderRow);
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    platform: row.platform,
    baseUrl: row.baseUrl || FLUX_SURFACE.openai,
    apiKey: fluxKey,
    useModel: FLUX_DEFAULT_IMAGE_ARM,
  };
}
