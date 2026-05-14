/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IConfirmation } from '@/common/chat/chatLib';
import { bridge } from '@office-ai/platform';
import type { OpenDialogOptions } from 'electron';
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

export const shell = {
  openFile: bridge.buildProvider<void, string>('open-file'), // Open file with the system default program
  showItemInFolder: bridge.buildProvider<void, string>('show-item-in-folder'), // Open folder
  openExternal: bridge.buildProvider<void, string>('open-external'), // Open external link with the system default program
  checkToolInstalled: bridge.buildProvider<boolean, { tool: string }>('shell.check-tool-installed'), // Check whether a tool is installed
  openFolderWith: bridge.buildProvider<void, { folderPath: string; tool: 'vscode' | 'terminal' | 'explorer' }>(
    'shell.open-folder-with'
  ), // Open a folder with the specified tool
};

// Generic conversation capabilities
export const conversation = {
  create: bridge.buildProvider<TChatConversation, ICreateConversationParams>('create-conversation'), // Create conversation
  createWithConversation: bridge.buildProvider<
    TChatConversation,
    { conversation: TChatConversation; sourceConversationId?: string; migrateCron?: boolean }
  >('create-conversation-with-conversation'), // Create new conversation from history (supports migration)
  get: bridge.buildProvider<TChatConversation, { id: string }>('get-conversation'), // Get conversation info
  getAssociateConversation: bridge.buildProvider<TChatConversation[], { conversation_id: string }>(
    'get-associated-conversation'
  ),
  listByCronJob: bridge.buildProvider<TChatConversation[], { cronJobId: string }>('conversation.list-by-cron-job'), // Get associated conversations
  remove: bridge.buildProvider<boolean, { id: string }>('remove-conversation'), // Delete conversation
  update: bridge.buildProvider<boolean, { id: string; updates: Partial<TChatConversation>; mergeExtra?: boolean }>(
    'update-conversation'
  ), // Update conversation info
  reset: bridge.buildProvider<void, IResetConversationParams>('reset-conversation'), // Reset conversation
  warmup: bridge.buildProvider<void, { conversation_id: string }>('conversation.warmup'), // Warm up conversation (bootstrap)
  stop: bridge.buildProvider<IBridgeResponse<{}>, { conversation_id: string }>('chat.stop.stream'), // Stop conversation
  sendMessage: bridge.buildProvider<IBridgeResponse<{}>, ISendMessageParams>('chat.send.message'), // Send message (unified interface)
  getSlashCommands: bridge.buildProvider<
    IBridgeResponse<{ commands: SlashCommandItem[] }>,
    { conversation_id: string }
  >('conversation.get-slash-commands'),
  askSideQuestion: bridge.buildProvider<
    IBridgeResponse<ConversationSideQuestionResult>,
    { conversation_id: string; question: string }
  >('conversation.ask-side-question'),
  confirmMessage: bridge.buildProvider<IBridgeResponse, IConfirmMessageParams>('conversation.confirm.message'), // Generic confirm message
  responseStream: bridge.buildEmitter<IResponseMessage>('chat.response.stream'), // Receive messages (unified interface)
  turnCompleted: bridge.buildEmitter<IConversationTurnCompletedEvent>('conversation.turn.completed'),
  listChanged: bridge.buildEmitter<IConversationListChangedEvent>('conversation.list-changed'),
  getWorkspace: bridge.buildProvider<
    IDirOrFile[],
    { conversation_id: string; workspace: string; path: string; search?: string }
  >('conversation.get-workspace'),
  responseSearchWorkSpace: bridge.buildProvider<void, { file: number; dir: number; match?: IDirOrFile }>(
    'conversation.response.search.workspace'
  ),
  reloadContext: bridge.buildProvider<IBridgeResponse, { conversation_id: string }>('conversation.reload-context'),
  setConfig: bridge.buildProvider<
    IBridgeResponse,
    {
      conversation_id: string;
      config: { model?: string; thinking?: string; thinking_budget?: number; effort?: string };
    }
  >('conversation.set-config'),
  confirmation: {
    add: bridge.buildEmitter<IConfirmation<any> & { conversation_id: string }>('confirmation.add'),
    update: bridge.buildEmitter<IConfirmation<any> & { conversation_id: string }>('confirmation.update'),
    confirm: bridge.buildProvider<
      IBridgeResponse,
      { conversation_id: string; msg_id: string; data: any; callId: string }
    >('confirmation.confirm'),
    list: bridge.buildProvider<IConfirmation<any>[], { conversation_id: string }>('confirmation.list'),
    remove: bridge.buildEmitter<{ conversation_id: string; id: string }>('confirmation.remove'),
  },
  // Session-level approval memory for "always allow" decisions
  approval: {
    // Check if action is approved (keys are parsed from action+commandType in backend)
    check: bridge.buildProvider<boolean, { conversation_id: string; action: string; commandType?: string }>(
      'approval.check'
    ),
  },
};

