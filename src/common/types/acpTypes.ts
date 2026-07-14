/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// These versions are FALLBACK floors only. At spawn time the connectors resolve
// the LATEST published version of each bridge via bridgeVersionResolver (so new
// models/features land automatically); these pins are used only when the npm
// registry is unreachable. Keep them at a recent known-good version.
// Codex uses the actively-maintained App-Server adapter, NOT the retired
// @zed-industries/codex-acp (which statically embedded codex-core rust-v0.137.0
// and so version-gated out of new models like gpt-5.6-sol). The new adapter
// drives the live `codex app-server`, so it tracks the current Codex release and
// new models work automatically. Zed handed the project off here on 2026-06-22.
export const CODEX_ACP_BRIDGE_VERSION = '1.1.2';
export const CODEX_ACP_NPX_PACKAGE = `@agentclientprotocol/codex-acp@${CODEX_ACP_BRIDGE_VERSION}`;

export const CLAUDE_ACP_BRIDGE_VERSION = '0.44.0';
export const CLAUDE_ACP_NPX_PACKAGE = `@agentclientprotocol/claude-agent-acp@${CLAUDE_ACP_BRIDGE_VERSION}`;

export const CODEBUDDY_ACP_BRIDGE_VERSION = '2.73.0';
export const CODEBUDDY_ACP_NPX_PACKAGE = `@tencent-ai/codebuddy-code@${CODEBUDDY_ACP_BRIDGE_VERSION}`;

/**
 * Current ACP wrapper version for a given backend, in the format `<backend>@<version>`,
 * or `null` for backends whose wrapper version we don't pin (locally installed CLIs).
 *
 * Self-healing replay path uses this: on session creation we persist the value to
 * `conversations.extra.acpWrapperVersion`. On reopen, if the persisted value differs
 * from what we return now, the resume path is skipped (some wrappers silently return
 * success on a session id created by an older version while the session state is
 * internally broken) and a fresh session is started with replayed history prepended.
 */
export function getCurrentWrapperVersion(backend: string): string | null {
  switch (backend) {
    case 'claude':
      return `claude@${CLAUDE_ACP_BRIDGE_VERSION}`;
    case 'codex':
      return `codex@${CODEX_ACP_BRIDGE_VERSION}`;
    case 'codebuddy':
      return `codebuddy@${CODEBUDDY_ACP_BRIDGE_VERSION}`;
    default:
      return null;
  }
}

// ACP backend types - only ACP protocol backends
export type AcpBackendAll =
  | 'claude' // Claude ACP
  // | 'gemini' // Google Gemini - not an ACP agent, handled by AgentRegistry directly
  | 'qwen' // Qwen Code ACP
  | 'codex' // OpenAI Codex ACP (via codex-acp bridge)
  | 'grok' // xAI Grok Build CLI (native ACP via `grok agent stdio`)
  | 'codebuddy' // Tencent CodeBuddy Code CLI
  | 'droid' // Factory Droid CLI (ACP via `droid exec --output-format acp`)
  | 'goose' // Block's Goose CLI
  | 'auggie' // Augment Code CLI
  | 'kimi' // Kimi CLI (Moonshot)
  | 'opencode' // OpenCode CLI
  | 'copilot' // GitHub Copilot CLI
  | 'qoder' // Qoder CLI
  | 'vibe' // Mistral Vibe CLI
  | 'cursor' // Cursor AI Agent CLI
  | 'kiro' // Kiro CLI (AWS)
  | 'hermes' // Hermes Agent CLI (Nous Research)
  | 'snow' // Snow AI CLI
  | 'custom'; // User-configured custom ACP agent (extension adapters)

// Superset type covering all execution engine backends (ACP + non-ACP).
export type AgentBackend = AcpBackendAll | 'gemini' | 'remote' | 'wcore' | 'nanobot' | 'openclaw-gateway';

/**
 * Potential ACP CLI tools list.
 * Used for auto-detecting CLI tools installed on the user's local machine.
 * When new ACP CLI tools are released, simply add them to this list.
 */
export interface PotentialAcpCli {
  /** CLI executable filename */
  cmd: string;
  /** ACP launch arguments */
  args: string[];
  /** Display name */
  name: string;
  /** Corresponding backend id */
  backendId: AcpBackendAll;
}

/** Default ACP launch arguments */
const DEFAULT_ACP_ARGS = ['--experimental-acp'];

/**
 * Generate detectable CLI list from ACP_BACKENDS_ALL.
 * Only includes enabled backends with cliCommand (excludes custom).
 */
function generatePotentialAcpClis(): PotentialAcpCli[] {
  // Must be called after ACP_BACKENDS_ALL is defined, so use lazy initialization
  return Object.entries(ACP_BACKENDS_ALL)
    .filter(([id, config]) => {
      // Exclude backends without CLI command (custom is user-configured)
      if (!config.cliCommand) return false;
      if (id === 'custom') return false;
      return config.enabled;
    })
    .map(([id, config]) => ({
      cmd: config.cliCommand!,
      args: config.acpArgs || DEFAULT_ACP_ARGS,
      name: config.name,
      backendId: id as AcpBackendAll,
    }));
}

// Lazy initialization to avoid circular dependency
let _potentialAcpClis: PotentialAcpCli[] | null = null;

/**
 * List of CLI tools known to support the ACP protocol.
 * Detection iterates this list and checks for installation via `which`.
 * Auto-generated from ACP_BACKENDS_ALL to avoid data duplication.
 */
