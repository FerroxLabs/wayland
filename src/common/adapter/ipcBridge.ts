/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IConfirmation } from '@/common/chat/chatLib';
import type { OpenDialogOptions } from 'electron';
// C1: wrap platform builders so each provider/emitter key is recorded in the
// inbound-dispatch allowlist. Behavior is identical to buildProvider /
// buildEmitter — only the side-effect of allowlist registration differs.
import { buildProvider, buildEmitter } from './bridgeAllowlist';
import type { McpSource } from '../../process/services/mcpServices/McpProtocol';
import type { AgentBackend, AcpModelInfo } from '../types/acpTypes';
import type { SlashCommandItem } from '../chat/slash/types';
import type { IMcpServer, IProvider, TChatConversation, TProviderWithModel, ICssTheme } from '../config/storage';
import type { PreviewHistoryTarget, PreviewSnapshotInfo } from '../types/preview';
import type {
  UpdateCheckRequest,
  UpdateCheckResult,
  UpdateDownloadProgressEvent,
  UpdateDownloadRequest,
  UpdateDownloadResult,
  AutoUpdateStatus,
} from '../update/updateTypes';
import type { ProtocolDetectionRequest, ProtocolDetectionResponse } from '../utils/protocolDetector';
import type { SpeechToTextRequest, SpeechToTextResult } from '../types/speech';
import type { DownloadResult, VoiceAsset } from '../types/voiceAsset';

export const shell = {
  openFile: buildProvider<void, string>('open-file'), // Open file with the system default program
  showItemInFolder: buildProvider<void, string>('show-item-in-folder'), // Open folder
  openExternal: buildProvider<void, string>('open-external'), // Open external link with the system default program
  checkToolInstalled: buildProvider<boolean, { tool: string }>('shell.check-tool-installed'), // Check whether a tool is installed
  openFolderWith: buildProvider<void, { folderPath: string; tool: 'vscode' | 'terminal' | 'explorer' }>(
    'shell.open-folder-with'
  ), // Open a folder with the specified tool
};

// Generic conversation capabilities
export const conversation = {
  create: buildProvider<TChatConversation, ICreateConversationParams>('create-conversation'), // Create conversation
  createWithConversation: buildProvider<
    TChatConversation,
    { conversation: TChatConversation; sourceConversationId?: string; migrateCron?: boolean }
  >('create-conversation-with-conversation'), // Create new conversation from history (supports migration)
  get: buildProvider<TChatConversation, { id: string }>('get-conversation'), // Get conversation info
  getAssociateConversation: buildProvider<TChatConversation[], { conversation_id: string }>(
    'get-associated-conversation'
  ),
  listByCronJob: buildProvider<TChatConversation[], { cronJobId: string }>('conversation.list-by-cron-job'), // Get associated conversations
  remove: buildProvider<boolean, { id: string }>('remove-conversation'), // Delete conversation
  update: buildProvider<boolean, { id: string; updates: Partial<TChatConversation>; mergeExtra?: boolean }>(
    'update-conversation'
  ), // Update conversation info
  reset: buildProvider<void, IResetConversationParams>('reset-conversation'), // Reset conversation
  warmup: buildProvider<void, { conversation_id: string }>('conversation.warmup'), // Warm up conversation (bootstrap)
  stop: buildProvider<IBridgeResponse<{}>, { conversation_id: string }>('chat.stop.stream'), // Stop conversation
  sendMessage: buildProvider<IBridgeResponse<{}>, ISendMessageParams>('chat.send.message'), // Send message (unified interface)
  getSlashCommands: buildProvider<
    IBridgeResponse<{ commands: SlashCommandItem[] }>,
    { conversation_id: string }
  >('conversation.get-slash-commands'),
  askSideQuestion: buildProvider<
    IBridgeResponse<ConversationSideQuestionResult>,
    { conversation_id: string; question: string }
  >('conversation.ask-side-question'),
  confirmMessage: buildProvider<IBridgeResponse, IConfirmMessageParams>('conversation.confirm.message'), // Generic confirm message
  responseStream: buildEmitter<IResponseMessage>('chat.response.stream'), // Receive messages (unified interface)
  turnCompleted: buildEmitter<IConversationTurnCompletedEvent>('conversation.turn.completed'),
  listChanged: buildEmitter<IConversationListChangedEvent>('conversation.list-changed'),
  getWorkspace: buildProvider<
    IDirOrFile[],
    { conversation_id: string; workspace: string; path: string; search?: string }
  >('conversation.get-workspace'),
  responseSearchWorkSpace: buildProvider<void, { file: number; dir: number; match?: IDirOrFile }>(
    'conversation.response.search.workspace'
  ),
  reloadContext: buildProvider<IBridgeResponse, { conversation_id: string }>('conversation.reload-context'),
  setConfig: buildProvider<
    IBridgeResponse,
    {
      conversation_id: string;
      config: { model?: string; thinking?: string; thinking_budget?: number; effort?: string };
    }
  >('conversation.set-config'),
  confirmation: {
    add: buildEmitter<IConfirmation<any> & { conversation_id: string }>('confirmation.add'),
    update: buildEmitter<IConfirmation<any> & { conversation_id: string }>('confirmation.update'),
    confirm: buildProvider<
      IBridgeResponse,
      { conversation_id: string; msg_id: string; data: any; callId: string }
    >('confirmation.confirm'),
    list: buildProvider<IConfirmation<any>[], { conversation_id: string }>('confirmation.list'),
    remove: buildEmitter<{ conversation_id: string; id: string }>('confirmation.remove'),
  },
  // Session-level approval memory for "always allow" decisions
  approval: {
    // Check if action is approved (keys are parsed from action+commandType in backend)
    check: buildProvider<boolean, { conversation_id: string; action: string; commandType?: string }>(
      'approval.check'
    ),
  },
};

// Gemini conversation related interface — reuses the unified conversation interface
export const geminiConversation = {
  sendMessage: conversation.sendMessage,
  confirmMessage: buildProvider<IBridgeResponse, IConfirmMessageParams>('input.confirm.message'),
  responseStream: conversation.responseStream,
};

// CDP status interface
export interface ICdpStatus {
  /** Whether CDP is currently enabled */
  enabled: boolean;
  /** Current CDP port (null if disabled or not started) */
  port: number | null;
  /** Whether CDP was enabled at startup (requires restart to change) */
  startupEnabled: boolean;
  /** All active CDP instances from registry */
  instances: Array<{
    pid: number;
    port: number;
    cwd: string;
    startTime: number;
  }>;
  /** Whether CDP is enabled in the persisted config file (may differ from runtime) */
  configEnabled: boolean;
  /** Whether the app is running in development mode */
  isDevMode: boolean;
}

// CDP config interface
export interface ICdpConfig {
  /** Whether CDP is enabled */
  enabled?: boolean;
  /** Preferred port number */
  port?: number;
}

// Start on boot status interface
export interface IStartOnBootStatus {
  /** Whether the current runtime can manage start-on-boot */
  supported: boolean;
  /** Whether Wayland is currently configured to launch at login */
  enabled: boolean;
  /** Whether the app is running from a packaged build */
  isPackaged: boolean;
  /** Current platform name */
  platform: string;
}

export const application = {
  restart: buildProvider<void, void>('restart-app'), // Restart app
  openDevTools: buildProvider<boolean, void>('open-dev-tools'), // Open/close DevTools, returns the resulting state
  isDevToolsOpened: buildProvider<boolean, void>('is-dev-tools-opened'), // Get current DevTools state
  systemInfo: buildProvider<
    { cacheDir: string; workDir: string; logDir: string; platform: string; arch: string },
    void
  >('system.info'), // Get system info
  getPath: buildProvider<string, { name: 'desktop' | 'home' | 'downloads' }>('app.get-path'), // Get system path
  updateSystemInfo: buildProvider<IBridgeResponse, { cacheDir: string; workDir: string }>('system.update-info'), // Update system info
  getZoomFactor: buildProvider<number, void>('app.get-zoom-factor'),
  setZoomFactor: buildProvider<number, { factor: number }>('app.set-zoom-factor'),
  // CDP (Chrome DevTools Protocol) management
  getCdpStatus: buildProvider<IBridgeResponse<ICdpStatus>, void>('app.get-cdp-status'), // Get CDP status
  updateCdpConfig: buildProvider<IBridgeResponse<ICdpConfig>, Partial<ICdpConfig>>('app.update-cdp-config'), // Update CDP config
  // Start on boot management
  getStartOnBootStatus: buildProvider<IBridgeResponse<IStartOnBootStatus>, void>('app.get-start-on-boot-status'), // Get start-on-boot status
  setStartOnBoot: buildProvider<IBridgeResponse<IStartOnBootStatus>, { enabled: boolean }>(
    'app.set-start-on-boot'
  ), // Set start-on-boot
  // Bridge Main Process logs to Renderer F12 Console
  logStream: buildEmitter<{ level: 'log' | 'warn' | 'error'; tag: string; message: string; data?: unknown }>(
    'app.log-stream'
  ),
  // DevTools state change notification
  devToolsStateChanged: buildEmitter<{ isOpen: boolean }>('app.devtools-state-changed'),
};

