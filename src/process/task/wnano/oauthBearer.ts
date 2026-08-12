/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Short-lived OAuth bearer injection for wnano (Wayland Nano) spawns (C8
 * provider parity, design §6.3 / Q1(b) ruling).
 *
 * Desktop owns every OAuth flow and token store; Nano NEVER reads
 * `~/.codex/auth.json` or `$WAYLAND_HOME/oauth/xai.json`, never sees a refresh
 * token, and never writes a token store. At spawn time, for each connected
 * OAuth provider that is advertised in the `WAYLAND_NANO_PROVIDERS` payload,
 * Desktop refreshes the access token ONLY when its remaining lifetime is below
 * {@link WNANO_OAUTH_REFRESH_THRESHOLD_SECS} (avoids refresh churn) and injects:
 *
 *  - `WAYLAND_NANO_OAUTH_BEARER_<NORMALIZED_ID>` - the ACCESS token only.
 *  - `WAYLAND_NANO_OAUTH_BEARER_<NORMALIZED_ID>_EXPIRES_AT_UNIX_SECS` - the
 *    non-secret expiry, so Nano can pre-fail with `oauth_expired` instead of
 *    dispatching a doomed turn.
 *
 * `NORMALIZED_ID` is the provider id uppercased with every char outside
 * [A-Z0-9] replaced by `_` (e.g. `google-gemini` -> `GOOGLE_GEMINI`).
 *
 * v1 reach: `xai` is the only wired source (the only Desktop OAuth provider in
 * Nano's known id set; ChatGPT's `chatgpt-subscription` id is not in the set
 * and needs the deferred Responses wire anyway). xAI also keeps working via
 * the `XAI_API_KEY` that `buildConnectedProviderEnv` already injects - the
 * bearer is the expiry-aware path on top.
 */

/** Refresh the access token at spawn only when fewer than this many seconds remain. */
export const WNANO_OAUTH_REFRESH_THRESHOLD_SECS = 600;

/** A read of a provider's current OAuth credential. Never carries the refresh token. */
export type WnanoOAuthBearerSnapshot = {
  /** The current short-lived access token (secret). */
  accessToken?: string;
  /** Epoch MILLISECONDS when the access token expires. */
  expiresAtMs?: number;
};

/**
 * One OAuth-backed credential source, wired by the caller to Desktop's token
 * stores. Dependencies are injected so the decision logic stays pure/testable.
 */
export type WnanoOAuthBearerSource = {
  /** Provider id exactly as advertised in the `WAYLAND_NANO_PROVIDERS` payload. */
  nanoProviderId: string;
  /** Read the current access token + expiry. Null/absent fields = no usable credential. */
  load: () => Promise<WnanoOAuthBearerSnapshot | null>;
  /**
   * Exchange the stored refresh token for a fresh access token and persist it.
   * Resolves true when a fresh token was obtained (a subsequent `load()` must
   * reflect it); false on any failure. Never rejects.
   */
  refresh: () => Promise<boolean>;
};

/** Map a provider id onto its bearer env-var suffix: uppercase, [^A-Z0-9] -> '_'. */
export function normalizeWnanoBearerEnvSuffix(providerId: string): string {
  return providerId.toUpperCase().replace(/[^A-Z0-9]/g, '_');
}

/**
 * Build the bearer env for a wnano spawn. Only sources whose provider id is
 * advertised in the payload are considered. A source emits nothing when it has
 * no access token, when its expiry is unknown (the expiry metadata is part of
 * the contract, so an unbounded token is never injected), or when a required
 * refresh fails - the spawn proceeds and Nano fails closed at dispatch time.
 * Two sources normalizing to the same env suffix are a config bug: the first
 * wins and the colliding source is skipped (never a silently overwritten var).
 * Never throws; never logs token material.
 */
export async function buildWnanoOAuthBearerEnv(
  advertisedProviderIds: readonly string[],
  sources: readonly WnanoOAuthBearerSource[],
  nowMs: number = Date.now()
): Promise<Record<string, string>> {
  const advertised = new Set(advertisedProviderIds);
  const usedSuffixes = new Set<string>();
  // Only advertised providers are considered. Two sources normalizing to the
  // same env suffix are a config bug: the first wins and the colliding source
  // is skipped (never a silently overwritten var).
  const eligible = sources.filter((source) => {
    if (!advertised.has(source.nanoProviderId)) return false;
    const suffix = normalizeWnanoBearerEnvSuffix(source.nanoProviderId);
    if (usedSuffixes.has(suffix)) return false;
    usedSuffixes.add(suffix);
    return true;
  });

  const parts = await Promise.all(eligible.map((source) => buildSourceBearerEnv(source, nowMs)));
  return Object.assign({}, ...parts);
}

/**
 * Resolve one source's bearer env. Emits nothing when the source has no
 * access token, when its expiry is unknown (the expiry metadata is part of the
 * contract, so an unbounded token is never injected), or when a required
 * refresh fails - the spawn proceeds and Nano fails closed at dispatch time.
 * Never throws; never logs token material.
 */
async function buildSourceBearerEnv(source: WnanoOAuthBearerSource, nowMs: number): Promise<Record<string, string>> {
  try {
    let snapshot = await source.load();
    if (!snapshot?.accessToken) return {};

    const remainingSecs = snapshot.expiresAtMs !== undefined ? (snapshot.expiresAtMs - nowMs) / 1000 : undefined;
    if (remainingSecs !== undefined && remainingSecs < WNANO_OAUTH_REFRESH_THRESHOLD_SECS) {
      if (!(await source.refresh())) return {};
      snapshot = await source.load();
      if (!snapshot?.accessToken) return {};
    }

    // The expiry metadata is contractual: never inject a bearer whose expiry
    // Desktop cannot state (Nano would be unable to pre-fail on expiry).
    if (snapshot.expiresAtMs === undefined) return {};

    const suffix = normalizeWnanoBearerEnvSuffix(source.nanoProviderId);
    return {
      [`WAYLAND_NANO_OAUTH_BEARER_${suffix}`]: snapshot.accessToken,
      [`WAYLAND_NANO_OAUTH_BEARER_${suffix}_EXPIRES_AT_UNIX_SECS`]: String(Math.floor(snapshot.expiresAtMs / 1000)),
    };
  } catch {
    // A failing source must never abort the spawn - skip it.
    return {};
  }
}
