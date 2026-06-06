/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AcpBackend, AcpBackendAll, AcpBackendConfig } from '@/common/types/acpTypes';
import type { SpeechToTextConfig } from '@/common/types/speech';
import type { TextToSpeechConfig } from '@/common/types/ttsTypes';
// C1: route through wrapped buildStorage so every namespace's storage.{get,set,clear,remove}
// wire key is recorded in the bridge allowlist. The raw `storage.buildStorage` from
// @office-ai/platform bypasses the allowlist and causes "Bridge event not allowed"
// rejections at runtime for every config/storage read.
import { buildStorage } from '@/common/adapter/bridgeAllowlist';

/**
 * @description Chat-related storage
 */
export const ChatStorage = buildStorage<IChatConversationRefer>('agent.chat');

// Chat message storage
export const ChatMessageStorage = buildStorage('agent.chat.message');

// System configuration storage
export const ConfigStorage = buildStorage<IConfigStorageRefer>('agent.config');

// System environment variable storage
export const EnvStorage = buildStorage<IEnvStorageRefer>('agent.env');

export interface IConfigStorageRefer {
  'gemini.config': {
    authType: string;
    proxy: string;
    GOOGLE_GEMINI_BASE_URL?: string;
    /** @deprecated Use accountProjects instead. Kept for backward compatibility migration. */
    GOOGLE_CLOUD_PROJECT?: string;
    /** GCP project IDs stored per Google account */
    accountProjects?: Record<string, string>;
    yoloMode?: boolean;
    /** Preferred session mode for new conversations */
    preferredMode?: string;
    /** Preferred model ID for new conversations */
    preferredModelId?: string;
  };
  'codex.config'?: {
    cliPath?: string;
    yoloMode?: boolean;
    sandboxMode?: 'read-only' | 'workspace-write' | 'danger-full-access';
  };
  'acp.config': {
    [backend in AcpBackend]?: {
      authMethodId?: string;
      authToken?: string;
      lastAuthTime?: number;
      cliPath?: string;
      yoloMode?: boolean;
      /** Preferred session mode for new conversations */
      preferredMode?: string;
      /** Preferred model ID for new conversations */
      preferredModelId?: string;
      /** LLM prompt timeout in seconds (default: 300) */
      promptTimeout?: number;
    };
  };
  /** Global LLM prompt timeout in seconds (default: 300). Per-backend promptTimeout overrides this. */
  'acp.promptTimeout'?: number;
  /** Idle timeout in minutes before an ACP agent process is killed to reclaim memory (default: 5). */
  'acp.agentIdleTimeout'?: number;
  /** User-defined custom ACP agents (isPreset !== true, require defaultCliPath). */
  'acp.customAgents'?: AcpBackendConfig[];
  /** Preset assistant configurations (isPreset === true, prompt-only, no CLI). */
  assistants?: AcpBackendConfig[];
  /**
   * Per-assistant execution-backend overrides keyed by assistant id. Used for
   * vendored/extension-contributed specialists (ext-*) that have no persisted
   * record in `assistants` or `acp.customAgents` to mutate directly. The custom
   * agents loader applies these on read so the chosen backend survives reloads.
   */
  'assistant.presetAgentTypeOverrides'?: Record<string, string>;
  // Cached initialize results per ACP backend (persisted across sessions)
  'acp.cachedInitializeResult'?: Record<string, import('@/common/types/acpTypes').AcpInitializeResult>;
  // Cached model lists per ACP backend for Guid page pre-selection
  'acp.cachedModels'?: Record<string, import('@/common/types/acpTypes').AcpModelInfo>;
  // Cached config options per ACP backend for Guid page pre-selection
  'acp.cachedConfigOptions'?: Record<string, import('@/common/types/acpTypes').AcpSessionConfigOption[]>;
  // Cached modes per ACP backend for Guid page / AgentModeSelector
  'acp.cachedModes'?: Record<string, import('@/common/types/acpTypes').AcpSessionModes>;
  'model.config': IProvider[];
  'mcp.config': IMcpServer[];
  'mcp.agentInstallStatus': Record<string, string[]>;
  language: string;
  theme: string;
  colorScheme: string;
  /** First-run onboarding overlay completion flag. Once true, the overlay never shows again. */
  onboardingCompleted?: boolean;
  /** Focus personas the user picked in onboarding (e.g. ['content','sales']). Seeds the launchpad + recommended teams/workflows. */
  'onboarding.focusArea'?: string[];
  /** Freeform one-line work/business description from onboarding, so assistants know the user's world. */
  'onboarding.workDescription'?: string;
  /** User's preferred display name for the new-chat greeting. Empty = use the OS account name. */
  'user.displayName'?: string;
  /**
   * v0.4.7 - Install-scoped UUID generated on first launch. Seeds the
   * Kickoff SuggestionEngine's per-day deterministic shuffle so fresh
   * installs don't all collapse to the same suggestion on day 1.
   */
  'app.installUuid'?: string;
  /**
   * v0.6.3 - When true, ijfwSystemService.bootstrap() short-circuits and
   * never spawns `npx @ijfw/install`. Wave 6 wires the Settings toggle.
   */
  'ijfw.skipSetup'?: boolean;
  /** Persisted app-wide UI zoom factor for Display settings */
  'ui.zoomFactor'?: number;
  /** Auto-enable WebUI in desktop mode */
  'webui.desktop.enabled'?: boolean;
  /** Allow remote access in desktop mode */
  'webui.desktop.allowRemote'?: boolean;
  /** WebUI port in desktop mode */
  'webui.desktop.port'?: number;
  customCss: string; // Custom CSS styles
  'css.themes': ICssTheme[]; // Custom CSS themes list
  'css.activeThemeId': string; // Currently active theme ID
  'gemini.defaultModel': string | { id: string; useModel: string };
  'wcore.config'?: {
    /** Preferred session mode for new conversations */
    preferredMode?: string;
  };
  'wcore.defaultModel'?: { id: string; useModel: string };
  /**
   * User-pinned models for the composer model picker, as `providerId:modelId`
   * keys. Surfaced in a dedicated "Pinned" zone at the top of the picker so a
   * subset of a large catalog (e.g. Flux Router's many models) stays one click
   * away. A UI preference, not provider state, so it lives in config not the DB.
   */
  pinnedModels?: string[];
  'tools.imageGenerationModel': TProviderWithModel & {
    /** @deprecated Image generation is now controlled via built-in MCP server toggle */
    switch?: boolean;
  };
  'tools.speechToText'?: SpeechToTextConfig;
  'tools.textToSpeech'?: TextToSpeechConfig;
  // Per-category notification preferences (master switch lives in system.notificationEnabled via systemSettingsBridge)
  'notifications.agentFinished'?: boolean;
  'notifications.agentError'?: boolean;
  'notifications.channelMessage'?: boolean;
  'notifications.playSound'?: boolean;
  'notifications.quietHours'?: { start: string; end: string };
  // Whether to ask for confirmation when pasting files into the workspace (true = don't ask again)
  'workspace.pasteConfirm'?: boolean;
  // Whether uploaded files are saved to the workspace directory (true = workspace, false = cache directory)
  'upload.saveToWorkspace'?: boolean;
  // Last selected agent type on the guid page
  'guid.lastSelectedAgent'?: string;
  // Migration flag: fix assistant enabled default value issue from older versions
  'migration.assistantEnabledFixed'?: boolean;
  // Migration flag: add default enabled skills for the cowork assistant
  /** @deprecated Use migration.builtinDefaultSkillsAdded_v2 instead */
  'migration.coworkDefaultSkillsAdded'?: boolean;
  // Migration flag: add default enabled skills for all builtin assistants
  'migration.builtinDefaultSkillsAdded_v2'?: boolean;
  // Migration flag: add promptsI18n for all builtin assistants
  'migration.promptsI18nAdded'?: boolean;
  /** Migration flag: split 'assistants' into presets-only + 'acp.customAgents' (user-defined customs). */
  'migration.assistantsSplitCustom'?: boolean;
  /** Migration flag: Electron desktop config has been imported to server config */
  'migration.electronConfigImported'?: boolean;
  /**
   * Migration flag: legacy `model.config` providers have been one-time migrated
   * into the new `model_registry_*` SQLite tables (Packet 3B). Set after a
   * successful run by `runLegacyModelConfigMigration`; subsequent boots skip
   * the translation entirely.
   */
  'migration.legacyModelConfigToRegistry'?: boolean;
  /**
   * Catalog data-version cursor for the polish-pass post-upgrade refresh.
   * Bumped whenever the Curator's eligibility logic or `CatalogModel`'s
   * derived fields (e.g. `tags`) change in a way that requires re-deriving
   * already-persisted rows. On boot, when the stored value is less than the
   * `CATALOG_DATA_VERSION` baked into the build, the model-registry IPC
   * iterates every connected provider and calls `refresh()` once, then bumps
   * the stored value. Absent the cursor is treated as `0`.
   */
  'migration.modelRegistryCatalogDataVersion'?: number;
  /**
   * Epoch-ms timestamp of the last *successful* global model refresh
   * (`refreshAll`). Advanced only when ≥1 provider succeeded - a total-failure
   * round leaves it untouched so the "updated Xh ago" label never lies. Absent
   * before the first successful refresh (rendered as "Never").
   */
  'models.lastRefreshedAt'?: number;
  /**
   * Model ids already surfaced in a "new models" toast. A genuinely-new id is
   * announced once, then recorded here so a subsequent refresh never re-announces
   * the same model.
   */
  'models.announcedModelIds'?: string[];
  /**
   * Master switch for automatic background model refresh (interval + launch).
   * Default `true`. The manual "Refresh models" button always works regardless.
   */
  'models.autoRefresh'?: boolean;
  // Minimize to system tray when closing the window
  'system.closeToTray'?: boolean;
  // First-run flag: set once after applying smart defaults (close-to-tray on, start-on-boot on).
  // Once true, the app never re-applies defaults - user's explicit choices win.
  'system.firstRunDefaultsApplied'?: boolean;
  // One-shot migration flag for the credentials crypto upgrade.
  // Set to true after every plugin's credentials have been re-encrypted from
  // the legacy base64 `b64:` / `plain:` / `enc:` formats into `enc:v1:`
  // Electron-safeStorage ciphertext. See process/utils/credentialMigration.
  'system.credentialsCryptoMigrated_v1'?: boolean;
  // Persisted webhook connection-token records. Hydrated by ChannelManager
  // on startup so URLs survive app restarts. Shape mirrors
  // ConnectionTokenRecord in src/process/channels/webhook/types.ts -
  // declared inline here to keep src/common/config/ free of channel deps.
  'webhook.connectionTokens'?: ReadonlyArray<{
    token: string;
    platform: string;
    pluginInstanceId: string;
    agentId: string;
    createdAt: number;
    lastUsedAt?: number;
    revokedAt?: number;
  }>;
  // Show system notification when a task completes
  'system.notificationEnabled'?: boolean;
  // Show system notification when a scheduled task completes
  'system.cronNotificationEnabled'?: boolean;
  // Prevent system sleep to ensure scheduled tasks run
  'system.keepAwake'?: boolean;
  // Route all agent requests through Flux Router (consent gate; default false until first connect)
  'system.routeThroughFlux'?: boolean;
  // Automatically preview newly created Office files in the current workspace
  'system.autoPreviewOfficeFiles'?: boolean;
  // Telegram assistant default model
  'assistant.telegram.defaultModel'?: {
    id: string;
    useModel: string;
  };
  // Telegram assistant agent selection
  'assistant.telegram.agent'?: {
    backend: string;
    customAgentId?: string;
    name?: string;
  };
  // Lark assistant default model
  'assistant.lark.defaultModel'?: {
    id: string;
    useModel: string;
  };
  // Lark assistant agent selection
  'assistant.lark.agent'?: {
    backend: string;
    customAgentId?: string;
    name?: string;
  };
  // DingTalk assistant default model
  'assistant.dingtalk.defaultModel'?: {
    id: string;
    useModel: string;
  };
  // DingTalk assistant agent selection
  'assistant.dingtalk.agent'?: {
    backend: string;
    customAgentId?: string;
    name?: string;
  };
  // WeChat assistant default model
  'assistant.weixin.defaultModel'?: {
    id: string;
    useModel: string;
  };
  // WeChat assistant agent selection
  'assistant.weixin.agent'?: {
    backend: string;
    customAgentId?: string;
    name?: string;
  };
  // WeCom assistant default model
  'assistant.wecom.defaultModel'?: {
    id: string;
    useModel: string;
  };
  // WeCom assistant agent selection
  'assistant.wecom.agent'?: {
    backend: string;
    customAgentId?: string;
    name?: string;
  };
  // Skills Market: whether the wayland-skills builtin skill is enabled
  'skillsMarket.enabled'?: boolean;
  /**
   * Global skills preference layer.
   *
   * Precedence rules (highest → lowest):
   *   1. `disabled` (global) - a skill listed here is NEVER loaded, even if a
   *      per-assistant `enabledSkills` entry would otherwise include it.
   *   2. `pinned` (global) - skills that are always-on across every assistant
   *      unless overridden by `disabled`.
   *   3. Per-assistant `enabledSkills` / `disabledBuiltinSkills` - scoped to
   *      a single assistant; evaluated after the global layer is applied.
   *
   * `revision` is bumped whenever the preference set is programmatically
   * modified; readers can use it to detect staleness without deep comparison.
   */
  'skills.preferences'?: {
    /** Skills pinned globally (always loaded for every assistant). */
    pinned: string[];
    /** Skills disabled globally (never loaded, overrides per-assistant enables). */
    disabled: string[];
    /** Monotonically increasing version counter. */
    revision: number;
  };
  /** Migration flag: skills.preferences seeded from existing assistant enabledSkills. */
  'migration.skillsPreferences_v1'?: boolean;
  /**
   * Opt-in mirror of locally-installed CLI tool skills (`~/.claude/skills`,
   * `~/.codex/skills`, `~/.gemini/skills`). Default off - surfaces the
   * user's parallel tooling as discoverable on the Skills page filter rail.
   * Requires app restart to take effect (no live re-scan yet).
   */
  'skills.cliDiscovery.enabled'?: boolean;
  // Ambient Mode (M1 skeleton): enable bubble + agent-driven UI flow
  'ambient.enabled'?: boolean;
  /**
   * Ordered list of assistant IDs that compose the user's editable launchpad
   * bar (LaunchpadBar). Absent = first launch, render the QUICK_LAUNCH_ANCHORS
   * defaults. Once the user mutates the bar via drag/add/remove the array is
   * persisted; unknown IDs (e.g. uninstalled extension) are skipped at render.
   */
  'launchpad.barOrder'?: import('@/common/types/launchpad').LaunchpadBarOrder;
  // Ambient Mode: persisted bubble window position (displayId used for multi-monitor recovery)
  'ambient.bubblePosition'?: { x: number; y: number; displayId: number };
}