// Manual (opt-in) updates via GitHub Releases
export const update = {
  /** Ask the renderer to open the update UI (e.g. from app menu). */
  open: buildEmitter<{ source?: 'menu' | 'about' }>('update.open'),
  /** Check GitHub releases and return latest version info. */
  check: buildProvider<IBridgeResponse<UpdateCheckResult>, UpdateCheckRequest>('update.check'),
  /** Download a chosen release asset (explicit user action). */
  download: buildProvider<IBridgeResponse<UpdateDownloadResult>, UpdateDownloadRequest>('update.download'),
  /** Download progress events emitted by main process. */
  downloadProgress: buildEmitter<UpdateDownloadProgressEvent>('update.download.progress'),
};

// Auto-updater (electron-updater) API
export const autoUpdate = {
  /** Check for updates using electron-updater */
  check: buildProvider<
    IBridgeResponse<{ updateInfo?: { version: string; releaseDate?: string; releaseNotes?: string } }>,
    { includePrerelease?: boolean }
  >('auto-update.check'),
  /** Download update using electron-updater */
  download: buildProvider<IBridgeResponse, void>('auto-update.download'),
  /** Quit and install the downloaded update */
  quitAndInstall: buildProvider<void, void>('auto-update.quit-and-install'),
  /** Auto-update status events */
  status: buildEmitter<AutoUpdateStatus>('auto-update.status'),
  /**
   * Reports whether the auto-update channel initialized successfully on app launch.
   * `available: false` means the bootstrap import failed (e.g. missing module, network);
   * the renderer should surface this so users know auto-updates are disabled until next launch.
   */
  getStatus: buildProvider<{ available: boolean; error?: string }, void>('auto-update.get-status'),
};

export const starOffice = {
  detectUrl: buildProvider<
    IBridgeResponse<{ url: string | null }>,
    { preferredUrl?: string; force?: boolean; timeoutMs?: number }
  >('star-office.detect-url'),
};

export const dialog = {
  showOpen: buildProvider<
    string[] | undefined,
    | { defaultPath?: string; properties?: OpenDialogOptions['properties']; filters?: OpenDialogOptions['filters'] }
    | undefined
  >('show-open'), // Open file/folder selection dialog
};
export const fs = {
  getFilesByDir: buildProvider<Array<IDirOrFile>, { dir: string; root: string }>('get-file-by-dir'), // Get list of all folders and files under a directory
  listWorkspaceFiles: buildProvider<Array<IWorkspaceFlatFile>, { root: string }>('list-workspace-files'),
  getImageBase64: buildProvider<string, { path: string }>('get-image-base64'), // Get image as base64
  fetchRemoteImage: buildProvider<string, { url: string }>('fetch-remote-image'), // Convert remote image to base64
  readFile: buildProvider<string, { path: string }>('read-file'), // Read file content (UTF-8)
  readFileBuffer: buildProvider<ArrayBuffer, { path: string }>('read-file-buffer'), // Read binary file as ArrayBuffer
  createTempFile: buildProvider<string, { fileName: string }>('create-temp-file'), // Create temp file
  createUploadFile: buildProvider<string, { fileName: string; conversationId?: string }>('create-upload-file'), // Create upload file (location decided by settings)
  writeFile: buildProvider<boolean, { path: string; data: Uint8Array | string }>('write-file'), // Write file
  createZip: buildProvider<
    boolean,
    {
      path: string;
      requestId?: string;
      files: Array<{
        /** Path inside zip (supports nested paths like "topic-1/workspace/a.txt") */
        name: string;
        /** Text or binary content to write into zip */
        content?: string | Uint8Array;
        /** Absolute file path on disk, zip bridge will read and pack it */
        sourcePath?: string;
      }>;
    }
  >('create-zip-file'), // Create zip file
  cancelZip: buildProvider<boolean, { requestId: string }>('cancel-zip-file'), // Cancel zip creation task
  getFileMetadata: buildProvider<IFileMetadata, { path: string }>('get-file-metadata'), // Get file metadata
  copyFilesToWorkspace: buildProvider<
    // Return details for successful and failed copies for better UI feedback
    IBridgeResponse<{ copiedFiles: string[]; failedFiles?: Array<{ path: string; error: string }> }>,
    { filePaths: string[]; workspace: string; sourceRoot?: string }
  >('copy-files-to-workspace'), // Copy files into workspace
  removeEntry: buildProvider<IBridgeResponse, { path: string }>('remove-entry'), // Delete file or folder
  renameEntry: buildProvider<IBridgeResponse<{ newPath: string }>, { path: string; newName: string }>(
    'rename-entry'
  ), // Rename file or folder
  readBuiltinRule: buildProvider<string, { fileName: string }>('read-builtin-rule'), // Read builtin rules file
  readBuiltinSkill: buildProvider<string, { fileName: string }>('read-builtin-skill'), // Read builtin skills file
  // Assistant rule file operations
  readAssistantRule: buildProvider<string, { assistantId: string; locale?: string }>('read-assistant-rule'), // Read assistant rule file
  writeAssistantRule: buildProvider<boolean, { assistantId: string; content: string; locale?: string }>(
    'write-assistant-rule'
  ), // Write assistant rule file
  deleteAssistantRule: buildProvider<boolean, { assistantId: string }>('delete-assistant-rule'), // Delete assistant rule file
  // Assistant skill file operations
  readAssistantSkill: buildProvider<string, { assistantId: string; locale?: string }>('read-assistant-skill'), // Read assistant skill file
  writeAssistantSkill: buildProvider<boolean, { assistantId: string; content: string; locale?: string }>(
    'write-assistant-skill'
  ), // Write assistant skill file
  deleteAssistantSkill: buildProvider<boolean, { assistantId: string }>('delete-assistant-skill'), // Delete assistant skill file
  // List available skills from skills directory
  listAvailableSkills: buildProvider<
    Array<{
      name: string;
      description: string;
      location: string;
      isCustom: boolean;
      source: 'builtin' | 'custom' | 'extension';
    }>,
    void
  >('list-available-skills'),
  // List builtin auto-injected skills from _builtin directory
  listBuiltinAutoSkills: buildProvider<Array<{ name: string; description: string }>, void>(
    'list-builtin-auto-skills'
  ),
  // Read skill info without importing
  readSkillInfo: buildProvider<IBridgeResponse<{ name: string; description: string }>, { skillPath: string }>(
    'read-skill-info'
  ),
  // Import skill directory
  importSkill: buildProvider<IBridgeResponse<{ skillName: string }>, { skillPath: string }>('import-skill'),
  // Scan directory for skills
  scanForSkills: buildProvider<
    IBridgeResponse<Array<{ name: string; description: string; path: string }>>,
    { folderPath: string }
  >('scan-for-skills'),
  // Detect common skills paths
  detectCommonSkillPaths: buildProvider<IBridgeResponse<Array<{ name: string; path: string }>>, void>(
    'detect-common-skill-paths'
  ),
  // Detect external skills with counts (for Skills Hub)
  detectAndCountExternalSkills: buildProvider<
    IBridgeResponse<
      Array<{
        name: string;
        path: string;
        source: string;
        skills: Array<{ name: string; description: string; path: string }>;
      }>
    >,
    void
  >('detect-and-count-external-skills'),
  // Import skill via symlink
  importSkillWithSymlink: buildProvider<IBridgeResponse<{ skillName: string }>, { skillPath: string }>(
    'import-skill-with-symlink'
  ),
  // Delete custom skill
  deleteSkill: buildProvider<IBridgeResponse, { skillName: string }>('delete-skill'),
  // Get skill storage paths
  getSkillPaths: buildProvider<{ userSkillsDir: string; builtinSkillsDir: string }, void>('get-skill-paths'),
  // Export skill to external directory via symlink
  exportSkillWithSymlink: buildProvider<IBridgeResponse, { skillPath: string; targetDir: string }>(
    'export-skill-with-symlink'
  ),
  // Custom external skill paths management
  getCustomExternalPaths: buildProvider<Array<{ name: string; path: string }>, void>(
    'get-custom-external-paths'
  ),
  addCustomExternalPath: buildProvider<IBridgeResponse, { name: string; path: string }>(
    'add-custom-external-path'
  ),
  removeCustomExternalPath: buildProvider<IBridgeResponse, { path: string }>('remove-custom-external-path'),
};

