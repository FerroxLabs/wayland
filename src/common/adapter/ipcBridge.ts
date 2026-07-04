/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IConfirmation } from '@/common/chat/chatLib';
import type { OpenDialogOptions } from 'electron';
// C1: wrap platform builders so each provider/emitter key is recorded in the
// inbound-dispatch allowlist. Behavior is identical to buildProvider /
// buildEmitter - only the side-effect of allowlist registration differs.
import { buildProvider, buildEmitter } from './bridgeAllowlist';
import type { McpSource } from '../../process/services/mcpServices/McpProtocol';
import type { CuaPermissionStatus, PrivacyPane } from '../../process/services/macPermissions/cuaPermissions';
import type { MicPermissionStatus } from '../../process/services/macPermissions/micPermission';
import type { DoctorReport } from '../../process/doctor/types';
import type { AgentBackend, AcpModelInfo } from '../types/acpTypes';
import type { SlashCommandItem } from '../chat/slash/types';
import type { IMcpServer, IProvider, TChatConversation, TProviderWithModel, ICssTheme } from '../config/storage';
import type { PreviewHistoryTarget, PreviewSnapshotInfo } from '../types/preview';
import type { MigrationPlan, MigrationResult, MigrationToolId } from '../types/migration';
import type { IjfwErrorReason, IjfwInvokeResult, IjfwRuntimeModePublic } from '../types/ijfw';
import type {
  CodexSetupResult,
  CodexStatusResult,
  FluxConnectorReport,
  OpencodeSetupResult,
  OpencodeStatusResult,
} from '../types/fluxConnector';
import type {
  UpdateCheckRequest,
  UpdateCheckResult,
  UpdateDownloadProgressEvent,
  UpdateDownloadRequest,
  UpdateDownloadResult,
  AutoUpdateStatus,
} from '../update/updateTypes';
import type {
  WCoreInstallRequest,
  WCoreInstallResult,
  WCoreUpdateCheck,
  WCoreUpdateProgress,
} from '../update/wcoreUpdateTypes';
import type {
  ChatGptOAuthResult,
  ConnectFluxResult,
  ConnectPastedKeyResult,
  XaiOAuthResult,
} from '../types/onboarding';
import type { ProtocolDetectionRequest, ProtocolDetectionResponse } from '../utils/protocolDetector';
import type { SpeechToTextRequest, SpeechToTextResult } from '../types/speech';
import type { DownloadProgress, DownloadResult, VoiceAsset } from '../types/voiceAsset';
import type { SkillSecurityReport, SkillIndexEntry, SkillSource, SkillVerdict } from '../types/skillTypes';
import type { ImportResult } from '../../process/services/skills/SkillImport';
import type { KickoffGridResult, KickoffResult, KickoffTelemetryEvent } from '../../process/services/kickoff/types';
import type {
  AskRecord,
  ResolvedSkill,
  StepStatus,
  StepTransitionSource,
  WorkflowInteractivity,
  WorkflowRunMode,
  WorkflowSession,
  WorkflowSessionStatus,
} from '../types/workflowTypes';
import type {
  ProviderId,
  CatalogModel,
  CuratedModel,
  ProviderConnState,
  ConnectError,
} from '../../process/providers/types';
import type { CatalogProviderEntry } from '../../process/providers/catalog/catalogProvider';

export type SkillStats = {
  total: number;
  bySource: Record<SkillSource, number>;
  pinned: number;
  flagged: number;
  /** Count of entries with `security.verdict === 'clean'` (verified safe). */
  verified: number;
};

/**
 * Result of a shell open/reveal operation. The IPC bridge's `invoke` has no
 * rejection channel (a throwing provider leaves the caller's promise pending
 * forever), so open/reveal report success or failure through this value instead
 * of throwing - letting the renderer surface a real error instead of a silent
 * no-op when the OS handler (e.g. `xdg-open` on Linux) is missing or fails.
 */
export type ShellOpenResult = { ok: boolean; error?: string };

export const shell = {
  openFile: buildProvider<ShellOpenResult, string>('open-file'), // Open file with the system default program
  showItemInFolder: buildProvider<ShellOpenResult, string>('show-item-in-folder'), // Open folder
  openExternal: buildProvider<void, string>('open-external'), // Open external link with the system default program
  checkToolInstalled: buildProvider<boolean, { tool: string }>('shell.check-tool-installed'), // Check whether a tool is installed
  openFolderWith: buildProvider<void, { folderPath: string; tool: 'vscode' | 'terminal' | 'explorer' }>(
    'shell.open-folder-with'
  ), // Open a folder with the specified tool
  /** Open a filesystem path (file or directory) via the OS default handler.
   *  Only `~`-expansion is applied - no `..` traversal is allowed. */
  openPath: buildProvider<{ ok: boolean; error?: string }, { path: string }>('shell.open-path'),
};

// #466 Computer-Use macOS permission onboarding. getStatus uses non-prompting
// query APIs (never triggers an OS dialog); openSettings deep-links the exact
// System Settings privacy pane. Quiet on non-macOS (status reports unsupported).
export const cua = {
  getStatus: buildProvider<CuaPermissionStatus, void>('cua.get-permission-status'),
  openSettings: buildProvider<void, { pane: PrivacyPane }>('cua.open-privacy-pane'),
};

// Microphone permission for voice input (speech-to-text). requestAccess triggers
// the macOS mic TCC prompt on demand; getStatus reads the grant without
// prompting. Both report 'unsupported' off macOS.
export const mic = {
  getStatus: buildProvider<MicPermissionStatus, void>('mic.get-permission-status'),
  requestAccess: buildProvider<MicPermissionStatus, void>('mic.request-permission'),
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
  generateTitle: buildProvider<{ success: boolean; title: string | null }, { message: string }>(
    'conversation.generate-title'
  ), // AI-generated concise chat title from the first user message (cheapest fast model)
  reset: buildProvider<void, IResetConversationParams>('reset-conversation'), // Reset conversation
  warmup: buildProvider<void, { conversation_id: string }>('conversation.warmup'), // Warm up conversation (bootstrap)
  stop: buildProvider<IBridgeResponse<{}>, { conversation_id: string }>('chat.stop.stream'), // Stop conversation
  sendMessage: buildProvider<IBridgeResponse<{}>, ISendMessageParams>('chat.send.message'), // Send message (unified interface)
  getSlashCommands: buildProvider<IBridgeResponse<{ commands: SlashCommandItem[] }>, { conversation_id: string }>(
    'conversation.get-slash-commands'
  ),
  askSideQuestion: buildProvider<
    IBridgeResponse<ConversationSideQuestionResult>,
    { conversation_id: string; question: string }
  >('conversation.ask-side-question'),
  confirmMessage: buildProvider<IBridgeResponse, IConfirmMessageParams>('conversation.confirm.message'), // Generic confirm message
  responseStream: buildEmitter<IResponseMessage>('chat.response.stream'), // Receive messages (unified interface)
  turnCompleted: buildEmitter<IConversationTurnCompletedEvent>('conversation.turn.completed'),
  /**
   * The runaway circuit-breaker (Phase 2) stopped a turn that was looping
   * (re-reading the same content / a command failing repeatedly). Carries the
   * conversation + reason so the renderer can explain why it stopped.
   */
  runawayHalted:
    buildEmitter<import('@process/services/runaway/RunawayMonitor').RunawayHalted>('conversation.runaway-halted'),
  listChanged: buildEmitter<IConversationListChangedEvent>('conversation.list-changed'),
  getWorkspace: buildProvider<
    IDirOrFile[],
    { conversation_id: string; workspace: string; path: string; search?: string }
  >('conversation.get-workspace'),
  responseSearchWorkSpace: buildProvider<void, { file: number; dir: number; match?: IDirOrFile }>(
    'conversation.response.search.workspace'
  ),
  reloadContext: buildProvider<IBridgeResponse, { conversation_id: string }>('conversation.reload-context'),
  // Pop-out windows (#27 phase 2): open a conversation in its own OS window for
  // multi-monitor work. Dedupes per conversation (focuses an existing pop-out);
  // dockBack closes the pop-out and restores the main-window tab. popoutClosed
  // is broadcast to ALL windows so the main window can un-dim the placeholder
  // tab when a pop-out closes by any path (dock-back, OS close, app quit).
  popout: buildProvider<{ ok: boolean; alreadyOpen: boolean }, { conversation_id: string }>('conversation.popout'),
  dockBack: buildProvider<{ ok: boolean }, { conversation_id: string }>('conversation.dock-back'),
  popoutClosed: buildEmitter<{ conversation_id: string }>('conversation.popout-closed'),
  setConfig: buildProvider<
    IBridgeResponse,
    {
      conversation_id: string;
      config: { model?: string; thinking?: string; thinking_budget?: number; effort?: string };
    }
  >('conversation.set-config'),
  deleteMessagesAfter: buildProvider<
    IBridgeResponse<{ deleted: number }>,
    { conversation_id: string; afterTimestamp: number }
  >('conversation.delete-messages-after'),
  confirmation: {
    add: buildEmitter<IConfirmation<any> & { conversation_id: string }>('confirmation.add'),
    update: buildEmitter<IConfirmation<any> & { conversation_id: string }>('confirmation.update'),
    confirm: buildProvider<
      IBridgeResponse,
      // #504: `answer` carries an AskUserQuestion choice back to the engine.
      { conversation_id: string; msg_id: string; data: any; callId: string; answer?: string }
    >('confirmation.confirm'),
    list: buildProvider<IConfirmation<any>[], { conversation_id: string }>('confirmation.list'),
    remove: buildEmitter<{ conversation_id: string; id: string }>('confirmation.remove'),
  },
  // Session-level approval memory for "always allow" decisions
  approval: {
    // Check if action is approved (keys are parsed from action+commandType in backend)
    check: buildProvider<boolean, { conversation_id: string; action: string; commandType?: string }>('approval.check'),
  },
};

// Gemini conversation related interface - reuses the unified conversation interface
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

/**
 * One-click bug-report payload (#464): app-window screenshot is placed on the OS
 * clipboard by the main process; the rest pre-fills a GitHub issue. `diagnostics`
 * is the already secret-masked `wayland_concierge_diag` overview.
 */
export type IBugReportData = {
  appVersion: string;
  engineVersion: string | null;
  platform: string;
  arch: string;
  osRelease: string;
  diagnostics: string;
  screenshotCopied: boolean;
};