export const POTENTIAL_ACP_CLIS: PotentialAcpCli[] = new Proxy([] as PotentialAcpCli[], {
  get(_target, prop) {
    if (_potentialAcpClis === null) {
      _potentialAcpClis = generatePotentialAcpClis();
    }
    if (prop === 'length') return _potentialAcpClis.length;
    if (typeof prop === 'string' && !isNaN(Number(prop))) {
      return _potentialAcpClis[Number(prop)];
    }
    if (prop === Symbol.iterator) {
      return function* () {
        yield* _potentialAcpClis!;
      };
    }
    if (prop === 'map') return _potentialAcpClis.map.bind(_potentialAcpClis);
    if (prop === 'filter') return _potentialAcpClis.filter.bind(_potentialAcpClis);
    if (prop === 'forEach') return _potentialAcpClis.forEach.bind(_potentialAcpClis);
    return Reflect.get(_potentialAcpClis, prop);
  },
});

/**
 * Configuration for an ACP backend agent.
 * Used for both built-in backends (claude, gemini, qwen) and custom user agents.
 */
export interface AcpBackendConfig {
  /** Unique identifier for the backend (e.g., 'claude', 'gemini', 'custom') */
  id: string;

  /** Display name shown in the UI (e.g., 'Goose', 'Claude Code') */
  name: string;

  /** Localized names (e.g., { 'zh-CN': '...', 'en-US': '...' }) */
  nameI18n?: Record<string, string>;

  /** Short description shown in assistant lists or settings */
  description?: string;

  /** Localized descriptions (e.g., { 'zh-CN': '...', 'en-US': '...' }) */
  descriptionI18n?: Record<string, string>;

  /** Avatar for the assistant - can be an emoji string or image path */
  avatar?: string;

  /**
   * CLI command name used for detection via `which` command.
   * Example: 'goose', 'claude', 'qwen'
   * Only needed if the binary name differs from id.
   */
  cliCommand?: string;

  /**
   * Full CLI path with optional arguments (space-separated).
   * Used when spawning the process.
   * Examples:
   *   - 'goose' (simple binary)
   *   - 'npx @qwen-code/qwen-code' (npx package)
   *   - '/usr/local/bin/my-agent --verbose' (full path with args)
   * Note: '--experimental-acp' is auto-appended for non-custom backends.
   */
  defaultCliPath?: string;

  /** Whether this backend requires authentication before use */
  authRequired?: boolean;

  /** Whether this backend is enabled and should appear in the UI */
  enabled?: boolean;

  /** Whether this backend supports streaming responses */
  supportsStreaming?: boolean;

  /**
   * Custom environment variables to pass to the spawned process.
   * Merged with process.env when spawning.
   * Example: { "ANTHROPIC_API_KEY": "sk-...", "DEBUG": "true" }
   */
  env?: Record<string, string>;

  /**
   * API Key fields declared by extensions for user configuration in Settings UI.
   * User-entered values are injected as environment variables when spawning the process.
   * Example: [{ key: "MY_API_KEY", label: "API Key", type: "password", required: true }]
   */
  apiKeyFields?: Array<{
    key: string;
    label: string;
    type: 'text' | 'password' | 'select' | 'number' | 'boolean';
    required?: boolean;
    options?: string[];
    default?: string | number | boolean;
  }>;

  /**
   * Arguments to enable ACP mode when spawning the CLI.
   * Different CLIs use different conventions:
   *   - ['--experimental-acp'] for claude (default if not specified)
   *   - ['--acp'] for qwen, auggie
   *   - ['acp'] for goose (subcommand)
   * If not specified, defaults to ['--experimental-acp'].
   */
  acpArgs?: string[];

  /**
   * Native skill discovery directories (relative to workspace root).
   * Only CLIs with this field support native skill discovery (CLI auto-scans directory for SKILL.md).
   * Backends without this field will fallback to first-message injection (prompt injection).
   */
  skillsDirs?: string[];

  /** Whether this is a prompt-based preset (no CLI binary required) */
  isPreset?: boolean;

  /** The system prompt or rule context for this preset */
  context?: string;

  /** Localized prompts for this preset (e.g., { 'zh-CN': '...', 'en-US': '...' }) */
  contextI18n?: Record<string, string>;

  /** Example prompts for this preset */
  prompts?: string[];

  /** Localized example prompts */
  promptsI18n?: Record<string, string[]>;

  /**
   * The primary agent type for this preset (only applies when isPreset=true).
   * Determines which conversation type to create when selecting this preset.
   * - 'gemini': Creates a Gemini conversation
   * - 'claude': Creates an ACP conversation with Claude backend
   * - 'codex': Creates a Codex conversation
   * - any string: Extension-contributed ACP adapter ID (e.g. 'ext-buddy')
   * Defaults to 'gemini' for backward compatibility.
   */
  presetAgentType?: string;

  /**
   * Available models for this assistant (only applies when isPreset=true).
   * If not specified, system default models will be used.
   */
  models?: string[];

  /** Whether this is a built-in assistant (cannot be edited/deleted) */
  isBuiltin?: boolean;

  /**
   * Enabled skills for this assistant (only applies when isPreset=true).
   * If not specified or empty array, all available skills will be loaded.
   */
  enabledSkills?: string[];

  /**
   * List of custom skill names added via "Add Skills" button (only applies when isPreset=true).
   * These skills will be displayed in the Custom Skills section even after being imported.
   */
  customSkillNames?: string[];

