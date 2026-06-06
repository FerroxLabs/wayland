/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Wayland Core catalog source (main process).
 *
 * Wayland Core (`wcore`) is a backend execution engine, not a model provider:
 * it runs whatever model the user connects through a real provider (Anthropic,
 * OpenAI, AWS Bedrock, ...). It has NO model catalog of its own - its models
 * are exactly the models of the connected providers, surfaced by their own
 * `ApiProviderSource`s.
 *
 * Therefore `listModels()` honestly returns `[]`. This is not a stub: it is the
 * correct answer. The downstream assembler unions every source's output, so
 * Wayland Core's connected models still reach the catalog via their providers.
 */

import type { CatalogSource } from './CatalogSource';
import type { RawModel } from '../types';

export class WaylandCoreSource implements CatalogSource {
  readonly kind = 'wcore' as const;
  readonly providerId = 'wcore';

  /**
   * Wayland Core owns no models - it proxies connected providers. Returns an
   * empty list by design.
   */
  async listModels(): Promise<RawModel[]> {
    return [];
  }
}