export const speechToText = {
  transcribe: buildProvider<SpeechToTextResult, SpeechToTextRequest>('speech-to-text.transcribe'),
};

export const voiceAsset = {
  download: buildProvider<DownloadResult, VoiceAsset>('voice-asset.download'),
  cancel: buildProvider<{ cancelled: boolean }, { assetId: string }>('voice-asset.cancel'),
};

export const fileWatch = {
  startWatch: buildProvider<IBridgeResponse, { filePath: string }>('file-watch-start'), // Start watching file changes
  stopWatch: buildProvider<IBridgeResponse, { filePath: string }>('file-watch-stop'), // Stop watching file changes
  stopAllWatches: buildProvider<IBridgeResponse, void>('file-watch-stop-all'), // Stop all file watches
  fileChanged: buildEmitter<{ filePath: string; eventType: string }>('file-changed'), // File change event
};

// Workspace office file scan (detects current .pptx/.docx/.xlsx)
export const workspaceOfficeWatch = {
  scan: buildProvider<string[], { workspace: string }>('workspace-office-watch-scan'),
};

// File streaming updates (real-time content push when agent writes)
export const fileStream = {
  contentUpdate: buildEmitter<{
    filePath: string; // Absolute file path
    content: string; // New content
    workspace: string; // Workspace root directory
    relativePath: string; // Relative path
    operation: 'write' | 'delete'; // Operation type
  }>('file-stream-content-update'), // Streaming content update when agent writes file
};

// File snapshot providers for tracking file changes
export const fileSnapshot = {
  init: buildProvider<import('@/common/types/fileSnapshot').SnapshotInfo, { workspace: string }>(
    'file-snapshot-init'
  ),
  compare: buildProvider<import('@/common/types/fileSnapshot').CompareResult, { workspace: string }>(
    'file-snapshot-compare'
  ),
  getBaselineContent: buildProvider<string | null, { workspace: string; filePath: string }>(
    'file-snapshot-baseline'
  ),
  getInfo: buildProvider<import('@/common/types/fileSnapshot').SnapshotInfo, { workspace: string }>(
    'file-snapshot-info'
  ),
  dispose: buildProvider<void, { workspace: string }>('file-snapshot-dispose'),
  stageFile: buildProvider<void, { workspace: string; filePath: string }>('file-snapshot-stage-file'),
  stageAll: buildProvider<void, { workspace: string }>('file-snapshot-stage-all'),
  unstageFile: buildProvider<void, { workspace: string; filePath: string }>('file-snapshot-unstage-file'),
  unstageAll: buildProvider<void, { workspace: string }>('file-snapshot-unstage-all'),
  discardFile: buildProvider<
    void,
    { workspace: string; filePath: string; operation: import('@/common/types/fileSnapshot').FileChangeOperation }
  >('file-snapshot-discard-file'),
  resetFile: buildProvider<
    void,
    { workspace: string; filePath: string; operation: import('@/common/types/fileSnapshot').FileChangeOperation }
  >('file-snapshot-reset-file'),
  getBranches: buildProvider<string[], { workspace: string }>('file-snapshot-get-branches'),
};

export const googleAuth = {
  login: buildProvider<IBridgeResponse<{ account: string }>, { proxy?: string }>('google.auth.login'),
  logout: buildProvider<void, {}>('google.auth.logout'),
  status: buildProvider<IBridgeResponse<{ account: string }>, { proxy?: string }>('google.auth.status'),
};

// Subscription check for Gemini models: used to dynamically decide whether to show gemini-3.1-pro-preview
export const gemini = {
  subscriptionStatus: buildProvider<
    IBridgeResponse<{ isSubscriber: boolean; tier?: string; lastChecked: number; message?: string }>,
    { proxy?: string }
  >('gemini.subscription-status'),
};

// AWS Bedrock interfaces
export const bedrock = {
  testConnection: buildProvider<
    IBridgeResponse<{ msg?: string }>,
    {
      bedrockConfig: {
        authMethod: 'accessKey' | 'profile';
        region: string;
        accessKeyId?: string;
        secretAccessKey?: string;
        profile?: string;
      };
    }
  >('bedrock.test-connection'),
};

export const mode = {
  fetchModelList: buildProvider<
    IBridgeResponse<{ mode: Array<string | { id: string; name: string }>; fix_base_url?: string }>,
    {
      base_url?: string;
      api_key: string;
      try_fix?: boolean;
      platform?: string;
      bedrockConfig?: {
        authMethod: 'accessKey' | 'profile';
        region: string;
        accessKeyId?: string;
        secretAccessKey?: string;
        profile?: string;
      };
    }
  >('mode.get-model-list'),
  saveModelConfig: buildProvider<IBridgeResponse, IProvider[]>('mode.save-model-config'),
  getModelConfig: buildProvider<IProvider[], void>('mode.get-model-config'),
  /** Protocol detection - auto-detect API protocol type */
  detectProtocol: buildProvider<IBridgeResponse<ProtocolDetectionResponse>, ProtocolDetectionRequest>(
    'mode.detect-protocol'
  ),
};

// ACP conversation related interface — reuses the unified conversation interface
export const acpConversation = {
  sendMessage: conversation.sendMessage,
  responseStream: conversation.responseStream,
  detectCliPath: buildProvider<IBridgeResponse<{ path?: string }>, { backend: string }>('acp.detect-cli-path'),
  getAvailableAgents: buildProvider<
    IBridgeResponse<
      Array<{
        backend: string;
        name: string;
        kind?: string;
        cliPath?: string;
        supportedTransports?: string[];
        isExtension?: boolean;
        extensionName?: string;
        isPreset?: boolean;
        customAgentId?: string;
      }>
    >,
    void
  >('acp.get-available-agents'),
  checkEnv: buildProvider<{ env: Record<string, string> }, void>('acp.check.env'),
  // AUDIT-05 F19: surface AgentRegistry load failures (e.g. remote-agent DB
  // read errors) to the renderer so the UI can distinguish "no agents
  // configured" from "agent loading failed". Sibling to getAvailableAgents
  // so 10+ existing consumers of getAvailableAgents.data stay unchanged.
  getLoadErrors: buildProvider<IBridgeResponse<string[]>, void>('acp.get-load-errors'),
  refreshCustomAgents: buildProvider<IBridgeResponse, void>('acp.refresh-custom-agents'),
  testCustomAgent: buildProvider<
    IBridgeResponse<{ step: 'cli_check' | 'acp_initialize'; error?: string }>,
    { command: string; acpArgs?: string[]; env?: Record<string, string> }
  >('acp.test-custom-agent'),
  checkAgentHealth: buildProvider<
    IBridgeResponse<{ available: boolean; latency?: number; error?: string }>,
    { backend: AgentBackend }
  >('acp.check-agent-health'),
  // Set session mode for ACP agents (claude, qwen, etc.)
  setMode: buildProvider<IBridgeResponse<{ mode: string }>, { conversationId: string; mode: string }>(
    'acp.set-mode'
  ),
  // Get current session mode for ACP agents
  getMode: buildProvider<IBridgeResponse<{ mode: string; initialized: boolean }>, { conversationId: string }>(
    'acp.get-mode'
  ),
  // Get model info for ACP agents (model name and available models)
  getModelInfo: buildProvider<IBridgeResponse<{ modelInfo: AcpModelInfo | null }>, { conversationId: string }>(
    'acp.get-model-info'
  ),
  // Set model for ACP agents
  setModel: buildProvider<
    IBridgeResponse<{ modelInfo: AcpModelInfo | null }>,
    { conversationId: string; modelId: string }
  >('acp.set-model'),
  // Get non-model config options for ACP agents (e.g., reasoning effort)
  getConfigOptions: buildProvider<
    IBridgeResponse<{ configOptions: import('../types/acpTypes').AcpSessionConfigOption[] }>,
    { conversationId: string }
  >('acp.get-config-options'),
  // Set a config option value for ACP agents (e.g., reasoning effort)
  setConfigOption: buildProvider<
    IBridgeResponse<{ configOptions: import('../types/acpTypes').AcpSessionConfigOption[] }>,
    { conversationId: string; configId: string; value: string }
  >('acp.set-config-option'),
};