export const application = {
  restart: buildProvider<void, void>('restart-app'), // Restart app
  openDevTools: buildProvider<boolean, void>('open-dev-tools'), // Open/close DevTools, returns the resulting state
  isDevToolsOpened: buildProvider<boolean, void>('is-dev-tools-opened'), // Get current DevTools state
  systemInfo: buildProvider<
    { cacheDir: string; workDir: string; logDir: string; platform: string; arch: string; userName: string },
    void
  >('system.info'), // Get system info
  getPath: buildProvider<string, { name: 'desktop' | 'home' | 'downloads' }>('app.get-path'), // Get system path
  // One-click bug report (#464): capture the app window (needs no OS Screen-Recording
  // permission), copy it to the clipboard, and return diagnostics + versions to
  // pre-fill a GitHub issue. Returned diagnostics are already secret-masked.
  captureBugReport: buildProvider<IBridgeResponse<IBugReportData>, void>('app.capture-bug-report'),
  updateSystemInfo: buildProvider<IBridgeResponse, { cacheDir: string; workDir: string }>('system.update-info'), // Update system info
  getZoomFactor: buildProvider<number, void>('app.get-zoom-factor'),
  setZoomFactor: buildProvider<number, { factor: number }>('app.set-zoom-factor'),
  // Pop a main destination (e.g. Mission Control) out into its own window, reusing
  // the conversation pop-out window infrastructure. `route` is validated against an
  // allowlist in the main process. Returns alreadyOpen:true when an existing
  // pop-out of the same route was focused instead of a new one created (#157).
  popoutRoute: buildProvider<{ ok: boolean; alreadyOpen: boolean }, { route: string }>('app.popout-route'),
  // CDP (Chrome DevTools Protocol) management
  getCdpStatus: buildProvider<IBridgeResponse<ICdpStatus>, void>('app.get-cdp-status'), // Get CDP status
  updateCdpConfig: buildProvider<IBridgeResponse<ICdpConfig>, Partial<ICdpConfig>>('app.update-cdp-config'), // Update CDP config
  // Start on boot management
  getStartOnBootStatus: buildProvider<IBridgeResponse<IStartOnBootStatus>, void>('app.get-start-on-boot-status'), // Get start-on-boot status
  setStartOnBoot: buildProvider<IBridgeResponse<IStartOnBootStatus>, { enabled: boolean }>('app.set-start-on-boot'), // Set start-on-boot
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

// In-app updater for the bundled Wayland Core engine binary (HUMAN-only;
// remote-denied in bridgeAllowlist - install downloads + stages a native binary).
export const wcoreUpdate = {
  /** Check GitHub releases for a newer wayland-core than the installed binary. */
  check: buildProvider<WCoreUpdateCheck, void>('wcoreUpdate.check'),
  /** Download, SHA-256 verify, and install a release tag into the override dir. */
  install: buildProvider<WCoreInstallResult, WCoreInstallRequest>('wcoreUpdate.install'),
  /** Install progress (download percent + phase) emitted by the main process. */
  progress: buildEmitter<WCoreUpdateProgress>('wcoreUpdate.progress'),
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
    // allowExternalSource: an explicit user drag-drop/paste authorizes a source
    // file outside the static roots (still guarded against secrets/traversal).
    { filePaths: string[]; workspace: string; sourceRoot?: string; allowExternalSource?: boolean }
  >('copy-files-to-workspace'), // Copy files into workspace
  removeEntry: buildProvider<IBridgeResponse, { path: string }>('remove-entry'), // Delete file or folder
  renameEntry: buildProvider<IBridgeResponse<{ newPath: string }>, { path: string; newName: string }>('rename-entry'), // Rename file or folder
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
  listBuiltinAutoSkills: buildProvider<Array<{ name: string; description: string }>, void>('list-builtin-auto-skills'),
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
  getCustomExternalPaths: buildProvider<Array<{ name: string; path: string }>, void>('get-custom-external-paths'),
  addCustomExternalPath: buildProvider<IBridgeResponse, { name: string; path: string }>('add-custom-external-path'),
  removeCustomExternalPath: buildProvider<IBridgeResponse, { path: string }>('remove-custom-external-path'),
};

export const speechToText = {
  transcribe: buildProvider<SpeechToTextResult, SpeechToTextRequest>('speech-to-text.transcribe'),
};

export const voiceSynth = {
  speak: buildProvider<{ data: number[]; mimeType: string }, { text: string }>('voice-synth.speak'),
  stop: buildProvider<Record<string, never>, void>('voice-synth.stop'),
};

export const skills = {
  scan: buildProvider<SkillSecurityReport | null, { name: string }>('skills.scan'),
  getReport: buildProvider<SkillSecurityReport | null, { name: string }>('skills.get-report'),
  rescanAll: buildProvider<{ rescanned: number }, void>('skills.rescan-all'),
  /**
   * Manual "Scan library" action (C4). Runs the same regex-only,
   * scannerVersion-gated sweep as the app-start trigger and returns how many
   * entries were (re)scanned. Never spends a model call — first-party content.
   */
  scanLibrary: buildProvider<{ rescanned: number }, void>('skills.scan-library'),
  import: {
    /** Import a skill from a local folder path. */
    folder: buildProvider<ImportResult, { srcPath: string }>('skills.import.folder'),
    /** Clone a git URL and import the resulting skill folder. */
    git: buildProvider<ImportResult, { url: string }>('skills.import.git'),
    /** Extract a zip archive and import contained skills. */
    zip: buildProvider<ImportResult, { zipPath: string }>('skills.import.zip'),
    /** Import a single SKILL.md file. */
    singleSkillMd: buildProvider<ImportResult, { srcPath: string }>('skills.import.single-skill-md'),
  },
  /**
   * Register a previously-swept, user-approved `review` skill (C3 consent
   * gate). Idempotent and replay-safe: the approval is keyed by the imported
   * on-disk path + the `contentHash` the user actually saw, so an approval
   * can't be replayed against a different body. Returns `{ ok: false }` with a
   * reason when the on-disk content changed, is now blocked, or is missing.
   */
  confirmImport: buildProvider<
    { ok: true } | { ok: false; error: 'content-changed' | 'blocked' | 'not-found' },
    { name: string; destPath: string; contentHash: string }
  >('skills.confirm-import'),
  /**
   * Return entries from the SkillLibrary index. Defaults to `type: 'skill'`
   * so the Skills page contract is preserved; pass `{ type: 'workflow' }`
   * to feed the Workflows page or `{ type: 'agent-profile' }` if a third
   * caller ever needs them.
   */
  list: buildProvider<SkillIndexEntry[], { type?: SkillIndexEntry['type'] } | undefined>('skills.list'),
  /**
   * Rank library skills for a composer draft (BM25), mirroring the per-turn
   * retrieval the agent uses. Powers the composer "+" "Suggested for '<draft>'"
   * list. Returns [] for greetings or when nothing clearly matches.
   */
  suggest: buildProvider<SkillIndexEntry[], { query: string; limit?: number }>('skills.suggest'),
  /** Return aggregate library statistics. */
  stats: buildProvider<SkillStats, void>('skills.stats'),
  /**
   * Load the body (markdown content) of a skill or workflow by name.
   * Used by the Workflows → Schedule flow to pre-fill the scheduled
   * task prompt with the chosen workflow's full SKILL.md body. Returns
   * null for unknown names or blocked (quarantined) entries.
   */
  getBody: buildProvider<string | null, { name: string }>('skills.get-body'),
  /**
   * Overwrite a user-editable skill's SKILL.md body. Re-scans the new body
   * (SkillGuard); a `blocked` verdict is rejected and the body is NOT written.
   * Only `user`/`imported` source skills are editable - bundled skills are
   * read-only and return `{ error: 'read-only' }`.
   */
  updateBody: buildProvider<
    { ok: true; verdict: string } | { ok: false; error: string },
    { name: string; body: string }
  >('skills.update-body'),
  /** Pin or unpin a skill by name. */
  setPinned: buildProvider<void, { name: string; pinned: boolean }>('skills.set-pinned'),
  /** Names of the currently pinned skills, used to hydrate the pin stars on load. */
  getPinned: buildProvider<string[], void>('skills.get-pinned'),
  /**
   * Add a skill to a single conversation from the chat composer. The skill's
   * body is injected once on that conversation's next turn (persisted in
   * conversation.extra.sessionSkills) and shown in the loaded-skills chip.
   * Rejects unknown or blocked (quarantined) skills.
   */
  addToConversation: buildProvider<
    { ok: true } | { ok: false; error: string },
    { conversationId: string; name: string }
  >('skills.add-to-conversation'),
  /**
   * Read / write the opt-in flag for CLI skill discovery
   * (`skills.cliDiscovery.enabled`). Toggling takes effect on the next
   * app restart - there's no live re-scan yet, so the renderer surfaces
   * a restart-required hint when the user flips it.
   */
  getCliDiscoveryEnabled: buildProvider<boolean, void>('skills.cli-discovery.get'),
  setCliDiscoveryEnabled: buildProvider<void, { enabled: boolean }>('skills.cli-discovery.set'),
  build: {
    /**
     * Draft a SKILL.md from a plain-text description.
     * TODO: wire to real model call; currently returns a deterministic template.
     */
    draft: buildProvider<{ skillMd: string }, { description: string }>('skills.build.draft'),
  },
  /**
   * Write a new SKILL.md to ~/.wayland/skills/<kebab-name>/SKILL.md,
   * scan it via SkillGuard, register in SkillLibrary, and return the verdict.
   */
  save: buildProvider<
    { name: string; verdict: SkillVerdict; quarantinedAt?: string },
    { name: string; description: string; category: string; tags: string[]; body: string; type?: 'skill' | 'workflow' }
  >('skills.save'),
};

/**
 * Per-item verdict returned by a type-aware import. One entry per imported
 * SKILL.md, carrying what surface it landed on so the import modal can show
 * "Registered as Assistant / Workflow / Skill" alongside the SkillGuard
 * verdict (clean / review / blocked).
 */
export type ImportItemResult = {
  name: string;
  /** Surface the entry registered into (driven by frontmatter `type:`). */
  registeredAs: SkillIndexEntry['type'];
  /** SkillGuard verdict: 'blocked' items are quarantined, not registered. */
  verdict: SkillVerdict;
  /** Assistant id, set only when registeredAs === 'agent-profile'. */
  assistantId?: string;
};

export type ImportSummary = {
  items: ImportItemResult[];
  /** Names routed to quarantine (verdict === 'blocked'). */
  quarantined: string[];
  /** Non-fatal warnings surfaced by the importer (e.g. executable-ref). */
  warnings: string[];
};

/**
 * Type-aware import for Assistants and Workflows. Runs the hardened
 * SkillImport pipeline (folder / git / SKILL.md), then routes each imported
 * entry by its frontmatter `type:`:
 *   - 'agent-profile' -> written to the custom-assistant store (surfaces on
 *     the Assistants page; the SkillLibrary type filter does NOT surface them)
 *   - 'workflow' / 'skill' -> already registered into SkillLibrary by the
 *     importer (surface on Workflows / Skills via skills.list).
 */
export const imports = {
  folder: buildProvider<ImportSummary, { srcPath: string }>('imports.folder'),
  git: buildProvider<ImportSummary, { url: string }>('imports.git'),
  singleSkillMd: buildProvider<ImportSummary, { srcPath: string }>('imports.single-skill-md'),
};

export const voiceAsset = {
  download: buildProvider<DownloadResult, VoiceAsset>('voice-asset.download'),
  cancel: buildProvider<{ cancelled: boolean }, { assetId: string }>('voice-asset.cancel'),
  // Streamed per-chunk download progress. voiceAssetBridge feeds this from the
  // onProgress callback it hands to VoiceAssetManager.download; the renderer's
  // download controls subscribe to drive <Progress/> (replaces the old
  // hardcoded 0% + "progress reporting coming soon" stub).
  downloadProgress: buildEmitter<DownloadProgress>('voice-asset.download-progress'),
  // Resolve the install state for a known asset. The renderer uses this to
  // suppress the Download button when the model is already on disk (no more
  // "Download Model" alongside an already-installed model).
  exists: buildProvider<{ installed: boolean; destPath: string | null }, { id: string }>('voice-asset.exists'),
  // wayland-asset:// URL base for the bundled voice-models directory. The
  // renderer's transformers.js STT worker uses this as env.localModelPath
  // so it can fetch the bundled Whisper-tiny ONNX files offline.
  localModelBase: buildProvider<{ url: string }, void>('voice-asset.local-model-base'),
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
  init: buildProvider<import('@/common/types/fileSnapshot').SnapshotInfo, { workspace: string }>('file-snapshot-init'),
  compare: buildProvider<import('@/common/types/fileSnapshot').CompareResult, { workspace: string }>(
    'file-snapshot-compare'
  ),
  getBaselineContent: buildProvider<string | null, { workspace: string; filePath: string }>('file-snapshot-baseline'),
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
  login: buildProvider<IBridgeResponse<{ account: string; firstName?: string }>, { proxy?: string }>(
    'google.auth.login'
  ),
  logout: buildProvider<void, {}>('google.auth.logout'),
  status: buildProvider<IBridgeResponse<{ account: string }>, { proxy?: string }>('google.auth.status'),
};

export const xaiAuth = {
  /**
   * Native xAI "Sign in with X (Grok)" via OAuth 2.0 Authorization Code + PKCE.
   * Reuses an existing `~/.grok/auth.json` credential when present, otherwise
   * opens the system browser to `accounts.x.ai`, runs a loopback listener,
   * exchanges the code for a bearer token, and persists it through the
   * model-registry connect path as the `xai` provider (inference targets
   * `https://api.x.ai/v1`). Resolves `{ ok: true, reused }` or a stable error
   * reason - it never rejects, so the renderer can branch on the result alone.
   */
  login: buildProvider<XaiOAuthResult, void>('xai.auth.login'),
  /**
   * Silent re-auth: exchange the persisted refresh token for a fresh access
   * token and re-register it. Surfaced for the 401 re-auth path.
   */
  refresh: buildProvider<XaiOAuthResult, void>('xai.auth.refresh'),
  /**
   * Complete an in-flight sign-in with the code the user copied from the xAI
   * consent page (xAI shows a code to paste rather than redirecting to the
   * loopback). Returns `{ accepted }` - false when no flow is awaiting a code.
   */
  submitCode: buildProvider<{ accepted: boolean }, { code: string }>('xai.auth.submit-code'),
};

export const chatgptAuth = {
  /**
   * Native "Sign in with ChatGPT" via OAuth 2.0 Authorization Code + PKCE, using
   * the same flow the Codex CLI uses (`auth.openai.com`, `originator=codex_cli_rs`)
   * - no `codex` CLI required. Opens the system browser, runs a loopback listener
   * on `127.0.0.1:1455` (fallback 1457), exchanges the code for the subscription
   * bundle, persists it encrypted, and registers the `chatgpt-subscription`
   * provider (inference routes to `https://chatgpt.com/backend-api/codex/responses`).
   * Resolves `{ ok: true, planType }` or a stable error reason - it never rejects,
   * so the renderer can branch on the result alone.
   */
  login: buildProvider<ChatGptOAuthResult, void>('chatgpt.auth.login'),
  /**
   * Silent re-auth: exchange the persisted refresh token for a fresh access
   * token and re-register it. Surfaced for the proactive + 401 re-auth paths.
   */
  refresh: buildProvider<ChatGptOAuthResult, void>('chatgpt.auth.refresh'),
};

export const onboarding = {
  /**
   * One-click Flux Router connect via OAuth 2.0 Authorization Code + PKCE.
   * Opens the system browser, runs a loopback listener, exchanges the code for a
   * freshly-minted `sk-flux` key, and persists it through the model-registry
   * connect path. Resolves with `{ ok: true }` on success or a stable error
   * reason - it never rejects, so the renderer can branch on the result alone.
   */
  connectFlux: buildProvider<ConnectFluxResult, void>('onboarding.connect-flux'),
  /**
   * Connect a single pasted API key. The provider is auto-detected with the
   * real `ProviderDetector` + `SkRaceResolver`, so a bare `sk-` key shared by
   * OpenAI/DeepSeek/Moonshot/Qwen is probed live and connected to its true
   * owner. Resolves with the resolved `providerId` or a stable error reason.
   */
  connectPastedKey: buildProvider<ConnectPastedKeyResult, { key: string }>('onboarding.connect-pasted-key'),
  /**
   * Classify the free-text "what are you working on" line into 1-3 focus
   * personas (content/sales/business/dev/finance/general) so the launchpad loads
   * the right assistants. Uses a cheap fast model (e.g. Gemini Flash) when one is
   * connected, with a deterministic keyword fallback for true cold start.
   */
  inferFocus: buildProvider<string[], { work: string }>('onboarding.infer-focus'),
};

/**
 * A message held in MAIN-PROCESS memory because the engine had no usable
 * provider when the user pressed send (the "asleep engine" flow). The body is
 * never persisted to disk/sessionStorage (SEC-8: message bodies are secrets/PII)
 * - the renderer keeps only the opaque `id` across an activation/OAuth round
 * trip and reclaims the message with an exactly-once `take`.
 */
export type IPendingSend = {
  /** Opaque id minted on hold; lets the renderer confirm its own held message. */
  id: string;
  conversationId: string;
  message: string;
  files: string[];
  /** Epoch ms the message was held. */
  createdAt: number;
};

/**
 * Asleep-engine pending-send store (SEC-8). HUMAN/RENDERER ONLY - every method
 * is remote-denied in `bridgeAllowlist.ts`: a remote/agent caller must never
 * read a held message body (PII/secrets) or inject one into a conversation.
 */
export const pendingSend = {
  /** Hold a message for a conversation; replaces any prior hold. Returns its id. */
  hold: buildProvider<{ id: string }, { conversationId: string; message: string; files?: string[] }>(
    'pendingSend.hold'
  ),
  /** Atomically remove + return the held message (exactly-once), or null. */
  take: buildProvider<IPendingSend | null, { conversationId: string }>('pendingSend.take'),
  /** Non-destructive check used to recover a hold after a renderer remount. */
  peek: buildProvider<{ hasPending: boolean; id?: string }, { conversationId: string }>('pendingSend.peek'),
  /** Drop a held message without sending it (user cancelled / left the thread). */
  clear: buildProvider<{ ok: boolean }, { conversationId: string }>('pendingSend.clear'),
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

// ACP conversation related interface - reuses the unified conversation interface
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
  setMode: buildProvider<IBridgeResponse<{ mode: string }>, { conversationId: string; mode: string }>('acp.set-mode'),
  // Get current session mode for ACP agents
  getMode: buildProvider<IBridgeResponse<{ mode: string; initialized: boolean }>, { conversationId: string }>(
    'acp.get-mode'
  ),
  // Get model info for ACP agents (model name and available models).
  // `backend` is optional and only consulted before a task exists, so the
  // process can derive a backend's cold-start catalog (e.g. Claude Code's
  // cc-switch model list) instead of returning null.
  getModelInfo: buildProvider<
    IBridgeResponse<{ modelInfo: AcpModelInfo | null }>,
    { conversationId: string; backend?: string }
  >('acp.get-model-info'),
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
    IBridgeResponse<
      | { success: true }
      | {
          success: false;
          code: 'needs_byo' | 'transport_unsupported' | 'no_url' | 'cancelled' | 'timeout' | 'unknown';
          error?: string;
          redirectUri?: string;
          authorizationUrl?: string;
        }
    >,
    { server: IMcpServer; config?: any }
  >('mcp.login-oauth'),
  /**
   * Abort an in-flight loginMcpOAuth. Optional serverName targets a single
   * login; omit to cancel all. Lets the renderer's Cancel button unstick a user
   * waiting on an OAuth callback that will never arrive.
   */
  cancelMcpOAuth: buildProvider<IBridgeResponse, string | undefined>('mcp.cancel-oauth'),
  logoutMcpOAuth: buildProvider<IBridgeResponse, string>('mcp.logout-oauth'),
  getAuthenticatedServers: buildProvider<IBridgeResponse<string[]>, void>('mcp.get-authenticated-servers'),
  /**
   * Persist user-supplied OAuth client credentials onto an existing server.
   * Caller is responsible for re-issuing loginMcpOAuth after this resolves.
   */
  setMcpByoOAuthCredentials: buildProvider<
    IBridgeResponse<{ server: IMcpServer }>,
    { serverId: string; clientId: string; clientSecret?: string }
  >('mcp.set-byo-oauth-credentials'),
};

// Codex conversation related interface - reuses the unified conversation interface
export const codexConversation = {
  sendMessage: conversation.sendMessage,
  responseStream: conversation.responseStream,
};

// OpenClaw conversation related interface - reuses the unified conversation interface
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
  save: buildProvider<PreviewSnapshotInfo, { target: PreviewHistoryTarget; content: string }>('preview-history.save'),
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
     * Typed as `unknown` - consumers MUST validate the shape before reading
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
  getRouteThroughFlux: buildProvider<boolean, void>('system-settings:get-route-through-flux'),
  setRouteThroughFlux: buildProvider<void, { enabled: boolean }>('system-settings:set-route-through-flux'),
  // Native Claude default model slot for a new Claude Code chat (null = no native
  // login). Lets a Claude chat default to the subscription instead of flux-auto.
  getClaudeNativeDefaultModelId: buildProvider<string | null, void>(
    'system-settings:get-claude-native-default-model-id'
  ),
  changeLanguage: buildProvider<void, { language: string }>('system-settings:change-language'),
  // Broadcast language change to all renderers (desktop + WebUI) for real-time sync
  languageChanged: buildEmitter<{ language: string }>('system-settings:language-changed'),
  getSaveUploadToWorkspace: buildProvider<boolean, void>('system-settings:get-save-upload-to-workspace'),
  setSaveUploadToWorkspace: buildProvider<void, { enabled: boolean }>('system-settings:set-save-upload-to-workspace'),
  getAutoPreviewOfficeFiles: buildProvider<boolean, void>('system-settings:get-auto-preview-office-files'),
  setAutoPreviewOfficeFiles: buildProvider<void, { enabled: boolean }>('system-settings:set-auto-preview-office-files'),
};