export interface IEnvStorageRefer {
  'wayland.dir': {
    workDir: string;
    cacheDir: string;
  };
}

/**
 * Conversation source type - identifies where the conversation was created
 */
export type ConversationSource = 'wayland' | 'telegram' | 'lark' | 'dingtalk' | 'weixin' | 'wecom' | (string & {});

interface IChatConversation<T, Extra> {
  createTime: number;
  modifyTime: number;
  name: string;
  desc?: string;
  id: string;
  type: T;
  extra: Extra;
  model: TProviderWithModel;
  status?: 'pending' | 'running' | 'finished' | undefined;
  /** Conversation source, defaults to wayland */
  source?: ConversationSource;
  /** Channel chat isolation ID (e.g. user:xxx, group:xxx) */
  channelChatId?: string;
}

// Token usage statistics data type
export interface TokenUsageData {
  totalTokens: number;
}

export type TChatConversation =
  | IChatConversation<
      'gemini',
      {
        workspace: string;
        customWorkspace?: boolean; // true = user-specified workspace directory, false = system default workspace directory
        webSearchEngine?: 'google' | 'default'; // Search engine configuration
        lastTokenUsage?: TokenUsageData; // Last token usage statistics
        contextFileName?: string;
        contextContent?: string;
        // System rules support
        presetRules?: string; // System rules, injected at initialization
        /** Enabled skills list for filtering SkillManager skills */
        enabledSkills?: string[];
        /** Snapshot of actually loaded skills (persisted on first message) */
        loadedSkills?: Array<{ name: string; description: string }>;
        /** Preset assistant ID for displaying name and avatar in the conversation panel */
        presetAssistantId?: string;
        /** Whether this conversation is pinned */
        pinned?: boolean;
        /** Pin timestamp in milliseconds */
        pinnedAt?: number;
        /** Persisted session mode for resume support */
        sessionMode?: string;
        /** Explicit marker for temporary health-check conversations */
        isHealthCheck?: boolean;
        /** Cron job ID that spawned this conversation */
        cronJobId?: string;
        /** Project ID this conversation belongs to (umbrella scoping). Mirrors cronJobId - read via json_extract(extra,'$.projectId'). */
        projectId?: string;
      }
    >
  | Omit<
      IChatConversation<
        'acp',
        {
          workspace?: string;
          backend: AcpBackend;
          cliPath?: string;
          customWorkspace?: boolean;
          agentName?: string;
          customAgentId?: string; // UUID for identifying specific custom agent
          presetContext?: string; // Preset context/rules from smart assistant
          /** Enabled skills list for filtering SkillManager skills */
          enabledSkills?: string[];
          /** Builtin auto-injected skills to exclude */
          excludeBuiltinSkills?: string[];
          /** Snapshot of actually loaded skills */
          loadedSkills?: Array<{ name: string; description: string }>;
          /** Preset assistant ID for displaying name and avatar in the conversation panel */
          presetAssistantId?: string;
          /** Whether this conversation is pinned */
          pinned?: boolean;
          /** Pin timestamp in milliseconds */
          pinnedAt?: number;
          /** ACP backend session UUID for session resume */
          acpSessionId?: string;
          /** Conversation ID that owns the ACP session */
          acpSessionConversationId?: string;
          /** Last update time of the ACP session */
          acpSessionUpdatedAt?: number;
          /**
           * ACP wrapper version pinned when this session was created
           * (format: `<backend>@<version>`). Used by the self-healing replay path:
           * on conversation reopen, if this differs from the current wrapper version,
           * the resume path is skipped and history is replayed into a fresh session.
           */
          acpWrapperVersion?: string;
          /** Last context usage from usage_update */
          lastTokenUsage?: TokenUsageData;
          /** Context window capacity from usage_update */
          lastContextLimit?: number;
          /** Persisted session mode for resume support */
          sessionMode?: string;
          /** Persisted model ID for resume support */
          currentModelId?: string;
          /** Cached config options from ACP backend */
          cachedConfigOptions?: import('@/common/types/acpTypes').AcpSessionConfigOption[];
          /** Pending config option selections from the Guid page */
          pendingConfigOptions?: Record<string, string>;
          /** Explicit marker for temporary health-check conversations */
          isHealthCheck?: boolean;
          /** Cron job ID that spawned this conversation */
          cronJobId?: string;
          /** Project ID this conversation belongs to (umbrella scoping). Mirrors cronJobId - read via json_extract(extra,'$.projectId'). */
          projectId?: string;
        }
      >,
      'model'
    >
  | Omit<
      IChatConversation<
        'codex',
        {
          workspace?: string;
          cliPath?: string;
          customWorkspace?: boolean;
          sandboxMode?: 'read-only' | 'workspace-write' | 'danger-full-access'; // Codex sandbox permission mode
          presetContext?: string; // Preset context/rules from smart assistant
          /** Enabled skills list for filtering SkillManager skills */
          enabledSkills?: string[];
          /** Snapshot of actually loaded skills */
          loadedSkills?: Array<{ name: string; description: string }>;
          /** Preset assistant ID for displaying name and avatar in the conversation panel */
          presetAssistantId?: string;
          /** Whether this conversation is pinned */
          pinned?: boolean;
          /** Pin timestamp in milliseconds */
          pinnedAt?: number;
          /** Persisted session mode for resume support */
          sessionMode?: string;
          /** User-selected Codex model from the Guid page */
          codexModel?: string;
          /** Explicit marker for temporary health-check conversations */
          isHealthCheck?: boolean;
          /** Cron job ID that spawned this conversation */
          cronJobId?: string;
          /** Project ID this conversation belongs to (umbrella scoping). Mirrors cronJobId - read via json_extract(extra,'$.projectId'). */
          projectId?: string;
        }
      >,
      'model'
    >
  | Omit<
      IChatConversation<
        'openclaw-gateway',
        {
          workspace?: string;
          backend?: AcpBackendAll;
          agentName?: string;
          customWorkspace?: boolean;
          /** Gateway configuration */
          gateway?: {
            host?: string;
            port?: number;
            token?: string;
            password?: string;
            useExternalGateway?: boolean;
            cliPath?: string;
          };
          /** Session key for resume */
          sessionKey?: string;
          /** Runtime validation snapshot used for post-switch strong checks */
          runtimeValidation?: {
            expectedWorkspace?: string;
            expectedBackend?: string;
            expectedAgentName?: string;
            expectedCliPath?: string;
            expectedModel?: string;
            expectedIdentityHash?: string | null;
            switchedAt?: number;
          };
          /** Enabled skills list */
          enabledSkills?: string[];
          /** Snapshot of actually loaded skills */
          loadedSkills?: Array<{ name: string; description: string }>;
          /** Preset assistant ID */
          presetAssistantId?: string;
          /** Whether this conversation is pinned */
          pinned?: boolean;
          /** Pin timestamp in milliseconds */
          pinnedAt?: number;
          /** Explicit marker for temporary health-check conversations */
          isHealthCheck?: boolean;
          /** Cron job ID that spawned this conversation */
          cronJobId?: string;
          /** Project ID this conversation belongs to (umbrella scoping). Mirrors cronJobId - read via json_extract(extra,'$.projectId'). */
          projectId?: string;
        }
      >,
      'model'
    >
  | Omit<
      IChatConversation<
        'nanobot',
        {
          workspace?: string;
          customWorkspace?: boolean;
          /** Enabled skills list */
          enabledSkills?: string[];
          /** Snapshot of actually loaded skills */
          loadedSkills?: Array<{ name: string; description: string }>;
          /** Preset assistant ID */
          presetAssistantId?: string;
          /** Whether this conversation is pinned */
          pinned?: boolean;
          /** Pin timestamp in milliseconds */
          pinnedAt?: number;
          /** Explicit marker for temporary health-check conversations */
          isHealthCheck?: boolean;
          /** Cron job ID that spawned this conversation */
          cronJobId?: string;
          /** Project ID this conversation belongs to (umbrella scoping). Mirrors cronJobId - read via json_extract(extra,'$.projectId'). */
          projectId?: string;
        }
      >,
      'model'
    >
  | Omit<
      IChatConversation<
        'remote',
        {
          workspace?: string;
          customWorkspace?: boolean;
          /** Remote agent config ID (FK to remote_agents table) */
          remoteAgentId: string;
          /** Remote session key for resume */
          sessionKey?: string;
          /** Enabled skills list */
          enabledSkills?: string[];
          /** Snapshot of actually loaded skills */
          loadedSkills?: Array<{ name: string; description: string }>;
          /** Preset assistant ID */
          presetAssistantId?: string;
          /** Whether this conversation is pinned */
          pinned?: boolean;
          /** Pin timestamp in milliseconds */
          pinnedAt?: number;
          /** Explicit marker for temporary health-check conversations */
          isHealthCheck?: boolean;
          /** Cron job ID that spawned this conversation */
          cronJobId?: string;
          /** Project ID this conversation belongs to (umbrella scoping). Mirrors cronJobId - read via json_extract(extra,'$.projectId'). */
          projectId?: string;
        }
      >,
      'model'
    >
  // Wayland-Core engine conversation variant.
  | IChatConversation<
      'wcore',
      {
        workspace: string;
        customWorkspace?: boolean;
        proxy?: string;
        /** System rules injected at initialization */
        presetRules?: string;
        /** Enabled skills list */
        enabledSkills?: string[];
        /** Snapshot of actually loaded skills */
        loadedSkills?: Array<{ name: string; description: string }>;
        /** Preset assistant ID */
        presetAssistantId?: string;
        /** Whether this conversation is pinned */
        pinned?: boolean;
        /** Pin timestamp in milliseconds */
        pinnedAt?: number;
        /** Max tokens per response */
        maxTokens?: number;
        /** Max agentic turns */
        maxTurns?: number;
        /** Persisted session mode for resume support */
        sessionMode?: string;
        /** Explicit marker for temporary health-check conversations */
        isHealthCheck?: boolean;
        /** Last token usage stats */
        lastTokenUsage?: TokenUsageData;
        /** Cron job ID that spawned this conversation */
        cronJobId?: string;
        /** Project ID this conversation belongs to (umbrella scoping). Mirrors cronJobId - read via json_extract(extra,'$.projectId'). */
        projectId?: string;
      }
    >;

