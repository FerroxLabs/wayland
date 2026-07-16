/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import semver from 'semver';
import { z } from 'zod';

// ============ Reserved Prefixes ============

export const RESERVED_NAME_PREFIXES = ['aion-', 'internal-', 'builtin-', 'system-'];

function validateExtensionName(name: string): boolean {
  return !RESERVED_NAME_PREFIXES.some((prefix) => name.startsWith(prefix));
}

const LifecycleHookSchema = z.union([
  z.string(),
  z
    .object({
      timeout: z.number().int().positive().optional(),
      script: z.string().optional(),
      shell: z
        .object({
          cliCommand: z.string(),
          args: z.array(z.string()).optional(),
        })
        .optional(),
    })
    .refine((data) => data.script || data.shell, {
      message: "Either 'script' or 'shell' must be provided",
    }),
]);

// ============ Extension Meta Schema ============

export const ExtensionMetaSchema = z
  .object({
    name: z
      .string()
      .regex(/^[a-z0-9-]+$/, 'Extension name must be kebab-case')
      .min(2, 'Extension name must be at least 2 characters')
      .max(64, 'Extension name must be at most 64 characters')
      .refine(validateExtensionName, {
        message: `Extension name cannot start with reserved prefixes: ${RESERVED_NAME_PREFIXES.join(', ')}`,
      }),
    displayName: z.string().min(1, 'Display name is required'),
    version: z.string().regex(/^\d+\.\d+\.\d+(-[\w.]+)?$/, 'Version must be semver format (e.g., 1.0.0)'),
    description: z.string().optional(),
    author: z.string().optional(),
    icon: z.string().optional(),
    homepage: z.string().url().optional(),
    /**
     * Extension API compatibility range.
     * Prefer declaring this field for extensions targeting the bundled extension API.
     * Example: "^1.0.0"
     */
    apiVersion: z
      .string()
      .refine((v) => semver.validRange(v) !== null, {
        message: 'apiVersion must be a valid semver range (e.g., "^1.0.0", "1.0.0", ">=1.0.0 <2.0.0")',
      })
      .optional(),
    /** P2: Extension dependencies */
    dependencies: z
      .record(
        z.string(),
        z.string().refine((v) => semver.validRange(v) !== null, {
          message: 'Dependency version must be a valid semver range',
        })
      )
      .optional()
      .describe('Extension dependencies: { extensionName: versionRange }'),
    /** P2: WAYLAND core version compatibility */
    engine: z
      .object({
        wayland: z
          .string()
          .refine((v) => semver.validRange(v) !== null, {
            message: 'Engine version must be a valid semver range (e.g., "^1.0.0", ">=1.0.0 <2.0.0")',
          })
          .optional()
          .describe('Compatible Wayland core version range'),
      })
      .optional(),
    /**
     * i18n configuration for the extension.
     * Follows the same structure as src/renderer/services/i18n/locales:
     *   i18n/{locale}/{module}.json
     * e.g. i18n/en-US/extension.json, i18n/zh-CN/assistants.json
     *
     * `localesDir` - relative path to the locales directory (default: "i18n")
     * `defaultLocale` - fallback locale code (default: "en-US")
     */
    i18n: z
      .object({
        localesDir: z.string().default('i18n'),
        defaultLocale: z.string().default('en-US'),
      })
      .optional(),
    /**
     * Lifecycle hook scripts (inspired by NocoBase plugin lifecycle).
     * Scripts are JS files relative to the extension directory.
     * Each script should export a function: (context: LifecycleContext) => void | Promise<void>
     */
    lifecycle: z
      .object({
        /** Run when the extension is first installed or upgraded */
        onInstall: LifecycleHookSchema.optional(),
        /** Run when the extension is activated (enabled) */
        onActivate: LifecycleHookSchema.optional(),
        /** Run when the extension is deactivated (disabled) */
        onDeactivate: LifecycleHookSchema.optional(),
        /** Run when the extension is uninstalled (removed) */
        onUninstall: LifecycleHookSchema.optional(),
      })
      .optional(),
    /**
     * Permission declarations (inspired by Figma's manifest permissions).
     * Declares what capabilities the extension requires.
     * Users are shown these permissions when installing/enabling the extension.
     */
    permissions: z
      .object({
        /** Read/write to Wayland persistent storage */
        storage: z.boolean().default(false),
        /** Network access: false (none), true (all), or { allowedDomains: [...], reasoning?: string } */
        network: z
          .union([
            z.boolean(),
            z.object({
              allowedDomains: z.array(z.string()).min(1),
              reasoning: z.string().optional(),
            }),
          ])
          .default(false),
        /** Execute system shell commands */
        shell: z.boolean().default(false),
        /** Filesystem scope: 'extension-only' | 'workspace' | 'full' */
        filesystem: z.enum(['extension-only', 'workspace', 'full']).default('extension-only'),
        /** Clipboard access */
        clipboard: z.boolean().default(false),
        /** Access to active user info */
        activeUser: z.boolean().default(false),
        /** Inter-extension event bus communication (default: true) */
        events: z.boolean().default(true),
      })
      .optional(),
  })
  .strict();