  /**
   * Disabled builtin auto-injected skills (only applies when isPreset=true).
   * Builtin skills (in _builtin/ directory) are auto-injected by default; skills in this list will be excluded.
   */
  disabledBuiltinSkills?: string[];

  /**
   * Whether this backend can route through Flux.
   * - 'env': routes through Flux via env injection (ready now).
   * - 'setup': routes after the Flux setup assistant writes its config.
   * - 'vendor': locked to its own service, not Flux-routable.
   * Unset means no Flux compatibility is claimed (no chip shown).
   */
  fluxCompat?: 'env' | 'setup' | 'vendor';

  // ---- Native catalog (builtin-catalog) fields ----
  // Let a native built-in record carry the library-grouping + team-launcher
  // metadata that previously only existed on extension-contributed records.
  // They round-trip through config storage as plain JSON and are mapped to the
  // renderer's `_kind`/`_teammates`/... fields by useAssistantList.

  /** Library grouping: 'team' composes multiple roles (launcher / standing company), 'specialist' is a single role. Drives /assistants + /teams classification. */
  kind?: 'team' | 'specialist';

  /** Dominant action category (sell | write | research | build | run | office | general). */
  category?: string;

  /** Team launcher roster - specialist assistant ids this team composes (kind === 'team'). */
  teammates?: string[];

  /** Recurring rituals declared by a standing team (e.g. weekly rollup). */
  rituals?: Array<{ name: string; cadence: string }>;

  /** Standing Company flag - always-on multi-role org (kind === 'team'). */
  standing?: boolean;

  /** SuggestionEngine kickoff cards shown on the new-chat empty state. */
  kickoffs?: Array<{
    id: string;
    text: string;
    prefill: string;
    scenario: string;
    timeBucket?: string;
    requiresRitualOutput?: boolean;
    beginnerSafe?: boolean;
  }>;
}