// Gemini conversation related interface — reuses the unified conversation interface
export const geminiConversation = {
  sendMessage: conversation.sendMessage,
  confirmMessage: bridge.buildProvider<IBridgeResponse, IConfirmMessageParams>('input.confirm.message'),
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
  restart: bridge.buildProvider<void, void>('restart-app'), // Restart app
  openDevTools: bridge.buildProvider<boolean, void>('open-dev-tools'), // Open/close DevTools, returns the resulting state
  isDevToolsOpened: bridge.buildProvider<boolean, void>('is-dev-tools-opened'), // Get current DevTools state
  systemInfo: bridge.buildProvider<
    { cacheDir: string; workDir: string; logDir: string; platform: string; arch: string },
    void
  >('system.info'), // Get system info
  getPath: bridge.buildProvider<string, { name: 'desktop' | 'home' | 'downloads' }>('app.get-path'), // Get system path
  updateSystemInfo: bridge.buildProvider<IBridgeResponse, { cacheDir: string; workDir: string }>('system.update-info'), // Update system info
  getZoomFactor: bridge.buildProvider<number, void>('app.get-zoom-factor'),
  setZoomFactor: bridge.buildProvider<number, { factor: number }>('app.set-zoom-factor'),
  // CDP (Chrome DevTools Protocol) management
  getCdpStatus: bridge.buildProvider<IBridgeResponse<ICdpStatus>, void>('app.get-cdp-status'), // Get CDP status
  updateCdpConfig: bridge.buildProvider<IBridgeResponse<ICdpConfig>, Partial<ICdpConfig>>('app.update-cdp-config'), // Update CDP config
  // Start on boot management
  getStartOnBootStatus: bridge.buildProvider<IBridgeResponse<IStartOnBootStatus>, void>('app.get-start-on-boot-status'), // Get start-on-boot status
  setStartOnBoot: bridge.buildProvider<IBridgeResponse<IStartOnBootStatus>, { enabled: boolean }>(
    'app.set-start-on-boot'
  ), // Set start-on-boot
  // Bridge Main Process logs to Renderer F12 Console
  logStream: bridge.buildEmitter<{ level: 'log' | 'warn' | 'error'; tag: string; message: string; data?: unknown }>(
    'app.log-stream'
  ),
  // DevTools state change notification
  devToolsStateChanged: bridge.buildEmitter<{ isOpen: boolean }>('app.devtools-state-changed'),
};

// Manual (opt-in) updates via GitHub Releases
export const update = {
  /** Ask the renderer to open the update UI (e.g. from app menu). */
  open: bridge.buildEmitter<{ source?: 'menu' | 'about' }>('update.open'),
  /** Check GitHub releases and return latest version info. */
  check: bridge.buildProvider<IBridgeResponse<UpdateCheckResult>, UpdateCheckRequest>('update.check'),
  /** Download a chosen release asset (explicit user action). */
  download: bridge.buildProvider<IBridgeResponse<UpdateDownloadResult>, UpdateDownloadRequest>('update.download'),
  /** Download progress events emitted by main process. */
  downloadProgress: bridge.buildEmitter<UpdateDownloadProgressEvent>('update.download.progress'),
};

// Auto-updater (electron-updater) API
export const autoUpdate = {
  /** Check for updates using electron-updater */
  check: bridge.buildProvider<
    IBridgeResponse<{ updateInfo?: { version: string; releaseDate?: string; releaseNotes?: string } }>,
    { includePrerelease?: boolean }
  >('auto-update.check'),
  /** Download update using electron-updater */
  download: bridge.buildProvider<IBridgeResponse, void>('auto-update.download'),
  /** Quit and install the downloaded update */
  quitAndInstall: bridge.buildProvider<void, void>('auto-update.quit-and-install'),
  /** Auto-update status events */
  status: bridge.buildEmitter<AutoUpdateStatus>('auto-update.status'),
};

export const starOffice = {
  detectUrl: bridge.buildProvider<
    IBridgeResponse<{ url: string | null }>,
    { preferredUrl?: string; force?: boolean; timeoutMs?: number }
  >('star-office.detect-url'),
};