// Doctor / health-check (issue #35). `runDoctor` runs the full diagnostic
// battery across providers, models, the engine, MCP, backends, workspaces, and
// config, returning a machine-readable + human-readable report. Remote-denied
// (bridgeAllowlist): the report discloses the host's connectivity + config
// posture, so a paired WebUI client must never enumerate it.
export const doctor = {
  runDoctor: buildProvider<DoctorReport, void>('doctor.run'),
  // Copy the rendered report text to the OS clipboard from the MAIN process.
  // `navigator.clipboard.writeText` is unreliable in the Electron renderer on
  // Windows (it silently rejects without a focused document / secure-context
  // gesture), so the Doctor "Copy report" button routes through Electron's
  // `clipboard.writeText` here instead (#269).
  copyText: buildProvider<void, { text: string }>('doctor.copy-text'),
};

// Flux compatibility-layer connectors (opencode, etc.)
export const fluxConnector = {
  opencodeStatus: buildProvider<OpencodeStatusResult, void>('flux-connector:opencode-status'),
  setupOpencode: buildProvider<OpencodeSetupResult, void>('flux-connector:setup-opencode'),
  removeOpencode: buildProvider<FluxConnectorReport, void>('flux-connector:remove-opencode'),
  codexStatus: buildProvider<CodexStatusResult, void>('flux-connector:codex-status'),
  setupCodex: buildProvider<CodexSetupResult, void>('flux-connector:setup-codex'),
  removeCodex: buildProvider<FluxConnectorReport, void>('flux-connector:remove-codex'),
};