// MCP service related interface
export const mcpService = {
  getAgentMcpConfigs: buildProvider<
    IBridgeResponse<Array<{ source: McpSource; servers: IMcpServer[] }>>,
    Array<{ backend: string; name: string; cliPath?: string }>
  >('mcp.get-agent-configs'),
  testMcpConnection: buildProvider<
    IBridgeResponse<{
      success: boolean;
      tools?: Array<{ name: string; description?: string; _meta?: Record<string, unknown> }>;
      error?: string;
      needsAuth?: boolean;
      authMethod?: 'oauth' | 'basic';
      wwwAuthenticate?: string;
    }>,
    IMcpServer
  >('mcp.test-connection'),
  syncMcpToAgents: buildProvider<
    IBridgeResponse<{ success: boolean; results: Array<{ agent: string; success: boolean; error?: string }> }>,
    { mcpServers: IMcpServer[]; agents: Array<{ backend: string; name: string; cliPath?: string }> }
  >('mcp.sync-to-agents'),
  removeMcpFromAgents: buildProvider<
    IBridgeResponse<{ success: boolean; results: Array<{ agent: string; success: boolean; error?: string }> }>,
    { mcpServerName: string; agents: Array<{ backend: string; name: string; cliPath?: string }> }
  >('mcp.remove-from-agents'),
  // OAuth-related interfaces
  checkOAuthStatus: buildProvider<
    IBridgeResponse<{ isAuthenticated: boolean; needsLogin: boolean; error?: string }>,
    IMcpServer
  >('mcp.check-oauth-status'),
  loginMcpOAuth: buildProvider<
    IBridgeResponse<{ success: boolean; error?: string }>,
    { server: IMcpServer; config?: any }
  >('mcp.login-oauth'),
  logoutMcpOAuth: buildProvider<IBridgeResponse, string>('mcp.logout-oauth'),
  getAuthenticatedServers: buildProvider<IBridgeResponse<string[]>, void>('mcp.get-authenticated-servers'),
};

// Codex conversation related interface — reuses the unified conversation interface
export const codexConversation = {
  sendMessage: conversation.sendMessage,
  responseStream: conversation.responseStream,
};

// OpenClaw conversation related interface — reuses the unified conversation interface
export const openclawConversation = {
  sendMessage: conversation.sendMessage,
  responseStream: buildEmitter<IResponseMessage>('openclaw.response.stream'),
  getRuntime: buildProvider<
    IBridgeResponse<{
      conversationId: string;
      runtime: {
        workspace?: string;
        backend?: string;
        agentName?: string;
        cliPath?: string;
        model?: string;
        sessionKey?: string | null;
        isConnected?: boolean;
        hasActiveSession?: boolean;
        identityHash?: string | null;
      };
      expected?: {
        expectedWorkspace?: string;
        expectedBackend?: string;
        expectedAgentName?: string;
        expectedCliPath?: string;
        expectedModel?: string;
        expectedIdentityHash?: string | null;
        switchedAt?: number;
      };
    }>,
    { conversation_id: string }
  >('openclaw.get-runtime'),
};

// Remote Agent configuration CRUD
export const remoteAgent = {
  list: buildProvider<import('@process/agent/remote/types').RemoteAgentConfig[], void>('remote-agent.list'),
  get: buildProvider<import('@process/agent/remote/types').RemoteAgentConfig | null, { id: string }>(
    'remote-agent.get'
  ),
  create: buildProvider<
    import('@process/agent/remote/types').RemoteAgentConfig,
    import('@process/agent/remote/types').RemoteAgentInput
  >('remote-agent.create'),
  update: buildProvider<
    boolean,
    { id: string; updates: Partial<import('@process/agent/remote/types').RemoteAgentInput> }
  >('remote-agent.update'),
  delete: buildProvider<boolean, { id: string }>('remote-agent.delete'),
  testConnection: buildProvider<
    { success: boolean; error?: string },
    { url: string; authType: string; authToken?: string; allowInsecure?: boolean }
  >('remote-agent.test-connection'),
  handshake: buildProvider<{ status: 'ok' | 'pending_approval' | 'error'; error?: string }, { id: string }>(
    'remote-agent.handshake'
  ),
};

// Database operations
export const database = {
  getConversationMessages: buildProvider<
    import('@/common/chat/chatLib').TMessage[],
    { conversation_id: string; page?: number; pageSize?: number }
  >('database.get-conversation-messages'),
  getUserConversations: buildProvider<
    import('@/common/config/storage').TChatConversation[],
    { page?: number; pageSize?: number }
  >('database.get-user-conversations'),
  searchConversationMessages: buildProvider<
    import('../types/database').IMessageSearchResponse,
    { keyword: string; page?: number; pageSize?: number }
  >('database.search-conversation-messages'),
};

export const previewHistory = {
  list: buildProvider<PreviewSnapshotInfo[], { target: PreviewHistoryTarget }>('preview-history.list'),
  save: buildProvider<PreviewSnapshotInfo, { target: PreviewHistoryTarget; content: string }>(
    'preview-history.save'
  ),
  getContent: buildProvider<
    { snapshot: PreviewSnapshotInfo; content: string } | null,
    { target: PreviewHistoryTarget; snapshotId: string }
  >('preview-history.get-content'),
};

// Preview panel API
export const preview = {
  // Agent triggers open preview (e.g., chrome-devtools navigates to URL)
  open: buildEmitter<{
    content: string; // URL or content
    contentType: import('../types/preview').PreviewContentType; // Content type
    metadata?: {
      title?: string;
      fileName?: string;
    };
  }>('preview.open'),
};

export const document = {
  convert: buildProvider<
    import('../types/conversion').DocumentConversionResponse,
    import('../types/conversion').DocumentConversionRequest
  >('document.convert'),
};

// PPT preview via officecli watch
export const pptPreview = {
  start: buildProvider<{ url: string }, { filePath: string }>('ppt-preview.start'),
  stop: buildProvider<void, { filePath: string }>('ppt-preview.stop'),
  status: buildEmitter<{ state: 'starting' | 'installing' | 'ready' | 'error'; message?: string }>(
    'ppt-preview.status'
  ),
};

// Word preview via officecli watch
export const wordPreview = {
  start: buildProvider<{ url: string }, { filePath: string }>('word-preview.start'),
  stop: buildProvider<void, { filePath: string }>('word-preview.stop'),
  status: buildEmitter<{ state: 'starting' | 'installing' | 'ready' | 'error'; message?: string }>(
    'word-preview.status'
  ),
};

// Excel preview via officecli watch
export const excelPreview = {
  start: buildProvider<{ url: string }, { filePath: string }>('excel-preview.start'),
  stop: buildProvider<void, { filePath: string }>('excel-preview.stop'),
  status: buildEmitter<{ state: 'starting' | 'installing' | 'ready' | 'error'; message?: string }>(
    'excel-preview.status'
  ),
};

// Deep link protocol handling
export const deepLink = {
  /** Emitted when app is opened via wayland:// protocol URL */
  received: buildEmitter<{
    action: string; // e.g. 'add-provider'
    params: Record<string, string>; // parsed query params
    /**
     * Decoded base64-JSON payload from the `data` query param, if present.
     * Typed as `unknown` — consumers MUST validate the shape before reading
     * any field (M8: prevents attacker-controlled key injection).
     */
    decoded?: unknown;
  }>('deep-link.received'),
};