// All backend configurations - including temporarily disabled ones
export const ACP_BACKENDS_ALL: Record<AcpBackendAll, AcpBackendConfig> = {
  claude: {
    id: 'claude',
    name: 'Claude Code',
    cliCommand: 'claude',
    authRequired: true,
    enabled: true,
    supportsStreaming: false,
    skillsDirs: ['.claude/skills'],
    // Routes through Flux per-spawn via the Anthropic surface (ANTHROPIC_BASE_URL).
    fluxCompat: 'env',
  },
  // gemini: not an ACP agent - handled by AgentRegistry as a dedicated DetectedAgentKind
  // gemini: {
  //   id: 'gemini',
  //   name: 'Google CLI',
  //   cliCommand: 'gemini',
  //   authRequired: true,
  //   enabled: false,
  //   supportsStreaming: true,
  //   skillsDirs: ['.gemini/skills'],
  // },
  // Codex is listed before Qwen so it appears earlier in the agent icon row.
  codex: {
    id: 'codex',
    name: 'Codex',
    cliCommand: 'codex', // Detect local codex CLI (codex-acp bridge invokes it)
    defaultCliPath: `npx ${CODEX_ACP_NPX_PACKAGE}`,
    authRequired: true, // Needs OPENAI_API_KEY or ChatGPT auth
    enabled: true, // ✅ Codex via codex-acp ACP bridge
    supportsStreaming: false,
    acpArgs: [], // codex-acp is ACP by default, no flag needed
    skillsDirs: ['.codex/skills'],
    // Needs the config-writing setup connector: codex routes through Flux's
    // Responses surface via a [model_providers.flux] table in its TOML config.
    fluxCompat: 'setup',
  },
  grok: {
    id: 'grok',
    name: 'Grok Build',
    cliCommand: 'grok',
    // Auth is CLI-owned: `grok login` (grok.com OAuth, SuperGrok subscription).
    // Wayland spawns the binary and it uses its cached credentials.
    authRequired: true,
    enabled: true, // ✅ xAI Grok Build CLI, native ACP v1 via `grok agent stdio` (proven: initialize/session/new/session/prompt)
    supportsStreaming: true, // streams agent_thought_chunk / agent_message_chunk over session/update
    acpArgs: ['agent', 'stdio'],
    skillsDirs: ['.grok/skills'],
    // Talks to xAI's own gateway (grok.com); not Flux-routable.
    fluxCompat: 'vendor',
  },
  qwen: {
    id: 'qwen',
    name: 'Qwen Code',
    cliCommand: 'qwen',
    defaultCliPath: 'npx @qwen-code/qwen-code',
    authRequired: true,
    enabled: true, // ✅ Verified: Qwen CLI v0.0.10+ supports --acp
    supportsStreaming: true,
    acpArgs: ['--acp'], // Use --acp instead of deprecated --experimental-acp
    skillsDirs: ['.qwen/skills'],
    fluxCompat: 'env',
  },
  codebuddy: {
    id: 'codebuddy',
    name: 'CodeBuddy',
    cliCommand: 'codebuddy',
    defaultCliPath: `npx ${CODEBUDDY_ACP_NPX_PACKAGE}`,
    authRequired: true,
    enabled: true, // ✅ Tencent CodeBuddy Code CLI, launched via `codebuddy --acp`
    supportsStreaming: false,
    acpArgs: ['--acp'], // codebuddy uses the --acp flag
    skillsDirs: ['.codebuddy/skills'],
  },
  goose: {
    id: 'goose',
    name: 'Goose',
    cliCommand: 'goose',
    authRequired: false,
    enabled: true, // ✅ Block's Goose CLI, launched via `goose acp`
    supportsStreaming: false,
    acpArgs: ['acp'], // goose uses a subcommand rather than a flag
    skillsDirs: ['.goose/skills'],
    fluxCompat: 'env',
  },
  auggie: {
    id: 'auggie',
    name: 'Augment Code',
    cliCommand: 'auggie',
    authRequired: false,
    enabled: true, // ✅ Augment Code CLI, launched via `auggie --acp`
    supportsStreaming: false,
    acpArgs: ['--acp'], // auggie uses the --acp flag
    fluxCompat: 'vendor',
  },
  kimi: {
    id: 'kimi',
    name: 'Kimi CLI',
    cliCommand: 'kimi',
    authRequired: false,
    enabled: true, // ✅ Kimi CLI (Moonshot), launched via `kimi acp`
    supportsStreaming: false,
    acpArgs: ['acp'], // kimi uses the acp subcommand
    skillsDirs: ['.kimi/skills'],
  },
  opencode: {
    id: 'opencode',
    name: 'OpenCode',
    cliCommand: 'opencode',
    authRequired: false,
    enabled: true, // ✅ OpenCode CLI, launched via `opencode acp`
    supportsStreaming: false,
    acpArgs: ['acp'], // opencode uses the acp subcommand
    skillsDirs: ['.opencode/skills'],
    fluxCompat: 'setup',
  },
  droid: {
    id: 'droid',
    name: 'Factory Droid',
    cliCommand: 'droid',
    // Droid uses FACTORY_API_KEY from environment, not an interactive auth flow.
    authRequired: false,
    enabled: true, // ✅ Factory docs: `droid exec --output-format acp` (JetBrains/Zed ACP integration)
    supportsStreaming: false,
    acpArgs: ['exec', '--output-format', 'acp'],
    skillsDirs: ['.factory/skills'],
    fluxCompat: 'vendor',
  },
  copilot: {
    id: 'copilot',
    name: 'GitHub Copilot',
    cliCommand: 'copilot',
    authRequired: false,
    enabled: true, // ✅ GitHub Copilot CLI, launched via `copilot --acp --stdio`
    supportsStreaming: false,
    acpArgs: ['--acp', '--stdio'], // copilot uses --acp --stdio to start ACP mode
    fluxCompat: 'vendor',
  },
  qoder: {
    id: 'qoder',
    name: 'Qoder CLI',
    cliCommand: 'qodercli',
    authRequired: false,
    enabled: true, // ✅ Qoder CLI, launched via `qodercli --acp`
    supportsStreaming: false,
    acpArgs: ['--acp'], // qoder uses the --acp flag
    fluxCompat: 'setup',
  },
  vibe: {
    id: 'vibe',
    name: 'Mistral Vibe',
    cliCommand: 'vibe-acp',
    authRequired: false,
    enabled: true, // ✅ Mistral Vibe CLI, launched via `vibe-acp`
    supportsStreaming: false,
    acpArgs: [],
    skillsDirs: ['.vibe/skills'],
    fluxCompat: 'vendor',
  },
  cursor: {
    id: 'cursor',
    name: 'Cursor Agent',
    // Note: Cursor CLI uses the generic command name "agent". Detection relies on `which agent`
    // which may match other tools. Users should ensure the Cursor CLI is the `agent` on their PATH.
    cliCommand: 'agent',
    authRequired: true, // Requires active Cursor subscription
    enabled: true, // ✅ Cursor AI Agent CLI, launched via `agent acp`
    supportsStreaming: false,
    acpArgs: ['acp'], // Cursor uses `agent acp` subcommand
    skillsDirs: ['.cursor/skills'],
    fluxCompat: 'vendor',
  },
  kiro: {
    id: 'kiro',
    name: 'Kiro',
    cliCommand: 'kiro-cli',
    authRequired: true, // Requires Kiro / AWS Builder ID login
    enabled: true, // ✅ Kiro CLI, launched via `kiro-cli acp`
    supportsStreaming: false,
    acpArgs: ['acp'], // Kiro uses `kiro-cli acp` subcommand
    fluxCompat: 'vendor',
  },
  hermes: {
    id: 'hermes',
    name: 'Hermes Agent',
    description: 'AI agent by Nous Research with 90+ tools, persistent memory, and multi-platform support',
    cliCommand: 'hermes',
    authRequired: true,
    enabled: true, // ✅ Nous Research Hermes Agent, launched via `hermes acp`
    supportsStreaming: false,
    acpArgs: ['acp'], // hermes uses the acp subcommand
    fluxCompat: 'setup',
  },
  snow: {
    id: 'snow',
    name: 'Snow CLI',
    cliCommand: 'snow',
    authRequired: false,
    enabled: true,
    supportsStreaming: false,
    acpArgs: ['--acp'],
  },
  custom: {
    id: 'custom',
    name: 'Custom Agent',
    cliCommand: undefined, // User-configured via settings
    authRequired: false,
    enabled: true,
    supportsStreaming: false,
  },
};

// Enabled backends only
export const ACP_ENABLED_BACKENDS: Record<string, AcpBackendConfig> = Object.fromEntries(
  Object.entries(ACP_BACKENDS_ALL).filter(([_, config]) => config.enabled)
);