// Ambient Mode - M1 bubble window (AC-M1-5 / AC-M1-10 / AC-M1-11 / AC-M1-13)
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
  listJobsByConversation: buildProvider<ICronJob[], { conversationId: string }>('cron.list-jobs-by-conversation'),
  getJob: buildProvider<ICronJob | null, { jobId: string }>('cron.get-job'),
  // CRUD
  addJob: buildProvider<ICronJob, ICreateCronJobParams>('cron.add-job'),
  updateJob: buildProvider<ICronJob, { jobId: string; updates: Partial<ICronJob> }>('cron.update-job'),
  removeJob: buildProvider<void, { jobId: string }>('cron.remove-job'),
  runNow: buildProvider<{ conversationId: string }, { jobId: string }>('cron.run-now'),
  saveSkill: buildProvider<void, { jobId: string; content: string }>('cron.save-skill'),
  hasSkill: buildProvider<boolean, { jobId: string }>('cron.has-skill'),
  // v0.6.2.6 - confirm or dismiss an inline CronProposeCard (rendered when
  // the agent emits [CRON_PROPOSE] in a chat). Status transitions are
  // guarded server-side to prevent double-fire from rapid clicks.
  confirmProposal: buildProvider<
    { ok: true; jobId?: string; editPayload?: ICronProposeEditPayload } | { ok: false; reason: string },
    { conversationId: string; msgId: string; action: 'accept' | 'edit' | 'cancel' }
  >('cron.confirm-proposal'),
  // Events
  onJobCreated: buildEmitter<ICronJob>('cron.job-created'),
  onJobUpdated: buildEmitter<ICronJob>('cron.job-updated'),
  onJobRemoved: buildEmitter<{ jobId: string }>('cron.job-removed'),
  onJobExecuted: buildEmitter<{ jobId: string; status: 'ok' | 'error' | 'skipped' | 'missed'; error?: string }>(
    'cron.job-executed'
  ),
};

/**
 * Concierge Phase 2b - confirm or dismiss an inline ConciergeConfigCard (rendered
 * when the agent emits [CONCIERGE_PROPOSE] in a chat). The mutation is applied in
 * MAIN only on `accept`; the optional `secret` carries a card-entered API key for
 * provider_connect and never crosses into the stored message. Status transitions
 * are guarded server-side (auth + pending-only + atomic processing) to prevent
 * double-fire and cross-conversation hijack - see conciergeConfigBridge.ts.
 */
export const conciergeConfig = {
  confirmProposal: buildProvider<
    import('@/common/chat/conciergeConfig').ConciergeConfirmResult,
    import('@/common/chat/conciergeConfig').ConciergeConfirmParams
  >('conciergeConfig.confirm-proposal'),
};

/** Mission Control - unified task ledger (team tasks + cron jobs). */
export const missionControl = {
  snapshot: buildProvider<import('@/common/types/missionControl').MissionControlSnapshot, { userId: string }>(
    'mission-control.snapshot'
  ),
};

/**
 * v0.6.2.6 - payload returned by cron.confirmProposal when action='edit'.
 * The renderer uses this to open CreateTaskDialog pre-filled so the user
 * can tweak the proposed cron before saving.
 */
export interface ICronProposeEditPayload {
  conversationId: string;
  conversationTitle?: string;
  agentType?: string;
  initialName: string;
  initialPrompt: string;
  initialSchedule: string;
  initialScheduleDescription: string;
}

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
    /** Remote agent config ID (FK to remote_agents table) - required when type='remote' */
    remoteAgentId?: string;
    /** Extra skill directory paths to symlink into workspace (e.g. cron job skill dirs) */
    extraSkillPaths?: string[];
    /** Builtin skill names to exclude from auto-injection (e.g. 'cron' for cron-spawned conversations) */
    excludeBuiltinSkills?: string[];
    /**
     * Skills staged in the composer "+" menu before the conversation existed.
     * Persisted to the new conversation so consumePendingSessionSkills injects
     * their bodies on the first turn (same field skills.add-to-conversation writes).
     */
    sessionSkills?: string[];
    /**
     * Per-conversation reasoning effort for effort-capable backends
     * (Codex / WCore / Claude-ACP). Persisted on the conversation and read by
     * each backend's config builder on the next turn. Absent => backend default.
     */
    effort?: 'low' | 'medium' | 'high';
    /** Team ownership - conversations with teamId are hidden from the sidebar */
    teamId?: string;
    /** Project ownership - stamps extra.projectId so the conversation lives under a project umbrella. */
    projectId?: string;
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
  getWebuiContributions: buildProvider<IExtensionWebuiContribution[], void>('extensions.get-webui-contributions'),
  /** Snapshot of all agent activities, for extension settings tabs */
  getAgentActivitySnapshot: buildProvider<IExtensionAgentActivitySnapshot, void>(
    'extensions.get-agent-activity-snapshot'
  ),
  /** Get merged extension i18n translations for a specific locale (falls back to en-US) */
  getExtI18nForLocale: buildProvider<Record<string, unknown>, { locale: string }>('extensions.get-ext-i18n-for-locale'),

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
  IChannelPluginConfigView,
  IChannelPluginStatus,
  IChannelSession,
  IChannelUser,
} from '@process/channels/types';

export const channel = {
  // Plugin Management
  getPluginStatus: buildProvider<IBridgeResponse<IChannelPluginStatus[]>, void>('channel.get-plugin-status'),
  // Read back a plugin's SAVED non-secret config so the Settings form can
  // rehydrate on reopen (fixes #548: form was always blank). Secrets are never
  // returned - only presence flags in `secretPresence`. Remote-denied (see
  // bridgeAllowlist) because it discloses saved connection details.
  getPluginConfig: buildProvider<IBridgeResponse<IChannelPluginConfigView | null>, { pluginId: string }>(
    'channel.get-plugin-config'
  ),
  enablePlugin: buildProvider<IBridgeResponse, { pluginId: string; config: Record<string, unknown> }>(
    'channel.enable-plugin'
  ),
  disablePlugin: buildProvider<IBridgeResponse, { pluginId: string }>('channel.disable-plugin'),
  testPlugin: buildProvider<
    IBridgeResponse<{ success: boolean; botUsername?: string; error?: string }>,
    {
      pluginId: string;
      token: string;
      extraConfig?: { appId?: string; appSecret?: string; domain?: 'feishu' | 'lark' };
    }
  >('channel.test-plugin'),

  // Pairing Management
  getPendingPairings: buildProvider<IBridgeResponse<IChannelPairingRequest[]>, void>('channel.get-pending-pairings'),
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

  // Resolve the public webhook base URL for a webhook-driven channel.
  // Precedence: user-supplied URL > opt-in tunnel (cloudflared) > none.
  // `configured: false` means the channel needs a public URL or the tunnel
  // opt-in (it stays OFF by default because it opens a public ingress). The
  // channel keeps verifying its provider signature regardless.
  getWebhookExposure: buildProvider<
    IBridgeResponse<{
      configured: boolean;
      publicUrl: string | null;
      source: 'user' | 'tunnel' | 'none';
      message: string;
      webhookUrl: string | null;
    }>,
    {
      platform: string;
      tunnelEnabled: boolean;
      connectionToken?: string;
      userPublicUrl?: string;
      provider?: 'cloudflared' | 'ngrok' | 'tailscale';
    }
  >('channel.get-webhook-exposure'),

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
  // Fired whenever the pending pairing set changes (created / approved / rejected
  // / expired). Carries the refreshed pending list so subscribers can render
  // directly without an extra round-trip.
  pairingRequestsChanged: buildEmitter<IChannelPairingRequest[]>('channel.pairing-requests-changed'),
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
  onStateChanged: buildEmitter<{ name: string; status: HubExtensionStatus; error?: string }>('hub.state-changed'),
};

// ==================== IJFW Install Lifecycle (v0.6.3 Wave 1) ====================

/**
 * Status union surfaced by `ijfwSystemService` as the local IJFW install
 * progresses through detection → install/upgrade → activation. Wave 6 will
 * add a Settings toggle that listens to this emitter; Wave 1 wires the
 * emit-side only.
 */
export type IjfwLifecycleStatus =
  | 'not_installed'
  | 'installing'
  | 'upgrading'
  | 'installed_current'
  | 'installed_pending_activation'
  | 'install_failed';

export type IjfwStatusPayload = {
  status: IjfwLifecycleStatus;
  version?: string;
  reason?: string;
  errorReason?: IjfwErrorReason;
  stderr?: string;
  offline?: boolean;
  /** Count of detected CLIs IJFW knows about, excluding Wayland Core itself. */
  cliCount?: number;
};

export const ijfw = {
  /** Lifecycle event for the local IJFW install (detection → install → activation). */
  onStatusChanged: buildEmitter<IjfwStatusPayload>('ijfw.status-changed'),
  /** Invoke a memory verb on the local IJFW MCP server (Wave 2). */
  brainInvoke: buildProvider<IjfwInvokeResult, { verb: string; args?: Record<string, unknown> }>('ijfw.brain-invoke'),
  /** Snapshot of the current lifecycle status. */
  getStatus: buildProvider<IjfwStatusPayload, void>('ijfw.get-status'),
  /** Refresh the version cache without installing. */
  checkNow: buildProvider<{ ok: true; version: string | null } | { ok: false; error: string }, void>('ijfw.check-now'),
  /** Fire bootstrap immediately - wired to the renderer "Install" button. */
  triggerInstall: buildProvider<{ ok: true } | { ok: false; error: string }, void>('ijfw.trigger-install'),
  /** Persist the Settings opt-out flag. */
  skipSetup: buildProvider<{ ok: true }, { enabled: boolean }>('ijfw.skip-setup'),
  /** Returns whether the MCP client is reachable (`full`) or short-circuiting (`degraded`). */
  getRuntimeMode: buildProvider<IjfwRuntimeModePublic, void>('ijfw.get-runtime-mode'),

  /** Drop-tab: list files currently queued in the ingest dump dir. */
  dropList: buildProvider<{ files: IjfwDropEntry[] }, void>('ijfw.drop-list'),
  /** Drop-tab: ingest a user-supplied file path into the dump dir (main-side safety checks). */
  dropIngest: buildProvider<IjfwDropIngestResult, { path: string }>('ijfw.drop-ingest'),
  /** Drop-tab: quarantine the named file out of the active queue. */
  dropQuarantine: buildProvider<{ ok: true } | { ok: false; error: string }, { name: string }>('ijfw.drop-quarantine'),
};