// ============ Field Schema (shared by ACP adapters & Channel plugins) ============

export const ExtFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(['text', 'password', 'select', 'number', 'boolean']),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  default: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

// ============ ACP Adapter Schema ============

export const PRESET_AGENT_TYPES = ['gemini', 'claude', 'codex', 'codebuddy', 'opencode'] as const;

export const ExtAcpAdapterSchema = z
  .object({
    id: z.string().min(1, 'ACP adapter id is required'),
    name: z.string().min(1, 'ACP adapter name is required'),
    description: z.string().optional(),
    cliCommand: z.string().optional(),
    defaultCliPath: z.string().optional(),
    acpArgs: z.array(z.string()).optional(),
    env: z.record(z.string()).optional(),
    icon: z.string().optional(),
    authRequired: z.boolean().optional(),
    supportsStreaming: z.boolean().optional(),
    connectionType: z.enum(['cli', 'stdio', 'websocket', 'http']).default('cli'),
    endpoint: z.string().optional(),
    models: z.array(z.string()).optional(),
    /**
     * API Key fields that the user can configure in the Settings UI.
     * Each field defines an environment variable name (key) and UI label.
     * Values entered by the user are injected into the adapter's env when spawning.
     * Example: [{ key: "ANTHROPIC_API_KEY", label: "API Key", type: "password", required: true }]
     */
    apiKeyFields: z.array(ExtFieldSchema).optional(),
    yoloMode: z
      .object({
        type: z.enum(['session', 'global']),
        sessionMode: z.string().optional(),
      })
      .optional(),
    healthCheck: z
      .object({
        versionCommand: z.string(),
        timeout: z.number().optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.connectionType === 'cli' || data.connectionType === 'stdio') {
        return !!data.cliCommand || !!data.defaultCliPath;
      }
      if (data.connectionType === 'websocket' || data.connectionType === 'http') {
        return !!data.endpoint;
      }
      return true;
    },
    {
      message: 'CLI/stdio adapters require cliCommand or defaultCliPath; websocket/http adapters require endpoint',
    }
  );

// ============ MCP Server Schema ============

export const ExtMcpTransportSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('stdio'),
    command: z.string(),
    args: z.array(z.string()).optional(),
    env: z.record(z.string()).optional(),
  }),
  z.object({
    type: z.literal('sse'),
    url: z.string(),
    headers: z.record(z.string()).optional(),
  }),
  z.object({
    type: z.literal('http'),
    url: z.string(),
    headers: z.record(z.string()).optional(),
  }),
  z.object({
    type: z.literal('streamable_http'),
    url: z.string(),
    headers: z.record(z.string()).optional(),
  }),
]);

export const ExtMcpServerSchema = z.object({
  name: z.string().min(1, 'MCP server name is required'),
  description: z.string().optional(),
  transport: ExtMcpTransportSchema,
  enabled: z.boolean().default(true),
});

// ============ Assistant Schema ============

/** Categories used by the chat-surface assistant picker. Matches AssistantPreset.category. */
export const ASSISTANT_CATEGORIES = ['sell', 'write', 'research', 'build', 'run', 'office', 'general'] as const;