// Window controls API
export const windowControls = {
  minimize: buildProvider<void, void>('window-controls:minimize'),
  maximize: buildProvider<void, void>('window-controls:maximize'),
  unmaximize: buildProvider<void, void>('window-controls:unmaximize'),
  close: buildProvider<void, void>('window-controls:close'),
  isMaximized: buildProvider<boolean, void>('window-controls:is-maximized'),
  maximizedChanged: buildEmitter<{ isMaximized: boolean }>('window-controls:maximized-changed'),
};

// System settings API
export const systemSettings = {
  getCloseToTray: buildProvider<boolean, void>('system-settings:get-close-to-tray'),
  setCloseToTray: buildProvider<void, { enabled: boolean }>('system-settings:set-close-to-tray'),
  getNotificationEnabled: buildProvider<boolean, void>('system-settings:get-notification-enabled'),
  setNotificationEnabled: buildProvider<void, { enabled: boolean }>('system-settings:set-notification-enabled'),
  getCronNotificationEnabled: buildProvider<boolean, void>('system-settings:get-cron-notification-enabled'),
  setCronNotificationEnabled: buildProvider<void, { enabled: boolean }>(
    'system-settings:set-cron-notification-enabled'
  ),
  getKeepAwake: buildProvider<boolean, void>('system-settings:get-keep-awake'),
  setKeepAwake: buildProvider<void, { enabled: boolean }>('system-settings:set-keep-awake'),
  changeLanguage: buildProvider<void, { language: string }>('system-settings:change-language'),
  // Broadcast language change to all renderers (desktop + WebUI) for real-time sync
  languageChanged: buildEmitter<{ language: string }>('system-settings:language-changed'),
  getSaveUploadToWorkspace: buildProvider<boolean, void>('system-settings:get-save-upload-to-workspace'),
  setSaveUploadToWorkspace: buildProvider<void, { enabled: boolean }>(
    'system-settings:set-save-upload-to-workspace'
  ),
  getAutoPreviewOfficeFiles: buildProvider<boolean, void>('system-settings:get-auto-preview-office-files'),
  setAutoPreviewOfficeFiles: buildProvider<void, { enabled: boolean }>(
    'system-settings:set-auto-preview-office-files'
  ),
};

// Ambient Mode — M1 bubble window (AC-M1-5 / AC-M1-10 / AC-M1-11 / AC-M1-13)
export type IAmbientBubblePosition = { x: number; y: number; displayId: number };
export const ambient = {
  getBubblePosition: buildProvider<IAmbientBubblePosition | null, void>('ambient.getBubblePosition'),
  setBubblePosition: buildProvider<void, IAmbientBubblePosition>('ambient.setBubblePosition'),
  getEnabled: buildProvider<boolean, void>('ambient.getEnabled'),
  setEnabled: buildProvider<void, { enabled: boolean }>('ambient.setEnabled'),
};

// System notification API
export type INotificationOptions = {
  title: string;
  body: string;
  icon?: string;
  conversationId?: string;
};

export const notification = {
  show: buildProvider<void, INotificationOptions>('notification.show'),
  clicked: buildEmitter<{ conversationId?: string }>('notification.clicked'),
};

// Task management API
export const task = {
  stopAll: buildProvider<{ success: boolean; count: number }, void>('task.stop-all'),
  getRunningCount: buildProvider<{ success: boolean; count: number }, void>('task.get-running-count'),
};

// WebUI service management API
export interface IWebUIStatus {
  running: boolean;
  port: number;
  allowRemote: boolean;
  localUrl: string;
  networkUrl?: string;
  lanIP?: string; // LAN IP for building remote access URL
  adminUsername: string;
  initialPassword?: string;
}

export const webui = {
  // Get WebUI status
  getStatus: buildProvider<IBridgeResponse<IWebUIStatus>, void>('webui.get-status'),
  // Start WebUI
  start: buildProvider<
    IBridgeResponse<{ port: number; localUrl: string; networkUrl?: string; lanIP?: string; initialPassword?: string }>,
    { port?: number; allowRemote?: boolean }
  >('webui.start'),
  // Stop WebUI
  stop: buildProvider<IBridgeResponse, void>('webui.stop'),
  // Change password (no current password required)
  changePassword: buildProvider<IBridgeResponse, { newPassword: string }>('webui.change-password'),
  changeUsername: buildProvider<IBridgeResponse<{ username: string }>, { newUsername: string }>(
    'webui.change-username'
  ),
  // Reset password (generate new random password)
  resetPassword: buildProvider<IBridgeResponse<{ newPassword: string }>, void>('webui.reset-password'),
  // Generate QR login token
  generateQRToken: buildProvider<IBridgeResponse<{ token: string; expiresAt: number; qrUrl: string }>, void>(
    'webui.generate-qr-token'
  ),
  // Verify QR token
  verifyQRToken: buildProvider<IBridgeResponse<{ sessionToken: string; username: string }>, { qrToken: string }>(
    'webui.verify-qr-token'
  ),
  // Status changed event
  statusChanged: buildEmitter<{ running: boolean; port?: number; localUrl?: string; networkUrl?: string }>(
    'webui.status-changed'
  ),
  // Password reset result event (workaround for provider return value issue)
  resetPasswordResult: buildEmitter<{ success: boolean; newPassword?: string; msg?: string }>(
    'webui.reset-password-result'
  ),
  // Paired devices
  listPairedDevices: buildProvider<
    IBridgeResponse<{
      devices: Array<{
        id: string;
        deviceName: string;
        ua: string;
        ipFirstSeen: string;
        lastSeenAt: number;
        createdAt: number;
      }>;
    }>,
    void
  >('webui.list-paired-devices'),
  revokeDevice: buildProvider<IBridgeResponse, { id: string }>('webui.revoke-device'),
  // Activity log
  activityLog: buildProvider<
    IBridgeResponse<{
      events: Array<{
        id: string;
        type: 'login' | 'command' | 'chat' | 'paired-device-added' | 'paired-device-revoked';
        detail: string;
        deviceId?: string;
        ts: number;
      }>;
    }>,
    { limit?: number }
  >('webui.activity-log'),
};

// Cron job management API
export const cron = {
  // Query
  listJobs: buildProvider<ICronJob[], void>('cron.list-jobs'),
  listJobsByConversation: buildProvider<ICronJob[], { conversationId: string }>(
    'cron.list-jobs-by-conversation'
  ),
  getJob: buildProvider<ICronJob | null, { jobId: string }>('cron.get-job'),
  // CRUD
  addJob: buildProvider<ICronJob, ICreateCronJobParams>('cron.add-job'),
  updateJob: buildProvider<ICronJob, { jobId: string; updates: Partial<ICronJob> }>('cron.update-job'),
  removeJob: buildProvider<void, { jobId: string }>('cron.remove-job'),
  runNow: buildProvider<{ conversationId: string }, { jobId: string }>('cron.run-now'),
  saveSkill: buildProvider<void, { jobId: string; content: string }>('cron.save-skill'),
  hasSkill: buildProvider<boolean, { jobId: string }>('cron.has-skill'),
  // Events
  onJobCreated: buildEmitter<ICronJob>('cron.job-created'),
  onJobUpdated: buildEmitter<ICronJob>('cron.job-updated'),
  onJobRemoved: buildEmitter<{ jobId: string }>('cron.job-removed'),
  onJobExecuted: buildEmitter<{ jobId: string; status: 'ok' | 'error' | 'skipped' | 'missed'; error?: string }>(
    'cron.job-executed'
  ),
};

// Cron job types for IPC
export type ICronSchedule =
  | { kind: 'at'; atMs: number; description: string }
  | { kind: 'every'; everyMs: number; description: string }
  | { kind: 'cron'; expr: string; tz?: string; description: string };

export interface ICronJob {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  schedule: ICronSchedule;
  target: {
    payload: { kind: 'message'; text: string };
    executionMode?: 'existing' | 'new_conversation';
  };
  metadata: {
    conversationId: string;
    conversationTitle?: string;
    agentType: AgentBackend;
    createdBy: 'user' | 'agent';
    createdAt: number;
    updatedAt: number;
    agentConfig?: ICronAgentConfig;
  };
  state: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastStatus?: 'ok' | 'error' | 'skipped' | 'missed';
    lastError?: string;
    runCount: number;
    retryCount: number;
    maxRetries: number;
  };
}