export type IjfwDropEntry = { name: string; size: number; mtimeMs: number };

export type IjfwDropIngestResult =
  | { ok: true; name: string }
  | { ok: false; error: string; errorReason: IjfwErrorReason };

// --- Models & Providers redesign (Wave 0 contract) ------------------------
// New two-tier model registry. Distinct from the legacy `providers` namespace
// above (which is removed in a later wave) - uses `modelRegistry.*` channel
// strings so there is no runtime collision with `providers.*`.

/** Result of a connect / re-key attempt against a provider. */
export type IModelRegistryConnectResult = {
  ok: boolean;
  error?: ConnectError;
  /**
   * Optional server-provided human-readable detail. Set ONLY by the hosted
   * WebUI HTTP connect path (#524) when a request guard rejects with a reason
   * that has no dedicated `ConnectError` code, so the panel can surface the
   * server's own (secret-scrubbed) message text instead of a bare "unknown".
   * The desktop IPC path never sets it.
   */
  errorMessage?: string;
  /**
   * Non-fatal advisory on an otherwise successful connect. `'no-credit'` means
   * the key authenticated but has no usable credit yet, so the provider was
   * added connected-but-switched-off (#100); the panel surfaces a soft notice.
   * `'no-models'` means a custom OpenAI-compatible base authenticated but exposes
   * no model listing (e.g. Cloudflare Workers AI has no `/models`, #339), so the
   * provider was added connected with an empty catalog - the user supplies a
   * model id manually.
   */
  warning?: ConnectError;
};

/** Result of a connectivity test against an already-connected provider. */
export type IModelRegistryTestResult = {
  ok: boolean;
  error?: ConnectError;
};

/** A provider key discovered from the environment / known credential stores. */
export type IModelRegistryDetectedKey = {
  providerId: ProviderId;
  source: string;
};

/** Live summary row for a connected provider in the registry. */
export type IModelRegistryProviderView = {
  providerId: ProviderId;
  connectedVia: string;
  state: ProviderConnState;
  modelCount: number;
  error?: ConnectError;
};

/** Full catalog + curated view for a single provider. */
export type IModelRegistryCatalogView = {
  catalog: CatalogModel[];
  curated: CuratedModel[];
};

/**
 * Credentials for connect / re-key - a bare API key, per-field cloud creds,
 * `useDiscovered` to resolve an auto-discovered key from the main process
 * (the renderer never sees auto-discovered key values), or `useGoogleAuth` for
 * a Gemini provider whose credentials live in the main-process Google OAuth
 * token store (Wave 3 Fix 6).
 */
export type IModelRegistryCreds =
  | { key: string; baseUrl?: string }
  | { fields: Record<string, string> }
  | { useDiscovered: true }
  | { useGoogleAuth: true };

/**
 * The FULL chat-start dispatch payload for a curated/catalog model, built
 * main-side from the model registry. Carries the decrypted credential material
 * (`apiKey` / cloud `bedrockConfig` / `cloudFields`) the spawn path needs.
 *
 * SECURITY (audit C4): this payload is MAIN-PROCESS ONLY. It must never cross
 * the IPC boundary to the renderer - `resolveForChatStart` returns the
 * non-secret {@link IModelRegistryChatStartHandle} instead, and the spawn path
 * re-resolves the secret in main at dispatch time (`resolveModelSecretsForSpawn`).
 */
export type IModelRegistryChatStartPayload = {
  /** A canonical, stable id for this provider (always equal to `providerId`). */
  id: string;
  providerId: ProviderId;
  /** Short human label, e.g. `'OpenAI'`. */
  name: string;
  /**
   * Legacy `IProvider.platform` string the main-process dispatch expects (e.g.
   * `'openai'`, `'anthropic'`, `'gemini'`, `'bedrock'`, `'gemini-with-google-auth'`).
   * Severs the chat-start dependency on the legacy `model.config` lookup without
   * changing the wcore envBuilder / Gemini-manager signatures.
   */
  platform: string;
  /** The model id the user picked - written verbatim into `useModel`. */
  modelId: string;
  /** API base URL - empty string when the provider uses its canonical default. */
  baseUrl: string;
  /** Decrypted API key (empty string for cloud / google-auth providers). */
  apiKey: string;
  /**
   * AWS Bedrock-specific block - present only when `providerId === 'aws-bedrock'`.
   * Covers both `accessKey` and `profile` auth shapes.
   */
  bedrockConfig?:
    | {
        authMethod: 'accessKey';
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
      }
    | {
        authMethod: 'profile';
        region: string;
        profile: string;
      };
  /**
   * Vertex / Azure cloud-credential fields (Wave 3 Fix 8). Carries the
   * `{ projectId, region, serviceAccountJson }` (Vertex) or `{ endpoint, apiKey }`
   * (Azure) creds the dispatcher arm needs verbatim. Empty / absent for
   * non-cloud providers.
   */
  cloudFields?: Record<string, string>;
  /**
   * Per-model protocol overrides for multi-protocol gateways (OneAPI etc.).
   * Mirrors the legacy `IProvider.modelProtocols` map verbatim.
   */
  modelProtocols?: Record<string, string>;
  /**
   * Multi-account (issue #14): which connected account of the provider this
   * resolution targets. Absent / `'default'` is the single-account case.
   */
  accountId?: string;
};

/**
 * The NON-SECRET chat-start handle returned to the renderer (audit C4). Carries
 * everything the picker needs to bind a conversation to a (provider, account,
 * model) - but NO decrypted credential material. The main process re-resolves
 * the real `apiKey` / cloud creds at dispatch time from this handle, so the
 * plaintext key never crosses IPC to the renderer or a paired WebUI.
 */
export type IModelRegistryChatStartHandle = {
  /** A canonical, stable id for this provider (always equal to `providerId`). */
  id: string;
  providerId: ProviderId;
  /** Short human label, e.g. `'OpenAI'`. */
  name: string;
  /** Legacy `IProvider.platform` string the dispatch arm selects on. */
  platform: string;
  /** The model id the user picked - written verbatim into `useModel`. */
  modelId: string;
  /** API base URL - empty string when the provider uses its canonical default. Non-secret. */
  baseUrl: string;
  /** Multi-account: the account this binding targets (`'default'` when single). */
  accountId?: string;
  /** Per-model protocol overrides for multi-protocol gateways. Non-secret. */
  modelProtocols?: Record<string, string>;
};

/** Result of resolving a curated/catalog model for chat-start (renderer-facing, no secrets). */
export type IModelRegistryResolveForChatStartResult =
  | { ok: true; provider: IModelRegistryChatStartHandle }
  | { ok: false; error: 'not-connected' | 'undecryptable' | 'unsupported' | 'unknown' };

/**
 * Summary of a global `refreshAll` run. `succeeded` / `failed` carry provider
 * ids; `added` carries the genuinely-new models a refresh surfaced (diffed from
 * each provider's catalog before/after). `lastRefreshedAt` is the success-only
 * freshness timestamp (epoch ms) - `null` when no provider succeeded.
 */
export type IModelRegistryRefreshSummary = {
  ok: boolean;
  succeeded: string[];
  failed: string[];
  added: { providerId: string; modelId: string; displayName: string }[];
  lastRefreshedAt: number | null;
};

/** Live freshness state for the Models settings header / scheduler. */
export type IModelRegistryRefreshState = {
  lastRefreshedAt: number | null;
  refreshing: boolean;
};

export const modelRegistry = {
  // Auto-discover provider keys from the environment / credential stores.
  detectKeys: buildProvider<IModelRegistryDetectedKey[], void>('modelRegistry.detectKeys'),
  // Connect a provider (explicit providerId) via a bare key or per-field credentials.
  connect: buildProvider<IModelRegistryConnectResult, { providerId: ProviderId; creds: IModelRegistryCreds }>(
    'modelRegistry.connect'
  ),
  // Test connectivity of an already-connected provider.
  testConnection: buildProvider<IModelRegistryTestResult, { providerId: ProviderId }>('modelRegistry.testConnection'),
  // List all connected providers with live state + model counts.
  list: buildProvider<IModelRegistryProviderView[], void>('modelRegistry.list'),
  // Get the enriched catalog + curated view for a provider.
  getCatalog: buildProvider<IModelRegistryCatalogView, { providerId: ProviderId }>('modelRegistry.getCatalog'),
  // Enable / disable a single model within a provider's catalog.
  toggleModel: buildProvider<{ ok: boolean }, { providerId: ProviderId; modelId: string; enabled: boolean }>(
    'modelRegistry.toggleModel'
  ),
  // Add a user-typed model id that isn't in the provider's public catalog
  // (e.g. an OpenRouter preset `@preset/<slug>`, #617). Persisted separately so
  // it survives catalog refreshes and merges into the curated picker view.
  addCustomModel: buildProvider<{ ok: boolean; reason?: 'duplicate' }, { providerId: ProviderId; modelId: string }>(
    'modelRegistry.addCustomModel'
  ),
  // Remove a previously added custom model id.
  removeCustomModel: buildProvider<{ ok: boolean }, { providerId: ProviderId; modelId: string }>(
    'modelRegistry.removeCustomModel'
  ),
  // Re-fetch a provider's model list + re-enrich.
  refresh: buildProvider<{ ok: boolean }, { providerId: ProviderId }>('modelRegistry.refresh'),
  // Disconnect a provider and drop its persisted catalog.
  disconnect: buildProvider<{ ok: boolean }, { providerId: ProviderId }>('modelRegistry.disconnect'),
  // Replace a connected provider's credentials.
  rekey: buildProvider<IModelRegistryConnectResult, { providerId: ProviderId; creds: IModelRegistryCreds }>(
    'modelRegistry.rekey'
  ),
  // Curated model list for a given CLI agent / backend key.
  curatedForAgent: buildProvider<CuratedModel[], { agentKey: string }>('modelRegistry.curatedForAgent'),
  // The full connectable provider catalog (~100 named OpenAI-compatible
  // providers from the engine's bundled `providers.toml`), sorted by
  // displayName. Each entry carries its baseUrl/envVar so a catalog provider
  // connects with just an API key (the engine resolves the endpoint).
  getProviderCatalog: buildProvider<CatalogProviderEntry[], void>('modelRegistry.getProviderCatalog'),
  /**
   * Resolve a curated/catalog model into the chat-start payload (decrypted
   * key / baseUrl / platform). Used by the home model picker after the user
   * selects a model - replaces the legacy `model.config` row lookup the
   * Wave 3A bridge mirror existed to support.
   */
  resolveForChatStart: buildProvider<
    IModelRegistryResolveForChatStartResult,
    { providerId: ProviderId; modelId: string; accountId?: string }
  >('modelRegistry.resolveForChatStart'),
  // Re-fetch + re-enrich every connected provider once; success-gated freshness stamp.
  refreshAll: buildProvider<IModelRegistryRefreshSummary, { reason?: 'manual' }>('modelRegistry.refreshAll'),
  // Current freshness + in-flight state for the Models settings header.
  getRefreshState: buildProvider<IModelRegistryRefreshState, void>('modelRegistry.getRefreshState'),
  // The auto-refresh toggle (persisted `models.autoRefresh`, default on).
  getAutoRefresh: buildProvider<boolean, void>('modelRegistry.getAutoRefresh'),
  setAutoRefresh: buildProvider<{ ok: boolean }, { value: boolean }>('modelRegistry.setAutoRefresh'),
  // Emitted once after every successful refreshAll / manual per-provider refresh
  // so an open picker / the Models page can re-fetch curated views live.
  listChanged: buildEmitter<void>('modelRegistry.list-changed'),
};

