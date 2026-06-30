/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { mkdirSync as _mkdirSync, existsSync, readdirSync, readFileSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { getPlatformServices } from '@/common/platform';
import { application } from '@/common/adapter/ipcBridge';
import type { TMessage } from '@/common/chat/chatLib';
import { ASSISTANT_PRESETS } from '@/common/config/presets/assistantPresets';
import { nativeConfigDir } from '@process/agent/wcore/profilePaths';
import type {
  IChannelAssistantConfigRefer,
  IChatConversationRefer,
  IConfigStorageRefer,
  IEnvStorageRefer,
  IMcpServer,
  IProvider,
  TChatConversation,
  TProviderWithModel,
} from '@/common/config/storage';
import { ChatMessageStorage, ChatStorage, ConfigStorage, EnvStorage } from '@/common/config/storage';
import {
  copyDirectoryRecursively,
  ensureDirectory,
  getConfigPath,
  getDataPath,
  getTempPath,
  hasElectronAppPath,
  pruneDirectoryToMatch,
  verifyDirectoryFiles,
} from './utils';
import { writeFileAtomic } from './atomicWrite';
import { getOsUserName } from './osUserName';
import { resolveFluxImageDefault } from './fluxImageDefault';
import { readConnectedFluxKey } from '../connectors/fluxKey';
import { getDatabase } from '../services/database/export';
import type { AcpBackendConfig } from '@/common/types/acpTypes';
import { migrateFromElectronConfig, importConfigFromFile } from './configMigration';
import {
  BUILTIN_CONCIERGE_DIAG_ID,
  BUILTIN_CONCIERGE_DIAG_NAME,
  BUILTIN_IMAGE_GEN_ID,
  BUILTIN_IMAGE_GEN_LEGACY_NAMES,
  BUILTIN_IMAGE_GEN_NAME,
  BUILTIN_PLAYWRIGHT_BLOCKED_ORIGINS,
  BUILTIN_PLAYWRIGHT_ID,
  BUILTIN_PLAYWRIGHT_LIBRARY_ENTRY_ID,
  BUILTIN_PLAYWRIGHT_NAME,
  BUILTIN_PLAYWRIGHT_PACKAGE,
  BUILTIN_SEARCH_SKILLS_ID,
  BUILTIN_SEARCH_SKILLS_NAME,
} from '../resources/builtinMcp/constants';
import { resolveNpxPath } from './shellEnv';
import { getPlaywrightBrowsersDir } from '../services/mcpServices/playwrightBrowsers';
import { getMcpScriptPath, inspectMcpScripts } from './mcpScriptDir';
import { getBuiltinCatalogAssistants } from './builtinCatalog';
// Platform and architecture types (moved from deleted updateConfig)
type PlatformType = 'win32' | 'darwin' | 'linux';
type ArchitectureType = 'x64' | 'arm64' | 'ia32' | 'arm';

const nodePath = path;

const STORAGE_PATH = {
  config: 'wayland-config.txt',
  chatMessage: 'wayland-chat-message.txt',
  chat: 'wayland-chat.txt',
  env: '.wayland-env',
  assistants: 'assistants',
  skills: 'skills',
  builtinSkills: 'builtin-skills',
  cronSkills: 'cron-skills',
};

const getHomePage = getConfigPath;

const mkdirSync = (path: string) => {
  return _mkdirSync(path, { recursive: true });
};

/**
 * Migrate legacy data from the temp directory to userData/config
 */
const migrateLegacyData = async () => {
  const oldDir = getTempPath(); // legacy temp dir
  const newDir = getConfigPath(); // new userData/config dir

  try {
    // Check if the new directory is empty (does not exist, or exists but has no contents)
    const isNewDirEmpty =
      !existsSync(newDir) ||
      (() => {
        try {
          return existsSync(newDir) && readdirSync(newDir).length === 0;
        } catch (error) {
          console.warn('[Wayland] Warning: Could not read new directory during migration check:', error);
          return false; // Assume non-empty to avoid overwriting on migration
        }
      })();

    // Migration precondition: old dir exists and new dir is empty
    if (existsSync(oldDir) && isNewDirEmpty) {
      // Create destination directory
      mkdirSync(newDir);

      // Copy all files and directories
      await copyDirectoryRecursively(oldDir, newDir);

      // Verify migration succeeded
      const isVerified = await verifyDirectoryFiles(oldDir, newDir);
      if (isVerified) {
        // Make sure we don't delete the same directory
        if (path.resolve(oldDir) !== path.resolve(newDir)) {
          try {
            await fs.rm(oldDir, { recursive: true });
          } catch (cleanupError) {
            console.warn(
              '[Wayland] Failed to clean up original directory, please delete manually:',
              oldDir,
              cleanupError
            );
          }
        }
      }

      return true;
    }
  } catch (error) {
    console.error('[Wayland] Data migration failed:', error);
  }

  return false;
};

const WriteFile = async (filePath: string, data: string) => {
  // Ensure parent directory exists to prevent ENOENT on first write
  const dir = nodePath.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  // SEC-DATA-04 / RT-S1: these are the secret-bearing base64 config/env/chat
  // blobs (webhook secrets, provider creds, env vars). Create them 0o600 so
  // other local users / backup daemons can't read them on POSIX. Node ignores
  // `mode` on Windows, so writeFileAtomic additionally restricts the temp file
  // AND the final file to an owner-only DACL there (the files already live in
  // the ACL-restricted userData/config dir; the explicit DACL is defense in
  // depth). Value-level safeStorage encryption remains the durable fix.
  return writeFileAtomic(filePath, data, { mode: 0o600 });
};

/**
 * In-memory JSON store backed by a file on disk.
 *
 * Data is loaded once (synchronously on first access) and kept in memory.
 * - `get` / `getSync` read from the in-memory cache (microseconds).
 * - `set` / `remove` / `clear` update the cache first, then persist to disk.
 * - Disk writes are serialized via a simple promise chain to prevent corruption.
 *
 * The on-disk format stays base64(encodeURIComponent(JSON)) for backward compat.
 */
const JsonFileBuilder = <S extends object = Record<string, unknown>>(filePath: string) => {
  // -- encoding helpers (unchanged, keeps backward compat) --
  const encode = (data: unknown) => btoa(encodeURIComponent(String(data)));
  const decode = (base64: string) => decodeURIComponent(atob(base64));

  // -- in-memory cache --
  let cache: S | null = null;

  const loadSync = (): S => {
    try {
      const raw = readFileSync(filePath).toString();
      if (!raw || raw.trim() === '') return {} as S;
      const decoded = decode(raw);
      if (!decoded || decoded.trim() === '') return {} as S;
      const parsed = JSON.parse(decoded) as S;
      if (filePath.includes('chat.txt') && Object.keys(parsed).length === 0) {
        console.warn(`[Storage] Chat history file appears to be empty: ${filePath}`);
      }
      return parsed;
    } catch {
      return {} as S;
    }
  };

  const ensureLoaded = (): S => {
    if (cache === null) {
      cache = loadSync();
    }
    return cache;
  };

  // -- serialized disk persistence --
  let writeChain: Promise<unknown> = Promise.resolve();

  const persist = (): Promise<S> => {
    const data = cache ?? ({} as S);
    const encoded = encode(JSON.stringify(data));
    // Write once, branch the promise: writeChain stays resolved (so one
    // failure doesn't block subsequent writes), callers get the real error.
    const writeOp = writeChain.then(() => WriteFile(filePath, encoded));
    writeChain = writeOp.catch(() => {});
    return writeOp.then(
      () => data,
      (err) => {
        console.error(`[Storage] Failed to persist ${filePath}:`, err);
        throw err;
      }
    );
  };

  // -- public API (same shape as before) --
  const toJson = async (): Promise<S> => ensureLoaded();

  const setJson = async (data: S): Promise<S> => {
    cache = data;
    return persist();
  };

  const toJsonSync = (): S => ensureLoaded();

  return {
    toJson,
    setJson,
    toJsonSync,
    async set<K extends keyof S>(key: K, value: Awaited<S>[K]): Promise<Awaited<S>[K]> {
      const data = ensureLoaded();
      data[key] = value;
      await persist();
      return value;
    },
    async get<K extends keyof S>(key: K): Promise<Awaited<S>[K]> {
      return ensureLoaded()[key] as Awaited<S>[K];
    },
    async remove<K extends keyof S>(key: K) {
      const data = ensureLoaded();
      delete data[key];
      return persist();
    },
    clear() {
      cache = {} as S;
      return persist();
    },
    getSync<K extends keyof S>(key: K): S[K] {
      return ensureLoaded()[key];
    },
    update<K extends keyof S>(key: K, updateFn: (value: S[K], data: S) => Promise<S[K]>) {
      const data = ensureLoaded();
      return updateFn(data[key], data).then((value) => {
        data[key] = value;
        return persist();
      });
    },
    backup(fullName: string) {
      const dir = nodePath.dirname(fullName);
      if (!existsSync(dir)) {
        mkdirSync(dir);
      }
      // Backup: copy the file then remove original
      const doCopy = () => fs.copyFile(filePath, fullName).then(() => fs.rm(filePath, { recursive: true }));
      const backupOp = writeChain.then(doCopy);
      writeChain = backupOp.catch(() => {});
      return backupOp.then(
        () => {},
        (err) => {
          console.error(`[Storage] Backup failed:`, err);
          throw err;
        }
      );
    },
  };
};

const envFile = JsonFileBuilder<IEnvStorageRefer>(path.join(getHomePage(), STORAGE_PATH.env));

const dirConfig = envFile.getSync('wayland.dir');

const cacheDir = dirConfig?.cacheDir || getHomePage();

const configFile = JsonFileBuilder<IConfigStorageRefer & IChannelAssistantConfigRefer>(
  path.join(cacheDir, STORAGE_PATH.config)
);
type ConversationHistoryData = Record<string, TMessage[]>;

const _chatMessageFile = JsonFileBuilder<ConversationHistoryData>(path.join(cacheDir, STORAGE_PATH.chatMessage));
const _chatFile = JsonFileBuilder<IChatConversationRefer>(path.join(cacheDir, STORAGE_PATH.chat));

// Create a chat-history proxy that handles field migration
const isGeminiConversation = (
  conversation: TChatConversation
): conversation is Extract<TChatConversation, { type: 'gemini' }> => {
  return conversation.type === 'gemini';
};

const chatFile = {
  ..._chatFile,
  async get<K extends keyof IChatConversationRefer>(key: K): Promise<IChatConversationRefer[K]> {
    const data = await _chatFile.get(key);

    // Special-case field migration for chat.history
    if (key === 'chat.history' && Array.isArray(data)) {
      const history = data as IChatConversationRefer['chat.history'];
      return history.map((conversation: TChatConversation) => {
        // Only Gemini conversations carry a model field; migrate legacy selectedModel -> useModel
        if (isGeminiConversation(conversation) && conversation.model) {
          // Use Record type to handle legacy-format migration
          const modelRecord = conversation.model as unknown as Record<string, unknown>;
          if ('selectedModel' in modelRecord && !('useModel' in modelRecord)) {
            modelRecord['useModel'] = modelRecord['selectedModel'];
            delete modelRecord['selectedModel'];
            conversation.model = modelRecord as TProviderWithModel;
          }
        }
        return conversation;
      }) as IChatConversationRefer[K];
    }

    return data;
  },
  async set<K extends keyof IChatConversationRefer>(
    key: K,
    value: IChatConversationRefer[K]
  ): Promise<IChatConversationRefer[K]> {
    return await _chatFile.set(key, value);
  },
};

const buildMessageListStorage = (conversation_id: string, dir: string) => {
  const fullName = path.join(dir, 'wayland-chat-history', conversation_id + '.txt');
  if (!existsSync(fullName)) {
    mkdirSync(path.join(dir, 'wayland-chat-history'));
  }
  return JsonFileBuilder<TMessage[]>(path.join(dir, 'wayland-chat-history', conversation_id + '.txt'));
};

const conversationHistoryProxy = (options: typeof _chatMessageFile, dir: string) => {
  return {
    ...options,
    async set(key: string, data: TMessage[]) {
      const conversation_id = key;
      const storage = buildMessageListStorage(conversation_id, dir);
      return await storage.setJson(data);
    },
    async get(key: string): Promise<TMessage[]> {
      const conversation_id = key;
      const storage = buildMessageListStorage(conversation_id, dir);
      const data = await storage.toJson();
      if (Array.isArray(data)) return data;
      return [];
    },
    backup(conversation_id: string) {
      const storage = buildMessageListStorage(conversation_id, dir);
      return storage.backup(
        path.join(dir, 'wayland-chat-history', 'backup', conversation_id + '_' + Date.now() + '.txt')
      );
    },
  };
};

const chatMessageFile = conversationHistoryProxy(_chatMessageFile, cacheDir);

/**
 * Get assistant rules directory path
 */
const getAssistantsDir = () => {
  return path.join(cacheDir, STORAGE_PATH.assistants);
};

/**
 * Get skills scripts directory path
 */
const getSkillsDir = () => {
  return path.join(cacheDir, STORAGE_PATH.skills);
};

/**
 * Get the directory where bundled skills are copied to (config/builtin-skills/).
 * This directory is fully managed by the app - synced on every startup.
 */
const getBuiltinSkillsCopyDir = () => {
  return path.join(cacheDir, STORAGE_PATH.builtinSkills);
};

/**
 * Get the auto-enabled builtin skills directory (_builtin subdirectory).
 * Skills in this directory are automatically injected for ALL agents and scenarios.
 */
const getAutoSkillsDir = () => {
  return path.join(getBuiltinSkillsCopyDir(), '_builtin');
};

/**
 * Get the directory for per-cron-job SKILL.md files.
 * Each cron job gets its own subdirectory: {cronSkillsDir}/{jobId}/SKILL.md
 */
const getCronSkillsDir = () => {
  return path.join(cacheDir, STORAGE_PATH.cronSkills);
};

/**
 * Initialize builtin assistant rule and skill files to user directory
 */
const initBuiltinAssistantRules = async (): Promise<void> => {
  const assistantsDir = getAssistantsDir();

  // In development, use project root. In production, use app.getAppPath().
  // viteStaticCopy maps src/process/resources/* to root-level dirs in the asar.
  const resolveBuiltinDir = (dirPath: string): string => {
    const platform = getPlatformServices().paths;
    const appPath = platform.getAppPath()!;
    let candidates: string[];
    if (platform.isPackaged()) {
      // In production, viteStaticCopy maps src/process/resources/* to root-level dirs in the asar.
      // skills/ and assistant/ are read from asar at startup and copied to user config dirs.
      const RESOURCES_PREFIX = 'src/process/resources/';
      const prodPath = dirPath.startsWith(RESOURCES_PREFIX) ? dirPath.slice(RESOURCES_PREFIX.length) : dirPath;
      candidates = [path.join(appPath, prodPath)];
    } else {
      // In dev, viteStaticCopy doesn't run; resolve source paths directly.
      // appPath is the project root, so a single join is sufficient.
      candidates = [path.join(appPath, dirPath)];
    }

    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }

    console.warn(`[Wayland] Could not find builtin ${dirPath} directory, tried:`, candidates);
    return candidates[0];
  };

  const presetsNeedDefaultRulesDir = ASSISTANT_PRESETS.some(
    (preset) => !preset.resourceDir && Object.keys(preset.ruleFiles).length > 0
  );
  const rulesDir = presetsNeedDefaultRulesDir ? resolveBuiltinDir('rules') : '';
  // resolveBuiltinDir("src/process/resources/skills") works for packaged Electron
  // (viteStaticCopy outputs to skills/ which matches after stripping the prefix),
  // but in standalone server mode the actual path differs.
  let builtinSkillsDir = resolveBuiltinDir('src/process/resources/skills');
  if (!existsSync(builtinSkillsDir)) {
    const skillsFallbacks = [
      // Standalone production: bundled alongside server binary by build-server.mjs
      path.join(__dirname, 'skills'),
      path.join(__dirname, '..', 'skills'),
      path.join(process.cwd(), 'dist-server', 'skills'),
    ];
    const found = skillsFallbacks.find((d) => existsSync(d));
    if (found) builtinSkillsDir = found;
  }
  const builtinSkillsCopyDir = getBuiltinSkillsCopyDir();
  const userSkillsDir = getSkillsDir();

  // Sync builtin skills to a dedicated directory (config/builtin-skills/).
  // This directory is fully managed by the app: overwrite existing, remove stale.
  // User-custom skills live in config/skills/ and are never touched.
  if (existsSync(builtinSkillsDir)) {
    try {
      if (!existsSync(builtinSkillsCopyDir)) {
        mkdirSync(builtinSkillsCopyDir);
      }
      // Prune FIRST, then copy: removes stale files (e.g. creating.md/editing.md merged away
      // upstream) and also clears any dest entry whose type (dir ↔ file) differs from source,
      // so the subsequent copy never hits ENOTDIR/EEXIST on a type mismatch.
      await pruneDirectoryToMatch(builtinSkillsDir, builtinSkillsCopyDir);
      await copyDirectoryRecursively(builtinSkillsDir, builtinSkillsCopyDir, {
        overwrite: true,
      });
    } catch (error) {
      console.warn(`[Wayland] Failed to sync builtin skills directory:`, error);
    }
  }

  // Ensure user skills directory exists
  if (!existsSync(userSkillsDir)) {
    mkdirSync(userSkillsDir);
  }

  // Ensure cron skills directory exists (per-job SKILL.md files)
  const cronSkillsDir = getCronSkillsDir();
  if (!existsSync(cronSkillsDir)) {
    mkdirSync(cronSkillsDir);
  }

  // Ensure assistants directory exists
  if (!existsSync(assistantsDir)) {
    mkdirSync(assistantsDir);
  }

  for (const preset of ASSISTANT_PRESETS) {
    const assistantId = `builtin-${preset.id}`;

    // If resourceDir is set, use that directory; otherwise use default rules/ directory
    const presetRulesDir = preset.resourceDir ? resolveBuiltinDir(preset.resourceDir) : rulesDir;
    const presetSkillsDir = preset.resourceDir ? resolveBuiltinDir(preset.resourceDir) : builtinSkillsDir;

    // Copy rule files
    const hasRuleFiles = Object.keys(preset.ruleFiles).length > 0;
    if (hasRuleFiles) {
      for (const [locale, ruleFile] of Object.entries(preset.ruleFiles)) {
        try {
          const sourceRulesPath = path.join(presetRulesDir, ruleFile);
          // Target file name format: {assistantId}.{locale}.md
          const targetFileName = `${assistantId}.${locale}.md`;
          const targetPath = path.join(assistantsDir, targetFileName);

          // Check if source file exists
          if (!existsSync(sourceRulesPath)) {
            console.warn(`[Wayland] Source rule file not found: ${sourceRulesPath}`);
            continue;
          }

          // Always overwrite builtin assistant rule files to ensure users get the latest version
          let content = await fs.readFile(sourceRulesPath, 'utf-8');
          // Replace relative paths with absolute paths so AI can find scripts correctly
          content = content.replace(/skills\//g, userSkillsDir + '/');
          await fs.writeFile(targetPath, content, 'utf-8');
        } catch (error) {
          // Ignore missing locale files
          console.warn(`[Wayland] Failed to copy rule file ${ruleFile}:`, error);
        }
      }
    } else {
      // If assistant has no ruleFiles config, delete old rules cache files
      const rulesFilePattern = new RegExp(`^${assistantId}\\..*\\.md$`);
      try {
        const files = readdirSync(assistantsDir);
        for (const file of files) {
          if (rulesFilePattern.test(file)) {
            const filePath = path.join(assistantsDir, file);
            await fs.unlink(filePath);
          }
        }
      } catch (error) {
        // Ignore deletion failure
      }
    }

    // Copy skill files (if preset has skills)
    if (preset.skillFiles) {
      for (const [locale, skillFile] of Object.entries(preset.skillFiles)) {
        try {
          const sourceSkillsPath = path.join(presetSkillsDir, skillFile);
          // Target file name format: {assistantId}-skills.{locale}.md
          const targetFileName = `${assistantId}-skills.${locale}.md`;
          const targetPath = path.join(assistantsDir, targetFileName);

          // Check if source file exists
          if (!existsSync(sourceSkillsPath)) {
            console.warn(`[Wayland] Source skill file not found: ${sourceSkillsPath}`);
            continue;
          }

          // Always overwrite builtin assistant skill files to ensure users get the latest version
          let content = await fs.readFile(sourceSkillsPath, 'utf-8');
          // Replace relative paths with absolute paths so AI can find scripts correctly
          content = content.replace(/skills\//g, userSkillsDir + '/');
          await fs.writeFile(targetPath, content, 'utf-8');
        } catch (error) {
          // Ignore missing skill files
          console.warn(`[Wayland] Failed to copy skill file ${skillFile}:`, error);
        }
      }
    } else {
      // If assistant has no skillFiles config, delete old skills cache files
      // This ensures old presetSkills won't be read after migrating to SkillManager
      const skillsFilePattern = new RegExp(`^${assistantId}-skills\\..*\\.md$`);
      try {
        const files = readdirSync(assistantsDir);
        for (const file of files) {
          if (skillsFilePattern.test(file)) {
            const filePath = path.join(assistantsDir, file);
            await fs.unlink(filePath);
          }
        }
      } catch (error) {
        // Ignore deletion failure
      }
    }
  }
};

/**
 * Get built-in assistant configurations (without context, context is read from files)
 */
const getBuiltinAssistants = (): AcpBackendConfig[] => {
  const assistants: AcpBackendConfig[] = [];

  for (const preset of ASSISTANT_PRESETS) {
    // Read default enabled skills from preset config (excluding cron, which is builtin and auto-injected)
    const defaultEnabledSkills = preset.defaultEnabledSkills;
    const enabledByDefault =
      preset.id === 'concierge' ||
      preset.id === 'word-creator' ||
      preset.id === 'ppt-creator' ||
      preset.id === 'excel-creator' ||
      preset.id === 'academic-paper' ||
      preset.id === 'morph-ppt' ||
      preset.id === 'cowork' ||
      preset.id === 'openclaw-setup' ||
      preset.id === 'star-office-helper' ||
      preset.id === 'story-roleplay' ||
      preset.id === 'moltbook' ||
      preset.id === 'beautiful-mermaid';

    assistants.push({
      id: `builtin-${preset.id}`,
      name: preset.nameI18n['en-US'],
      nameI18n: preset.nameI18n,
      description: preset.descriptionI18n['en-US'],
      descriptionI18n: preset.descriptionI18n,
      avatar: preset.avatar,
      // context is no longer stored in config, read from files instead
      // Cowork enabled by default
      enabled: enabledByDefault,
      isPreset: true,
      isBuiltin: true,
      presetAgentType: preset.presetAgentType || 'gemini',
      // Cowork enables all builtin skills by default
      enabledSkills: defaultEnabledSkills,
      // Copy quick prompts
      promptsI18n: preset.promptsI18n,
    });
  }

  // Native built-in catalog (waylandteams: 28 specialists + 60 team launchers).
  // Appended here so they merge into config.assistants through the same prune/
  // update machinery as the ASSISTANT_PRESETS rows. They carry kind/teammates/
  // rituals/standing/kickoffs so the renderer surfaces teams on /teams.
  return [...assistants, ...getBuiltinCatalogAssistants()];
};

/**
 * Build the default MCP server configuration
 */
const getDefaultMcpServers = (): IMcpServer[] => {
  const now = Date.now();
  const defaultConfig = {
    mcpServers: {
      'chrome-devtools': {
        command: 'npx',
        args: ['-y', 'chrome-devtools-mcp@latest'],
      },
    },
  };

  return Object.entries(defaultConfig.mcpServers).map(([name, config], index) => ({
    id: `mcp_default_${now}_${index}`,
    name,
    description: `Default MCP server: ${name}`,
    enabled: false, // Disabled by default; users opt in manually
    transport: {
      type: 'stdio' as const,
      command: config.command,
      args: config.args,
    },
    createdAt: now,
    updatedAt: now,
    originalJson: JSON.stringify({ [name]: config }, null, 2),
  }));
};

/**
 * Resolve the path to a built-in MCP server entry script.
 *
 * Delegates to the shared `mcpScriptDir` resolver - both this module and
 * `team/mcp/tcpHelpers.ts` previously had ad-hoc resolution logic that
 * produced wrong paths under electron-vite dev (in different ways), causing
 * MCP children to crash with MODULE_NOT_FOUND and zero tools to register.
 * One shared resolver eliminates the drift.
 *
 * In development the file lives next to the main process bundle
 * (`out/main/`); in packaged builds it's at `app.asar.unpacked/out/main/`.
 */
const getBuiltinMcpScriptPath = (scriptName: string): string => {
  return getMcpScriptPath(`${scriptName}.js`);
};

/**
 * Ensure built-in MCP servers exist in mcp.config.
 * - Creates missing entries with enabled: false
 * - Updates command path if app location changed
 * - Migrates old tools.imageGenerationModel.switch to MCP server enabled state
 */
const ensureBuiltinMcpServers = async (): Promise<void> => {
  try {
    const mcpServers: IMcpServer[] = (await configFile.get('mcp.config').catch((): IMcpServer[] => [])) || [];
    const now = Date.now();
    let changed = false;

    const scriptPath = getBuiltinMcpScriptPath('builtin-mcp-image-gen');

    // Check if built-in image gen server already exists
    const existingIdx = mcpServers.findIndex((s) => s.builtin === true && s.id === BUILTIN_IMAGE_GEN_ID);

    // Migrate old switch setting
    let shouldEnable = false;
    const oldConfig = await configFile.get('tools.imageGenerationModel').catch((): undefined => undefined);
    if (oldConfig && oldConfig.switch === true) {
      shouldEnable = true;
    }

    // Build env vars from existing image generation model config
    const buildEnvFromConfig = (cfg: typeof oldConfig): Record<string, string> => {
      if (!cfg) return {};
      const env: Record<string, string> = {};
      if (cfg.platform) env.WAYLAND_IMG_PLATFORM = cfg.platform;
      if (cfg.baseUrl) env.WAYLAND_IMG_BASE_URL = cfg.baseUrl;
      if (cfg.apiKey) env.WAYLAND_IMG_API_KEY = cfg.apiKey;
      if (cfg.useModel) env.WAYLAND_IMG_MODEL = cfg.useModel;
      return env;
    };

    // Default the image MCP to Flux when Flux is connected and the user hasn't
    // chosen an image model. Seeds only (never clobbers an explicit choice), so
    // a connected-Flux user gets working image generation with zero setup.
    let imageConfig = oldConfig;
    let seededImageConfig = false;
    if (!oldConfig || !oldConfig.useModel) {
      try {
        const fluxKey = await readConnectedFluxKey();
        const providers = (await configFile.get('model.config').catch((): IProvider[] => [])) || [];
        const seed = resolveFluxImageDefault({ current: oldConfig, providers, fluxKey });
        if (seed) {
          imageConfig = seed;
          seededImageConfig = true;
          await configFile.set('tools.imageGenerationModel', seed);
          console.log('[Wayland] Defaulted image generation to Flux (connected, no model chosen)');
        }
      } catch (seedError) {
        console.error('[Wayland] Flux image-default seeding failed (non-fatal):', seedError);
      }
    }

    const buildOriginalJson = (scriptPathValue: string, env: Record<string, string>) =>
      JSON.stringify(
        {
          [BUILTIN_IMAGE_GEN_NAME]: {
            command: 'node',
            args: [scriptPathValue],
            env,
          },
        },
        null,
        2
      );

    if (existingIdx >= 0) {
      // Update command path in case app location changed
      const existing = mcpServers[existingIdx];
      const needsNameMigration =
        existing.name !== BUILTIN_IMAGE_GEN_NAME &&
        BUILTIN_IMAGE_GEN_LEGACY_NAMES.includes(existing.name as (typeof BUILTIN_IMAGE_GEN_LEGACY_NAMES)[number]);

      const needsPathUpdate =
        existing.transport.type === 'stdio' &&
        existing.transport.command === 'node' &&
        ((existing.transport.args || [])[0] !== scriptPath || needsNameMigration);

      const needsMigration = shouldEnable && !existing.enabled;
      // When we just seeded a Flux image default, push its env onto the
      // already-existing built-in server so the MCP picks up WAYLAND_IMG_* on
      // this boot (the env is otherwise only built when the server is created).
      const needsSeedEnv = seededImageConfig && existing.transport.type === 'stdio';
      const needsEnvUpdate = needsMigration || needsSeedEnv;

      if (needsNameMigration || needsPathUpdate || needsEnvUpdate) {
        let updatedTransport: IMcpServer['transport'] = existing.transport;

        if (existing.transport.type === 'stdio') {
          const mergedEnv = needsEnvUpdate
            ? { ...existing.transport.env, ...buildEnvFromConfig(imageConfig) }
            : existing.transport.env;
          updatedTransport = {
            ...existing.transport,
            ...(needsPathUpdate && { args: [scriptPath] }),
            ...(needsEnvUpdate && { env: mergedEnv }),
          };
        }

        const newOriginalJson =
          (needsPathUpdate || needsEnvUpdate) && updatedTransport.type === 'stdio'
            ? buildOriginalJson(updatedTransport.args?.[0] ?? scriptPath, updatedTransport.env ?? {})
            : existing.originalJson;

        mcpServers[existingIdx] = {
          ...existing,
          name: needsNameMigration ? BUILTIN_IMAGE_GEN_NAME : existing.name,
          transport: updatedTransport,
          originalJson: newOriginalJson,
          enabled: needsMigration ? true : existing.enabled,
          updatedAt: now,
        };
        changed = true;
      }
    } else {
      // Create new built-in image gen server
      const env = buildEnvFromConfig(imageConfig);
      const newServer: IMcpServer = {
        id: BUILTIN_IMAGE_GEN_ID,
        name: BUILTIN_IMAGE_GEN_NAME,
        description: 'Built-in image generation tool powered by AI models. Configure the model in Settings > Tools.',
        enabled: shouldEnable,
        builtin: true,
        transport: {
          type: 'stdio',
          command: 'node',
          args: [scriptPath],
          env,
        },
        createdAt: now,
        updatedAt: now,
        originalJson: buildOriginalJson(scriptPath, env),
      };
      mcpServers.push(newServer);
      changed = true;
    }

    // ── Built-in search-skills MCP server ────────────────────────────────────
    // Exposes the second channel of the two-channel skill architecture: native
    // backends ship only `_builtin + pinned + enabledSkills` natively (~30
    // skills); the full 2,105-entry library is reachable ONLY via the
    // `wayland_search_skills` tool. Enabled by default - the tool is silent
    // unless the agent calls it, and is what makes the library searchable at
    // all on ACP/Gemini/wcore backends.
    const searchSkillsScriptPath = getBuiltinMcpScriptPath('builtin-mcp-search-skills');
    const searchSkillsExistingIdx = mcpServers.findIndex(
      (s) => s.builtin === true && s.id === BUILTIN_SEARCH_SKILLS_ID
    );

    const buildSearchSkillsOriginalJson = (scriptPathValue: string) =>
      JSON.stringify(
        {
          [BUILTIN_SEARCH_SKILLS_NAME]: {
            command: 'node',
            args: [scriptPathValue],
            env: {},
          },
        },
        null,
        2
      );

    if (searchSkillsExistingIdx >= 0) {
      // Update command path in case app location changed.
      const existing = mcpServers[searchSkillsExistingIdx];
      const needsPathUpdate =
        existing.transport.type === 'stdio' &&
        existing.transport.command === 'node' &&
        (existing.transport.args || [])[0] !== searchSkillsScriptPath;

      if (needsPathUpdate && existing.transport.type === 'stdio') {
        const updatedTransport: IMcpServer['transport'] = {
          ...existing.transport,
          args: [searchSkillsScriptPath],
        };
        mcpServers[searchSkillsExistingIdx] = {
          ...existing,
          transport: updatedTransport,
          originalJson: buildSearchSkillsOriginalJson(searchSkillsScriptPath),
          updatedAt: now,
        };
        changed = true;
      }
    } else {
      const newServer: IMcpServer = {
        id: BUILTIN_SEARCH_SKILLS_ID,
        name: BUILTIN_SEARCH_SKILLS_NAME,
        description:
          'Built-in tool that lets agents search the full Wayland skill library (~2,000+ entries) by natural language. Returns matching skill bodies inline.',
        enabled: true,
        builtin: true,
        transport: {
          type: 'stdio',
          command: 'node',
          args: [searchSkillsScriptPath],
          env: {},
        },
        createdAt: now,
        updatedAt: now,
        originalJson: buildSearchSkillsOriginalJson(searchSkillsScriptPath),
      };
      mcpServers.push(newServer);
      changed = true;
    }

    // ── Built-in concierge-diag MCP server (Phase 2a) ────────────────────────
    // Read-only diagnostics tool (`wayland_concierge_diag`) that inspects
    // on-disk state to answer "why isn't X working?". The standalone stdio
    // subprocess has no Electron APIs, so the on-disk sources it reads are
    // injected as env vars — using the EXACT same path expressions the app uses
    // to write them:
    //   - WAYLAND_CONFIG_PATH → the config file `configFile` writes (mcp.config).
    //   - WAYLAND_CRON_DB / WAYLAND_PROVIDER_DB / WAYLAND_WORKSPACE_DB → the main
    //     `wayland.db` (resolveDbPath() = path.join(getDataPath(), 'wayland.db'));
    //     CronStore, ProviderRepository, and projects/conversations all share it.
    //   - WAYLAND_LOG_DIR → the electron-log directory (same one getSystemDir()
    //     reports).
    //   - WAYLAND_APP_CONFIG_DIR / WAYLAND_ENGINE_CONFIG_DIR → the two distinct
    //     config locations, for the configPaths report.
    // Enabled by default — the tool is silent unless invoked and never mutates.
    const conciergeDiagScriptPath = getBuiltinMcpScriptPath('builtin-mcp-concierge-diag');
    const conciergeDiagDbPath = path.join(getDataPath(), 'wayland.db');
    const conciergeDiagEnv: Record<string, string> = {
      WAYLAND_CONFIG_PATH: path.join(cacheDir, STORAGE_PATH.config),
      WAYLAND_CRON_DB: conciergeDiagDbPath,
      WAYLAND_PROVIDER_DB: conciergeDiagDbPath,
      // projects + conversations live in the same shared wayland.db (workspace health).
      WAYLAND_WORKSPACE_DB: conciergeDiagDbPath,
      WAYLAND_LOG_DIR: getPlatformServices().paths.getLogsDir(),
      // The two distinct config locations, for the configPaths report: the app
      // settings dir, and the wayland-core engine config dir.
      WAYLAND_APP_CONFIG_DIR: cacheDir,
      WAYLAND_ENGINE_CONFIG_DIR: nativeConfigDir(),
    };
    const conciergeDiagExistingIdx = mcpServers.findIndex(
      (s) => s.builtin === true && s.id === BUILTIN_CONCIERGE_DIAG_ID
    );

    const buildConciergeDiagOriginalJson = (scriptPathValue: string, envValue: Record<string, string>) =>
      JSON.stringify(
        {
          [BUILTIN_CONCIERGE_DIAG_NAME]: {
            command: 'node',
            args: [scriptPathValue],
            env: envValue,
          },
        },
        null,
        2
      );

    if (conciergeDiagExistingIdx >= 0) {
      // Update command path / injected env in case app location or paths changed.
      // Narrow the transport union once so `args`/`env` are accessible (SSE/HTTP
      // variants carry neither).
      const existing = mcpServers[conciergeDiagExistingIdx];
      const existingTransport = existing.transport;
      if (existingTransport.type === 'stdio' && existingTransport.command === 'node') {
        const needsPathUpdate = (existingTransport.args || [])[0] !== conciergeDiagScriptPath;
        const needsEnvUpdate = JSON.stringify(existingTransport.env ?? {}) !== JSON.stringify(conciergeDiagEnv);

        if (needsPathUpdate || needsEnvUpdate) {
          const updatedTransport: IMcpServer['transport'] = {
            ...existingTransport,
            args: [conciergeDiagScriptPath],
            env: conciergeDiagEnv,
          };
          mcpServers[conciergeDiagExistingIdx] = {
            ...existing,
            transport: updatedTransport,
            originalJson: buildConciergeDiagOriginalJson(conciergeDiagScriptPath, conciergeDiagEnv),
            updatedAt: now,
          };
          changed = true;
        }
      }
    } else {
      const newServer: IMcpServer = {
        id: BUILTIN_CONCIERGE_DIAG_ID,
        name: BUILTIN_CONCIERGE_DIAG_NAME,
        description:
          'Built-in read-only diagnostics tool that inspects on-disk state (scheduled tasks, MCP servers, providers, recent errors) to explain why something is not working. Never mutates anything; secrets are masked.',
        enabled: true,
        builtin: true,
        transport: {
          type: 'stdio',
          command: 'node',
          args: [conciergeDiagScriptPath],
          env: conciergeDiagEnv,
        },
        createdAt: now,
        updatedAt: now,
        originalJson: buildConciergeDiagOriginalJson(conciergeDiagScriptPath, conciergeDiagEnv),
      };
      mcpServers.push(newServer);
      changed = true;
    }

    // ── Built-in Playwright MCP server (browser capability, #465) ────────────
    // The upstream @playwright/mcp server, run through the bundled bun (no system
    // Node). Seeded ENABLED so the agent has browser tools out of the box. The
    // `npx`->bun swap is app-side only (McpProtocol), but the wcore engine spawns
    // MCP servers straight from its config.toml — so we pre-resolve the bundled
    // bun HERE (command + `x --bun @playwright/mcp@<ver>`), so every spawn path
    // (wcore engine, ACP CLIs, app SDK) runs it identically with no system Node.
    // Chromium is fetched on first use into PLAYWRIGHT_BROWSERS_PATH; see
    // playwrightBrowsers.ensurePlaywrightChromium (triggered from McpService).
    // SSRF guardrail (#465): block link-local + cloud-metadata origins.
    const playwrightBun = resolveNpxPath(process.env);
    const playwrightArgs = [
      'x',
      '--bun',
      BUILTIN_PLAYWRIGHT_PACKAGE,
      '--blocked-origins',
      BUILTIN_PLAYWRIGHT_BLOCKED_ORIGINS,
    ];
    const playwrightEnv: Record<string, string> = { PLAYWRIGHT_BROWSERS_PATH: getPlaywrightBrowsersDir() };
    const buildPlaywrightOriginalJson = (command: string, args: string[], env: Record<string, string>) =>
      JSON.stringify({ [BUILTIN_PLAYWRIGHT_NAME]: { command, args, env } }, null, 2);
    // Match ANY existing Playwright server, not just our builtin id: a user may
    // already have one (catalog/manual install) whose sanitized name collides
    // with ours — two servers sharing the wcore config.toml [mcp.servers."<name>"]
    // key is a TOML collision. Detect by id / libraryEntryId / name / @playwright/mcp arg.
    const looksLikePlaywright = (s: IMcpServer): boolean => {
      if (s.id === BUILTIN_PLAYWRIGHT_ID) return true;
      if (s.libraryEntryId === BUILTIN_PLAYWRIGHT_LIBRARY_ENTRY_ID) return true;
      if (s.name === BUILTIN_PLAYWRIGHT_NAME) return true;
      return (
        s.transport.type === 'stdio' &&
        (s.transport.args ?? []).some((a) => typeof a === 'string' && a.includes('@playwright/mcp'))
      );
    };
    const playwrightExistingIdx = mcpServers.findIndex(looksLikePlaywright);

    if (playwrightExistingIdx >= 0 && mcpServers[playwrightExistingIdx].id !== BUILTIN_PLAYWRIGHT_ID) {
      // ADOPT a pre-existing user/manual Playwright install: do NOT seed a second
      // server (would collide on the wcore TOML key). The user owns that server's
      // enabled state and args; we leave it untouched.
      console.log('[Wayland] Adopting existing Playwright MCP server; skipping builtin seed');
    } else if (playwrightExistingIdx >= 0) {
      // Our builtin exists → refresh command/args/env in case the bundled bun
      // path, managed browsers dir, or blocked-origins changed across an app
      // update. Never flip `enabled` — respect a user who turned browsing off.
      const existing = mcpServers[playwrightExistingIdx];
      const t = existing.transport;
      if (t.type === 'stdio') {
        const needsUpdate =
          t.command !== playwrightBun ||
          JSON.stringify(t.args ?? []) !== JSON.stringify(playwrightArgs) ||
          JSON.stringify(t.env ?? {}) !== JSON.stringify(playwrightEnv);
        if (needsUpdate) {
          mcpServers[playwrightExistingIdx] = {
            ...existing,
            transport: { ...t, command: playwrightBun, args: playwrightArgs, env: playwrightEnv },
            originalJson: buildPlaywrightOriginalJson(playwrightBun, playwrightArgs, playwrightEnv),
            updatedAt: now,
          };
          changed = true;
        }
      }
    } else {
      const newServer: IMcpServer = {
        id: BUILTIN_PLAYWRIGHT_ID,
        name: BUILTIN_PLAYWRIGHT_NAME,
        description:
          'Headless browser automation (navigate, click, type, screenshot) powered by Playwright. Chromium is downloaded on first use.',
        enabled: true,
        builtin: true,
        source: 'library',
        libraryEntryId: BUILTIN_PLAYWRIGHT_LIBRARY_ENTRY_ID,
        transport: { type: 'stdio', command: playwrightBun, args: playwrightArgs, env: playwrightEnv },
        createdAt: now,
        updatedAt: now,
        originalJson: buildPlaywrightOriginalJson(playwrightBun, playwrightArgs, playwrightEnv),
      };
      mcpServers.push(newServer);
      changed = true;
    }

    if (changed) {
      await configFile.set('mcp.config', mcpServers);
      console.log('[Wayland] Built-in MCP servers ensured');
    }

    // Clear old switch flag after migration
    if (shouldEnable && oldConfig) {
      const { switch: _switch, ...rest } = oldConfig;
      await configFile.set('tools.imageGenerationModel', rest as typeof oldConfig);
    }
  } catch (error) {
    console.error('[Wayland] Failed to ensure built-in MCP servers:', error);
  }
};

/**
 * Cleanup orphaned health-check temporary conversations on startup
 */
const cleanupOrphanedHealthCheckConversations = async () => {
  try {
    const db = await getDatabase();
    const pageSize = 1000;
    const idsToDelete: string[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const result = db.getUserConversations(undefined, page, pageSize);
      result.data.forEach((conversation) => {
        const extra = conversation.extra as { isHealthCheck?: boolean } | undefined;
        if (extra?.isHealthCheck === true) {
          idsToDelete.push(conversation.id);
        }
      });
      hasMore = result.hasMore;
      page += 1;
    }

    let deletedCount = 0;
    idsToDelete.forEach((id) => {
      const deleted = db.deleteConversation(id);
      if (deleted.success && deleted.data) {
        deletedCount += 1;
      }
    });

    if (deletedCount > 0) {
      console.log(`[Wayland] Cleaned up ${deletedCount} orphaned health-check conversation(s) on startup`);
    }
  } catch (error) {
    console.warn('[Wayland] Failed to cleanup orphaned health-check conversations:', error);
  }
};

const initStorage = async () => {
  const t0 = performance.now();
  const mark = (label: string) => console.log(`[Wayland:init] ${label} +${Math.round(performance.now() - t0)}ms`);
  mark('start');

  // 1. Run data migration first (before any directory is created)
  await migrateLegacyData();
  mark('1. migrateLegacyData');

  // 2. Create required directories (after migration so migration can run normally)
  // Use ensureDirectory to handle cases where a regular file blocks the path (#841)
  ensureDirectory(getHomePage());
  ensureDirectory(getDataPath());

  // 3. Initialize the storage system
  ConfigStorage.interceptor(configFile);
  ChatStorage.interceptor(chatFile);
  ChatMessageStorage.interceptor(chatMessageFile);
  EnvStorage.interceptor(envFile);
  mark('3. storage interceptors');

  // 3.1 Config migration only makes sense in standalone server mode (not inside Electron itself)
  if (!hasElectronAppPath()) {
    // Migrate config from Electron desktop app (once, after storage is ready)
    await migrateFromElectronConfig(configFile as unknown as Parameters<typeof migrateFromElectronConfig>[0]);

    // Manual import from specified path (if env var present)
    const importFrom = process.env.IMPORT_CONFIG_FROM;
    if (importFrom) {
      const overwrite = process.env.IMPORT_CONFIG_OVERWRITE === 'true';
      await importConfigFromFile(
        importFrom,
        overwrite,
        configFile as unknown as Parameters<typeof importConfigFromFile>[2]
      );
    }
    mark('3.1 configMigration');
  }

  // 4. Initialize MCP configuration (default config for every user)
  try {
    const existingMcpConfig = await configFile.get('mcp.config').catch((): undefined => undefined);

    // Only write defaults when config is missing or empty (covers new and existing users)
    if (!existingMcpConfig || !Array.isArray(existingMcpConfig) || existingMcpConfig.length === 0) {
      const defaultServers = getDefaultMcpServers();
      await configFile.set('mcp.config', defaultServers);
    }
  } catch (error) {
    console.error('[Wayland] Failed to initialize default MCP servers:', error);
  }
  mark('4.1 MCP defaults');

  // 4.1.5 Startup canary - verify every bundled MCP stdio script actually
  // exists at the resolved dir before we write paths into mcp.config /
  // teamMcpStdioConfig. A missing script means external `node` children
  // crash silently with MODULE_NOT_FOUND, the leader's role prompt advertises
  // `team_*` tools that never register, and the team appears to "not
  // coordinate" with no visible error. Failing loud here beats failing mute
  // at first send.
  //
  // Soft fail in dev (electron-vite's `dev-build-mcp-servers` plugin may not
  // have run yet on the very first boot) - log loudly and continue so the
  // user can see the actionable repro command. Hard fail in packaged mode.
  try {
    const mcpScripts = inspectMcpScripts();
    if (!mcpScripts.ok) {
      console.error('[Wayland] MCP script canary FAILED:\n' + mcpScripts.message);
      if (getPlatformServices().paths.isPackaged()) {
        throw new Error(mcpScripts.message);
      }
    } else {
      console.log(
        `[Wayland] MCP scripts present (${mcpScripts.presentScripts.length}/${mcpScripts.presentScripts.length}) at ${mcpScripts.dir}`
      );
    }
  } catch (error) {
    if (getPlatformServices().paths.isPackaged()) throw error;
    console.error('[Wayland] MCP script canary error:', error);
  }
  mark('4.1.5 mcpScriptCanary');

  // 4.2 Ensure built-in MCP servers exist and are up-to-date
  await ensureBuiltinMcpServers();
  mark('4.2 builtinMcpServers');

  // 4.3 Bundled business-pack extensions are no longer copied out to
  // <userData>/extensions. ExtensionLoader reads them in place from inside the
  // app (asar) via the 'bundled' scan source — loose .md skill bodies tripped
  // AV content heuristics (#275). See getBundledExtensionsDir().
  mark('4.3 bundledExtensions');

  // 5. Initialize builtin assistants
  try {
    // 5.1 Initialize builtin assistant rule files into the user directory
    // Initialize builtin assistant rule files to user directory
    await initBuiltinAssistantRules();
    mark('5.1 initBuiltinAssistantRules');

    // 5.2 Split storage semantics (one-time migration):
    //   - `assistants`        → built-in / preset assistants (isPreset === true)
    //   - `acp.customAgents`  → user-defined custom ACP agents (isPreset !== true)
    //
    // Historical context: v1.9.18 moved every entry from `acp.customAgents` into
    // `assistants`, conflating the two concepts. This migration splits them back.
    const ASSISTANTS_SPLIT_MIGRATION_KEY = 'migration.assistantsSplitCustom';
    const splitMigrationDone = await configFile.get(ASSISTANTS_SPLIT_MIGRATION_KEY).catch(() => false);
    if (!splitMigrationDone) {
      const legacyCustomAgents =
        ((await configFile.get('acp.customAgents').catch((): undefined => undefined)) as
          | AcpBackendConfig[]
          | undefined) || [];
      const currentAssistants =
        ((await configFile.get('assistants').catch((): undefined => undefined)) as AcpBackendConfig[] | undefined) ||
        [];

      const presetsInAssistants = currentAssistants.filter((a) => a.isPreset === true);
      const customsInAssistants = currentAssistants.filter((a) => a.isPreset !== true);

      // Merge customs, dedupe by id (existing acp.customAgents takes priority).
      const existingCustomIds = new Set(legacyCustomAgents.map((a) => a.id));
      const mergedCustoms = [...legacyCustomAgents, ...customsInAssistants.filter((a) => !existingCustomIds.has(a.id))];

      if (mergedCustoms.length > 0) {
        await configFile.set('acp.customAgents', mergedCustoms);
      }
      await configFile.set('assistants', presetsInAssistants);
      await configFile.set(ASSISTANTS_SPLIT_MIGRATION_KEY, true);
    }

    // 5.3 Initialize assistant config (metadata only, no context)
    // Initialize assistant config (metadata only, no context)
    const existingAgents = (await configFile.get('assistants').catch((): undefined => undefined)) || [];
    const builtinAssistants = getBuiltinAssistants();

    // 5.2.0 - Prune stale built-in records whose preset has been dropped from
    // ASSISTANT_PRESETS. The 'builtin-' prefix uniquely identifies preset-
    // sourced rows; any 'builtin-<id>' in storage whose <id> no longer
    // matches a current preset is a residue from an older build (e.g. the
    // social-job-publisher kill in 2026-05-22) and would otherwise keep
    // showing up in the Assistants list across reboots.
    const currentBuiltinIds = new Set(builtinAssistants.map((b) => b.id));

    // 5.2.1 Check whether migration is needed: fix legacy behavior where all assistants defaulted to enabled
    // Check if migration needed: fix old version where all assistants were enabled by default
    const ASSISTANT_ENABLED_MIGRATION_KEY = 'migration.assistantEnabledFixed';
    const migrationDone = await configFile.get(ASSISTANT_ENABLED_MIGRATION_KEY).catch(() => false);
    const needsMigration = !migrationDone && existingAgents.length > 0;

    // 5.2.2 Check whether migration is needed: add default enabled skills for builtin assistants
    // Check if migration needed: add default enabled skills for builtin assistants
    const BUILTIN_SKILLS_MIGRATION_KEY = 'migration.builtinDefaultSkillsAdded_v2';
    const builtinSkillsMigrationDone = await configFile.get(BUILTIN_SKILLS_MIGRATION_KEY).catch(() => false);
    const needsBuiltinSkillsMigration = !builtinSkillsMigrationDone;

    // 5.2.3 Check whether migration is needed: add promptsI18n to builtin assistants
    // Check if migration needed: add promptsI18n for builtin assistants
    const PROMPTS_I18N_MIGRATION_KEY = 'migration.promptsI18nAdded';
    const promptsI18nMigrationDone = await configFile.get(PROMPTS_I18N_MIGRATION_KEY).catch(() => false);
    const needsPromptsI18nMigration = !promptsI18nMigrationDone;

    // Update or add builtin assistant config
    // Update or add built-in assistant configurations
    let updatedAgents = [...existingAgents];
    let hasChanges = false;

    // Drop any builtin-prefixed entries whose preset no longer exists in
    // ASSISTANT_PRESETS. Don't touch user-created custom assistants -
    // those have either a 'custom-' or 'ext-' prefix.
    const beforePrune = updatedAgents.length;
    updatedAgents = updatedAgents.filter((a: AcpBackendConfig) => {
      if (typeof a.id !== 'string') return true;
      if (!a.id.startsWith('builtin-')) return true;
      return currentBuiltinIds.has(a.id);
    });
    if (updatedAgents.length !== beforePrune) {
      hasChanges = true;
    }

    for (const builtin of builtinAssistants) {
      const index = updatedAgents.findIndex((a: AcpBackendConfig) => a.id === builtin.id);
      if (index >= 0) {
        // Update existing builtin assistant config
        // Update existing built-in assistant config
        const existing = updatedAgents[index];
        // Only update when key fields differ to avoid unnecessary writes
        // Update only if key fields are different to avoid unnecessary writes
        // Note: enabled and presetAgentType are user-controlled and excluded from the shouldUpdate decision
        // Note: enabled and presetAgentType are user-controlled, not included in shouldUpdate check
        // Check whether promptsI18n needs updating (missing, changed, or migration required)
        // Check if promptsI18n needs update (if missing, changed, or migration needed)
        const promptsI18nMissing = !existing.promptsI18n && builtin.promptsI18n;
        const promptsI18nChanged =
          existing.promptsI18n &&
          builtin.promptsI18n &&
          JSON.stringify(existing.promptsI18n) !== JSON.stringify(builtin.promptsI18n);
        const needsPromptsI18nUpdate = needsPromptsI18nMigration || promptsI18nMissing || promptsI18nChanged;
        const nameI18nMissing = !existing.nameI18n && !!builtin.nameI18n;
        const nameI18nChanged =
          existing.nameI18n &&
          builtin.nameI18n &&
          JSON.stringify(existing.nameI18n) !== JSON.stringify(builtin.nameI18n);
        const descriptionI18nMissing = !existing.descriptionI18n && !!builtin.descriptionI18n;
        const descriptionI18nChanged =
          existing.descriptionI18n &&
          builtin.descriptionI18n &&
          JSON.stringify(existing.descriptionI18n) !== JSON.stringify(builtin.descriptionI18n);
        const shouldUpdate =
          existing.name !== builtin.name ||
          existing.description !== builtin.description ||
          existing.avatar !== builtin.avatar ||
          existing.isPreset !== builtin.isPreset ||
          existing.isBuiltin !== builtin.isBuiltin ||
          nameI18nMissing ||
          !!nameI18nChanged ||
          descriptionI18nMissing ||
          !!descriptionI18nChanged ||
          needsPromptsI18nUpdate;
        // When enabled is undefined or migration is needed, apply defaults (Cowork enabled, others disabled)
        // When enabled is undefined or migration needed, set default value (Cowork enabled, others disabled)
        const needsEnabledFix = existing.enabled === undefined || needsMigration;
        // On migration force defaults; otherwise preserve user settings
        // Force default value during migration, otherwise preserve user setting
        const resolvedEnabled = needsEnabledFix ? builtin.enabled : existing.enabled;
        // presetAgentType is user-controlled; fall back to the builtin default when unset
        // presetAgentType is user-controlled, use builtin default if not set
        const resolvedPresetAgentType = existing.presetAgentType ?? builtin.presetAgentType;

        // For builtin assistants with defaultEnabledSkills, add default skills (only on migration, when user has not set enabledSkills)
        // Add default enabled skills for builtin assistants with defaultEnabledSkills (only during migration and if user hasn't set enabledSkills)
        let resolvedEnabledSkills = existing.enabledSkills;
        const needsSkillsMigration =
          needsBuiltinSkillsMigration &&
          builtin.enabledSkills &&
          (!existing.enabledSkills || existing.enabledSkills.length === 0);
        if (needsSkillsMigration) {
          resolvedEnabledSkills = builtin.enabledSkills;
        }

        if (
          shouldUpdate ||
          needsEnabledFix ||
          (needsSkillsMigration && resolvedEnabledSkills !== existing.enabledSkills) ||
          needsPromptsI18nUpdate
        ) {
          // Preserve user-set enabled and presetAgentType
          updatedAgents[index] = {
            ...existing,
            ...builtin,
            enabled: resolvedEnabled,
            presetAgentType: resolvedPresetAgentType,
            enabledSkills: resolvedEnabledSkills,
            // Ensure promptsI18n is updated
            promptsI18n: builtin.promptsI18n,
          };
          hasChanges = true;
        }
      } else {
        // Add new builtin assistant
        // Add new built-in assistant
        updatedAgents.unshift(builtin);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await configFile.set('assistants', updatedAgents);
    }

    // Mark migration as done
    if (needsMigration) {
      await configFile.set(ASSISTANT_ENABLED_MIGRATION_KEY, true);
    }
    if (needsBuiltinSkillsMigration) {
      await configFile.set(BUILTIN_SKILLS_MIGRATION_KEY, true);
    }
    if (needsPromptsI18nMigration) {
      await configFile.set(PROMPTS_I18N_MIGRATION_KEY, true);
    }
    mark('5.2 assistant config + migrations');
  } catch (error) {
    console.error('[Wayland] Failed to initialize builtin assistants:', error);
  }

  // 6. Initialize the database (better-sqlite3)
  try {
    await getDatabase();
    await cleanupOrphanedHealthCheckConversations();
  } catch (error) {
    console.error('[InitStorage] Database initialization failed, falling back to file-based storage:', error);
  }
  mark('6. database');

  if (hasElectronAppPath()) {
    application.systemInfo.provider(() => {
      return Promise.resolve(getSystemDir());
    });
  }
  mark('done');
};

export const ProcessConfig = configFile;

export const ProcessChat = chatFile;

export const ProcessChatMessage = chatMessageFile;

export const ProcessEnv = envFile;

export const getSystemDir = () => {
  // electron-log writes to the platform-standard logs directory
  const logDir = getPlatformServices().paths.getLogsDir();

  return {
    cacheDir: cacheDir,
    // getDataPath() returns CLI-safe path (symlink on macOS) to avoid spaces
    // getDataPath() returns a CLI-safe path (symlink on macOS) to avoid space-in-path issues
    workDir: dirConfig?.workDir || getDataPath(),
    logDir,
    platform: process.platform as PlatformType,
    arch: process.arch as ArchitectureType,
    userName: getOsUserName(),
  };
};

/**
 * Get assistant rules directory path (for other modules)
 * Get assistant rules directory path (for use by other modules)
 */
export {
  getAssistantsDir,
  getSkillsDir,
  getBuiltinSkillsCopyDir,
  getAutoSkillsDir,
  getCronSkillsDir,
  BUILTIN_IMAGE_GEN_ID,
  getBuiltinMcpScriptPath,
};

/**
 * Skills content cache to avoid repeated filesystem reads
 * Skills content cache to avoid repeated file system reads
 */
const skillsContentCache = new Map<string, string>();

/**
 * Load content for the given skills (cached)
 * Load content of specified skills (with caching)
 * @param enabledSkills - list of skill names
 * @returns merged skills content
 */
export const loadSkillsContent = async (enabledSkills: string[]): Promise<string> => {
  if (!enabledSkills || enabledSkills.length === 0) {
    return '';
  }

  // Use sorted skill names as the cache key so identical combinations hit the cache
  // Use sorted skill names as cache key to ensure same combinations hit cache
  const cacheKey = [...enabledSkills].toSorted().join(',');
  const cached = skillsContentCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const skillsDir = getSkillsDir();
  const builtinSkillsDir = getAutoSkillsDir();
  const skillContents: string[] = [];

  for (const skillName of enabledSkills) {
    // 1. Auto-enabled builtin: builtin-skills/_builtin/{skillName}/SKILL.md
    const builtinSkillFile = path.join(builtinSkillsDir, skillName, 'SKILL.md');
    // 2. Bundled skill: builtin-skills/{skillName}/SKILL.md
    const bundledSkillFile = path.join(getBuiltinSkillsCopyDir(), skillName, 'SKILL.md');
    // 3. User custom: skills/{skillName}/SKILL.md
    const skillDirFile = path.join(skillsDir, skillName, 'SKILL.md');
    // Backward compatibility: flat structure {skillName}.md
    // Backward compatible: flat structure {skillName}.md
    const skillFlatFile = path.join(skillsDir, `${skillName}.md`);

    try {
      let content: string | null = null;

      if (existsSync(builtinSkillFile)) {
        content = await fs.readFile(builtinSkillFile, 'utf-8');
      } else if (existsSync(bundledSkillFile)) {
        content = await fs.readFile(bundledSkillFile, 'utf-8');
      } else if (existsSync(skillDirFile)) {
        content = await fs.readFile(skillDirFile, 'utf-8');
      } else if (existsSync(skillFlatFile)) {
        content = await fs.readFile(skillFlatFile, 'utf-8');
      }

      if (content && content.trim()) {
        skillContents.push(`## Skill: ${skillName}\n${content}`);
      }
    } catch (error) {
      console.warn(`[Wayland] Failed to load skill ${skillName}:`, error);
    }
  }

  const result = skillContents.length === 0 ? '' : `[Available Skills]\n${skillContents.join('\n\n')}`;

  // Cache result
  skillsContentCache.set(cacheKey, result);

  return result;
};

/**
 * Clear the skills cache (call after skill files are updated)
 * Clear skills cache (call after skills files are updated)
 */
export const clearSkillsCache = (): void => {
  skillsContentCache.clear();
};

export default initStorage;