// Currently enabled backend types
export type AcpBackend = keyof typeof ACP_BACKENDS_ALL;
/**
 * Skill directories for non-ACP agents (DetectedAgentKind not in ACP_BACKENDS_ALL).
 * These agents have their own execution engines but still support native skill discovery.
 */
// The wayland-core engine's project-level skill discovery walks for
// `.wayland-core/skills/` (see engine crates/wcore-skills/src/paths.rs:46).
const NON_ACP_SKILLS_DIRS: Record<string, string[]> = {
  gemini: ['.gemini/skills'],
  wcore: ['.wayland-core/skills'],
};

/**
 * Check if a given agent type/backend supports native skill discovery.
 * When false, callers should fallback to prompt injection for skills.
 */
export function hasNativeSkillSupport(agentTypeOrBackend: string | undefined): boolean {
  if (!agentTypeOrBackend) return false;
  const acpConfig = ACP_BACKENDS_ALL[agentTypeOrBackend as AcpBackendAll];
  if (acpConfig?.skillsDirs?.length) return true;
  return !!NON_ACP_SKILLS_DIRS[agentTypeOrBackend]?.length;
}

/**
 * Get native skill directories for a given backend.
 * Returns undefined if the backend does not support native skill discovery.
 */
export function getSkillsDirsForBackend(agentTypeOrBackend: string | undefined): string[] | undefined {
  if (!agentTypeOrBackend) return undefined;
  return ACP_BACKENDS_ALL[agentTypeOrBackend as AcpBackendAll]?.skillsDirs ?? NON_ACP_SKILLS_DIRS[agentTypeOrBackend];
}

/**
 * Flux compatibility for non-ACP agents (handled outside ACP_BACKENDS_ALL).
 * wcore and gemini route through Flux via env injection (ready now).
 */
const NON_ACP_FLUX_COMPAT: Record<string, AcpBackendConfig['fluxCompat']> = {
  wcore: 'env',
  gemini: 'env',
};

/**
 * Resolve the Flux compatibility for any backend id (ACP or non-ACP).
 * Single source of truth for the Agents-page Flux status chip.
 * Returns undefined when no Flux compatibility is classified (no chip shown).
 */
export function getFluxCompat(agentTypeOrBackend: string | undefined): AcpBackendConfig['fluxCompat'] {
  if (!agentTypeOrBackend) return undefined;
  return ACP_BACKENDS_ALL[agentTypeOrBackend as AcpBackendAll]?.fluxCompat ?? NON_ACP_FLUX_COMPAT[agentTypeOrBackend];
}

// ACP Error Type System - structured error handling
export enum AcpErrorType {
  CONNECTION_NOT_READY = 'CONNECTION_NOT_READY',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  AGENT_ERROR = 'AGENT_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  // Granular ACP protocol errors
  ACP_PARSE_ERROR = 'ACP_PARSE_ERROR',
  INVALID_ACP_REQUEST = 'INVALID_ACP_REQUEST',
  ACP_METHOD_NOT_FOUND = 'ACP_METHOD_NOT_FOUND',
  ACP_INVALID_PARAMS = 'ACP_INVALID_PARAMS',
  AGENT_INTERNAL_ERROR = 'AGENT_INTERNAL_ERROR',
  ACP_SESSION_NOT_FOUND = 'ACP_SESSION_NOT_FOUND',
  AGENT_SESSION_NOT_FOUND = 'AGENT_SESSION_NOT_FOUND',
  ACP_ELICITATION_REQUIRED = 'ACP_ELICITATION_REQUIRED',
  ACP_REQ_CANCELLED = 'ACP_REQ_CANCELLED',
  UNKNOWN = 'UNKNOWN',
}

export interface AcpError {
  type: AcpErrorType;
  code: string;
  message: string;
  retryable: boolean;
  details?: unknown;
}

// ACP Result Type - type-safe result handling
export type AcpResult<T = unknown> = { success: true; data: T } | { success: false; error: AcpError };

// Helper function to create ACP errors
export function createAcpError(
  type: AcpErrorType,
  message: string,
  retryable: boolean = false,
  details?: unknown
): AcpError {
  return {
    type,
    code: type.toString(),
    message,
    retryable,
    details,
  };
}

export function isRetryableError(error: AcpError): boolean {
  return error.retryable || error.type === AcpErrorType.CONNECTION_NOT_READY;
}

// ACP JSON-RPC Protocol Types
export const JSONRPC_VERSION = '2.0' as const;

export interface AcpRequest {
  jsonrpc: typeof JSONRPC_VERSION;
  id: number;
  method: string;
  params?: Record<string, unknown> | unknown[];
}

