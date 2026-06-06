/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Re-export GeminiApprovalStore for use in other modules
export { GeminiApprovalStore } from './GeminiApprovalStore';

// src/core/ConfigManager.ts
import { WAYLAND_FILES_MARKER } from '@/common/config/constants';
import { NavigationInterceptor } from '@/common/chat/navigation';
import type { TProviderWithModel } from '@/common/config/storage';
import { uuid } from '@/common/utils';
import { getProviderAuthType } from '@/common/utils/platformAuthType';
import { isNewApiPlatform } from '@/common/utils/platformConstants';
import { normalizeNewApiBaseUrl } from '@/common/api/ClientFactory';
import type {
  CompletedToolCall,
  Config,
  GeminiClient,
  ServerGeminiStreamEvent,
  ToolCall,
  ToolCallRequestInfo,
  Turn,
} from '@office-ai/aioncli-core';
import {
  AuthType,
  clearOauthClientCache,
  CoreToolScheduler,
  FileDiscoveryService,
  refreshServerHierarchicalMemory,
  sessionId,
} from '@office-ai/aioncli-core';
import fs from 'fs';
import { ApiKeyManager } from '@/common/api/ApiKeyManager';
import { handleAtCommand } from './cli/atCommandProcessor';
import { loadCliConfig } from './cli/config';
import { sanitizeGeminiSchema } from './cli/utils/geminiSchemaFilter';
import { loadExtensions } from './cli/extension';
import { getGlobalTokenManager } from './cli/oauthTokenManager';
import type { Settings } from './cli/settings';
import { loadSettings } from './cli/settings';
import { globalToolCallGuard, type StreamConnectionEvent } from './cli/streamResilience';
import { ConversationToolConfig } from './cli/tools/conversation-tool-config';
import { mapToDisplay, type TrackedToolCall } from './cli/useReactToolScheduler';
import {
  compactToolResponsesInHistory,
  getPromptCount,
  handleCompletedTools,
  processGeminiStreamEvents,
  startNewPrompt,
} from './utils';
import path from 'path';
import os from 'os';

// Global registry for current agent instance (used by flashFallbackHandler)
let currentGeminiAgent: GeminiAgent | null = null;

/**
 * Check if Google OAuth credentials exist.
 *
 * Gemini CLI stores OAuth credentials in ~/.gemini/oauth_creds.json.
 * If this file doesn't exist or is empty, OAuth hasn't been configured.
 */
function hasGoogleOAuthCredentials(): boolean {
  try {
    const credentialsPath = path.join(os.homedir(), '.gemini', 'oauth_creds.json');
    if (!fs.existsSync(credentialsPath)) {
      return false;
    }
    const content = fs.readFileSync(credentialsPath, 'utf-8');
    const creds = JSON.parse(content);
    // Check if credentials have the required fields
    return !!(creds && (creds.access_token || creds.refresh_token));
  } catch {
    return false;
  }
}

interface GeminiAgent2Options {
  workspace: string;
  proxy?: string;
  model: TProviderWithModel;
  webSearchEngine?: 'google' | 'default';
  yoloMode?: boolean;
  GOOGLE_CLOUD_PROJECT?: string;
  mcpServers?: Record<string, unknown>;
  contextFileName?: string;
  onStreamEvent: (event: { type: string; data: unknown; msg_id: string }) => void;
  // System rules, injected into userMemory at initialization
  presetRules?: string;
  contextContent?: string; // Backward compatible
  /** Builtin skills directory path, loaded by aioncli-core SkillManager */
  skillsDir?: string;
  /** Enabled skills list for filtering skills in SkillManager */
  enabledSkills?: string[];
}