export type IChatConversationRefer = {
  'chat.history': TChatConversation[];
};

export type ModelType =
  | 'text' // Text conversation
  | 'vision' // Vision/image understanding
  | 'function_calling' // Tool/function calling
  | 'image_generation' // Image generation
  | 'web_search' // Web search
  | 'reasoning' // Reasoning model
  | 'embedding' // Embedding model
  | 'rerank' // Re-ranking model
  | 'excludeFromPrimary'; // Excluded: not suitable as a primary model

export type ModelCapability = {
  type: ModelType;
  /**
   * Whether the user manually selected this type. If true, the user explicitly enabled it;
   * if false, the user explicitly disabled it; if undefined, the default value applies.
   */
  isUserSelected?: boolean;
};

export interface IProvider {
  id: string;
  platform: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string[];
  /**
   * List of model capability tags. A tag's presence means the capability is supported; absence means it is not.
   */
  capabilities?: ModelCapability[];
  /**
   * Context token limit. Optional - only populate when the value is known with certainty.
   */
  contextLimit?: number;
  /**
   * Per-model protocol overrides. Maps model name to protocol string.
   * Only used when platform is 'new-api'.
   * e.g. { "gemini-2.5-pro": "gemini", "claude-sonnet-4": "anthropic", "gpt-4o": "openai" }
   */
  modelProtocols?: Record<string, string>;
  /**
   * AWS Bedrock specific configuration
   * Only used when platform is 'bedrock'
   */
  bedrockConfig?: {
    authMethod: 'accessKey' | 'profile';
    region: string;
    // For access key method
    accessKeyId?: string;
    secretAccessKey?: string;
    // For profile method
    profile?: string;
  };
  /**
   * Provider enabled state, defaults to true
   */
  enabled?: boolean;
  /**
   * Individual model enabled states, defaults to all true
   */
  modelEnabled?: Record<string, boolean>;
  /**
   * Model health check results (for UI display only, does not affect enabled state)
   */
  modelHealth?: Record<
    string,
    {
      status: 'unknown' | 'healthy' | 'unhealthy';
      lastCheck?: number; // timestamp
      latency?: number; // latency in milliseconds
      error?: string; // error message
    }
  >;
}