export const ExtAssistantSchema = z.object({
  id: z.string().min(1, 'Assistant id is required'),
  name: z.string().min(1, 'Assistant name is required'),
  description: z.string().optional(),
  avatar: z.string().optional(),
  // Accept built-in preset types OR any extension-contributed adapter ID (e.g. "ext-buddy")
  presetAgentType: z.union([
    z.enum(PRESET_AGENT_TYPES),
    z.string().min(1, 'presetAgentType must be a non-empty string'),
  ]),
  /** Optional category aligned with built-in AssistantPreset.category for Phase 2 routing. */
  category: z.enum(ASSISTANT_CATEGORIES).optional(),
  /**
   * Optional library-grouping kind. 'team' = composes multiple roles into a
   * workflow (Standing Companies, launchers). 'specialist' = single role.
   * Used by the /assistants library page (Phase 3) to split the 3-group grid.
   */
  kind: z.enum(['team', 'specialist']).optional(),
  contextFile: z.string().min(1, 'contextFile is required'),
  models: z.array(z.string()).optional(),
  enabledSkills: z.array(z.string()).optional(),
  prompts: z.array(z.string()).optional(),
  /** W1a - Roster of specialist assistant IDs that compose this launcher (kind==='team' only). */
  teammates: z.array(z.string()).optional(),
  /** W1a - Recurring rituals declared by the launcher (e.g. weekly standup). */
  rituals: z
    .array(
      z.object({
        name: z.string(),
        cadence: z.string(),
      })
    )
    .optional(),
  /** W1a / TRIAGE C4 - Marks Standing Companies (always-on multi-role orgs). True for the 5 standing teams only. */
  standing: z.boolean().optional(),
});

// ============ Skill Schema ============

export const ExtSkillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  description: z.string().optional(),
  file: z.string().min(1, 'Skill file path is required'),
});

// ============ Channel Plugin Schema ============