export const dialog = {
  showOpen: bridge.buildProvider<
    string[] | undefined,
    | { defaultPath?: string; properties?: OpenDialogOptions['properties']; filters?: OpenDialogOptions['filters'] }
    | undefined
  >('show-open'), // Open file/folder selection dialog
};
export const fs = {
  getFilesByDir: bridge.buildProvider<Array<IDirOrFile>, { dir: string; root: string }>('get-file-by-dir'), // Get list of all folders and files under a directory
  listWorkspaceFiles: bridge.buildProvider<Array<IWorkspaceFlatFile>, { root: string }>('list-workspace-files'),
  getImageBase64: bridge.buildProvider<string, { path: string }>('get-image-base64'), // Get image as base64
  fetchRemoteImage: bridge.buildProvider<string, { url: string }>('fetch-remote-image'), // Convert remote image to base64
  readFile: bridge.buildProvider<string, { path: string }>('read-file'), // Read file content (UTF-8)
  readFileBuffer: bridge.buildProvider<ArrayBuffer, { path: string }>('read-file-buffer'), // Read binary file as ArrayBuffer
  createTempFile: bridge.buildProvider<string, { fileName: string }>('create-temp-file'), // Create temp file
  createUploadFile: bridge.buildProvider<string, { fileName: string; conversationId?: string }>('create-upload-file'), // Create upload file (location decided by settings)
  writeFile: bridge.buildProvider<boolean, { path: string; data: Uint8Array | string }>('write-file'), // Write file
  createZip: bridge.buildProvider<
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
  cancelZip: bridge.buildProvider<boolean, { requestId: string }>('cancel-zip-file'), // Cancel zip creation task
  getFileMetadata: bridge.buildProvider<IFileMetadata, { path: string }>('get-file-metadata'), // Get file metadata
  copyFilesToWorkspace: bridge.buildProvider<
    // Return details for successful and failed copies for better UI feedback
    IBridgeResponse<{ copiedFiles: string[]; failedFiles?: Array<{ path: string; error: string }> }>,
    { filePaths: string[]; workspace: string; sourceRoot?: string }
  >('copy-files-to-workspace'), // Copy files into workspace
  removeEntry: bridge.buildProvider<IBridgeResponse, { path: string }>('remove-entry'), // Delete file or folder
  renameEntry: bridge.buildProvider<IBridgeResponse<{ newPath: string }>, { path: string; newName: string }>(
    'rename-entry'
  ), // Rename file or folder
  readBuiltinRule: bridge.buildProvider<string, { fileName: string }>('read-builtin-rule'), // Read builtin rules file
  readBuiltinSkill: bridge.buildProvider<string, { fileName: string }>('read-builtin-skill'), // Read builtin skills file
  // Assistant rule file operations
  readAssistantRule: bridge.buildProvider<string, { assistantId: string; locale?: string }>('read-assistant-rule'), // Read assistant rule file
  writeAssistantRule: bridge.buildProvider<boolean, { assistantId: string; content: string; locale?: string }>(
    'write-assistant-rule'
  ), // Write assistant rule file
  deleteAssistantRule: bridge.buildProvider<boolean, { assistantId: string }>('delete-assistant-rule'), // Delete assistant rule file
  // Assistant skill file operations
  readAssistantSkill: bridge.buildProvider<string, { assistantId: string; locale?: string }>('read-assistant-skill'), // Read assistant skill file
  writeAssistantSkill: bridge.buildProvider<boolean, { assistantId: string; content: string; locale?: string }>(
    'write-assistant-skill'
  ), // Write assistant skill file
  deleteAssistantSkill: bridge.buildProvider<boolean, { assistantId: string }>('delete-assistant-skill'), // Delete assistant skill file
  // List available skills from skills directory
  listAvailableSkills: bridge.buildProvider<
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
  listBuiltinAutoSkills: bridge.buildProvider<Array<{ name: string; description: string }>, void>(
    'list-builtin-auto-skills'
  ),
  // Read skill info without importing
  readSkillInfo: bridge.buildProvider<IBridgeResponse<{ name: string; description: string }>, { skillPath: string }>(
    'read-skill-info'
  ),
  // Import skill directory
  importSkill: bridge.buildProvider<IBridgeResponse<{ skillName: string }>, { skillPath: string }>('import-skill'),
  // Scan directory for skills
  scanForSkills: bridge.buildProvider<
    IBridgeResponse<Array<{ name: string; description: string; path: string }>>,
    { folderPath: string }
  >('scan-for-skills'),
  // Detect common skills paths
  detectCommonSkillPaths: bridge.buildProvider<IBridgeResponse<Array<{ name: string; path: string }>>, void>(
    'detect-common-skill-paths'
  ),
  // Detect external skills with counts (for Skills Hub)
  detectAndCountExternalSkills: bridge.buildProvider<
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
  importSkillWithSymlink: bridge.buildProvider<IBridgeResponse<{ skillName: string }>, { skillPath: string }>(
    'import-skill-with-symlink'
  ),
  // Delete custom skill
  deleteSkill: bridge.buildProvider<IBridgeResponse, { skillName: string }>('delete-skill'),
  // Get skill storage paths
  getSkillPaths: bridge.buildProvider<{ userSkillsDir: string; builtinSkillsDir: string }, void>('get-skill-paths'),
  // Export skill to external directory via symlink
  exportSkillWithSymlink: bridge.buildProvider<IBridgeResponse, { skillPath: string; targetDir: string }>(
    'export-skill-with-symlink'
  ),
  // Custom external skill paths management
  getCustomExternalPaths: bridge.buildProvider<Array<{ name: string; path: string }>, void>(
    'get-custom-external-paths'
  ),
  addCustomExternalPath: bridge.buildProvider<IBridgeResponse, { name: string; path: string }>(
    'add-custom-external-path'
  ),
  removeCustomExternalPath: bridge.buildProvider<IBridgeResponse, { path: string }>('remove-custom-external-path'),
  // Skills Market: inject/remove the wayland-skills builtin skill
  enableSkillsMarket: bridge.buildProvider<IBridgeResponse, void>('enable-skills-market'),
  disableSkillsMarket: bridge.buildProvider<IBridgeResponse, void>('disable-skills-market'),
};

export const speechToText = {
  transcribe: bridge.buildProvider<SpeechToTextResult, SpeechToTextRequest>('speech-to-text.transcribe'),
};

export const fileWatch = {
  startWatch: bridge.buildProvider<IBridgeResponse, { filePath: string }>('file-watch-start'), // Start watching file changes
  stopWatch: bridge.buildProvider<IBridgeResponse, { filePath: string }>('file-watch-stop'), // Stop watching file changes
  stopAllWatches: bridge.buildProvider<IBridgeResponse, void>('file-watch-stop-all'), // Stop all file watches
  fileChanged: bridge.buildEmitter<{ filePath: string; eventType: string }>('file-changed'), // File change event
};

// Workspace office file scan (detects current .pptx/.docx/.xlsx)
export const workspaceOfficeWatch = {
  scan: bridge.buildProvider<string[], { workspace: string }>('workspace-office-watch-scan'),
};

// File streaming updates (real-time content push when agent writes)
export const fileStream = {
  contentUpdate: bridge.buildEmitter<{
    filePath: string; // Absolute file path
    content: string; // New content
    workspace: string; // Workspace root directory
    relativePath: string; // Relative path
    operation: 'write' | 'delete'; // Operation type
  }>('file-stream-content-update'), // Streaming content update when agent writes file
};