/**
 * Presence-only view of one engine tool-backend key. The plaintext key is NEVER
 * sent to the renderer - `wcoreToolKeys.list` returns only whether a key is
 * stored for each backend.
 */
export type IWcoreToolKeyPresence = {
  /** Canonical tool-backend id (e.g. `brave`, `tavily`, `exa`, `firecrawl`). */
  id: string;
  /** Whether an encrypted key is stored for this backend. */
  hasKey: boolean;
};

/**
 * Wayland Core tool-backend keys (web-search providers). HUMAN/RENDERER ONLY -
 * `set`/`delete` mutate credential material for the engine tool sandbox and are
 * remote-denied; `list` returns presence ONLY (never the plaintext key).
 */
export const wcoreToolKeys = {
  // Store (insert or replace) the encrypted key for a tool backend.
  set: buildProvider<{ ok: boolean }, { id: string; key: string }>('wcoreToolKeys.set'),
  // Presence-only metadata for every supported tool backend (never the key).
  list: buildProvider<IWcoreToolKeyPresence[], void>('wcoreToolKeys.list'),
  // Remove a stored tool-backend key.
  delete: buildProvider<{ ok: boolean }, { id: string }>('wcoreToolKeys.delete'),
};

/**
 * Wayland Core engine `config.toml` sections (tools / security / memory /
 * profiles, ...). HUMAN/RENDERER ONLY - `setSection` mutates the engine's
 * security-load-bearing runtime config (tool allow-lists, sandbox policy, env
 * passthrough). It is remote-denied in `bridgeAllowlist.ts` and must NEVER be
 * exposed to the agent/engine tool surface: an agent that could call it could
 * rewrite its own allow-list and escape the sandbox (SEC-6).
 *
 * The setter always targets the real user `config.toml` (no caller-supplied
 * path) and honours the engine's config invariants (atomic, lossless,
 * single-flight) via `configBridge.setSection`.
 */
export const wcoreConfig = {
  // Read one top-level `config.toml` section (e.g. `tools`, `security`),
  // or undefined when the section is absent.
  getSection: buildProvider<Record<string, unknown> | undefined, { section: string }>('wcoreConfig.getSection'),
  // Replace one top-level section wholesale, preserving every other section.
  // HUMAN-ONLY; remote-denied; never reachable from the agent tool surface.
  setSection: buildProvider<{ ok: boolean }, { section: string; value: Record<string, unknown> }>(
    'wcoreConfig.setSection'
  ),
};

/** A single Wayland Core profile, as listed by `wcoreProfiles.list`. */
export type IWcoreProfile = {
  /** Sanitized profile name (also the directory name under the profiles root). */
  name: string;
  /** Whether this profile is the active one. */
  active: boolean;
  /**
   * Best-effort stats read from the profile's OWN config tree. Every field is
   * OMITTED (not zeroed) when absent - a brand-new profile legitimately has no
   * stats yet, and we never fabricate a count.
   */
  /** Model declared in the profile's `[default].model` (engine config.toml). */
  model?: string;
  /** Number of allow-listed tools in the profile's `[tools].allow_list`. */
  tools?: number;
  /** Number of skills installed in the profile's `skills/` dir. */
  skills?: number;
  /** `config.toml` last-modified time (epoch ms), for an "updated …" chip. */
  updatedAt?: number;
  /**
   * Absolute config dir the engine actually reads for this profile. `default`
   * maps to the native dir (`dirs::config_dir()/wayland-core`); named profiles
   * to `~/.wayland/profiles/<name>/`. Surfaced so the UI shows the REAL path
   * (Design B) instead of a fabricated `profiles/default`.
   */
  dir?: string;
};

/**
 * Wayland Core profile directories (`~/.wayland/profiles/<name>/`). HUMAN-ONLY -
 * create/clone/delete do filesystem mutation under the profiles root with a
 * strict name sanitizer + realpath containment (SEC-4); they are remote-denied.
 */
export const wcoreProfiles = {
  // List all profiles (name + active flag).
  list: buildProvider<IWcoreProfile[], void>('wcoreProfiles.list'),
  // Create an empty profile directory (sanitized name).
  create: buildProvider<{ ok: boolean; error?: string }, { name: string }>('wcoreProfiles.create'),
  // Clone an existing profile's config into a new one.
  clone: buildProvider<{ ok: boolean; error?: string }, { from: string; to: string }>('wcoreProfiles.clone'),
  // Activate a profile (persists the active marker). NOTE: the engine must be
  // respawned for an active-profile switch to take effect (SEC-3).
  activate: buildProvider<{ ok: boolean; error?: string }, { name: string }>('wcoreProfiles.activate'),
  // Soft-delete a profile (moves it to a `.trash` sibling under the root).
  remove: buildProvider<{ ok: boolean; error?: string }, { name: string }>('wcoreProfiles.remove'),
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
   * Live-smoke fix #4b (2026-05-19) - swap a teammate's backend CLI
   * without recreating the team. Same-conversationType swaps only
   * (Claude ↔ Codex; not Gemini ↔ Claude - those would destroy the
   * conversation history). The service rejects cross-type swaps with
   * a descriptive error the renderer surfaces via Message.error.
   */
  changeAgentBackend: buildProvider<void, { teamId: string; slotId: string; newBackend: string; newModel?: string }>(
    'team.change-agent-backend'
  ),
  renameTeam: buildProvider<void, { id: string; name: string }>('team.rename'),
  setSessionMode: buildProvider<void, { teamId: string; sessionMode: string }>('team.set-session-mode'),
  updateWorkspace: buildProvider<void, { teamId: string; workspace: string }>('team.update-workspace'),
  /** W3b - promote a user-spawned team to Standing Company status. Idempotent. */
  promoteToStanding: buildProvider<void, { teamId: string }>('team.promote-to-standing'),
  /** W3b - reverse a previous promotion. Idempotent. */
  demoteFromStanding: buildProvider<void, { teamId: string }>('team.demote-from-standing'),
  /**
   * W1e - list rows from `team_event_log`, newest-first. Paged via `limit`
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
   * W3c - Build-my-own AI-suggest. Pure server-side suggester scores the
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
   * W4 (T4.1) - Build the whitelist-only v1 JSON export for a team.
   * Returns a pretty-printed JSON string for the user to review + save.
   */
  export: buildProvider<string, { teamId: string }>('team.export'),
  /**
   * W4 (T4.2 + T4.6) - Validate an import payload + surface missing
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
   * W4 (T4.5 + T4.6) - Persist an imported team with origin tracking +
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

// Settings sync (Beta) - E2EE settings sync across devices.
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

// v0.4.7 - Kickoff suggestion engine. Yes-bias card surfaced on new-chat
// empty-state. Engine walks the 5-level cascade in the main process; the
// renderer just consumes the result through this namespace.
// v0.4.7.1 (C-L-1) - channel names use the dominant `.` separator
// (e.g. `extensions.list`) instead of the early `:` form.
export const kickoff = {
  suggest: buildProvider<KickoffResult, { assistantId: string }>('kickoff.suggest'),
  // #375 - per-assistant suggested-prompts grid (assistant detail view). Returns
  // up to `max` ranked starters; `locale` selects the promptsI18n fallback.
  suggestMany: buildProvider<KickoffGridResult, { assistantId: string; max?: number; locale?: string }>(
    'kickoff.suggestMany'
  ),
  telemetry: buildProvider<void, KickoffTelemetryEvent>('kickoff.telemetry'),
};

// v0.6.0 - Workflow launch surface. The renderer drives the workflow chrome
// (right-rail step list, ask-card, autonomous-run badges) by calling these
// endpoints; the main process owns the canonical WorkflowSession state and
// the FleetDispatcher hand-off for "Run autonomously". See SPEC §6 in
// `.planning/brainstorm/2026-05-25-workflow-launch-surface/SPEC.md`.
export const workflow = {
  // 6.1 - Creates a new workflow session for the given workflow_name. Loads
  // the body via SkillLibrary, parses `## Step N` headers, resolves depends,
  // composes the static WORKFLOW_PROTOCOL system prompt, and creates the
  // backing conversation + workflow_sessions rows.
  //
  // Launch-target params (all required; the main process must not fall back to
  // any hardcoded default - the renderer resolves the target before calling):
  //   workflow_name      - slug of the workflow skill to launch
  //   backend            - provider type: 'claude' | 'codex' | 'gemini' | 'wcore' | 'custom' | 'remote'
  //   cliPath            - absolute path to the CLI binary; undefined for non-CLI backends
  //   model              - full provider+model record from AgentRegistry/ModelCatalog
  //   agentName          - display name of the preset assistant when launching via one (or undefined)
  //   customAgentId      - custom agent id when launching via a custom agent (or undefined)
  //   presetAssistantId  - preset assistant id when launching via a preset (or undefined)
  //   sessionMode        - conversation permission mode: 'default' | 'bypassPermissions' | 'yolo' | etc.
  start: buildProvider<
    {
      sessionId: string;
      session: WorkflowSession;
      systemPromptDirective: string;
    },
    {
      workflow_name: string;
      backend: string;
      cliPath: string | undefined;
      model: TProviderWithModel;
      agentName: string | undefined;
      customAgentId: string | undefined;
      presetAssistantId: string | undefined;
      sessionMode: string | undefined;
    }
  >('workflow.start'),
  // 6.2 - Resolves a list of depends slugs to full skill entries so the
  // detail modal can show them before launch. Unresolved slugs are returned
  // separately so the UI can warn without blocking the launch.
  resolveSkills: buildProvider<{ skills: ResolvedSkill[]; unresolved: string[] }, { slugs: string[] }>(
    'workflow.resolveSkills'
  ),
  // 6.3 - Single most-recent non-complete session for this workflow. Used by
  // WorkflowDetailModal to decide between launching a new session and
  // surfacing the resume-prompt (when updated_at < 14 days).
  findActive: buildProvider<{ session: WorkflowSession | null }, { workflow_name: string }>('workflow.findActive'),
  // 6.3.1 - Cross-workflow in-flight sessions for the launchpad "In-flight
  // workflows" strip (Codex finding #7). conversation_preview is the first
  // ~80 chars of the most recent agent message in the underlying conversation.
  findAllActive: buildProvider<
    { sessions: Array<{ session: WorkflowSession; conversation_preview: string }> },
    { limit?: number }
  >('workflow.findAllActive'),
  // 6.3.2 - Fetch a single session by id REGARDLESS of status. Unlike
  // findAllActive (which filters to in-flight sessions), this returns
  // completed/ended sessions too, so the renderer can re-sync a workflow
  // surface when the main-side driver advances or completes a run. Backs the
  // `sessionChanged` live-refresh in useWorkflowSession.
  findById: buildProvider<{ session: WorkflowSession | null }, { sessionId: string }>('workflow.findById'),
  // 6.4 - Single mutation endpoint for renderer-driven state changes. Avoids
  // five separate IPC channels for step-status / ask / status transitions.
  updateSessionState: buildProvider<
    { session: WorkflowSession },
    { sessionId: string; patch: WorkflowUpdateSessionStatePatch }
  >('workflow.updateSessionState'),
  // 6.5 - Spawns a FleetDispatcher sub-agent scoped to a single step. The
  // worker reports completion via AgentBus → WorkflowSessionService updates
  // the session and posts the tagged agent message to the chat.
  dispatchAutonomousStep: buildProvider<{ dispatchId: string }, { sessionId: string; stepN: number }>(
    'workflow.dispatchAutonomousStep'
  ),
  // 6.5.1 - Step-mode "Accept & continue": the user approved the active step at
  // the StepReviewBeat. The service marks it done, advances to the next step,
  // and the handler sends the next-step directive into the conversation. Returns
  // the resulting session so the renderer rail re-renders immediately.
  acceptStep: buildProvider<{ session: WorkflowSession }, { sessionId: string }>('workflow.acceptStep'),
  // 6.6 - Fire-and-forget notification that a workflow session was created,
  // mutated, or completed. Sidebar listeners use this to update the in-flight
  // strip and badge counts without re-fetching the full session payload.
  // `action` distinguishes lifecycle phase: 'start' (insert), 'update'
  // (any state mutation), 'complete' (terminal flip to complete/ended).
  sessionChanged: buildEmitter<{ session_id: string; action: 'start' | 'update' | 'complete' | 'delete' }>(
    'workflow.session-changed'
  ),
  // 6.6.1 - Permanently delete a workflow session (and its row). Distinct from
  // the 'ended' status flip (updateSessionState): lets the user clear a stuck
  // or unwanted in-flight workflow they can no longer make progress on.
  deleteSession: buildProvider<void, { sessionId: string }>('workflow.delete-session'),
  // 6.7 - Count of currently-active (non-complete, non-ended) workflow
  // sessions. Backs the sidebar Workflows-section badge so the badge can
  // refresh in response to `sessionChanged` without paying for the full
  // findAllActive payload.
  countActive: buildProvider<number, void>('workflow.count-active'),
};

// SPEC §6.4 patch shape - union of partial mutations the renderer can submit
// via `workflow.updateSessionState`. Each field is optional; the service
// applies all present mutations atomically. Reproduced verbatim from SPEC.
//
// `setBeginSent` carries the epoch-ms timestamp at which the renderer fired
// the hidden "begin" auto-send. The main-side dispatcher ignores the value
// and delegates to `WorkflowSessionService.markBeginSent` (which is
// idempotent - a no-op when `begin_sent_at` is already set). The field acts
// as a sentinel so the renderer can guarantee exactly-once begin semantics
// across Strict Mode double-mount, refresh, and back-navigation.
export type WorkflowUpdateSessionStatePatch = {
  /**
   * `source` is the provenance of the transition. The renderer threads
   * `'parent'` for in-chat `<step>` markers narrated by the agent (so the
   * stepCursor no-forward-leapfrog guard activates) and `'user'` for explicit
   * rail jumps. Absent → the bridge defaults to `'user'` (the historical
   * behaviour) so existing callers are unchanged.
   */
  setStepStatus?: { n: number; status: StepStatus; completed_at?: number; source?: StepTransitionSource };
  setCurrentStep?: number;
  appendAsk?: AskRecord;
  answerAsk?: { askId: string; answer: string; answered_at: number };
  setSessionStatus?: WorkflowSessionStatus;
  /**
   * Drive the run-state machine (Phase 2c). `paused` routes to `pause()`,
   * `running` to `resume()` (the Continue affordance on an `awaiting_input`
   * step-mode run), and `done` to `setRunMode()` directly. Idempotent.
   */
  setRunMode?: WorkflowRunMode;
  recordAutonomousDispatch?: { stepN: number; dispatchId: string };
  recordAutonomousResult?: { stepN: number; success: boolean };
  /** Epoch ms when the hidden begin auto-send fired. Idempotent - service no-ops if already set. */
  setBeginSent?: number;
  /**
   * Flip the interactivity mode (Phase 3 collaborative surface toggle).
   * Routes to `service.setInteractivity`. Idempotent.
   */
  setInteractivity?: WorkflowInteractivity;
  /**
   * Regress the run to step N (Phase 3 backtrack affordance).
   * Routes to `service.backtrackToStep`. Emits `workflow.backtrack` telemetry.
   */
  backtrackToStep?: number;
};