export const ExtChannelPluginSchema = z.object({
  type: z.string().min(1, 'Channel plugin type is required'),
  name: z.string().min(1, 'Channel plugin name is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
  entryPoint: z.string().min(1, 'entryPoint is required'),
  credentialFields: z.array(ExtFieldSchema).optional(),
  configFields: z.array(ExtFieldSchema).optional(),
});

// ============ WebUI Schema ============

export const ExtApiRouteSchema = z.object({
  path: z.string().min(1, 'WebUI route path is required'),
  entryPoint: z.string(),
  description: z.string().optional(),
  auth: z.boolean().default(true),
});

export const ExtWsHandlerSchema = z.object({
  namespace: z.string(),
  entryPoint: z.string(),
  description: z.string().optional(),
});

export const ExtMiddlewareSchema = z.object({
  entryPoint: z.string(),
  description: z.string().optional(),
  applyTo: z.string().default('/**'),
  order: z.enum(['before', 'after']).default('before'),
});

export const ExtStaticAssetSchema = z.object({
  urlPrefix: z.string().min(1, 'WebUI static asset urlPrefix is required'),
  directory: z.string(),
  description: z.string().optional(),
});

export const ExtWebuiSchema = z.object({
  apiRoutes: z.array(ExtApiRouteSchema).optional(),
  wsHandlers: z.array(ExtWsHandlerSchema).optional(),
  middleware: z.array(ExtMiddlewareSchema).optional(),
  staticAssets: z.array(ExtStaticAssetSchema).optional(),
});

// ============ Theme Schema ============

export const ExtThemeSchema = z.object({
  id: z.string(),
  name: z.string(),
  file: z.string(),
  cover: z.string().optional(),
});

// ============ Model Provider Schema ============

/**
 * Extension-contributed model provider.
 * Follows the same IProvider structure from common/storage.ts.
 * The extension provides a preset configuration that gets merged into the model list.
 */
export const ExtModelProviderSchema = z.object({
  /** Unique provider ID - must be globally unique across all extensions */
  id: z.string().min(1, 'Model provider id is required'),
  /** Platform identifier (e.g. 'custom', 'gemini', 'anthropic', 'new-api', 'bedrock') */
  platform: z.string().min(1, 'Platform is required'),
  /** Display name */
  name: z.string().min(1, 'Provider name is required'),
  /** API base URL */
  baseUrl: z.string().optional(),
  /** Default models provided by this provider */
  models: z.array(z.string()).optional(),
  /** Logo file relative to extension directory */
  logo: z.string().optional(),
});

// ============ Settings Tab Schema ============

/**
 * Built-in settings tab IDs - used by extensions to anchor relative positioning.
 *
 * Route-page tabs:  gemini | model | agent | tools | display | webui | system | about
 * Modal-only tabs:  gemini | model | tools | webui | system | about
 */
export const BUILTIN_SETTINGS_TAB_IDS = [
  'gemini',
  'model',
  'agent',
  'tools',
  'display',
  'webui',
  'system',
  'about',
] as const;

export const ExtSettingsTabSchema = z.object({
  id: z.string().min(1, 'Settings tab id is required'),
  name: z.string().min(1, 'Settings tab name is required'),
  icon: z.string().optional(),
  /** HTML entry point file relative to extension directory */
  entryPoint: z.string().min(1, 'entryPoint is required'),
  /**
   * Position relative to a built-in or other extension tab.
   * Format: `{ anchor: "<tabId>", placement: "before" | "after" }`
   * If omitted, the tab is appended before "system".
   */
  position: z
    .object({
      anchor: z.string().min(1),
      placement: z.enum(['before', 'after']),
    })
    .optional(),
  /** Fallback numeric order when multiple tabs target the same anchor+placement. Lower = first. Default 100 */
  order: z.number().default(100),
});

// ============ Native UI Hook Schemas ============

export const ExtAcronymSchema = z.object({
  acronym: z.string().min(1, 'Acronym is required').max(32, 'Acronym must be at most 32 characters'),
  expansion: z.string().min(1, 'Acronym expansion is required'),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
});

export const ExtWorkspacePanelSchema = z.object({
  id: z.string().min(1, 'Workspace panel id is required'),
  name: z.string().min(1, 'Workspace panel name is required'),
  icon: z.string().optional(),
  entryPoint: z.string().min(1, 'entryPoint is required'),
  order: z.number().default(100),
});

export const ExtFilePreviewActionSchema = z.object({
  id: z.string().min(1, 'File preview action id is required'),
  name: z.string().min(1, 'File preview action name is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
  matchExtensions: z.array(z.string().min(1)).optional(),
  promptTemplate: z.string().optional(),
  entryPoint: z.string().optional(),
  order: z.number().default(100),
});

export const ExtScheduledTaskTemplateSchema = z.object({
  id: z.string().min(1, 'Scheduled task template id is required'),
  name: z.string().min(1, 'Scheduled task template name is required'),
  description: z.string().optional(),
  promptTemplate: z.string().min(1, 'promptTemplate is required'),
  scheduleHint: z.string().optional(),
  order: z.number().default(100),
});

export const ExtWorkflowTemplateSchema = z.object({
  id: z.string().min(1, 'Workflow template id is required'),
  name: z.string().min(1, 'Workflow template name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  promptTemplate: z.string().optional(),
  steps: z.array(z.string().min(1)).optional(),
  order: z.number().default(100),
});

// ============ Contributes Schema ============

function validateContributeIds(contributes: z.infer<typeof ExtContributesSchemaBase>): string | true {
  if (contributes.acpAdapters) {
    const ids = contributes.acpAdapters.map((a) => a.id);
    const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    if (duplicates.length > 0) {
      return `Duplicate ACP adapter IDs: ${[...new Set(duplicates)].join(', ')}`;
    }
  }
  if (contributes.assistants) {
    const ids = contributes.assistants.map((a) => a.id);
    const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    if (duplicates.length > 0) {
      return `Duplicate assistant IDs: ${[...new Set(duplicates)].join(', ')}`;
    }
  }
  if (contributes.agents) {
    const ids = contributes.agents.map((a) => a.id);
    const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    if (duplicates.length > 0) {
      return `Duplicate agent IDs: ${[...new Set(duplicates)].join(', ')}`;
    }
  }
  // Cross-validate: agent IDs must not collide with assistant IDs
  if (contributes.assistants && contributes.agents) {
    const assistantIds = new Set(contributes.assistants.map((a) => a.id));
    const collisions = contributes.agents.filter((a) => assistantIds.has(a.id)).map((a) => a.id);
    if (collisions.length > 0) {
      return `Agent IDs collide with assistant IDs: ${collisions.join(', ')}`;
    }
  }
  if (contributes.mcpServers) {
    const names = contributes.mcpServers.map((s) => s.name);
    const duplicates = names.filter((name, idx) => names.indexOf(name) !== idx);
    if (duplicates.length > 0) {
      return `Duplicate MCP server names: ${[...new Set(duplicates)].join(', ')}`;
    }
  }
  if (contributes.skills) {
    const names = contributes.skills.map((s) => s.name);
    const duplicates = names.filter((name, idx) => names.indexOf(name) !== idx);
    if (duplicates.length > 0) {
      return `Duplicate skill names: ${[...new Set(duplicates)].join(', ')}`;
    }
  }
  if (contributes.channelPlugins) {
    const types = contributes.channelPlugins.map((p) => p.type);
    const duplicates = types.filter((type, idx) => types.indexOf(type) !== idx);
    if (duplicates.length > 0) {
      return `Duplicate channel plugin types: ${[...new Set(duplicates)].join(', ')}`;
    }
  }
  if (contributes.themes) {
    const ids = contributes.themes.map((t) => t.id);
    const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    if (duplicates.length > 0) {
      return `Duplicate theme IDs: ${[...new Set(duplicates)].join(', ')}`;
    }
  }
  if (contributes.settingsTabs) {
    const ids = contributes.settingsTabs.map((t) => t.id);
    const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    if (duplicates.length > 0) {
      return `Duplicate settings tab IDs: ${[...new Set(duplicates)].join(', ')}`;
    }
  }
  if (contributes.acronyms) {
    const acronyms = contributes.acronyms.map((a) => a.acronym.toLowerCase());
    const duplicates = acronyms.filter((id, idx) => acronyms.indexOf(id) !== idx);
    if (duplicates.length > 0) {
      return `Duplicate acronym entries: ${[...new Set(duplicates)].join(', ')}`;
    }
  }
  if (contributes.workspacePanels) {
    const ids = contributes.workspacePanels.map((p) => p.id);
    const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    if (duplicates.length > 0) {
      return `Duplicate workspace panel IDs: ${[...new Set(duplicates)].join(', ')}`;
    }
  }
  if (contributes.filePreviewActions) {
    const ids = contributes.filePreviewActions.map((a) => a.id);
    const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    if (duplicates.length > 0) {
      return `Duplicate file preview action IDs: ${[...new Set(duplicates)].join(', ')}`;
    }
  }
  if (contributes.scheduledTaskTemplates) {
    const ids = contributes.scheduledTaskTemplates.map((t) => t.id);
    const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    if (duplicates.length > 0) {
      return `Duplicate scheduled task template IDs: ${[...new Set(duplicates)].join(', ')}`;
    }
  }
  if (contributes.workflowTemplates) {
    const ids = contributes.workflowTemplates.map((t) => t.id);
    const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    if (duplicates.length > 0) {
      return `Duplicate workflow template IDs: ${[...new Set(duplicates)].join(', ')}`;
    }
  }
  if (contributes.webui?.apiRoutes) {
    const paths = contributes.webui.apiRoutes.map((r) => r.path);
    const duplicates = paths.filter((p, idx) => paths.indexOf(p) !== idx);
    if (duplicates.length > 0) {
      return `Duplicate WebUI API route paths: ${[...new Set(duplicates)].join(', ')}`;
    }
  }
  if (contributes.webui?.wsHandlers) {
    const namespaces = contributes.webui.wsHandlers.map((h) => h.namespace);
    const duplicates = namespaces.filter((ns, idx) => namespaces.indexOf(ns) !== idx);
    if (duplicates.length > 0) {
      return `Duplicate WebUI WS namespaces: ${[...new Set(duplicates)].join(', ')}`;
    }
  }
  if (contributes.webui?.staticAssets) {
    const prefixes = contributes.webui.staticAssets.map((a) => a.urlPrefix);
    const duplicates = prefixes.filter((p, idx) => prefixes.indexOf(p) !== idx);
    if (duplicates.length > 0) {
      return `Duplicate WebUI static asset prefixes: ${[...new Set(duplicates)].join(', ')}`;
    }
  }
  if (contributes.modelProviders) {
    const ids = contributes.modelProviders.map((p) => p.id);
    const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    if (duplicates.length > 0) {
      return `Duplicate model provider IDs: ${[...new Set(duplicates)].join(', ')}`;
    }
  }
  return true;
}

const ExtContributesSchemaBase = z.object({
  acpAdapters: z.array(ExtAcpAdapterSchema).optional(),
  mcpServers: z.array(ExtMcpServerSchema).optional(),
  assistants: z.array(ExtAssistantSchema).optional(),
  /** Agent presets - structurally identical to assistants but semantically represent autonomous agents (e.g. leis, openfang, opencode style) */
  agents: z.array(ExtAssistantSchema).optional(),
  skills: z.array(ExtSkillSchema).optional(),
  channelPlugins: z.array(ExtChannelPluginSchema).optional(),
  webui: ExtWebuiSchema.optional(),
  themes: z.array(ExtThemeSchema).optional(),
  settingsTabs: z.array(ExtSettingsTabSchema).optional(),
  /** Model providers contributed by this extension */
  modelProviders: z.array(ExtModelProviderSchema).optional(),
  /** Native composer acronym expansions */
  acronyms: z.array(ExtAcronymSchema).optional(),
  /** Native workspace side panel entries */
  workspacePanels: z.array(ExtWorkspacePanelSchema).optional(),
  /** Native file preview actions */
  filePreviewActions: z.array(ExtFilePreviewActionSchema).optional(),
  /** Native scheduled-task create/edit templates */
  scheduledTaskTemplates: z.array(ExtScheduledTaskTemplateSchema).optional(),
  /** Native workflow builder templates/import recipes */
  workflowTemplates: z.array(ExtWorkflowTemplateSchema).optional(),
});

export const ExtContributesSchema = ExtContributesSchemaBase.refine(validateContributeIds, {
  message: 'Duplicate IDs found in contributions',
});

// ============ Full Manifest Schema ============

export const ExtensionManifestSchema = ExtensionMetaSchema.extend({
  $schema: z.string().optional(),
  contributes: ExtContributesSchema,
});

// ============ TypeScript Types ============

export type ExtensionManifest = z.infer<typeof ExtensionManifestSchema>;
export type ExtContributes = z.infer<typeof ExtContributesSchema>;
export type ExtAcpAdapter = z.infer<typeof ExtAcpAdapterSchema>;
export type ExtMcpServer = z.infer<typeof ExtMcpServerSchema>;
export type ExtAssistant = z.infer<typeof ExtAssistantSchema>;
export type ExtAgent = z.infer<typeof ExtAssistantSchema>;
export type ExtSkill = z.infer<typeof ExtSkillSchema>;
export type ExtChannelPlugin = z.infer<typeof ExtChannelPluginSchema>;
export type ExtTheme = z.infer<typeof ExtThemeSchema>;
export type ExtWebui = z.infer<typeof ExtWebuiSchema>;
export type ExtSettingsTab = z.infer<typeof ExtSettingsTabSchema>;
export type ExtModelProvider = z.infer<typeof ExtModelProviderSchema>;
export type ExtAcronym = z.infer<typeof ExtAcronymSchema>;
export type ExtWorkspacePanel = z.infer<typeof ExtWorkspacePanelSchema>;
export type ExtFilePreviewAction = z.infer<typeof ExtFilePreviewActionSchema>;
export type ExtScheduledTaskTemplate = z.infer<typeof ExtScheduledTaskTemplateSchema>;
export type ExtWorkflowTemplate = z.infer<typeof ExtWorkflowTemplateSchema>;

export type ExtensionSource = 'local' | 'appdata' | 'env' | 'bundled';

export type LoadedExtension = {
  manifest: ExtensionManifest;
  directory: string;
  source: ExtensionSource;
};

export type ExtensionState = {
  enabled: boolean;
  disabledAt?: Date;
  disabledReason?: string;
  permissionReview?: {
    approvedAt: Date;
    approvedRiskLevel: 'safe' | 'moderate' | 'dangerous';
    approvedPermissions: string[];
  };
  /** Whether onInstall hook has been run */
  installed?: boolean;
  /** Last known version - used for upgrade detection */
  lastVersion?: string;
  /** Install error message for Agent Hub tracking */
  installError?: string;
};