// File snapshot providers for tracking file changes
export const fileSnapshot = {
  init: bridge.buildProvider<import('@/common/types/fileSnapshot').SnapshotInfo, { workspace: string }>(
    'file-snapshot-init'
  ),
  compare: bridge.buildProvider<import('@/common/types/fileSnapshot').CompareResult, { workspace: string }>(
    'file-snapshot-compare'
  ),
  getBaselineContent: bridge.buildProvider<string | null, { workspace: string; filePath: string }>(
    'file-snapshot-baseline'
  ),
  getInfo: bridge.buildProvider<import('@/common/types/fileSnapshot').SnapshotInfo, { workspace: string }>(
    'file-snapshot-info'
  ),
  dispose: bridge.buildProvider<void, { workspace: string }>('file-snapshot-dispose'),
  stageFile: bridge.buildProvider<void, { workspace: string; filePath: string }>('file-snapshot-stage-file'),
  stageAll: bridge.buildProvider<void, { workspace: string }>('file-snapshot-stage-all'),
  unstageFile: bridge.buildProvider<void, { workspace: string; filePath: string }>('file-snapshot-unstage-file'),
  unstageAll: bridge.buildProvider<void, { workspace: string }>('file-snapshot-unstage-all'),
  discardFile: bridge.buildProvider<
    void,
    { workspace: string; filePath: string; operation: import('@/common/types/fileSnapshot').FileChangeOperation }
  >('file-snapshot-discard-file'),
  resetFile: bridge.buildProvider<
    void,
    { workspace: string; filePath: string; operation: import('@/common/types/fileSnapshot').FileChangeOperation }
  >('file-snapshot-reset-file'),
  getBranches: bridge.buildProvider<string[], { workspace: string }>('file-snapshot-get-branches'),
};

export const googleAuth = {
  login: bridge.buildProvider<IBridgeResponse<{ account: string }>, { proxy?: string }>('google.auth.login'),
  logout: bridge.buildProvider<void, {}>('google.auth.logout'),
  status: bridge.buildProvider<IBridgeResponse<{ account: string }>, { proxy?: string }>('google.auth.status'),
};

// Subscription check for Gemini models: used to dynamically decide whether to show gemini-3.1-pro-preview
export const gemini = {
  subscriptionStatus: bridge.buildProvider<
    IBridgeResponse<{ isSubscriber: boolean; tier?: string; lastChecked: number; message?: string }>,
    { proxy?: string }
  >('gemini.subscription-status'),
};

// AWS Bedrock interfaces
export const bedrock = {
  testConnection: bridge.buildProvider<
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
  fetchModelList: bridge.buildProvider<
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
  saveModelConfig: bridge.buildProvider<IBridgeResponse, IProvider[]>('mode.save-model-config'),
  getModelConfig: bridge.buildProvider<IProvider[], void>('mode.get-model-config'),
  /** Protocol detection - auto-detect API protocol type */
  detectProtocol: bridge.buildProvider<IBridgeResponse<ProtocolDetectionResponse>, ProtocolDetectionRequest>(
    'mode.detect-protocol'
  ),
};

// ACP conversation related interface — reuses the unified conversation interface
export const acpConversation = {
  sendMessage: conversation.sendMessage,
  responseStream: conversation.responseStream,
  detectCliPath: bridge.buildProvider<IBridgeResponse<{ path?: string }>, { backend: string }>('acp.detect-cli-path'),
  getAvailableAgents: bridge.buildProvider<
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
  checkEnv: bridge.buildProvider<{ env: Record<string, string> }, void>('acp.check.env'),
  refreshCustomAgents: bridge.buildProvider<IBridgeResponse, void>('acp.refresh-custom-agents'),
  testCustomAgent: bridge.buildProvider<
    IBridgeResponse<{ step: 'cli_check' | 'acp_initialize'; error?: string }>,
    { command: string; acpArgs?: string[]; env?: Record<string, string> }
  >('acp.test-custom-agent'),
  checkAgentHealth: bridge.buildProvider<
    IBridgeResponse<{ available: boolean; latency?: number; error?: string }>,
    { backend: AgentBackend }
  >('acp.check-agent-health'),
  // Set session mode for ACP agents (claude, qwen, etc.)
  setMode: bridge.buildProvider<IBridgeResponse<{ mode: string }>, { conversationId: string; mode: string }>(
    'acp.set-mode'
  ),
  // Get current session mode for ACP agents
  getMode: bridge.buildProvider<IBridgeResponse<{ mode: string; initialized: boolean }>, { conversationId: string }>(
    'acp.get-mode'
  ),
  // Get model info for ACP agents (model name and available models)
  getModelInfo: bridge.buildProvider<IBridgeResponse<{ modelInfo: AcpModelInfo | null }>, { conversationId: string }>(
    'acp.get-model-info'
  ),
  // Set model for ACP agents
  setModel: bridge.buildProvider<
    IBridgeResponse<{ modelInfo: AcpModelInfo | null }>,
    { conversationId: string; modelId: string }
  >('acp.set-model'),
  // Get non-model config options for ACP agents (e.g., reasoning effort)
  getConfigOptions: bridge.buildProvider<
    IBridgeResponse<{ configOptions: import('../types/acpTypes').AcpSessionConfigOption[] }>,
    { conversationId: string }
  >('acp.get-config-options'),
  // Set a config option value for ACP agents (e.g., reasoning effort)
  setConfigOption: bridge.buildProvider<
    IBridgeResponse<{ configOptions: import('../types/acpTypes').AcpSessionConfigOption[] }>,
    { conversationId: string; configId: string; value: string }
  >('acp.set-config-option'),
};