export type TProviderWithModel = Omit<IProvider, 'model'> & {
  useModel: string;
};

// MCP Server Configuration Types
export type McpTransportType = 'stdio' | 'sse' | 'http';

export interface IMcpServerTransportStdio {
  type: 'stdio';
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface IMcpServerTransportSSE {
  type: 'sse';
  url: string;
  headers?: Record<string, string>;
}

export interface IMcpServerTransportHTTP {
  type: 'http';
  url: string;
  headers?: Record<string, string>;
}

export interface IMcpServerTransportStreamableHTTP {
  type: 'streamable_http';
  url: string;
  headers?: Record<string, string>;
}

export type IMcpServerTransport =
  | IMcpServerTransportStdio
  | IMcpServerTransportSSE
  | IMcpServerTransportHTTP
  | IMcpServerTransportStreamableHTTP;

/**
 * MCP server provenance. Used by the MCP Library UI to group servers into
 * "From Library" (installed via the in-app catalog) vs "Custom" (added by
 * the user before the library existed, or via the Add Custom flow).
 */
export type McpServerSource = 'library' | 'custom';

export interface IMcpServer {
  id: string;
  name: string;
  description?: string;
  enabled: boolean; // Whether it is installed to CLI agents (controls the Switch state)
  transport: IMcpServerTransport;
  tools?: IMcpTool[];
  status?: 'connected' | 'disconnected' | 'error' | 'testing'; // Connection status (also indicates service availability)
  lastConnected?: number;
  createdAt: number;
  updatedAt: number;
  originalJson: string; // Stores the raw JSON config for accurate display when editing
  /** Built-in MCP server managed by Wayland (hide edit/delete in UI) */
  builtin?: boolean;
  /** Provenance - 'library' for catalog installs, 'custom' for hand-added servers. */
  source?: McpServerSource;
  /** Catalog entry id if this server was installed from the MCP Library. */
  libraryEntryId?: string;
  /**
   * User-supplied OAuth client credentials for vendors that don't support
   * Dynamic Client Registration (Slack, GitHub, HubSpot, Zoom, Box, Figma…).
   * When present, the OAuth flow skips DCR and uses these credentials
   * directly. The user must have registered an OAuth app on the vendor's
   * developer console with the redirect URI set to
   * http://localhost:57000/oauth/callback.
   */
  byoOAuth?: IByoOAuthCredentials;
}

export interface IByoOAuthCredentials {
  clientId: string;
  /** Optional - public clients with PKCE don't need a secret. */
  clientSecret?: string;
}

/** Stable ID for the built-in image generation MCP server */
export const BUILTIN_IMAGE_GEN_ID = 'builtin-image-gen';

export interface IMcpTool {
  name: string;
  description?: string;
  inputSchema?: unknown;
  _meta?: Record<string, unknown>;
}

/**
 * CSS theme configuration interface.
 * Used to store user-defined CSS skins.
 */
export interface ICssTheme {
  id: string; // Unique identifier
  name: string; // Theme name
  cover?: string; // Cover image as base64 or URL
  css: string; // CSS style code
  isPreset?: boolean; // Whether it's a preset theme
  createdAt: number; // Creation timestamp
  updatedAt: number; // Last updated timestamp
}