export class GeminiAgent {
  config: Config | null = null;
  private workspace: string | null = null;
  private proxy: string | null = null;
  private model: TProviderWithModel | null = null;
  private webSearchEngine: 'google' | 'default' | null = null;
  private yoloMode: boolean = false;
  private googleCloudProject: string | null = null;
  private mcpServers: Record<string, unknown> = {};
  private geminiClient: GeminiClient | null = null;
  private authType: AuthType | null = null;
  private scheduler: CoreToolScheduler | null = null;
  private trackedCalls: TrackedToolCall[] = [];
  private abortController: AbortController | null = null;
  private activeMsgId: string | null = null;
  private onStreamEvent: (event: { type: string; data: unknown; msg_id: string }) => void;
  // System rules, injected at initialization
  private presetRules?: string;
  private contextContent?: string; // Backward compatible
  private toolConfig: ConversationToolConfig; // Conversation-level tool configuration
  private apiKeyManager: ApiKeyManager | null = null; // Multi-API-key manager
  private settings: Settings | null = null;
  private historyPrefix: string | null = null;
  private historyUsedOnce = false;
  private skillsIndexPrependedOnce = false; // Track if we've prepended skills index to first message
  private contextFileName: string | undefined;
  /** Builtin skills directory path */
  private skillsDir?: string;
  /** Enabled skills list */
  private enabledSkills?: string[];
  bootstrap: Promise<void>;
  static buildFileServer(workspace: string) {
    return new FileDiscoveryService(workspace);
  }
  constructor(options: GeminiAgent2Options) {
    this.workspace = options.workspace;
    this.proxy = options.proxy;
    this.model = options.model;
    this.webSearchEngine = options.webSearchEngine || 'default';
    this.yoloMode = options.yoloMode || false;
    this.googleCloudProject = options.GOOGLE_CLOUD_PROJECT;
    this.mcpServers = options.mcpServers || {};
    this.contextFileName = options.contextFileName;
    // Use the shared helper to resolve the auth type
    this.authType = getProviderAuthType(options.model);
    this.onStreamEvent = options.onStreamEvent;
    this.presetRules = options.presetRules;
    this.skillsDir = options.skillsDir;
    this.enabledSkills = options.enabledSkills;
    // Backward compatible: prefer presetRules, fallback to contextContent
    this.contextContent = options.contextContent || options.presetRules;
    this.initClientEnv();
    this.toolConfig = new ConversationToolConfig({
      proxy: this.proxy,
      webSearchEngine: this.webSearchEngine,
    });

    // Register as current agent for flashFallbackHandler access
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    currentGeminiAgent = this;

    this.bootstrap = this.initialize();
    // Prevent unhandled rejection when initialize fails (e.g. missing OAuth credentials).
    // The error still propagates when callers `await this.bootstrap` in send().
    this.bootstrap.catch(() => {});
  }

  private initClientEnv() {
    const fallbackValue = (key: string, value1: string, value2?: string) => {
      if (value1 && value1 !== 'undefined') {
        process.env[key] = value1;
      }
      if (value2 && value2 !== 'undefined') {
        process.env[key] = value2;
      }
    };

    // Initialize multi-key manager for supported auth types
    this.initializeMultiKeySupport();

    // Get the current API key to use (either from multi-key manager or original)
    const getCurrentApiKey = () => {
      if (this.apiKeyManager && this.apiKeyManager.hasMultipleKeys()) {
        return process.env[this.apiKeyManager.getStatus().envKey] || this.model.apiKey;
      }
      return this.model.apiKey;
    };

    // Clear all auth-related env vars to avoid interference between different auth types
    const clearAllAuthEnvVars = () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.GOOGLE_GEMINI_BASE_URL;
      delete process.env.GOOGLE_API_KEY;
      delete process.env.GOOGLE_GENAI_USE_VERTEXAI;
      delete process.env.GOOGLE_CLOUD_PROJECT;
      delete process.env.OPENAI_BASE_URL;
      delete process.env.OPENAI_API_KEY;
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      delete process.env.AWS_PROFILE;
      delete process.env.AWS_REGION;
    };

    clearAllAuthEnvVars();

    // Normalize URL for new-api gateway (different protocols need different URL formats)
    const isNewApi = isNewApiPlatform(this.model.platform);
    const getBaseUrl = () =>
      isNewApi ? normalizeNewApiBaseUrl(this.model.baseUrl, this.authType) : this.model.baseUrl;