// MCP service related interface
export const mcpService = {
  getAgentMcpConfigs: bridge.buildProvider<
    IBridgeResponse<Array<{ source: McpSource; servers: IMcpServer[] }>>,
    Array<{ backend: string; name: string; cliPath?: string }>
  >('mcp.get-agent-configs'),
  testMcpConnection: bridge.buildProvider<
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
  syncMcpToAgents: bridge.buildProvider<
    IBridgeResponse<{ success: boolean; results: Array<{ agent: string; success: boolean; error?: string }> }>,
    { mcpServers: IMcpServer[]; agents: Array<{ backend: string; name: string; cliPath?: string }> }
  >('mcp.sync-to-agents'),
  removeMcpFromAgents: bridge.buildProvider<
    IBridgeResponse<{ success: boolean; results: Array<{ agent: string; success: boolean; error?: string }> }>,
    { mcpServerName: string; agents: Array<{ backend: string; name: string; cliPath?: string }> }
  >('mcp.remove-from-agents'),
  // OAuth-related interfaces
  checkOAuthStatus: bridge.buildProvider<
    IBridgeResponse<{ isAuthenticated: boolean; needsLogin: boolean; error?: string }>,
    IMcpServer
  >('mcp.check-oauth-status'),
  loginMcpOAuth: bridge.buildProvider<
    IBridgeResponse<{ success: boolean; error?: string }>,
    { server: IMcpServer; config?: any }
  >('mcp.login-oauth'),
  logoutMcpOAuth: bridge.buildProvider<IBridgeResponse, string>('mcp.logout-oauth'),
  getAuthenticatedServers: bridge.buildProvider<IBridgeResponse<string[]>, void>('mcp.get-authenticated-servers'),
};

// Codex conversation related interface — reuses the unified conversation interface
export const codexConversation = {
  sendMessage: conversation.sendMessage,
  responseStream: conversation.responseStream,
};

// OpenClaw conversation related interface — reuses the unified conversation interface
export const openclawConversation = {
  sendMessage: conversation.sendMessage,
  responseStream: bridge.buildEmitter<IResponseMessage>('openclaw.response.stream'),
  getRuntime: bridge.buildProvider<
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
  list: bridge.buildProvider<import('@process/agent/remote/types').RemoteAgentConfig[], void>('remote-agent.list'),
  get: bridge.buildProvider<import('@process/agent/remote/types').RemoteAgentConfig | null, { id: string }>(
    'remote-agent.get'
  ),
  create: bridge.buildProvider<
    import('@process/agent/remote/types').RemoteAgentConfig,
    import('@process/agent/remote/types').RemoteAgentInput
  >('remote-agent.create'),
  update: bridge.buildProvider<
    boolean,
    { id: string; updates: Partial<import('@process/agent/remote/types').RemoteAgentInput> }
  >('remote-agent.update'),
  delete: bridge.buildProvider<boolean, { id: string }>('remote-agent.delete'),
  testConnection: bridge.buildProvider<
    { success: boolean; error?: string },
    { url: string; authType: string; authToken?: string; allowInsecure?: boolean }
  >('remote-agent.test-connection'),
  handshake: bridge.buildProvider<{ status: 'ok' | 'pending_approval' | 'error'; error?: string }, { id: string }>(
    'remote-agent.handshake'
  ),
};

// Database operations
export const database = {
  getConversationMessages: bridge.buildProvider<
    import('@/common/chat/chatLib').TMessage[],
    { conversation_id: string; page?: number; pageSize?: number }
  >('database.get-conversation-messages'),
  getUserConversations: bridge.buildProvider<
    import('@/common/config/storage').TChatConversation[],
    { page?: number; pageSize?: number }
  >('database.get-user-conversations'),
  searchConversationMessages: bridge.buildProvider<
    import('../types/database').IMessageSearchResponse,
    { keyword: string; page?: number; pageSize?: number }
  >('database.search-conversation-messages'),
};

export const previewHistory = {
  list: bridge.buildProvider<PreviewSnapshotInfo[], { target: PreviewHistoryTarget }>('preview-history.list'),
  save: bridge.buildProvider<PreviewSnapshotInfo, { target: PreviewHistoryTarget; content: string }>(
    'preview-history.save'
  ),
  getContent: bridge.buildProvider<
    { snapshot: PreviewSnapshotInfo; content: string } | null,
    { target: PreviewHistoryTarget; snapshotId: string }
  >('preview-history.get-content'),
};

// Preview panel API
export const preview = {
  // Agent triggers open preview (e.g., chrome-devtools navigates to URL)
  open: bridge.buildEmitter<{
    content: string; // URL or content
    contentType: import('../types/preview').PreviewContentType; // Content type
    metadata?: {
      title?: string;
      fileName?: string;
    };
  }>('preview.open'),
};

export const document = {
  convert: bridge.buildProvider<
    import('../types/conversion').DocumentConversionResponse,
    import('../types/conversion').DocumentConversionRequest
  >('document.convert'),
};

// PPT preview via officecli watch
export const pptPreview = {
  start: bridge.buildProvider<{ url: string }, { filePath: string }>('ppt-preview.start'),
  stop: bridge.buildProvider<void, { filePath: string }>('ppt-preview.stop'),
  status: bridge.buildEmitter<{ state: 'starting' | 'installing' | 'ready' | 'error'; message?: string }>(
    'ppt-preview.status'
  ),
};

// Word preview via officecli watch
export const wordPreview = {
  start: bridge.buildProvider<{ url: string }, { filePath: string }>('word-preview.start'),
  stop: bridge.buildProvider<void, { filePath: string }>('word-preview.stop'),
  status: bridge.buildEmitter<{ state: 'starting' | 'installing' | 'ready' | 'error'; message?: string }>(
    'word-preview.status'
  ),
};