export interface ICronAgentConfig {
  backend: AgentBackend;
  name: string;
  cliPath?: string;
  isPreset?: boolean;
  customAgentId?: string;
  presetAgentType?: string;
  mode?: string;
  modelId?: string;
  configOptions?: Record<string, string>;
  workspace?: string;
}

export interface ICreateCronJobParams {
  name: string;
  description?: string;
  schedule: ICronSchedule;
  /** New UI system uses `prompt`; old skill system uses `message` */
  prompt?: string;
  message?: string;
  conversationId: string;
  conversationTitle?: string;
  agentType: AgentBackend;
  createdBy: 'user' | 'agent';
  executionMode?: 'existing' | 'new_conversation';
  agentConfig?: ICronAgentConfig;
}

interface ISendMessageParams {
  input: string;
  msg_id: string;
  conversation_id: string;
  files?: string[];
  loading_id?: string;
  /** Skill names to inject into the message (used by agents with file-reading ability) */
  injectSkills?: string[];
}

// Unified confirm message params for all agents (Gemini, ACP, Codex)
export interface IConfirmMessageParams {
  confirmKey: string;
  msg_id: string;
  conversation_id: string;
  callId: string;
}

export interface ICreateConversationParams {
  type: 'gemini' | 'acp' | 'codex' | 'openclaw-gateway' | 'nanobot' | 'remote' | 'wcore';
  id?: string;
  name?: string;
  model: TProviderWithModel;
  extra: {
    workspace?: string;
    customWorkspace?: boolean;
    defaultFiles?: string[];
    backend?: AgentBackend;
    cliPath?: string;
    webSearchEngine?: 'google' | 'default';
    agentName?: string;
    customAgentId?: string;
    context?: string;
    contextFileName?: string; // For gemini preset agents
    // System rules for smart assistants
    presetRules?: string; // system rules injected at initialization
    /** Enabled skills list for filtering SkillManager skills */
    enabledSkills?: string[];
    /**
     * Preset context/rules to inject into the first message.
     * Used by smart assistants to provide custom prompts/rules.
     * For Gemini: injected via contextContent
     * For ACP/Codex: injected via <system_instruction> tag in first message
     */
    presetContext?: string;
    /** Preset assistant ID for displaying name and avatar in conversation panel */
    presetAssistantId?: string;
    /** Initial session mode selected on Guid page (from AgentModeSelector) */
    sessionMode?: string;
    /** User-selected Codex model from Guid page */
    codexModel?: string;
    /** Pre-selected ACP model from Guid page (cached model list) */
    currentModelId?: string;
    /** Cached config options from Guid page for immediate display in conversation */
    cachedConfigOptions?: import('../types/acpTypes').AcpSessionConfigOption[];
    /** Pending config option selections from Guid page (applied after session creation) */
    pendingConfigOptions?: Record<string, string>;
    /** Runtime validation snapshot used for post-switch strong checks (OpenClaw) */
    runtimeValidation?: {
      expectedWorkspace?: string;
      expectedBackend?: string;
      expectedAgentName?: string;
      expectedCliPath?: string;
      expectedModel?: string;
      expectedIdentityHash?: string | null;
      switchedAt?: number;
    };
    /** Explicit marker for temporary health-check conversations */
    isHealthCheck?: boolean;
    /** Remote agent config ID (FK to remote_agents table) — required when type='remote' */
    remoteAgentId?: string;
    /** Extra skill directory paths to symlink into workspace (e.g. cron job skill dirs) */
    extraSkillPaths?: string[];
    /** Builtin skill names to exclude from auto-injection (e.g. 'cron' for cron-spawned conversations) */
    excludeBuiltinSkills?: string[];
    /** Team ownership — conversations with teamId are hidden from the sidebar */
    teamId?: string;
  };
}
interface IResetConversationParams {
  id?: string;
  gemini?: {
    clearCachedCredentialFile?: boolean;
  };
}

// Get folder or file list
export interface IDirOrFile {
  name: string;
  fullPath: string;
  relativePath: string;
  isDir: boolean;
  isFile: boolean;
  children?: Array<IDirOrFile>;
}

// File metadata interface
export interface IFileMetadata {
  name: string;
  path: string;
  size: number;
  type: string;
  lastModified: number;
  isDirectory?: boolean;
}

export type IWorkspaceFlatFile = {
  name: string;
  fullPath: string;
  relativePath: string;
};

export interface IResponseMessage {
  type: string;
  data: unknown;
  msg_id: string;
  conversation_id: string;
  hidden?: boolean;
}

export interface IConversationTurnCompletedEvent {
  sessionId: string;
  status: 'pending' | 'running' | 'finished';
  state:
    | 'ai_generating'
    | 'ai_waiting_input'
    | 'ai_waiting_confirmation'
    | 'initializing'
    | 'stopped'
    | 'error'
    | 'unknown';
  detail: string;
  canSendMessage: boolean;
  runtime: {
    hasTask: boolean;
    taskStatus?: 'pending' | 'running' | 'finished';
    isProcessing: boolean;
    pendingConfirmations: number;
    dbStatus?: 'pending' | 'running' | 'finished';
  };
  workspace: string;
  model: {
    platform: string;
    name: string;
    useModel: string;
  };
  lastMessage: {
    id?: string;
    type?: string;
    content: unknown;
    status?: string | null;
    createdAt: number;
  };
}

export interface IConversationListChangedEvent {
  conversationId: string;
  action: 'created' | 'updated' | 'deleted';
  source?: string;
}

export type ConversationSideQuestionResult =
  | {
      status: 'ok';
      answer: string;
    }
  | {
      status: 'noAnswer';
    }
  | {
      status: 'unsupported';
    }
  | {
      status: 'invalid';
      reason: 'emptyQuestion';
    }
  | {
      status: 'toolsRequired';
    };

interface IBridgeResponse<D = {}> {
  success: boolean;
  data?: D;
  msg?: string;
}

// ==================== Extensions API ====================

export interface IExtensionInfo {
  name: string;
  displayName: string;
  version: string;
  description?: string;
  source: string;
  directory: string;
  /** Whether the extension is currently enabled */
  enabled: boolean;
  /** Overall permission risk level */
  riskLevel: 'safe' | 'moderate' | 'dangerous';
  /** Whether the extension has lifecycle hooks */
  hasLifecycle: boolean;
}

/** Permission summary for extension management UI (Figma-inspired) */
export interface IExtensionPermissionSummary {
  name: string;
  description: string;
  level: 'safe' | 'moderate' | 'dangerous';
  granted: boolean;
}

/** Settings tab contributed by an extension, consumed by settings UI */
export interface IExtensionSettingsTab {
  id: string;
  name: string;
  icon?: string;
  /** wayland-asset:// local page or external https:// URL */
  entryUrl: string;
  /** Position anchor relative to a built-in or other extension tab */
  position?: { anchor: string; placement: 'before' | 'after' };
  /** Fallback numeric order when multiple tabs share the same anchor+placement. Lower = first */
  order: number;
  _extensionName: string;
}

/** WebUI contributions exposed for diagnostics/e2e validation */
export interface IExtensionWebuiContribution {
  extensionName: string;
  apiRoutes: Array<{ path: string; auth: boolean }>;
  staticAssets: Array<{ urlPrefix: string; directory: string }>;
}

export type AgentActivityState = 'idle' | 'writing' | 'researching' | 'executing' | 'syncing' | 'error';

export interface IExtensionAgentActivityEvent {
  conversationId: string;
  at: number;
  kind: 'status' | 'tool' | 'message';
  text: string;
}

export interface IExtensionAgentActivityItem {
  id: string;
  backend: string;
  agentName: string;
  state: AgentActivityState;
  runtimeStatus: 'pending' | 'running' | 'finished' | 'unknown';
  conversations: number;
  activeConversations: number;
  lastActiveAt: number;
  lastStatus?: string;
  currentTask?: string;
  recentEvents: IExtensionAgentActivityEvent[];
}

export interface IExtensionAgentActivitySnapshot {
  generatedAt: number;
  totalConversations: number;
  runningConversations: number;
  agents: IExtensionAgentActivityItem[];
}

