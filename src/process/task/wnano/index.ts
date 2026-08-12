/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * wnano (Wayland Nano) spawn support: the Desktop half of C8 provider parity.
 * See `C8-provider-parity-design.md` §5-§8 for the env contract these modules
 * implement (`FLUX_API_KEY_FILE`, `WAYLAND_NANO_PROVIDERS`,
 * `WAYLAND_NANO_OAUTH_BEARER_*`).
 */

export {
  NANO_KNOWN_PROVIDER_IDS,
  WNANO_PROVIDERS_MAX_BYTES,
  WNANO_PROVIDERS_MAX_ENTRIES,
  WNANO_PROVIDERS_MAX_ID_CHARS,
  WNANO_PROVIDERS_MAX_MODELS_PER_PROVIDER,
  buildWaylandNanoProvidersPayload,
  type NanoKnownProviderId,
  type WnanoProviderEntry,
} from './providersPayload';
export { cleanupWnanoFluxKeyFile, wnanoFluxKeyFilePath, writeWnanoFluxKeyFile } from './fluxKeyFile';
export {
  WNANO_OAUTH_REFRESH_THRESHOLD_SECS,
  buildWnanoOAuthBearerEnv,
  normalizeWnanoBearerEnvSuffix,
  type WnanoOAuthBearerSnapshot,
  type WnanoOAuthBearerSource,
} from './oauthBearer';
