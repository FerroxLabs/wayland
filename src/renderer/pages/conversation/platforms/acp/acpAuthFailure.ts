/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Generic auth-failure shapes an ACP turn surfaces when the underlying CLI
 * could not authenticate. These cover both the Anthropic-blocks-subscription
 * OAuth rejection (Claude Code under a Pro/Max login inside a third-party tool)
 * and the broader "your CLI is not logged in / key invalid" family any backend
 * can hit. Lowercased so the classifier can match case-insensitively.
 */
const AUTH_FAILURE_SIGNATURES = [
  'invalid api key',
  'createsession',
  'authentication failed',
  '认证失败',
  '[acp-auth-',
  'oauth',
  'unauthorized',
  // Engine-start credential failures (#629): the wcore engine bails during init
  // with "No API key found" (engine config.rs) when it is spawned without a
  // working key - the exact dead-end a paid user hit after a credit top-up left
  // `model.apiKey` empty. Treat it as an auth failure so the recovery card
  // (re-enter key / reconnect Flux) shows instead of a raw stderr bubble. The
  // desktop's pre-spawn guard (MissingApiKeyError) also surfaces this phrasing.
  'no api key',
  'missingapikey',
  'api key not found',
  'no working provider',
  // NOTE: bare '401' intentionally removed (#624) - a raw substring misroutes
  // non-auth errors that merely contain "401"; HTTP_401_PATTERN (\b401\b) below
  // handles the real status-code shapes with word boundaries.
] as const;

/**
 * HTTP 401 as a standalone status code. Matched with word boundaries rather
 * than a bare `includes('401')` so an unrelated number that merely CONTAINS
 * "401" - e.g. a token count like 40100, or an id like 124015 - does not
 * misroute a non-auth error to the auth-failure card (#624). `\b401\b` still
 * matches the real shapes: "401 Unauthorized", "error 401", "status=401",
 * "HTTP/1.1 401".
 */
const HTTP_401_PATTERN = /\b401\b/;

/** A descriptor for how to remedy an ACP auth failure for a given backend. */
export type AcpAuthRemedy = {
  backend: string;
  /** Human-friendly product name for the backend, e.g. 'Claude Code'. */
  backendLabel: string;
  /** True when the vendor blocks subscription OAuth logins inside third-party tools. */
  subscriptionOAuthBlocked: boolean;
  /** Provider whose API key fixes this, e.g. 'Anthropic'. Omitted when adding a key does not apply. */
  providerKeyLabel?: string;
  /** A shell command the user can run to re-authenticate the CLI, e.g. 'codex login'. */
  cliLoginCmd?: string;
  /** True when this backend can be routed through Flux Router instead. */
  fluxRoutable: boolean;
  /**
   * i18n key for the explainer line. Defaults (when omitted) to the
   * subscription/generic pair driven by `subscriptionOAuthBlocked`. Set it when
   * a backend needs a tailored "why" - e.g. Wayland Core has no CLI login and no
   * subscription fallback, so the generic "sign in to the CLI" copy is wrong.
   */
  explainerKey?: string;
  /**
   * True when the failing backend is ALREADY routed through Flux. Re-routing
   * through Flux cannot fix it, so the card suppresses the Flux action.
   */
  fluxAlreadyRouted?: boolean;
  /**
   * True when the backend routes ANY provider (Wayland Core), so the "add a key"
   * remedy must read generically ("add any provider API key") rather than naming
   * one vendor.
   */
  genericProviderKey?: boolean;
};

/** Case-insensitive substring match against the generic auth-failure signatures. */
export function looksLikeAuthFailure(errorMsg: string): boolean {
  const haystack = errorMsg.toLowerCase();
  return AUTH_FAILURE_SIGNATURES.some((signature) => haystack.includes(signature)) || HTTP_401_PATTERN.test(haystack);
}

/** Display labels for backend ids that do not Title-case cleanly. */
const BACKEND_LABELS: Record<string, string> = {
  droid: 'Factory Droid',
  auggie: 'Auggie',
  copilot: 'Copilot CLI',
  cursor: 'Cursor',
  kiro: 'Kiro',
  vibe: 'Vibe',
  qoder: 'Qoder',
  kimi: 'Kimi',
  codebuddy: 'CodeBuddy',
  hermes: 'Hermes',
  snow: 'Snow',
  custom: 'this agent',
};