export const extensions = {
  /** Get all extension-contributed CSS themes */
  getThemes: buildProvider<ICssTheme[], void>('extensions.get-themes'),
  /** Get summary of all loaded extensions */
  getLoadedExtensions: buildProvider<IExtensionInfo[], void>('extensions.get-loaded-extensions'),
  /** Get all extension-contributed assistants */
  getAssistants: buildProvider<Record<string, unknown>[], void>('extensions.get-assistants'),
  /** Get all extension-contributed agents (autonomous agent presets) */
  getAgents: buildProvider<Record<string, unknown>[], void>('extensions.get-agents'),
  /** Get all extension-contributed ACP adapters */
  getAcpAdapters: buildProvider<Record<string, unknown>[], void>('extensions.get-acp-adapters'),
  /** Get all extension-contributed MCP servers */
  getMcpServers: buildProvider<Record<string, unknown>[], void>('extensions.get-mcp-servers'),
  /** Get all extension-contributed skills */
  getSkills: buildProvider<Array<{ name: string; description: string; location: string }>, void>(
    'extensions.get-skills'
  ),
  /** Get all extension-contributed settings tabs */
  getSettingsTabs: buildProvider<IExtensionSettingsTab[], void>('extensions.get-settings-tabs'),
  /** Get extension-contributed webui routes/assets metadata */
  getWebuiContributions: buildProvider<IExtensionWebuiContribution[], void>(
    'extensions.get-webui-contributions'
  ),
  /** Snapshot of all agent activities, for extension settings tabs */
  getAgentActivitySnapshot: buildProvider<IExtensionAgentActivitySnapshot, void>(
    'extensions.get-agent-activity-snapshot'
  ),
  /** Get merged extension i18n translations for a specific locale (falls back to en-US) */
  getExtI18nForLocale: buildProvider<Record<string, unknown>, { locale: string }>(
    'extensions.get-ext-i18n-for-locale'
  ),

  // --- Extension Management API (NocoBase-inspired) ---
  /** Enable a disabled extension */
  enableExtension: buildProvider<IBridgeResponse, { name: string }>('extensions.enable'),
  /** Disable an extension */
  disableExtension: buildProvider<IBridgeResponse, { name: string; reason?: string }>('extensions.disable'),
  /** Get permission summary for an extension (Figma-inspired) */
  getPermissions: buildProvider<IExtensionPermissionSummary[], { name: string }>('extensions.get-permissions'),
  /** Get overall risk level for an extension */
  getRiskLevel: buildProvider<string, { name: string }>('extensions.get-risk-level'),
  /** Extension state change events (push to renderer when enable/disable happens) */
  stateChanged: buildEmitter<{ name: string; enabled: boolean; reason?: string }>('extensions.state-changed'),
};

// ==================== Channel API ====================

import type {
  IChannelPairingRequest,
  IChannelPluginStatus,
  IChannelSession,
  IChannelUser,
} from '@process/channels/types';

export const channel = {
  // Plugin Management
  getPluginStatus: buildProvider<IBridgeResponse<IChannelPluginStatus[]>, void>('channel.get-plugin-status'),
  enablePlugin: buildProvider<IBridgeResponse, { pluginId: string; config: Record<string, unknown> }>(
    'channel.enable-plugin'
  ),
  disablePlugin: buildProvider<IBridgeResponse, { pluginId: string }>('channel.disable-plugin'),
  testPlugin: buildProvider<
    IBridgeResponse<{ success: boolean; botUsername?: string; error?: string }>,
    { pluginId: string; token: string; extraConfig?: { appId?: string; appSecret?: string; domain?: 'feishu' | 'lark' } }
  >('channel.test-plugin'),

  // Pairing Management
  getPendingPairings: buildProvider<IBridgeResponse<IChannelPairingRequest[]>, void>(
    'channel.get-pending-pairings'
  ),
  approvePairing: buildProvider<IBridgeResponse, { code: string }>('channel.approve-pairing'),
  rejectPairing: buildProvider<IBridgeResponse, { code: string }>('channel.reject-pairing'),

  // User Management
  getAuthorizedUsers: buildProvider<IBridgeResponse<IChannelUser[]>, void>('channel.get-authorized-users'),
  revokeUser: buildProvider<IBridgeResponse, { userId: string }>('channel.revoke-user'),

  // Session Management (MVP: read-only view)
  getActiveSessions: buildProvider<IBridgeResponse<IChannelSession[]>, void>('channel.get-active-sessions'),

  // Webhook connection token rotation (revokes existing token + mints a new one).
  // Used by webhook-driven plugins (SMS, WhatsApp Meta) so the operator can roll
  // the inbound URL without disabling the plugin.
  rotateWebhookToken: buildProvider<
    IBridgeResponse<{ token: string; platform: string; createdAt: number }>,
    { platform: string; pluginInstanceId: string; agentId: string; secret?: string }
  >('channel.rotate-webhook-token'),

  // Settings Sync
  syncChannelSettings: buildProvider<
    IBridgeResponse,
    {
      platform: string;
      agent: { backend: string; customAgentId?: string; name?: string };
      model?: { id: string; useModel: string };
    }
  >('channel.sync-channel-settings'),

  // Events
  pairingRequested: buildEmitter<IChannelPairingRequest>('channel.pairing-requested'),
  pluginStatusChanged: buildEmitter<{ pluginId: string; status: IChannelPluginStatus }>(
    'channel.plugin-status-changed'
  ),
  userAuthorized: buildEmitter<IChannelUser>('channel.user-authorized'),
};

// ==================== Agent Hub API ====================
import type { IHubAgentItem, HubExtensionStatus } from '@/common/types/hub';

export const hub = {
  // Get extension list for Hub Modal
  getExtensionList: buildProvider<IBridgeResponse<IHubAgentItem[]>, void>('hub.get-extension-list'),
  // Install extension
  install: buildProvider<IBridgeResponse, { name: string }>('hub.install'),
  // Uninstall extension (optional in P0)
  uninstall: buildProvider<IBridgeResponse, { name: string }>('hub.uninstall'),
  // Retry install
  retryInstall: buildProvider<IBridgeResponse, { name: string }>('hub.retry-install'),
  // Check updates for installed extensions
  checkUpdates: buildProvider<IBridgeResponse<{ name: string }[]>, void>('hub.check-updates'),
  // Update extension
  update: buildProvider<IBridgeResponse, { name: string }>('hub.update'),
  // State changed event for extension (install/uninstall status changes)
  onStateChanged: buildEmitter<{ name: string; status: HubExtensionStatus; error?: string }>(
    'hub.state-changed'
  ),
};
// Provider catalog API
export type IProviderErrorKind = 'network' | 'unauthorized' | 'forbidden' | 'rate-limit' | 'unknown';

export type IProviderError = {
  kind: IProviderErrorKind;
  message: string;
};

export type IConnectedProviderView = {
  id: string;
  providerId: string;
  displayName: string | null;
  status: 'connected' | 'error' | 'refreshing';
  lastRefreshedAt: number | null;
  models: Array<{
    id: string;
    displayName: string;
    tier: string;
    capabilities: string[];
    enabled: boolean;
    deprecated: boolean;
    deprecatedAt?: number;
    contextWindow?: number;
  }>;
};

export type IDefaultModelView = {
  scope: 'chat' | 'coding' | 'vision' | 'image' | 'audio';
  catalogId: string;
  modelId: string;
};

export const providers = {
  list: buildProvider<IBridgeResponse<{ providers: IConnectedProviderView[]; defaults: IDefaultModelView[] }>, void>(
    'providers.list'
  ),
  connect: buildProvider<
    IBridgeResponse<{ provider: IConnectedProviderView }>,
    { key: string; additionalFields?: Record<string, string> }
  >('providers.connect'),
  refresh: buildProvider<IBridgeResponse<{ provider: IConnectedProviderView }>, { catalogId: string }>(
    'providers.refresh'
  ),
  disconnect: buildProvider<IBridgeResponse, { catalogId: string }>('providers.disconnect'),
  toggleModel: buildProvider<IBridgeResponse, { catalogId: string; modelId: string; enabled: boolean }>(
    'providers.toggleModel'
  ),
  setDisplayName: buildProvider<IBridgeResponse, { catalogId: string; displayName: string }>(
    'providers.setDisplayName'
  ),
  setDefault: buildProvider<
    IBridgeResponse,
    { scope: 'chat' | 'coding' | 'vision' | 'image' | 'audio'; catalogId: string; modelId: string }
  >('providers.setDefault'),
  catalogUpdated: buildEmitter<{ catalogId: string }>('providers.catalogUpdated'),
};