// Excel preview via officecli watch
export const excelPreview = {
  start: bridge.buildProvider<{ url: string }, { filePath: string }>('excel-preview.start'),
  stop: bridge.buildProvider<void, { filePath: string }>('excel-preview.stop'),
  status: bridge.buildEmitter<{ state: 'starting' | 'installing' | 'ready' | 'error'; message?: string }>(
    'excel-preview.status'
  ),
};

// Deep link protocol handling
export const deepLink = {
  /** Emitted when app is opened via wayland:// protocol URL */
  received: bridge.buildEmitter<{
    action: string; // e.g. 'add-provider'
    params: Record<string, string>; // parsed query params
  }>('deep-link.received'),
};

// Window controls API
export const windowControls = {
  minimize: bridge.buildProvider<void, void>('window-controls:minimize'),
  maximize: bridge.buildProvider<void, void>('window-controls:maximize'),
  unmaximize: bridge.buildProvider<void, void>('window-controls:unmaximize'),
  close: bridge.buildProvider<void, void>('window-controls:close'),
  isMaximized: bridge.buildProvider<boolean, void>('window-controls:is-maximized'),
  maximizedChanged: bridge.buildEmitter<{ isMaximized: boolean }>('window-controls:maximized-changed'),
};

// System settings API
export const systemSettings = {
  getCloseToTray: bridge.buildProvider<boolean, void>('system-settings:get-close-to-tray'),
  setCloseToTray: bridge.buildProvider<void, { enabled: boolean }>('system-settings:set-close-to-tray'),
  getNotificationEnabled: bridge.buildProvider<boolean, void>('system-settings:get-notification-enabled'),
  setNotificationEnabled: bridge.buildProvider<void, { enabled: boolean }>('system-settings:set-notification-enabled'),
  getCronNotificationEnabled: bridge.buildProvider<boolean, void>('system-settings:get-cron-notification-enabled'),
  setCronNotificationEnabled: bridge.buildProvider<void, { enabled: boolean }>(
    'system-settings:set-cron-notification-enabled'
  ),
  getKeepAwake: bridge.buildProvider<boolean, void>('system-settings:get-keep-awake'),
  setKeepAwake: bridge.buildProvider<void, { enabled: boolean }>('system-settings:set-keep-awake'),
  changeLanguage: bridge.buildProvider<void, { language: string }>('system-settings:change-language'),
  // Broadcast language change to all renderers (desktop + WebUI) for real-time sync
  languageChanged: bridge.buildEmitter<{ language: string }>('system-settings:language-changed'),
  getSaveUploadToWorkspace: bridge.buildProvider<boolean, void>('system-settings:get-save-upload-to-workspace'),
  setSaveUploadToWorkspace: bridge.buildProvider<void, { enabled: boolean }>(
    'system-settings:set-save-upload-to-workspace'
  ),
  getAutoPreviewOfficeFiles: bridge.buildProvider<boolean, void>('system-settings:get-auto-preview-office-files'),
  setAutoPreviewOfficeFiles: bridge.buildProvider<void, { enabled: boolean }>(
    'system-settings:set-auto-preview-office-files'
  ),
};

// Ambient Mode — M1 bubble window (AC-M1-5 / AC-M1-10 / AC-M1-11 / AC-M1-13)
export type IAmbientBubblePosition = { x: number; y: number; displayId: number };
export const ambient = {
  getBubblePosition: bridge.buildProvider<IAmbientBubblePosition | null, void>('ambient.getBubblePosition'),
  setBubblePosition: bridge.buildProvider<void, IAmbientBubblePosition>('ambient.setBubblePosition'),
  getEnabled: bridge.buildProvider<boolean, void>('ambient.getEnabled'),
  setEnabled: bridge.buildProvider<void, { enabled: boolean }>('ambient.setEnabled'),
};

// System notification API
export type INotificationOptions = {
  title: string;
  body: string;
  icon?: string;
  conversationId?: string;
};

export const notification = {
  show: bridge.buildProvider<void, INotificationOptions>('notification.show'),
  clicked: bridge.buildEmitter<{ conversationId?: string }>('notification.clicked'),
};

// Task management API
export const task = {
  stopAll: bridge.buildProvider<{ success: boolean; count: number }, void>('task.stop-all'),
  getRunningCount: bridge.buildProvider<{ success: boolean; count: number }, void>('task.get-running-count'),
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
  getStatus: bridge.buildProvider<IBridgeResponse<IWebUIStatus>, void>('webui.get-status'),
  // Start WebUI
  start: bridge.buildProvider<
    IBridgeResponse<{ port: number; localUrl: string; networkUrl?: string; lanIP?: string; initialPassword?: string }>,
    { port?: number; allowRemote?: boolean }
  >('webui.start'),
  // Stop WebUI
  stop: bridge.buildProvider<IBridgeResponse, void>('webui.stop'),
  // Change password (no current password required)
  changePassword: bridge.buildProvider<IBridgeResponse, { newPassword: string }>('webui.change-password'),
  changeUsername: bridge.buildProvider<IBridgeResponse<{ username: string }>, { newUsername: string }>(
    'webui.change-username'
  ),
  // Reset password (generate new random password)
  resetPassword: bridge.buildProvider<IBridgeResponse<{ newPassword: string }>, void>('webui.reset-password'),
  // Generate QR login token
  generateQRToken: bridge.buildProvider<IBridgeResponse<{ token: string; expiresAt: number; qrUrl: string }>, void>(
    'webui.generate-qr-token'
  ),
  // Verify QR token
  verifyQRToken: bridge.buildProvider<IBridgeResponse<{ sessionToken: string; username: string }>, { qrToken: string }>(
    'webui.verify-qr-token'
  ),
  // Status changed event
  statusChanged: bridge.buildEmitter<{ running: boolean; port?: number; localUrl?: string; networkUrl?: string }>(
    'webui.status-changed'
  ),
  // Password reset result event (workaround for provider return value issue)
  resetPasswordResult: bridge.buildEmitter<{ success: boolean; newPassword?: string; msg?: string }>(
    'webui.reset-password-result'
  ),
};