    if (this.authType === AuthType.USE_GEMINI) {
      fallbackValue('GEMINI_API_KEY', getCurrentApiKey());
      fallbackValue('GOOGLE_GEMINI_BASE_URL', getBaseUrl());
      return;
    }
    if (this.authType === AuthType.USE_VERTEX_AI) {
      fallbackValue('GOOGLE_API_KEY', getCurrentApiKey());
      process.env.GOOGLE_GENAI_USE_VERTEXAI = 'true';
      return;
    }
    if (this.authType === AuthType.LOGIN_WITH_GOOGLE) {
      // For personal OAuth auth, GOOGLE_CLOUD_PROJECT is not needed.
      // Invalid project ID will cause 403 permission error.
      // Only set if user explicitly configured a valid project ID.
      if (this.googleCloudProject && this.googleCloudProject.trim()) {
        process.env.GOOGLE_CLOUD_PROJECT = this.googleCloudProject.trim();
      }
      // Note: LOGIN_WITH_GOOGLE uses OAuth, no API Key needed
      return;
    }
    if (this.authType === AuthType.USE_OPENAI) {
      fallbackValue('OPENAI_BASE_URL', getBaseUrl());
      fallbackValue('OPENAI_API_KEY', getCurrentApiKey());
      return;
    }
    if (this.authType === AuthType.USE_ANTHROPIC) {
      fallbackValue('ANTHROPIC_BASE_URL', getBaseUrl());
      fallbackValue('ANTHROPIC_API_KEY', getCurrentApiKey());
      return;
    }
    if (this.authType === AuthType.USE_BEDROCK) {
      const bedrockConfig = this.model.bedrockConfig;

      if (!bedrockConfig) {
        throw new Error('Bedrock configuration missing');
      }

      // Set region (required)
      process.env.AWS_REGION = bedrockConfig.region;

      if (bedrockConfig.authMethod === 'accessKey') {
        if (!bedrockConfig.accessKeyId || !bedrockConfig.secretAccessKey) {
          throw new Error('AWS credentials missing for access key authentication');
        }
        process.env.AWS_ACCESS_KEY_ID = bedrockConfig.accessKeyId;
        process.env.AWS_SECRET_ACCESS_KEY = bedrockConfig.secretAccessKey;
      } else if (bedrockConfig.authMethod === 'profile') {
        if (!bedrockConfig.profile) {
          throw new Error('AWS profile name missing');
        }
        process.env.AWS_PROFILE = bedrockConfig.profile;
        // Clear access keys to ensure profile is used
        delete process.env.AWS_ACCESS_KEY_ID;
        delete process.env.AWS_SECRET_ACCESS_KEY;
      }
      return;
    }
  }

  private initializeMultiKeySupport(): void {
    const apiKey = this.model?.apiKey;
    if (!apiKey || (!apiKey.includes(',') && !apiKey.includes('\n'))) {
      return; // Single key or no key, skip multi-key setup
    }

    // Only initialize for supported auth types
    if (
      this.authType === AuthType.USE_OPENAI ||
      this.authType === AuthType.USE_GEMINI ||
      this.authType === AuthType.USE_ANTHROPIC
    ) {
      this.apiKeyManager = new ApiKeyManager(apiKey, this.authType);
    }
  }

  /**
   * Get multi-key manager (used by flashFallbackHandler)
   */
  getApiKeyManager(): ApiKeyManager | null {
    return this.apiKeyManager;
  }

  private createAbortController() {
    this.abortController = new AbortController();
    return this.abortController;
  }

  private enrichErrorMessage(errorMessage: string): string {
    const reportMatch = errorMessage.match(/Full report available at:\s*(.+?\.json)/i);
    const lowerMessage = errorMessage.toLowerCase();
    if (
      lowerMessage.includes('model_capacity_exhausted') ||
      lowerMessage.includes('no capacity available') ||
      lowerMessage.includes('resource_exhausted') ||
      lowerMessage.includes('ratelimitexceeded')
    ) {
      return `${errorMessage}\nQuota exhausted on this model.`;
    }
    if (!reportMatch?.[1]) return errorMessage;
    try {
      const reportContent = fs.readFileSync(reportMatch[1], 'utf-8');
      const reportLower = reportContent.toLowerCase();
      if (
        reportLower.includes('quota') ||
        reportLower.includes('resource_exhausted') ||
        reportLower.includes('exhausted')
      ) {
        return `${errorMessage}\nQuota exhausted on this model.`;
      }
    } catch {
      // Ignore report read errors and keep original message.
    }
    return errorMessage;
  }

  private async initialize(): Promise<void> {
    const path = this.workspace;

    if (!path) {
      throw new Error('GeminiAgent workspace is empty - cannot initialize without a valid workspace path');
    }

    // Ensure workspace directory exists before loading config.
    // The temp directory created by buildWorkspaceWidthFiles may have been removed
    // by OS cleanup or antivirus before the worker process starts initialization.
    // loadServerHierarchicalMemory calls fs.realpath(workspace) without try-catch,
    // causing an unhandled ENOENT rejection (Sentry ELECTRON-6W).
    await fs.promises.mkdir(path, { recursive: true });

    // Verify workspace is resolvable before aioncli-core attempts fs.realpath()
    // internally. The mkdir above handles ENOENT, but EACCES (permission denied)
    // still causes an unhandled rejection inside the library (Sentry ELECTRON-BM).
    await fs.promises.realpath(path);

    const settings = loadSettings(path).merged;
    if (this.contextFileName) {
      settings.contextFileName = this.contextFileName;
    }
    this.settings = settings;

    // Use the passed-in YOLO setting
    const yoloMode = this.yoloMode;

    // Initialize the conversation-level tool configuration
    await this.toolConfig.initializeForConversation(this.authType!);

    const extensions = loadExtensions(path);
    this.config = await loadCliConfig({
      workspace: path,
      settings,
      extensions,
      sessionId,
      proxy: this.proxy,
      model: this.model.useModel,
      conversationToolConfig: this.toolConfig,
      yoloMode,
      mcpServers: this.mcpServers,
      skillsDir: this.skillsDir,
      enabledSkills: this.enabledSkills,
    });
    await this.config.initialize();

    // aioncli-core skips awaiting MCP server connections when interactive=true
    // (Config._initialize fires startConfiguredMcpServers without await).
    // For team mode we MUST have MCP tools ready before the first message,
    // so explicitly await MCP discovery here when team MCP servers are configured.
    if (Object.keys(this.mcpServers).length > 0) {
      const mcpMgr = this.config.getMcpClientManager?.();
      if (mcpMgr) {
        await mcpMgr.startConfiguredMcpServers();
      }

      this.sanitizeMcpToolSchemas();
    }

    // aioncli-core's SkillManager.discoverSkills() reloads all skills from user directory,
    // overriding our filtering in loadCliConfig, so we need to re-apply enabledSkills filter here
    if (this.enabledSkills && this.enabledSkills.length > 0) {
      const enabledSet = new Set(this.enabledSkills);
      this.config.getSkillManager().filterSkills((skill) => enabledSet.has(skill.name));
      console.log(`[GeminiAgent] Filtered skills after initialize: ${this.enabledSkills.join(', ')}`);
    } else {
      // Non-preset agent: clear all optional skills (cron is injected via system instructions)
      this.config.getSkillManager().filterSkills(() => false);
    }

    // For Google OAuth auth, check if credentials exist first to avoid triggering browser auth popup
    if (this.authType === AuthType.LOGIN_WITH_GOOGLE) {
      // Check if OAuth credentials exist
      if (!hasGoogleOAuthCredentials()) {
        // Throw auth error to let UI layer handle auto-switching.
        // Error message contains "authentication" keyword to trigger GeminiSendBox API error detection and auto-switch
        console.error(
          '[GeminiAgent] Google OAuth credentials not found. User needs to authenticate via Gemini CLI first.'
        );
        throw new Error(
          'Google OAuth authentication not configured. Please run "gemini" CLI to authenticate first, or switch to an API key-based agent.'
        );
      }
      // Only clear cache and refresh when credentials exist
      clearOauthClientCache();
    }

    // refreshAuth is necessary to initialize contentGenerator, required for all auth types.
    // Note: OAuth is only triggered for LOGIN_WITH_GOOGLE (via createCodeAssistContentGenerator).
    // For USE_OPENAI, USE_GEMINI, USE_ANTHROPIC, etc., corresponding Generator is created without OAuth.
    await this.config.refreshAuth(this.authType);
    console.log(
      `[GeminiAgent] After refreshAuth - config.getModel(): "${this.config.getModel()}", authType used: ${this.authType}`
    );

    this.geminiClient = this.config.getGeminiClient();

    // Inject presetRules into userMemory at initialization.
    // Rules define system behavior, should be effective from session start.
    console.log(`[GeminiAgent] presetRules length: ${this.presetRules?.length || 0}`);
    if (this.presetRules) {
      const currentMemory = this.config.getUserMemory();
      const rulesSection = `[Assistant System Rules]\n${this.presetRules}`;
      const combined = currentMemory ? `${rulesSection}\n\n${currentMemory}` : rulesSection;
      this.config.setUserMemory(combined);
      console.log(`[GeminiAgent] Injected presetRules into userMemory, total length: ${combined.length}`);
    } else {
      console.log(`[GeminiAgent] No presetRules to inject`);
    }

    // Note: Skills (skill definitions) are prepended to the first message in send() method.
    // Skills provide capabilities/tools descriptions, injected at runtime.

    // Register conversation-level custom tools
    await this.toolConfig.registerCustomTools(this.config, this.geminiClient);

    this.initToolScheduler(settings);
  }

  // Initialize the tool scheduler
  private initToolScheduler(_settings: Settings) {
    this.scheduler = new CoreToolScheduler({
      onAllToolCallsComplete: async (completedToolCalls: CompletedToolCall[]) => {
        await Promise.resolve(); // Satisfy async requirement
        try {
          if (completedToolCalls.length > 0) {
            const refreshMemory = async () => {
              // Directly use refreshServerHierarchicalMemory from aioncli-core;
              // it automatically gets ExtensionLoader from config and updates memory
              await refreshServerHierarchicalMemory(this.config);
            };
            const response = handleCompletedTools(completedToolCalls, this.geminiClient, refreshMemory);
            if (response.length > 0) {
              const geminiTools = completedToolCalls.filter((tc) => {
                const isTerminalState = tc.status === 'success' || tc.status === 'error' || tc.status === 'cancelled';

                if (isTerminalState) {
                  const completedOrCancelledCall = tc;
                  return (
                    completedOrCancelledCall.response?.responseParts !== undefined && !tc.request.isClientInitiated
                  );
                }
                return false;
              });

              this.submitQuery(response, this.activeMsgId ?? uuid(), this.createAbortController(), {
                isContinuation: true,
                prompt_id: geminiTools[0].request.prompt_id,
              });
            }
          }
        } catch (e) {
          this.onStreamEvent({
            type: 'error',
            data: 'handleCompletedTools error: ' + (e.message || JSON.stringify(e)),
            msg_id: this.activeMsgId ?? uuid(),
          });
        }
      },
      onToolCallsUpdate: (updatedCoreToolCalls: ToolCall[]) => {
        try {
          const prevTrackedCalls = this.trackedCalls || [];
          const toolCalls: TrackedToolCall[] = updatedCoreToolCalls.map((coreTc) => {
            const existingTrackedCall = prevTrackedCalls.find((ptc) => ptc.request.callId === coreTc.request.callId);
            const newTrackedCall: TrackedToolCall = {
              ...coreTc,
              responseSubmittedToGemini: existingTrackedCall?.responseSubmittedToGemini ?? false,
            };
            return newTrackedCall;
          });
          const display = mapToDisplay(toolCalls);
          this.onStreamEvent({
            type: 'tool_group',
            data: display.tools,
            msg_id: this.activeMsgId ?? uuid(),
          });
        } catch (e) {
          this.onStreamEvent({
            type: 'error',
            data: 'tool_calls_update error: ' + (e.message || JSON.stringify(e)),
            msg_id: this.activeMsgId ?? uuid(),
          });
        }
      },
      // onEditorClose callback was removed in aioncli-core v0.18.4
      // approvalMode: this.config.getApprovalMode(),
      getPreferredEditor() {
        return 'vscode';
      },
      config: this.config,
    });
  }

  /**
   * Handle message stream with resilience monitoring
   *
   * InvalidStream retry is handled by aioncli-core (geminiChat.ts streamWithRetries
   * + client.ts "Please continue." mechanism). Wayland does NOT retry at this layer
   * to avoid redundant classifier-router calls and quota amplification.
   */
  private handleMessage(
    stream: AsyncGenerator<ServerGeminiStreamEvent, Turn, unknown>,
    msg_id: string,
    abortController: AbortController
  ): Promise<void> {
    const toolCallRequests: ToolCallRequestInfo[] = [];
    let heartbeatWarned = false;

    // Stream connection event handler
    const onConnectionEvent = (event: StreamConnectionEvent) => {
      if (event.type === 'heartbeat_timeout') {
        console.warn(`[GeminiAgent] Stream heartbeat timeout at ${new Date(event.lastEventTime).toISOString()}`);
        if (!heartbeatWarned) {
          heartbeatWarned = true;
        }
      } else if (event.type === 'state_change' && event.state === 'failed') {
        console.error(`[GeminiAgent] Stream connection failed: ${event.reason}`);
        this.onStreamEvent({
          type: 'error',
          data: `Connection lost: ${event.reason}. Please try again.`,
          msg_id: uuid(),
        });
      }
    };

    return processGeminiStreamEvents(
      stream,
      this.config,
      (data) => {
        if (data.type === 'tool_call_request') {
          const toolRequest = data.data as ToolCallRequestInfo;
          toolCallRequests.push(toolRequest);
          // Immediately protect tool call to prevent cancellation
          globalToolCallGuard.protect(toolRequest.callId);
          return;
        }

        // Defensive: the legacy `invalid_stream` synthetic event used to be re-emitted
        // as a user-visible error here. utils.ts no longer forwards InvalidStream events
        // from aioncli-core because the library retries transparently (#GEMINI-RETRY-NOISE
        // fix, 2026-05-16). Anything still arriving with this type is swallowed.
        if (data.type === ('invalid_stream' as string)) {
          return;
        }

        // Use a fresh msg_id for error events so error/tips messages don't
        // replace already-streamed content that shares the original msg_id.
        this.onStreamEvent({
          ...data,
          msg_id: data.type === 'error' ? uuid() : msg_id,
        });
      },
      { onConnectionEvent }
    )
      .then(async () => {
        if (toolCallRequests.length > 0) {
          // Emit preview_open for navigation tools, but don't block execution.
          // Agent needs chrome-devtools to fetch web page content.
          this.emitPreviewForNavigationTools(toolCallRequests, msg_id);

          // Schedule ALL tool requests including chrome-devtools
          await this.scheduler.schedule(toolCallRequests, abortController.signal);
        } else {
          // Agentic loop finished (no pending tool calls).
          // Compact large functionResponse entries in history to prevent
          // context window overflow on subsequent turns.
          if (this.geminiClient) {
            compactToolResponsesInHistory(this.geminiClient);
          }
        }
        // If the user aborted while the stream was draining, the core layer
        // may have pushed a user turn at the start of sendMessageStream
        // (geminiChat.ts) but skipped the trailing model turn. Repair it so
        // the next sendMessage doesn't fail with a 400 user/model alternation
        // error. See H10 (upstream issue #982).
        if (abortController.signal.aborted) {
          this.repairAbortedHistory();
        }
      })
      .catch((e: unknown) => {
        const rawMessage = e instanceof Error ? e.message : JSON.stringify(e);
        const errorMessage = this.enrichErrorMessage(rawMessage);
        // Clean up protected tool calls on error
        for (const req of toolCallRequests) {
          globalToolCallGuard.unprotect(req.callId);
        }
        // Repair user/model alternation if the stream threw before the model
        // turn was committed (covers abort-via-thrown-AbortError and other
        // mid-stream failures). H10 / upstream #982.
        this.repairAbortedHistory();
        // Use a fresh msg_id so the error message does not replace
        // already-streamed content that shares the same msg_id.
        this.onStreamEvent({
          type: 'error',
          data: errorMessage,
          msg_id: uuid(),
        });
      });
  }

  /**
   * Ensure chat history ends with a model turn after a stream abort or error.
   *
   * Background: aioncli-core's GeminiChat.sendMessageStream pushes the user
   * turn into history *before* the stream starts, and only pushes the model
   * turn after the stream fully consolidates. If the stream is aborted or
   * fails in between, history is left ending on a user turn - the Gemini API
   * then rejects the next request with a user/model alternation 400.
   *
   * We synthesize a minimal model turn ("[aborted]") only when the last
   * entry is a user turn. Adding this is idempotent: callers can invoke it
   * from both the success-after-abort and catch paths without risk of
   * double-inserting model turns.
   */
  private repairAbortedHistory(): void {
    try {
      if (!this.geminiClient || !this.geminiClient.isInitialized()) return;
      const history = this.geminiClient.getHistory();
      if (history.length === 0) return;
      const last = history[history.length - 1];
      if (last?.role !== 'user') return;
      void this.geminiClient.addHistory({
        role: 'model',
        parts: [{ text: '[aborted]' }],
      });
    } catch {
      // Best-effort: never throw out of repair logic.
    }
  }

  /**
   * Check if it's a navigation tool call (supports both with and without MCP prefix).
   *
   * Delegates to NavigationInterceptor for unified logic.
   */
  private isNavigationTool(toolName: string): boolean {
    return NavigationInterceptor.isNavigationTool(toolName);
  }

  /**
   * Emit preview_open events for navigation tools without blocking execution.
   *
   * Agent needs chrome-devtools to fetch web page content, so we only emit
   * preview events to show URL in preview panel, while letting tools execute normally.
   */
  private emitPreviewForNavigationTools(toolCallRequests: ToolCallRequestInfo[], _msg_id: string): void {
    for (const request of toolCallRequests) {
      const toolName = request.name || '';

      if (this.isNavigationTool(toolName)) {
        const args = request.args || {};
        const url = NavigationInterceptor.extractUrl({ arguments: args as Record<string, unknown> });
        if (url) {
          // Emit preview_open event to show URL in preview panel
          this.onStreamEvent({
            type: 'preview_open',
            data: {
              content: url,
              contentType: 'url',
              metadata: {
                title: url,
              },
            },
            msg_id: uuid(),
          });
        }
      }
    }
  }

  /**
   * Collapse union `type` arrays and strip Gemini/OpenAI-unsupported schema
   * keywords on every discovered MCP tool's parameterSchema, in place.
   *
   * Why per-turn and not once at init: MCP servers such as Notion register tools
   * asynchronously and push tool-list *updates* after initialize ("supports tool
   * updates. Listening for changes…"), each re-registering the tool with its raw
   * schema. The request builder reads `tool.parameterSchema` live on every send
   * (GeminiChat's per-turn tool-refresh callback → getFunctionDeclarations), so an
   * init-only sweep is silently undone by a later update and the raw union reaches
   * the API → `400 Invalid schema for function 'notion-create-pages'`. Running this
   * immediately before each send guarantees the sanitized schema is what ships.
   * Built-in tools carry no serverName and are left untouched.
   */
  private sanitizeMcpToolSchemas(): void {
    try {
      const registry = this.config?.getToolRegistry?.();
      for (const tool of registry?.getAllTools?.() ?? []) {
        const mcpTool = tool as { serverName?: string; parameterSchema?: unknown };
        if (typeof mcpTool.serverName === 'string') {
          mcpTool.parameterSchema = sanitizeGeminiSchema(mcpTool.parameterSchema);
        }
      }
    } catch (err) {
      console.error('[GeminiAgent] Failed to sanitize MCP tool schemas:', err);
    }
  }

  submitQuery(
    query: unknown,
    msg_id: string,
    abortController: AbortController,
    options?: {
      prompt_id?: string;
      isContinuation?: boolean;
    }
  ): string | undefined {
    try {
      this.activeMsgId = msg_id;
      // Re-sanitize MCP tool schemas right before the request builds its tools -
      // async MCP tool-updates may have re-registered raw union schemas since init.
      this.sanitizeMcpToolSchemas();
      let prompt_id = options?.prompt_id;
      if (!prompt_id) {
        prompt_id = this.config.getSessionId() + '########' + getPromptCount();
      }
      if (!options?.isContinuation) {
        startNewPrompt();
      }

      const stream = this.geminiClient.sendMessageStream(query, abortController.signal, prompt_id);

      // Send start event immediately when stream is created so the UI shows the stop button
      this.onStreamEvent({ type: 'start', data: '', msg_id });

      this.handleMessage(stream, msg_id, abortController)
        .catch((e: unknown) => {
          const errorMessage = e instanceof Error ? e.message : JSON.stringify(e);
          this.onStreamEvent({
            type: 'error',
            data: errorMessage,
            msg_id: uuid(),
          });
        })
        .finally(() => {
          this.onStreamEvent({
            type: 'finish',
            data: '',
            msg_id,
          });
        });
      return '';
    } catch (e) {
      const rawMessage = e instanceof Error ? e.message : JSON.stringify(e);
      const errorMessage = this.enrichErrorMessage(rawMessage);
      this.onStreamEvent({
        type: 'error',
        data: errorMessage,
        msg_id: uuid(),
      });
    }
  }

  async send(message: string | Array<{ text: string }>, msg_id = '', files?: string[]) {
    try {
      await this.bootstrap;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      this.onStreamEvent({ type: 'error', data: errorMessage, msg_id });
      this.onStreamEvent({ type: 'finish', data: null, msg_id });
      return;
    }
    const abortController = this.createAbortController();

    const stripFilesMarker = (text: string): string => {
      const markerIndex = text.indexOf(WAYLAND_FILES_MARKER);
      if (markerIndex === -1) return text;
      return text.slice(0, markerIndex).trimEnd();
    };

    if (Array.isArray(message)) {
      if (message[0]?.text) {
        message[0].text = stripFilesMarker(message[0].text);
      }
    } else if (typeof message === 'string') {
      message = stripFilesMarker(message);
    }

    // Append files from files parameter as @ references to the message
    if (files && files.length > 0) {
      const fileRefs = files.map((filePath) => `@${filePath}`).join(' ');
      if (Array.isArray(message)) {
        if (message[0]?.text) {
          message[0].text = `${message[0].text} ${fileRefs}`;
        }
      } else if (typeof message === 'string') {
        message = `${message} ${fileRefs}`;
      }
    }

    // Preemptive OAuth Token check (only for OAuth mode)
    if (this.authType === AuthType.LOGIN_WITH_GOOGLE) {
      try {
        const tokenManager = getGlobalTokenManager(this.authType);
        const isTokenValid = await tokenManager.checkAndRefreshIfNeeded();
        if (!isTokenValid) {
          console.warn('[GeminiAgent] OAuth token validation failed, proceeding anyway');
        }
      } catch (tokenError) {
        console.warn('[GeminiAgent] OAuth token check error:', tokenError);
        // Continue execution and let the downstream flow handle auth errors
      }
    }

    // Prepend one-time history prefix before processing commands
    if (this.historyPrefix && !this.historyUsedOnce) {
      if (Array.isArray(message)) {
        const first = message[0];
        const original = first?.text ?? '';
        message = [{ text: `${this.historyPrefix}${original}` }];
      } else if (typeof message === 'string') {
        message = `${this.historyPrefix}${message}`;
      }
      this.historyUsedOnce = true;
    }

    // Skills are loaded via SkillManager, index is already in system instruction
    let skillsPrefix = '';

    if (!this.skillsIndexPrependedOnce) {
      // Prefer presetRules, fallback to contextContent
      const rulesContent = this.presetRules || this.contextContent;
      if (rulesContent) {
        skillsPrefix = `[Assistant Rules - You MUST follow these instructions]\n${rulesContent}\n\n`;
      }
      this.skillsIndexPrependedOnce = true;

      // Inject prefix into message
      if (skillsPrefix) {
        const prefix = skillsPrefix + '[User Request]\n';
        if (Array.isArray(message)) {
          if (message[0]) message[0].text = prefix + message[0].text;
        } else {
          message = prefix + message;
        }
      }
    }

    // Track error messages from @ command processing
    let atCommandError: string | null = null;

    const { processedQuery, shouldProceed } = await handleAtCommand({
      query: Array.isArray(message) ? message[0].text : message,
      config: this.config,
      addItem: (item: unknown) => {
        // Capture error messages from @ command processing
        if (item && typeof item === 'object' && 'type' in item) {
          const typedItem = item as { type: string; text?: string };
          if (typedItem.type === 'error' && typedItem.text) {
            atCommandError = typedItem.text;
          }
        }
      },
      onDebugMessage() {
        // Debug hook intentionally left blank to avoid noisy logging
      },
      messageId: Date.now(),
      signal: abortController.signal,
      // Enable lazy loading only when files are provided; do not read file content immediately
      lazyFileLoading: !!(files && files.length > 0),
    });

    if (!shouldProceed || processedQuery === null || abortController.signal.aborted) {
      // Send error message to user if @ command processing failed
      if (atCommandError) {
        this.onStreamEvent({
          type: 'error',
          data: atCommandError,
          msg_id,
        });
      } else if (!abortController.signal.aborted) {
        // Generic error if we don't have specific error message
        this.onStreamEvent({
          type: 'error',
          data: 'Failed to process @ file reference. The file may not exist or is not accessible.',
          msg_id,
        });
      }
      // Send finish event so UI can reset state
      this.onStreamEvent({
        type: 'finish',
        data: null,
        msg_id,
      });
      return;
    }
    const requestId = this.submitQuery(processedQuery, msg_id, abortController);
    return requestId;
  }
  stop(): void {
    this.abortController?.abort();
  }

  async injectConversationHistory(text: string): Promise<void> {
    try {
      if (!this.config || !this.workspace || !this.settings) return;
      if (this.geminiClient) {
        await this.geminiClient.resetChat();
      }

      // Prepare one-time prefix for first outgoing message after (re)start
      this.historyPrefix = `Conversation history (recent):\n${text}\n\n`;
      this.historyUsedOnce = false;
      this.skillsIndexPrependedOnce = false;
      // Use refreshServerHierarchicalMemory to refresh memory, then append chat history
      const { memoryContent } = await refreshServerHierarchicalMemory(this.config);
      const combined = `${memoryContent}\n\n[Recent Chat]\n${text}`;
      this.config.setUserMemory(combined);
    } catch (e) {
      // ignore injection errors
    }
  }
}

/**
 * Get current GeminiAgent instance (used by flashFallbackHandler)
 */
export function getCurrentGeminiAgent(): GeminiAgent | null {
  return currentGeminiAgent;
}