// Telemetry-driven Launchpad predictive widget. The renderer fires
// fire-and-forget events here (anchor clicks, GUID interactions, dashboard
// activity); the main-process logger persists them via the usage_events
// table (migration v40) for downstream frecency ranking.
export const usage = {
  recordEvent: buildProvider<
    void,
    {
      eventType: string;
      anchorId?: string;
      assistantId?: string;
      cliBackend?: string;
      metadata?: Record<string, unknown>;
    }
  >('usage.recordEvent'),
  // Top-N most-used models within a lookback window. Backs the
  // "Frequently used" zone of the GUID model selector. Defaults
  // (7-day window, limit 5) live in the main-process aggregator.
  queryFrequentlyUsedModels: buildProvider<
    Array<{ modelId: string; useCount: number; lastUsedMs: number }>,
    { windowMs?: number; limit?: number }
  >('usage.queryFrequentlyUsedModels'),
  // Same data as queryFrequentlyUsedModels but ordered most-recent-first.
  // Backs the "Recently used" zone of the GUID model selector and the smart
  // boot-default resolver (recent → frequent → safe).
  queryRecentlyUsedModels: buildProvider<
    Array<{ modelId: string; useCount: number; lastUsedMs: number }>,
    { windowMs?: number; limit?: number }
  >('usage.queryRecentlyUsedModels'),
};

// Cost observability reads (cost_events table, migration v48). The renderer
// (Mission Control cost panel) invokes these one-shot queries; the
// CostAnalyticsService in the main process answers them over a shared SQLite
// driver. All endpoints are read-only - writes go through CostRecorder.
//
// Remote (paired-device WebSocket) callers are denied ALL cost.* reads by the
// `cost.` prefix in src/common/adapter/bridgeAllowlist.ts (no remote cost view
// today); the namespace is left open for the WS-F budget mutations, which are
// denied to remote callers up front.
export const cost = {
  /** Total cost + tokens + event count within a window. */
  summary: buildProvider<
    import('@process/services/cost/types').CostSummary,
    import('@process/services/cost/types').CostWindow
  >('cost.summary'),
  /** Cost + tokens grouped by model id within a window (cost desc). */
  byModel: buildProvider<
    import('@process/services/cost/types').CostAggregate[],
    import('@process/services/cost/types').CostWindow
  >('cost.byModel'),
  /** Cost + tokens grouped by backend within a window (cost desc). */
  byBackend: buildProvider<
    import('@process/services/cost/types').CostAggregate[],
    import('@process/services/cost/types').CostWindow
  >('cost.byBackend'),
  /** Cost + tokens grouped by conversation id within a window (cost desc). */
  byConversation: buildProvider<
    import('@process/services/cost/types').CostAggregate[],
    import('@process/services/cost/types').CostWindow
  >('cost.byConversation'),
  /** Cost + tokens grouped by team id within a window (cost desc). */
  byTeam: buildProvider<
    import('@process/services/cost/types').CostAggregate[],
    import('@process/services/cost/types').CostWindow
  >('cost.byTeam'),
  /** Fixed-width time-bucketed series over a window. */
  series: buildProvider<
    import('@process/services/cost/types').CostSeriesPoint[],
    { window: import('@process/services/cost/types').CostWindow; bucketMs: number }
  >('cost.series'),
  // --- Budgets / caps (Stage 1 / WS-F). All three are mutations or
  //     spend-disclosing reads; remote-denied by the `cost.` prefix in
  //     bridgeAllowlist.ts. listBudgets returns spend vs limit for the UI bars.
  /** Insert or update a budget. Returns the persisted budget. */
  upsertBudget: buildProvider<
    import('@process/services/cost/types').Budget,
    import('@process/services/cost/types').BudgetInput
  >('cost.upsertBudget'),
  /** Delete a budget by id. */
  deleteBudget: buildProvider<void, string>('cost.deleteBudget'),
  /** All budgets with their current-period spend. */
  listBudgets: buildProvider<import('@process/services/cost/types').BudgetStatus[], void>('cost.listBudgets'),
  /** One-time non-blocking over-budget warn notification (main -> renderer). */
  budgetAlert: buildEmitter<import('@process/services/cost/types').BudgetAlert>('cost.budgetAlert'),
  /**
   * A 'pause' budget blocked a turn before it started (runaway circuit-breaker
   * Phase 1). The renderer shows a resumable card; the held message is in the
   * payload so it can be re-sent after the user raises the cap (main -> renderer).
   */
  budgetGateBlocked: buildEmitter<import('@process/services/cost/types').BudgetGateBlocked>('cost.budgetGateBlocked'),
};

// ==================== Memory Archive (v0.6.4) ====================
// Direct filesystem access to .ijfw/memory/*.md files - does NOT go through
// the MCP server. The MCP server stays as the write/orchestrate layer.

import type {
  MemoryEntry,
  MemoryStats,
  ListFilter,
  ProjectSummary,
  TagCount,
  IndexStats,
  PromotionCandidates,
  GetStatsResult,
  WikiConcept,
  WikiState,
  WikiTopicTag,
  WikiFreshness,
} from '@/common/types/memory';

