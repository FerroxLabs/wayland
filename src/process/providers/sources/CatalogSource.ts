import type { RawModel } from '../types';

/**
 * A catalog source emits the raw model list for a single provider. Concrete
 * sources back the three discovery paths in the Models & Providers redesign:
 *
 * - `api`   - a cloud provider's `/v1/models` endpoint
 * - `wcore` - the Wayland Core model list
 * - `cli`   - a local CLI agent's exposed models
 *
 * The raw models are later enriched by the models.dev registry into
 * `CatalogModel[]`.
 *
 * ## Contract seam - `providerId` and the `cli` kind
 *
 * `providerId` is intentionally typed `string`, not `ProviderId`. A source's
 * identity may be `'wcore'` or a CLI *agent key* (`'claude'`, `'codex'`,
 * `'gemini'`) - both broader than the `ProviderId` union (`'claude'` and
 * `'gemini'` are NOT valid `ProviderId` values). Consumers must therefore NOT
 * blindly cast `source.providerId as ProviderId`.
 *
 * When `kind === 'cli'`, the source is a `CliAgentSource` instance that carries
 * two extra fields not declared on this type: `enumerable: boolean` and
 * `underlyingProviderId: ProviderId`. A consumer needing the real model
 * provider must narrow first (`source.kind === 'cli'`, or
 * `source instanceof CliAgentSource`) and read `underlyingProviderId` - never
 * `providerId`, which holds the agent key for a CLI source.
 */
export type CatalogSource = {
  readonly kind: 'api' | 'wcore' | 'cli';
  readonly providerId: string;
  listModels(): Promise<RawModel[]>;
};