/** Per-backend overrides merged over the DEFAULT remedy. */
const BACKEND_REMEDIES: Record<string, Partial<AcpAuthRemedy>> = {
  claude: {
    backendLabel: 'Claude Code',
    subscriptionOAuthBlocked: true,
    providerKeyLabel: 'Anthropic',
    fluxRoutable: true,
  },
  codex: {
    backendLabel: 'Codex',
    subscriptionOAuthBlocked: true,
    providerKeyLabel: 'OpenAI',
    cliLoginCmd: 'codex login',
    fluxRoutable: true,
  },
  grok: {
    backendLabel: 'Grok Build',
    // Auth is the grok.com OAuth login behind a SuperGrok subscription; the only
    // fix is re-running the CLI login. Not Flux-routable (xAI's own gateway).
    cliLoginCmd: 'grok login',
    fluxRoutable: false,
  },
  qwen: {
    backendLabel: 'Qwen Code',
    cliLoginCmd: 'qwen',
    fluxRoutable: true,
  },
  goose: {
    backendLabel: 'Goose',
    cliLoginCmd: 'goose',
    fluxRoutable: true,
  },
  opencode: {
    backendLabel: 'OpenCode',
    cliLoginCmd: 'opencode auth login',
    fluxRoutable: true,
  },
  wcore: {
    backendLabel: 'Wayland Core',
    fluxRoutable: true,
    // Wayland Core routes any provider, so the add-key remedy is vendor-neutral.
    genericProviderKey: true,
    // No CLI login and no subscription fallback - the only fixes are a working
    // provider key or the Flux route. Keep cliLoginCmd undefined so buildRemedy
    // does not synthesize a "wcore login" command.
    cliLoginCmd: undefined,
    explainerKey: 'conversation.acpAuthFailure.wcoreExplainer',
  },
};

/** Build the remedy descriptor for a backend, merging its entry over a sensible default. */
function buildRemedy(backend: string, runtimeOverrides?: Partial<AcpAuthRemedy>): AcpAuthRemedy {
  const override = BACKEND_REMEDIES[backend] ?? {};
  const backendLabel =
    override.backendLabel ?? BACKEND_LABELS[backend] ?? backend.charAt(0).toUpperCase() + backend.slice(1);
  const remedy: AcpAuthRemedy = {
    backend,
    backendLabel,
    subscriptionOAuthBlocked: override.subscriptionOAuthBlocked ?? false,
    providerKeyLabel: override.providerKeyLabel,
    cliLoginCmd: 'cliLoginCmd' in override ? override.cliLoginCmd : `${backend} login`,
    fluxRoutable: override.fluxRoutable ?? false,
    explainerKey: override.explainerKey,
    genericProviderKey: override.genericProviderKey,
    ...runtimeOverrides,
  };
  // A backend already routed through Flux cannot be fixed by routing through
  // Flux again - hide that action so the user picks a real remedy.
  if (remedy.fluxAlreadyRouted) remedy.fluxRoutable = false;
  return remedy;
}

/**
 * Registry lookup with NO error-signature gate. Use this when you already know
 * the turn failed for auth reasons and only need the remedy descriptor (e.g.
 * reacting to the auth.failed.card event, which carries the backend only).
 *
 * `runtimeOverrides` lets a caller fill in details known only at failure time -
 * e.g. Wayland Core routes any registry provider, so the failing provider's
 * label (`providerKeyLabel`) is passed in rather than hard-coded.
 */
export function getAcpAuthRemedy(backend: string, runtimeOverrides?: Partial<AcpAuthRemedy>): AcpAuthRemedy {
  return buildRemedy(backend, runtimeOverrides);
}

/**
 * Classify an ACP turn error. Returns null when the error does not look like an
 * auth failure; otherwise returns the remedy descriptor for that backend.
 */
export function classifyAcpAuthFailure(backend: string, errorMsg: string): AcpAuthRemedy | null {
  if (!looksLikeAuthFailure(errorMsg)) return null;
  return buildRemedy(backend);
}