export const memory = {
  /** Aggregated stats from the in-memory index (counts, deltas, sparkline). */
  getStats: buildProvider<GetStatsResult, void>('memory.get-stats'),
  /** Filtered + sorted list of entries. */
  listEntries: buildProvider<{ entries: MemoryEntry[]; total: number }, ListFilter | void>('memory.list-entries'),
  /** Full entry including body text (read from disk on demand). */
  getEntry: buildProvider<(MemoryEntry & { body: string }) | null, { id: string }>('memory.get-entry'),
  /** Ranked list of projects by entry count + last-active time. */
  getProjects: buildProvider<ProjectSummary[], void>('memory.get-projects'),
  /** Top-20 tags, optionally scoped to a project. */
  getTags: buildProvider<TagCount[], { project?: string } | void>('memory.get-tags'),
  /** Promote a memory entry to the project's .ijfw/wiki/ directory. */
  promote: buildProvider<{ ok: boolean; wikiPath?: string } | { ok: false; error: string }, { id: string }>(
    'memory.promote'
  ),
  /** Quick-add a new memory from the renderer input. */
  setQuickAdd: buildProvider<
    { ok: boolean; error?: string },
    { content: string; scope: 'project' | 'global'; type?: string }
  >('memory.set-quick-add'),
  /** Entries whose promotionScore meets the threshold. */
  getPromotionCandidates: buildProvider<PromotionCandidates, void>('memory.get-promotion-candidates'),
  /** Persist the promotion threshold (0–100). */
  setPromotionThreshold: buildProvider<void, { threshold: number }>('memory.set-promotion-threshold'),
  /** Enable or disable auto-promotion on schedule (added W3). */
  setAutoPromoteEnabled: buildProvider<void, { enabled: boolean }>('memory.set-auto-promote-enabled'),
  /** Undo a recent promotion within the 24h grace window (added W3). */
  undoPromotion: buildProvider<{ ok: boolean; error?: string }, { id: string }>('memory.undo-promotion'),
  /** Edit a single memory entry in place (#414); returns the new id if the summary changed. */
  updateEntry: buildProvider<
    { ok: boolean; error?: string; newId?: string },
    { id: string; summary?: string; type?: string; tags?: string[]; body?: string }
  >('memory.update-entry'),
  /** Hard-delete a single memory entry from its source file (#414). */
  deleteEntry: buildProvider<{ ok: boolean; error?: string }, { id: string }>('memory.delete-entry'),
  /** Trigger an immediate promotion sweep (added W3). */
  forceSweep: buildProvider<void, void>('memory.force-sweep'),
  /** Read a windowed slice of a source file centred on `line` for inline display. */
  readSourceContext: buildProvider<
    { ok: true; before: string; anchor: string; after: string; totalLines: number } | { ok: false; error: string },
    { path: string; line: number; contextLines?: number }
  >('memory.read-source-context'),
  /** Fired when the file watcher triggers a re-index. */
  onIndexChanged: buildEmitter<IndexStats>('memory.index-changed'),
  /** Import verbs - stubs until W1a wires the actual importers. */
  import: {
    claudeMem: buildProvider<{ count: number; errors: string[] }, void>('memory.import.claude-mem'),
    /** Scan ~/Documents (max depth 4) for Obsidian vaults (dirs containing .obsidian/). */
    obsidianDetectVaults: buildProvider<Array<{ path: string; name: string; mdFileCount: number }>, void>(
      'memory.import.obsidian-detect-vaults'
    ),
    obsidianVault: buildProvider<{ count: number; errors: string[] }, { vaultPath: string }>(
      'memory.import.obsidian-vault'
    ),
    scanDevDir: buildProvider<{ count: number; projectsFound: number; errors: string[] }, void>(
      'memory.import.scan-dev-dir'
    ),
    processDropFolder: buildProvider<{ count: number; errors: string[] }, void>('memory.import.process-drop-folder'),
    /** Return live status of the drop folder watcher for the status bar chip. */
    getDropFolderStatus: buildProvider<{ path: string; watching: boolean; ingestedToday: number }, void>(
      'memory.import.get-drop-folder-status'
    ),
  },
  /** Ingest raw file contents (from drag-drop) directly into the memory dir. */
  ingestFiles: buildProvider<
    { ok: boolean; ingested: number; errors: string[] },
    { files: { name: string; content: string; scope?: 'project' | 'global' }[] }
  >('memory.ingest-files'),
};

// ==================== Wiki (v0.6.4) ====================
// Synthesized concept pages built from MemoryEntry records.
// Stored in <project>/.ijfw/wiki/*.md (Obsidian-compatible).
// Sidecar index at <project>/.ijfw/wiki-state/index.json.

export const wiki = {
  /** List concepts with optional topic/search/freshness/sort filter. */
  listConcepts: buildProvider<
    { concepts: WikiConcept[]; total: number },
    {
      topicTag?: WikiTopicTag;
      search?: string;
      freshness?: WikiFreshness;
      sort?: 'recent' | 'most-referenced' | 'alphabetical';
    } | void
  >('wiki.list-concepts'),
  /** Get a single concept by slug. */
  getConcept: buildProvider<WikiConcept | null, { slug: string }>('wiki.get-concept'),
  /** Synthesize a new concept page from orphan memory IDs. */
  synthesizeOrphan: buildProvider<{ ok: boolean; slug?: string; error?: string }, { memoryIds: string[] }>(
    'wiki.synthesize-orphan'
  ),
  /** Re-synthesize an existing concept from its source memories. */
  reSynthesize: buildProvider<{ ok: boolean; lastSynthesizedAt?: number; error?: string }, { slug: string }>(
    'wiki.re-synthesize'
  ),
  /** Resolve a raw wikilink text to a concept slug. */
  resolveBacklink: buildProvider<{ slug: string | null; name: string | null }, { wikilinkText: string }>(
    'wiki.resolve-backlink'
  ),
  /** Full backlink graph: slug → list of slugs that link to it. */
  getBacklinkGraph: buildProvider<Record<string, string[]>, void>('wiki.get-backlink-graph'),
  /** Full wiki state (concepts + backlinkGraph + orphanCandidates) - used on cold load. */
  getState: buildProvider<WikiState, void>('wiki.get-state'),
  /** Fired when the wiki state mutates (synthesize / re-synthesize). */
  stateChanged: buildEmitter<WikiState>('wiki.state-changed'),
  /** Trigger a full synthesis sweep immediately and return count of new concepts. */
  synthesizeNow: buildProvider<{ ok: boolean; newConcepts: number; error?: string }, void>('wiki.synthesize-now'),
};

/**
 * Projects - an umbrella that owns conversations. A conversation keeps full
 * backend/model/assistant freedom; the project only stamps `extra.projectId`.
 * No execution lock - `getConversations` may return any number of concurrently
 * running chats. `assignConversation` / `removeConversation` re-parent an
 * existing chat by mutating `extra.projectId`.
 */
export const project = {
  create: buildProvider<
    import('@/common/types/project').IProject,
    import('@/common/types/project').ICreateProjectParams
  >('project.create'),
  get: buildProvider<import('@/common/types/project').IProject | null, { id: string }>('project.get'),
  list: buildProvider<import('@/common/types/project').IProject[], void>('project.list'),
  update: buildProvider<void, { id: string; updates: import('@/common/types/project').IUpdateProjectParams }>(
    'project.update'
  ),
  remove: buildProvider<void, { id: string }>('project.remove'),
  /** Conversations owned by a project, newest-first. */
  getConversations: buildProvider<import('@/common/config/storage').TChatConversation[], { projectId: string }>(
    'project.get-conversations'
  ),
  /** Re-parent an existing conversation into a project (sets extra.projectId). */
  assignConversation: buildProvider<void, { conversationId: string; projectId: string }>('project.assign-conversation'),
  /** Detach a conversation from its project (clears extra.projectId). */
  removeConversation: buildProvider<void, { conversationId: string }>('project.remove-conversation'),
  /** Read the project's editable .wayland/ knowledge docs (instructions/rules/decisions). */
  readKnowledge: buildProvider<{ context: string; rules: string; decisions: string }, { id: string }>(
    'project.read-knowledge'
  ),
  /** Write one knowledge doc; injected into every new chat in the project. */
  writeKnowledge: buildProvider<void, { id: string; kind: 'context' | 'rules' | 'decisions'; content: string }>(
    'project.write-knowledge'
  ),
  /** List files dropped into .wayland/reference/. */
  listReference: buildProvider<Array<{ name: string; path: string; size: number }>, { id: string }>(
    'project.list-reference'
  ),
  /** Copy dropped files into .wayland/reference/; returns the updated list. */
  addReference: buildProvider<Array<{ name: string; path: string; size: number }>, { id: string; filePaths: string[] }>(
    'project.add-reference'
  ),
  /** Remove one reference file by name; returns the updated list. */
  removeReference: buildProvider<Array<{ name: string; path: string; size: number }>, { id: string; name: string }>(
    'project.remove-reference'
  ),
  /** Read the editable one-line summaries for each knowledge doc. */
  readSummaries: buildProvider<{ context?: string; rules?: string; decisions?: string }, { id: string }>(
    'project.read-summaries'
  ),
  /** Write one doc's one-line summary. */
  writeSummary: buildProvider<void, { id: string; kind: 'context' | 'rules' | 'decisions'; summary: string }>(
    'project.write-summary'
  ),
  /** Generate a one-line summary of a knowledge doc with a cheap fast model; persists + returns it. Never rejects. */
  generateSummary: buildProvider<
    { summary: string; error?: 'no-model' | 'failed' },
    { id: string; kind: 'context' | 'rules' | 'decisions' }
  >('project.generate-summary'),
  /** True if the user has any configured model usable for cheap summaries. */
  hasUsableModel: buildProvider<boolean, void>('project.has-usable-model'),
  /**
   * Draft an Instructions (context) or Rules document with the best available
   * model from the user's source description / pasted text / uploaded files plus
   * a couple of wizard answers. Stateless (works before a project exists), so it
   * takes name/description directly rather than a project id. Never rejects.
   */
  generateKnowledgeDraft: buildProvider<
    { draft: string; error?: 'no-model' | 'failed'; detail?: string },
    {
      name?: string;
      description?: string;
      kind: 'context' | 'rules';
      sourceText?: string;
      filePaths?: string[];
      /** Existing project knowledge (e.g. instructions + decisions) to inform a Rules draft. */
      relatedKnowledge?: string;
      audience?: string;
      constraints?: string;
    }
  >('project.generate-knowledge-draft'),
  /** Append one dated decision to .wayland/decisions.md; returns the updated doc. */
  appendDecision: buildProvider<{ decisions: string }, { id: string; text: string }>('project.append-decision'),
  /** Read IJFW's own per-project memory ({workspace}/.ijfw/memory/*.md) if present - read-only, attributed. */
  readIjfwMemory: buildProvider<
    { available: boolean; files: Array<{ name: string; content: string }> },
    { id: string }
  >('project.read-ijfw-memory'),
  /**
   * Fired whenever the project list or a project's membership changes.
   *
   * PERF-IPC-01: carries an optional targeted payload so the renderer can patch
   * a single row (e.g. update one project's chat count) instead of re-listing
   * every project and recomputing all counts. The payload is optional and the
   * broad (payload-less) signal is still emitted for structural changes
   * (create/remove/update) where a full refresh is the correct response, so all
   * existing `changed.on(() => refresh())` listeners remain valid.
   */
  changed: buildEmitter<{ id?: string; count?: number } | undefined>('project.changed'),
};

/**
 * Migrate config (provider keys, MCP servers) from a sibling agent tool
 * (Hermes, OpenClaw) into Wayland (#migrate). `scan` is read-only and returns a
 * secret-free plan; `apply` re-reads the source in the main process to recover
 * key values, so secrets never cross this boundary - the renderer only sends
 * back the selected item ids.
 */
export const migrate = {
  scan: buildProvider<MigrationPlan, { toolId: MigrationToolId }>('migrate.scan'),
  apply: buildProvider<MigrationResult, { toolId: MigrationToolId; selectedIds: string[] }>('migrate.apply'),
};