// Team Mode API
export type ICreateTeamParams = {
  userId: string;
  name: string;
  workspace: string;
  workspaceMode: 'shared' | 'isolated';
  agents: import('@process/team/types').TeamAgent[];
  sourceLauncherId?: string;
};

export type IAddTeamAgentParams = {
  teamId: string;
  agent: Omit<import('@process/team/types').TeamAgent, 'slotId'>;
};

export const team = {
  create: buildProvider<import('@process/team/types').TTeam, ICreateTeamParams>('team.create'),
  list: buildProvider<import('@process/team/types').TTeam[], { userId: string }>('team.list'),
  get: buildProvider<import('@process/team/types').TTeam | null, { id: string }>('team.get'),
  remove: buildProvider<void, { id: string }>('team.remove'),
  addAgent: buildProvider<import('@process/team/types').TeamAgent, IAddTeamAgentParams>('team.add-agent'),
  removeAgent: buildProvider<void, { teamId: string; slotId: string }>('team.remove-agent'),
  restartAgent: buildProvider<void, { teamId: string; slotId: string }>('team.restart-agent'),
  sendMessage: buildProvider<void, { teamId: string; content: string; files?: string[] }>('team.send-message'),
  sendMessageToAgent: buildProvider<void, { teamId: string; slotId: string; content: string; files?: string[] }>(
    'team.send-message-to-agent'
  ),
  stop: buildProvider<void, { teamId: string }>('team.stop'),
  ensureSession: buildProvider<void, { teamId: string }>('team.ensure-session'),
  renameAgent: buildProvider<void, { teamId: string; slotId: string; newName: string }>('team.rename-agent'),
  /**
   * Live-smoke fix #4b (2026-05-19) — swap a teammate's backend CLI
   * without recreating the team. Same-conversationType swaps only
   * (Claude ↔ Codex; not Gemini ↔ Claude — those would destroy the
   * conversation history). The service rejects cross-type swaps with
   * a descriptive error the renderer surfaces via Message.error.
   */
  changeAgentBackend: buildProvider<
    void,
    { teamId: string; slotId: string; newBackend: string; newModel?: string }
  >('team.change-agent-backend'),
  renameTeam: buildProvider<void, { id: string; name: string }>('team.rename'),
  setSessionMode: buildProvider<void, { teamId: string; sessionMode: string }>('team.set-session-mode'),
  updateWorkspace: buildProvider<void, { teamId: string; workspace: string }>('team.update-workspace'),
  /** W3b — promote a user-spawned team to Standing Company status. Idempotent. */
  promoteToStanding: buildProvider<void, { teamId: string }>('team.promote-to-standing'),
  /** W3b — reverse a previous promotion. Idempotent. */
  demoteFromStanding: buildProvider<void, { teamId: string }>('team.demote-from-standing'),
  /**
   * W1e — list rows from `team_event_log`, newest-first. Paged via `limit`
   * (default 100) and `since` (only events with `createdAt > since`).
   * Optional `eventType` filter is used by the W2d cost meter to read only
   * `token_usage` rows.
   */
  listEvents: buildProvider<
    import('@process/team/types').TeamEvent[],
    {
      teamId: string;
      since?: number;
      limit?: number;
      eventType?: import('@process/team/types').TeamEventType;
    }
  >('team.list-events'),
  /**
   * W3c — Build-my-own AI-suggest. Pure server-side suggester scores the
   * provided specialist pool against the user's goal text and returns a
   * pre-fill roster (leader + 4-5 teammates).
   */
  suggestRoster: buildProvider<
    import('@process/team/suggestRoster').SuggestRosterResult,
    {
      goalText: string;
      specialists: import('@process/team/suggestRoster').SuggestSpecialist[];
      detectedBackends: string[];
      targetSize?: number;
    }
  >('team.suggest-roster'),
  /**
   * W4 (T4.1) — Build the whitelist-only v1 JSON export for a team.
   * Returns a pretty-printed JSON string for the user to review + save.
   */
  export: buildProvider<string, { teamId: string }>('team.export'),
  /**
   * W4 (T4.2 + T4.6) — Validate an import payload + surface missing
   * specialists without persisting. Throws TeamImportError on guard
   * failure or TeamImportBusyError when the parse queue is saturated.
   */
  importPreview: buildProvider<
    {
      parsed: import('@process/team/importExport/TeamExportSchema').TeamExport;
      specialistsAvailable: boolean;
      missingSpecialists: string[];
    },
    { jsonText: string }
  >('team.import-preview'),
  /**
   * W4 (T4.5 + T4.6) — Persist an imported team with origin tracking +
   * sandbox-flag derived from the caller-supplied capability grants.
   * The W4b capability-review UI is the only caller that should pass
   * non-empty grants; until W4b ships, the renderer must pass an
   * empty (all-false) grants map.
   */
  importAccept: buildProvider<
    import('@process/team/types').TTeam,
    {
      userId: string;
      parsed: import('@process/team/importExport/TeamExportSchema').TeamExport;
      capabilityGrants: Record<string, boolean>;
      source: string;
    }
  >('team.import-accept'),
  agentStatusChanged: buildEmitter<import('@process/team/types').ITeamAgentStatusEvent>('team.agent.status'),
  agentSpawned: buildEmitter<import('@/common/types/teamTypes').ITeamAgentSpawnedEvent>('team.agent.spawned'),
  agentRemoved: buildEmitter<import('@/common/types/teamTypes').ITeamAgentRemovedEvent>('team.agent.removed'),
  agentRenamed: buildEmitter<import('@/common/types/teamTypes').ITeamAgentRenamedEvent>('team.agent.renamed'),
  listChanged: buildEmitter<import('@/common/types/teamTypes').ITeamListChangedEvent>('team.list-changed'),
  mcpStatus: buildEmitter<import('@/common/types/teamTypes').ITeamMcpStatusEvent>('team.mcp.status'),
};

export type StorageUsageResult = {
  total: number;
  used: number;
  breakdown: { label: string; bytes: number; color: string }[];
  computedAt: number;
};

// Model nickname: store a user-visible display name per model, keyed by
// providerId + modelId. Persisted in main-process userData/nicknames.json.
// Separate from `providers.setDisplayName` (catalog-level rename); this is
// per-model. Renamed to `providerNicknames` to avoid name collision.
export const providerNicknames = {
  setDisplayName: buildProvider<void, { providerId: string; modelId: string; nickname: string }>(
    'providers:setDisplayName'
  ),
  getDisplayNames: buildProvider<Record<string, string>, { providerId: string }>('providers:getDisplayNames'),
};

// Settings sync (Beta) — E2EE settings sync across devices.
// Crypto: scrypt key derivation + NaCl secretbox (see src/process/sync/crypto/).
// Passphrase is never transmitted; derived key held in-memory only.
export const sync = {
  enable: buildProvider<{ ok: boolean }, { passphrase: string; backendType: 'local-file'; backendPath: string }>(
    'sync.enable'
  ),
  disable: buildProvider<void, void>('sync.disable'),
  status: buildProvider<{ enabled: boolean; lastSync?: number; itemsCount?: number }, void>('sync.status'),
  forceSync: buildProvider<{ pulled: number; pushed: number }, void>('sync.forceSync'),
};

export const storage = {
  computeUsage: buildProvider<StorageUsageResult, void>('storage:computeUsage'),
  openDir: buildProvider<void, string>('storage:openDir'),
  clearDir: buildProvider<void, string>('storage:clearDir'),
  changeDir: buildProvider<string | null, void>('storage:changeDir'),
  exportAll: buildProvider<{ ok: boolean; path?: string }, { includeKeys: boolean; passphrase?: string }>(
    'storage:exportAll'
  ),
  importBackup: buildProvider<{ ok: boolean }, { passphrase?: string }>('storage:importBackup'),
  resetAll: buildProvider<void, void>('storage:resetAll'),
};