// Cron job management API
export const cron = {
  // Query
  listJobs: bridge.buildProvider<ICronJob[], void>('cron.list-jobs'),
  listJobsByConversation: bridge.buildProvider<ICronJob[], { conversationId: string }>(
    'cron.list-jobs-by-conversation'
  ),
  getJob: bridge.buildProvider<ICronJob | null, { jobId: string }>('cron.get-job'),
  // CRUD
  addJob: bridge.buildProvider<ICronJob, ICreateCronJobParams>('cron.add-job'),
  updateJob: bridge.buildProvider<ICronJob, { jobId: string; updates: Partial<ICronJob> }>('cron.update-job'),
  removeJob: bridge.buildProvider<void, { jobId: string }>('cron.remove-job'),
  runNow: bridge.buildProvider<{ conversationId: string }, { jobId: string }>('cron.run-now'),
  saveSkill: bridge.buildProvider<void, { jobId: string; content: string }>('cron.save-skill'),
  hasSkill: bridge.buildProvider<boolean, { jobId: string }>('cron.has-skill'),
  // Events
  onJobCreated: bridge.buildEmitter<ICronJob>('cron.job-created'),
  onJobUpdated: bridge.buildEmitter<ICronJob>('cron.job-updated'),
  onJobRemoved: bridge.buildEmitter<{ jobId: string }>('cron.job-removed'),
  onJobExecuted: bridge.buildEmitter<{ jobId: string; status: 'ok' | 'error' | 'skipped' | 'missed'; error?: string }>(
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
  type: 'gemini' | 'acp' | 'codex' | 'openclaw-gateway' | 'nanobot' | 'remote' | 'aionrs' | 'wcore';
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
  getThemes: bridge.buildProvider<ICssTheme[], void>('extensions.get-themes'),
  /** Get summary of all loaded extensions */
  getLoadedExtensions: bridge.buildProvider<IExtensionInfo[], void>('extensions.get-loaded-extensions'),
  /** Get all extension-contributed assistants */
  getAssistants: bridge.buildProvider<Record<string, unknown>[], void>('extensions.get-assistants'),
  /** Get all extension-contributed agents (autonomous agent presets) */
  getAgents: bridge.buildProvider<Record<string, unknown>[], void>('extensions.get-agents'),
  /** Get all extension-contributed ACP adapters */
  getAcpAdapters: bridge.buildProvider<Record<string, unknown>[], void>('extensions.get-acp-adapters'),
  /** Get all extension-contributed MCP servers */
  getMcpServers: bridge.buildProvider<Record<string, unknown>[], void>('extensions.get-mcp-servers'),
  /** Get all extension-contributed skills */
  getSkills: bridge.buildProvider<Array<{ name: string; description: string; location: string }>, void>(
    'extensions.get-skills'
  ),
  /** Get all extension-contributed settings tabs */
  getSettingsTabs: bridge.buildProvider<IExtensionSettingsTab[], void>('extensions.get-settings-tabs'),
  /** Get extension-contributed webui routes/assets metadata */
  getWebuiContributions: bridge.buildProvider<IExtensionWebuiContribution[], void>(
    'extensions.get-webui-contributions'
  ),
  /** Snapshot of all agent activities, for extension settings tabs */
  getAgentActivitySnapshot: bridge.buildProvider<IExtensionAgentActivitySnapshot, void>(
    'extensions.get-agent-activity-snapshot'
  ),
  /** Get merged extension i18n translations for a specific locale (falls back to en-US) */
  getExtI18nForLocale: bridge.buildProvider<Record<string, unknown>, { locale: string }>(
    'extensions.get-ext-i18n-for-locale'
  ),

  // --- Extension Management API (NocoBase-inspired) ---
  /** Enable a disabled extension */
  enableExtension: bridge.buildProvider<IBridgeResponse, { name: string }>('extensions.enable'),
  /** Disable an extension */
  disableExtension: bridge.buildProvider<IBridgeResponse, { name: string; reason?: string }>('extensions.disable'),
  /** Get permission summary for an extension (Figma-inspired) */
  getPermissions: bridge.buildProvider<IExtensionPermissionSummary[], { name: string }>('extensions.get-permissions'),
  /** Get overall risk level for an extension */
  getRiskLevel: bridge.buildProvider<string, { name: string }>('extensions.get-risk-level'),
  /** Extension state change events (push to renderer when enable/disable happens) */
  stateChanged: bridge.buildEmitter<{ name: string; enabled: boolean; reason?: string }>('extensions.state-changed'),
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
  getPluginStatus: bridge.buildProvider<IBridgeResponse<IChannelPluginStatus[]>, void>('channel.get-plugin-status'),
  enablePlugin: bridge.buildProvider<IBridgeResponse, { pluginId: string; config: Record<string, unknown> }>(
    'channel.enable-plugin'
  ),
  disablePlugin: bridge.buildProvider<IBridgeResponse, { pluginId: string }>('channel.disable-plugin'),
  testPlugin: bridge.buildProvider<
    IBridgeResponse<{ success: boolean; botUsername?: string; error?: string }>,
    { pluginId: string; token: string; extraConfig?: { appId?: string; appSecret?: string } }
  >('channel.test-plugin'),

  // Pairing Management
  getPendingPairings: bridge.buildProvider<IBridgeResponse<IChannelPairingRequest[]>, void>(
    'channel.get-pending-pairings'
  ),
  approvePairing: bridge.buildProvider<IBridgeResponse, { code: string }>('channel.approve-pairing'),
  rejectPairing: bridge.buildProvider<IBridgeResponse, { code: string }>('channel.reject-pairing'),

  // User Management
  getAuthorizedUsers: bridge.buildProvider<IBridgeResponse<IChannelUser[]>, void>('channel.get-authorized-users'),
  revokeUser: bridge.buildProvider<IBridgeResponse, { userId: string }>('channel.revoke-user'),

  // Session Management (MVP: read-only view)
  getActiveSessions: bridge.buildProvider<IBridgeResponse<IChannelSession[]>, void>('channel.get-active-sessions'),

  // Settings Sync
  syncChannelSettings: bridge.buildProvider<
    IBridgeResponse,
    {
      platform: string;
      agent: { backend: string; customAgentId?: string; name?: string };
      model?: { id: string; useModel: string };
    }
  >('channel.sync-channel-settings'),

  // Events
  pairingRequested: bridge.buildEmitter<IChannelPairingRequest>('channel.pairing-requested'),
  pluginStatusChanged: bridge.buildEmitter<{ pluginId: string; status: IChannelPluginStatus }>(
    'channel.plugin-status-changed'
  ),
  userAuthorized: bridge.buildEmitter<IChannelUser>('channel.user-authorized'),
};

// ==================== Agent Hub API ====================
import type { IHubAgentItem, HubExtensionStatus } from '@/common/types/hub';

export const hub = {
  // Get extension list for Hub Modal
  getExtensionList: bridge.buildProvider<IBridgeResponse<IHubAgentItem[]>, void>('hub.get-extension-list'),
  // Install extension
  install: bridge.buildProvider<IBridgeResponse, { name: string }>('hub.install'),
  // Uninstall extension (optional in P0)
  uninstall: bridge.buildProvider<IBridgeResponse, { name: string }>('hub.uninstall'),
  // Retry install
  retryInstall: bridge.buildProvider<IBridgeResponse, { name: string }>('hub.retry-install'),
  // Check updates for installed extensions
  checkUpdates: bridge.buildProvider<IBridgeResponse<{ name: string }[]>, void>('hub.check-updates'),
  // Update extension
  update: bridge.buildProvider<IBridgeResponse, { name: string }>('hub.update'),
  // State changed event for extension (install/uninstall status changes)
  onStateChanged: bridge.buildEmitter<{ name: string; status: HubExtensionStatus; error?: string }>(
    'hub.state-changed'
  ),
};
// Team Mode API
export type ICreateTeamParams = {
  userId: string;
  name: string;
  workspace: string;
  workspaceMode: 'shared' | 'isolated';
  agents: import('@process/team/types').TeamAgent[];
};

export type IAddTeamAgentParams = {
  teamId: string;
  agent: Omit<import('@process/team/types').TeamAgent, 'slotId'>;
};

export const team = {
  create: bridge.buildProvider<import('@process/team/types').TTeam, ICreateTeamParams>('team.create'),
  list: bridge.buildProvider<import('@process/team/types').TTeam[], { userId: string }>('team.list'),
  get: bridge.buildProvider<import('@process/team/types').TTeam | null, { id: string }>('team.get'),
  remove: bridge.buildProvider<void, { id: string }>('team.remove'),
  addAgent: bridge.buildProvider<import('@process/team/types').TeamAgent, IAddTeamAgentParams>('team.add-agent'),
  removeAgent: bridge.buildProvider<void, { teamId: string; slotId: string }>('team.remove-agent'),
  sendMessage: bridge.buildProvider<void, { teamId: string; content: string; files?: string[] }>('team.send-message'),
  sendMessageToAgent: bridge.buildProvider<void, { teamId: string; slotId: string; content: string; files?: string[] }>(
    'team.send-message-to-agent'
  ),
  stop: bridge.buildProvider<void, { teamId: string }>('team.stop'),
  ensureSession: bridge.buildProvider<void, { teamId: string }>('team.ensure-session'),
  renameAgent: bridge.buildProvider<void, { teamId: string; slotId: string; newName: string }>('team.rename-agent'),
  renameTeam: bridge.buildProvider<void, { id: string; name: string }>('team.rename'),
  setSessionMode: bridge.buildProvider<void, { teamId: string; sessionMode: string }>('team.set-session-mode'),
  updateWorkspace: bridge.buildProvider<void, { teamId: string; workspace: string }>('team.update-workspace'),
  agentStatusChanged: bridge.buildEmitter<import('@process/team/types').ITeamAgentStatusEvent>('team.agent.status'),
  agentSpawned: bridge.buildEmitter<import('@/common/types/teamTypes').ITeamAgentSpawnedEvent>('team.agent.spawned'),
  agentRemoved: bridge.buildEmitter<import('@/common/types/teamTypes').ITeamAgentRemovedEvent>('team.agent.removed'),
  agentRenamed: bridge.buildEmitter<import('@/common/types/teamTypes').ITeamAgentRenamedEvent>('team.agent.renamed'),
  listChanged: bridge.buildEmitter<import('@/common/types/teamTypes').ITeamListChangedEvent>('team.list-changed'),
  mcpStatus: bridge.buildEmitter<import('@/common/types/teamTypes').ITeamMcpStatusEvent>('team.mcp.status'),
};