export interface AcpResponse {
  jsonrpc: typeof JSONRPC_VERSION;
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

export interface AcpNotification {
  jsonrpc: typeof JSONRPC_VERSION;
  method: string;
  params?: Record<string, unknown> | unknown[];
}

// ── Initialize response types (from ACP spec) ──────────────────────────

/**
 * Prompt content types the agent can accept.
 * Per ACP spec, omitted fields default to false.
 */
export type AcpPromptCapabilities = {
  image: boolean;
  audio: boolean;
  embeddedContext: boolean;
};

/**
 * MCP transport types the agent supports.
 * stdio is mandatory per ACP spec IF the agent declares mcpCapabilities at all.
 * If mcpCapabilities is absent from the initialize response, all transports are false.
 */
export type AcpMcpCapabilities = {
  stdio: boolean;
  http: boolean;
  sse: boolean;
};

/**
 * Session operations the agent supports.
 * Per ACP spec, key presence (e.g. `{ fork: {} }`) indicates support;
 * values are `{}` reserved for future extension.
 * null = unsupported (key was omitted in the response).
 */
export type AcpSessionCapabilities = {
  fork: Record<string, unknown> | null;
  resume: Record<string, unknown> | null;
  list: Record<string, unknown> | null;
  close: Record<string, unknown> | null;
};

/**
 * Parsed agent capabilities from the initialize response.
 * Field names match the ACP protocol wire format to avoid confusion.
 * All fields have safe defaults - no undefined checks needed by callers.
 */
export type AcpAgentCapabilities = {
  loadSession: boolean;
  promptCapabilities: AcpPromptCapabilities;
  mcpCapabilities: AcpMcpCapabilities;
  sessionCapabilities: AcpSessionCapabilities;
  /** Backend-specific metadata (_meta from agentCapabilities) */
  _meta: Record<string, unknown>;
};

/** Agent identity info from initialize response. */
export type AcpAgentInfo = {
  name: string;
  version: string;
  title?: string;
};

/**
 * Authentication method descriptor from initialize response.
 * Backends may extend this with extra fields (e.g. `type`, `vars`).
 */
export type AcpAuthMethod = {
  id: string;
  name: string;
  description?: string;
  /** Extended fields - e.g. Codex uses `type: "env_var"` and `vars` */
  [key: string]: unknown;
};

/**
 * Fully parsed initialize response (the `result` from JSON-RPC).
 * Consolidates all top-level fields per ACP initialization spec.
 */
export type AcpInitializeResult = {
  protocolVersion: number;
  capabilities: AcpAgentCapabilities;
  agentInfo: AcpAgentInfo | null;
  authMethods: AcpAuthMethod[];
  /**
   * Top-level modes advertised at initialize time (e.g. qwen-code returns
   * availableModes here rather than on session/new).
   */
  modes: AcpSessionModes | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function toBool(v: unknown): boolean {
  return v === true;
}

function parseAgentCapabilitiesObject(raw: unknown): AcpAgentCapabilities {
  const caps = isRecord(raw) ? raw : null;

  const prompt = caps && isRecord(caps.promptCapabilities) ? caps.promptCapabilities : null;
  const mcp = caps && isRecord(caps.mcpCapabilities) ? caps.mcpCapabilities : null;
  const session = caps && isRecord(caps.sessionCapabilities) ? caps.sessionCapabilities : null;
  const meta = caps && isRecord(caps._meta) ? (caps._meta as Record<string, unknown>) : {};

  return {
    loadSession: toBool(caps?.loadSession),
    promptCapabilities: {
      image: toBool(prompt?.image),
      audio: toBool(prompt?.audio),
      embeddedContext: toBool(prompt?.embeddedContext),
    },
    mcpCapabilities: {
      // stdio is mandatory per ACP spec - but only if the agent declares mcpCapabilities at all.
      // If mcpCapabilities is entirely absent, the agent does not support MCP.
      stdio: mcp !== null,
      http: toBool(mcp?.http),
      sse: toBool(mcp?.sse),
    },
    sessionCapabilities: {
      fork: isRecord(session?.fork) ? (session.fork as Record<string, unknown>) : null,
      resume: isRecord(session?.resume) ? (session.resume as Record<string, unknown>) : null,
      list: isRecord(session?.list) ? (session.list as Record<string, unknown>) : null,
      close: isRecord(session?.close) ? (session.close as Record<string, unknown>) : null,
    },
    _meta: meta,
  };
}

function parseAgentInfo(raw: unknown): AcpAgentInfo | null {
  if (!isRecord(raw)) return null;
  const name = typeof raw.name === 'string' ? raw.name : '';
  const version = typeof raw.version === 'string' ? raw.version : '';
  if (!name && !version) return null;
  return {
    name,
    version,
    ...(typeof raw.title === 'string' && { title: raw.title }),
  };
}

function parseAuthMethods(raw: unknown): AcpAuthMethod[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is AcpAuthMethod => isRecord(item) && typeof item.id === 'string' && typeof item.name === 'string'
  );
}

function parseSessionModes(raw: unknown): AcpSessionModes | null {
  if (!isRecord(raw)) return null;
  const availableRaw = raw.availableModes;
  if (!Array.isArray(availableRaw)) return null;
  const availableModes: AcpAvailableMode[] = availableRaw.flatMap((item) => {
    if (!isRecord(item) || typeof item.id !== 'string') return [];
    return [
      {
        id: item.id,
        ...(typeof item.name === 'string' && { name: item.name }),
        ...(typeof item.description === 'string' && { description: item.description }),
      },
    ];
  });
  if (availableModes.length === 0) return null;
  return {
    ...(typeof raw.currentModeId === 'string' && { currentModeId: raw.currentModeId }),
    availableModes,
  };
}

/**
 * Parse the raw initialize result (unwrapped from JSON-RPC `result` field)
 * into a fully structured AcpInitializeResult.
 *
 * Follows ACP spec: omitted capabilities are treated as unsupported (false).
 */
export function parseInitializeResult(raw: unknown): AcpInitializeResult {
  const result = isRecord(raw) ? raw : null;

  return {
    protocolVersion: typeof result?.protocolVersion === 'number' ? result.protocolVersion : 0,
    capabilities: parseAgentCapabilitiesObject(result?.agentCapabilities),
    agentInfo: parseAgentInfo(result?.agentInfo),
    authMethods: parseAuthMethods(result?.authMethods),
    modes: parseSessionModes(result?.modes),
  };
}

/**
 * Parse raw initialize result into structured AcpAgentCapabilities only.
 * Convenience wrapper - use parseInitializeResult() for full response.
 */
export function parseAgentCapabilities(raw: unknown): AcpAgentCapabilities {
  const result = isRecord(raw) ? raw : null;
  return parseAgentCapabilitiesObject(result?.agentCapabilities);
}

// Base interface for all session updates
export interface BaseSessionUpdate {
  sessionId: string;
}

// Agent message chunk update
export interface AgentMessageChunkUpdate extends BaseSessionUpdate {
  update: {
    sessionUpdate: 'agent_message_chunk';
    content: {
      type: 'text' | 'image';
      text?: string;
      data?: string;
      mimeType?: string;
      uri?: string;
    };
  };
}

// Agent thought chunk update
export interface AgentThoughtChunkUpdate extends BaseSessionUpdate {
  update: {
    sessionUpdate: 'agent_thought_chunk';
    content: {
      type: 'text';
      text: string;
    };
  };
}

// ===== Shared sub-types =====

/** Tool call content item type */
export interface ToolCallContentItem {
  type: 'content' | 'diff';
  content?: {
    type: 'text';
    text: string;
  };
  path?: string;
  oldText?: string | null;
  newText?: string;
}

/** Tool call location item type */
export interface ToolCallLocationItem {
  path: string;
}

// Tool call update
export interface ToolCallUpdate extends BaseSessionUpdate {
  update: {
    sessionUpdate: 'tool_call';
    toolCallId: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    title: string;
    kind: 'read' | 'edit' | 'execute';
    rawInput?: Record<string, unknown>;
    content?: ToolCallContentItem[];
    locations?: ToolCallLocationItem[];
  };
}

// Tool call update (status change)
export interface ToolCallUpdateStatus extends BaseSessionUpdate {
  update: {
    sessionUpdate: 'tool_call_update';
    toolCallId: string;
    status: 'completed' | 'failed';
    // rawInput may arrive in tool_call_update with complete data (after streaming completes)
    // This happens when input_json_delta finishes and the full input is available
    rawInput?: Record<string, unknown>;
    content?: Array<{
      type: 'content';
      content: {
        type: 'text';
        text: string;
      };
    }>;
  };
}

// Plan update
export interface PlanUpdate extends BaseSessionUpdate {
  update: {
    sessionUpdate: 'plan';
    entries: Array<{
      content: string;
      status: 'pending' | 'in_progress' | 'completed';
      priority?: 'low' | 'medium' | 'high';
    }>;
  };
}

// Available commands update
export interface AvailableCommandsUpdate extends BaseSessionUpdate {
  update: {
    sessionUpdate: 'available_commands_update';
    availableCommands: Array<{
      name: string;
      description: string;
      input?: {
        hint?: string;
      } | null;
    }>;
  };
}

// User message chunk update
export interface UserMessageChunkUpdate extends BaseSessionUpdate {
  update: {
    sessionUpdate: 'user_message_chunk';
    content: {
      type: 'text' | 'image';
      text?: string;
      data?: string;
      mimeType?: string;
      uri?: string;
    };
  };
}

// ===== ACP ConfigOption types (stable API) =====

/** A single select option within a config option */
export interface AcpConfigSelectOption {
  value: string;
  name?: string;
  label?: string; // Some agents may use label instead of name
}

/** A configuration option returned by session/new */
export interface AcpSessionConfigOption {
  id: string;
  name?: string;
  label?: string; // Some agents may use label instead of name
  description?: string;
  category?: string;
  type: 'select' | 'boolean' | 'string';
  currentValue?: string;
  selectedValue?: string; // Some agents may use selectedValue instead of currentValue
  options?: AcpConfigSelectOption[];
}

/** Config options update notification (within session/update) */
export interface ConfigOptionsUpdatePayload extends BaseSessionUpdate {
  update: {
    sessionUpdate: 'config_option_update';
    configOptions: AcpSessionConfigOption[];
  };
}

/** Usage update notification from ACP backend (context window utilization, supported by claude-agent-acp and codex-acp) */
export interface UsageUpdatePayload extends BaseSessionUpdate {
  update: {
    sessionUpdate: 'usage_update';
    /** Total tokens currently in context */
    used: number;
    /** Context window capacity (max tokens) */
    size: number;
    /** Cumulative session cost */
    cost?: {
      amount: number;
      currency: string;
    };
  };
}

/** Per-turn token usage from PromptResponse (unstable ACP spec, supported by codex-acp) */
export interface AcpPromptResponseUsage {
  /** Total input tokens (includes context from previous turns) */
  inputTokens: number;
  /** Total output tokens for this turn */
  outputTokens: number;
  /** Sum of all token types */
  totalTokens: number;
  /** Tokens read from cache */
  cachedReadTokens?: number | null;
  /** Tokens written to cache */
  cachedWriteTokens?: number | null;
  /** Reasoning/thinking tokens */
  thoughtTokens?: number | null;
}

// ===== ACP Models types (unstable API) =====

/** An available model returned by session/new (unstable API) */
export interface AcpAvailableModel {
  id?: string;
  modelId?: string; // OpenCode uses modelId instead of id
  name?: string;
}

/** Models info returned by session/new (unstable API) */
export interface AcpSessionModels {
  currentModelId?: string;
  availableModels?: AcpAvailableModel[];
}

/** Mode entry in the top-level `modes` object of session/new response */
export interface AcpAvailableMode {
  id: string;
  name?: string;
  description?: string;
}

/** Modes info returned by session/new (used by qoder, opencode, etc.) */
export interface AcpSessionModes {
  currentModeId?: string;
  availableModes?: AcpAvailableMode[];
}

// ===== Unified model info for UI =====

/** Unified model info that abstracts over both stable and unstable APIs */
export type AcpModelInfoSourceDetail =
  | 'cc-switch'
  | 'acp-config-option'
  | 'acp-models'
  | 'persisted-model'
  | 'codex-stream'
  | 'claude-slots';

export interface AcpModelInfo {
  /** Currently active model ID */
  currentModelId: string | null;
  /** Display label for the current model */
  currentModelLabel: string | null;
  /** Available models for switching */
  availableModels: Array<{ id: string; label: string }>;
  /** Whether the user can switch models */
  canSwitch: boolean;
  /** Source of the model info: 'configOption' (stable) or 'models' (unstable) */
  source: 'configOption' | 'models';
  /** More specific source detail for UI diagnostics */
  sourceDetail?: AcpModelInfoSourceDetail;
  /** Config option ID (only when source is 'configOption') */
  configOptionId?: string;
}

// Union type for all session updates
export type AcpSessionUpdate =
  | AgentMessageChunkUpdate
  | AgentThoughtChunkUpdate
  | ToolCallUpdate
  | ToolCallUpdateStatus
  | PlanUpdate
  | AvailableCommandsUpdate
  | UserMessageChunkUpdate
  | ConfigOptionsUpdatePayload
  | UsageUpdatePayload;

// ACP permission request interface
export interface AcpPermissionOption {
  optionId: string;
  name: string;
  kind: 'allow_once' | 'allow_always' | 'reject_once' | 'reject_always';
}
export interface AcpPermissionRequest {
  sessionId: string;
  options: Array<AcpPermissionOption>;
  toolCall: {
    toolCallId: string;
    rawInput?: {
      command?: string;
      description?: string;
      [key: string]: unknown;
    };
    status?: string;
    title?: string;
    kind?: string;
    content?: ToolCallContentItem[];
    locations?: ToolCallLocationItem[];
  };
}

// Legacy compatibility type - supports old version data structures
export interface LegacyAcpPermissionData extends Record<string, unknown> {
  // Possible old version fields
  options?: Array<{
    optionId?: string;
    name?: string;
    kind?: string;
    // Compatible with other possible fields
    [key: string]: unknown;
  }>;
  toolCall?: {
    toolCallId?: string;
    rawInput?: unknown;
    title?: string;
    kind?: string;
    // Compatible with other possible fields
    [key: string]: unknown;
  };
}

// Compatibility union type
export type CompatibleAcpPermissionData = AcpPermissionRequest | LegacyAcpPermissionData;

export type AcpMessage = AcpRequest | AcpNotification | AcpResponse | AcpSessionUpdate;

// File Operation Request Types
export interface AcpFileWriteRequest extends AcpRequest {
  method: 'fs/write_text_file';
  params: {
    sessionId: string;
    path: string;
    content: string;
  };
}

export interface AcpFileReadRequest extends AcpRequest {
  method: 'fs/read_text_file';
  params: {
    sessionId: string;
    path: string;
  };
}

// ===== ACP Protocol Method Constants =====
// These constants define the method names used in the ACP protocol.
// Source: Existing code implementation (no official protocol docs, sync changes if updated).

export const ACP_METHODS = {
  SESSION_UPDATE: 'session/update',
  REQUEST_PERMISSION: 'session/request_permission',
  READ_TEXT_FILE: 'fs/read_text_file',
  WRITE_TEXT_FILE: 'fs/write_text_file',
  SET_CONFIG_OPTION: 'session/set_config_option',
} as const;

export type AcpMethod = (typeof ACP_METHODS)[keyof typeof ACP_METHODS];

// ===== Discriminated Union Types =====
// Used for type-safe dispatching in AcpConnection.handleIncomingRequest

/** Session update notification */
export interface AcpSessionUpdateNotification {
  jsonrpc: typeof JSONRPC_VERSION;
  method: typeof ACP_METHODS.SESSION_UPDATE;
  params: AcpSessionUpdate;
}

/** Permission request message */
export interface AcpPermissionRequestMessage {
  jsonrpc: typeof JSONRPC_VERSION;
  id: number;
  method: typeof ACP_METHODS.REQUEST_PERMISSION;
  params: AcpPermissionRequest;
}

/** File read request (with typed params) */
export interface AcpFileReadMessage {
  jsonrpc: typeof JSONRPC_VERSION;
  id: number;
  method: typeof ACP_METHODS.READ_TEXT_FILE;
  params: {
    path: string;
    sessionId?: string;
  };
}

/** File write request (with typed params) */
export interface AcpFileWriteMessage {
  jsonrpc: typeof JSONRPC_VERSION;
  id: number;
  method: typeof ACP_METHODS.WRITE_TEXT_FILE;
  params: {
    path: string;
    content: string;
    sessionId?: string;
  };
}

/**
 * ACP incoming message union type.
 * TypeScript can automatically narrow the type based on the method field.
 */
export type AcpIncomingMessage =
  | AcpSessionUpdateNotification
  | AcpPermissionRequestMessage
  | AcpFileReadMessage
  | AcpFileWriteMessage;
