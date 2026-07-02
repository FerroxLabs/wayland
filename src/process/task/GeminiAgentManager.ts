/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { channelEventBus } from '@process/channels/agent/ChannelEventBus';
import { ipcBridge } from '@/common';
import type { CronMessageMeta, IMessageText, IMessageToolGroup, TMessage } from '@/common/chat/chatLib';
import { transformMessage } from '@/common/chat/chatLib';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';
import type { IMcpServer, TProviderWithModel } from '@/common/config/storage';
import { ProcessConfig, getSkillsDir } from '@process/utils/initStorage';
import { ExtensionRegistry } from '@process/extensions';
import { hydrateModelForSpawn } from '@process/providers/ipc/modelRegistryIpc';
import {
  buildSystemInstructionsWithSkillsIndex,
  buildTurnSkillContext,
  mergeLoadedSkillsExtra,
  consumePendingSessionSkills,
  resolveCapabilitiesManifest,
  isConciergeAssistant,
} from './agentUtils';
import { BUILTIN_CONCIERGE_DIAG_ID } from '@process/resources/builtinMcp/constants';
import { detectSkillLoadRequest, AcpSkillManager, buildSkillContentText } from './AcpSkillManager';
import { uuid } from '@/common/utils';
import { getProviderAuthType } from '@/common/utils/platformAuthType';
import { AuthType, getOauthInfoWithCache, Storage } from '@office-ai/aioncli-core';
import { GeminiApprovalStore } from '../agent/gemini/GeminiApprovalStore';
import { ToolConfirmationOutcome } from '../agent/gemini/cli/tools/tools';
import { getDatabase } from '@process/services/database';
import { addMessage, addOrUpdateMessage, nextTickToLocalFinish } from '@process/utils/message';
import { cronBusyGuard } from '@process/services/cron/CronBusyGuard';
import { skillSuggestWatcher } from '@process/services/cron/SkillSuggestWatcher';
import { getCostRecorder } from '@process/services/cost/CostRecorder';
import { handlePreviewOpenEvent } from '@process/utils/previewUtils';
import { getTeamGuideStdioConfig } from '@process/team/mcp/guide/teamGuideSingleton';
import { shouldInjectSessionMcpServer } from '@process/agent/acp/mcpSessionConfig';
import BaseAgentManager from './BaseAgentManager';
import { IpcAgentEventEmitter } from './IpcAgentEventEmitter';
import { mainLog, mainWarn, mainError } from '@process/utils/mainLogger';
import { hasCronCommands } from './CronCommandDetector';
import { hasConciergeProposals } from './ConciergeProposeDetector';
import { extractTextFromMessage, processCronInMessage } from './MessageMiddleware';
import { stripThinkTags, extractAndStripThinkTags } from './ThinkTagDetector';
import { teamEventBus } from '@process/team/teamEventBus';
import * as fs from 'node:fs';

// Gemini agent manager class
type UiMcpServerConfig = {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  type?: 'sse' | 'http';
  headers?: Record<string, string>;
  description?: string;
};

export class GeminiAgentManager extends BaseAgentManager<
  {
    workspace: string;
    model: TProviderWithModel;
    webSearchEngine?: 'google' | 'default';
    mcpServers?: Record<string, UiMcpServerConfig>;
    contextFileName?: string;
    // System rules
    presetRules?: string;
    contextContent?: string; // Backward compatible
    GOOGLE_CLOUD_PROJECT?: string;
    /** Builtin skills directory path */
    skillsDir?: string;
    /** Enabled skills list */
    enabledSkills?: string[];
    /** Yolo mode: auto-approve all tool calls */
    yoloMode?: boolean;
  },
  string
> {
  workspace: string;
  model: TProviderWithModel;
  contextFileName?: string;
  presetRules?: string;
  contextContent?: string;
  enabledSkills?: string[];
  excludeBuiltinSkills?: string[];
  presetAssistantId?: string;
  private bootstrap: Promise<void>;

  /** Fingerprint of MCP config used by the current worker, for change detection */
  private mcpFingerprint: string = '';

  /** Session-level approval store for "always allow" memory */
  readonly approvalStore = new GeminiApprovalStore();

  private async injectHistoryFromDatabase(): Promise<void> {
    try {
      const result = (await getDatabase()).getConversationMessages(this.conversation_id, 0, 10000);
      const data = (result.data || []) as TMessage[];
      const lines = data
        .filter((m): m is IMessageText => m.type === 'text')
        .slice(-20)
        .map((m) => `${m.position === 'right' ? 'User' : 'Assistant'}: ${m.content.content || ''}`);
      const text = lines.join('\n').slice(-4000);
      if (text) {
        await this.postMessagePromise('init.history', { text });
      }
    } catch (e) {
      // ignore history injection errors
    }
  }

  /**
   * Abort the current stream, then rebuild Gemini's in-memory conversation
   * state from persisted history so the next turn keeps prior context.
   */
  async stop() {
    await super.stop();
    await this.injectHistoryFromDatabase();
  }

  /** Force yolo mode (for cron jobs) */
  private forceYoloMode?: boolean;

  /** Current session mode for approval behavior */
  private currentMode: string = 'default';

  /**
   * Latest per-turn token split from the gemini `'finished'` event's
   * usageMetadata (input/output/cacheRead). These are per-turn totals, not a
   * cumulative gauge, so the last `'finished'` before `'finish'` carries the
   * turn's final counts. Stashed here in MAIN (the renderer also reads it, but
   * the cost ledger lives in the main process) and recorded once on `'finish'`.
   * Reset to undefined after each record so a turn with no usage records nothing.
   */
  private lastGeminiUsage: { input: number; output: number; cacheRead: number } | undefined;

  /** Current turn's thinking message msg_id for accumulating content */
  private thinkingMsgId: string | null = null;
  /** Timestamp when thinking started for duration calculation */
  private thinkingStartTime: number | null = null;
  /** Accumulated thinking content for persistence */
  private thinkingContent: string = '';
  private thinkingDbFlushTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly thinkingDbFlushIntervalMs = 120;

  /** Stored webSearchEngine for worker re-bootstrap */
  private webSearchEngine?: 'google' | 'default';

  /** Team MCP stdio config injected by TeamSessionService */
  private teamMcpStdioConfig?: {
    name: string;
    command: string;
    args: string[];
    env: Array<{ name: string; value: string }>;
  };

  constructor(
    data: {
      workspace: string;
      conversation_id: string;
      webSearchEngine?: 'google' | 'default';
      contextFileName?: string;
      // System rules
      presetRules?: string;
      contextContent?: string; // Backward compatible
      /** Enabled skills list */
      enabledSkills?: string[];
      /** Force yolo mode (for cron jobs) */
      yoloMode?: boolean;
      /** Persisted session mode for resume support */
      sessionMode?: string;
      /** Team MCP server stdio config injected by TeamSessionService */
      teamMcpStdioConfig?: {
        name: string;
        command: string;
        args: string[];
        env: Array<{ name: string; value: string }>;
      };
      /** Builtin skill names to exclude from discovery (e.g. 'cron' for cron-spawned conversations) */
      excludeBuiltinSkills?: string[];
      /** Preset assistant id backing this conversation - used to label Leader in team guide prompt */
      presetAssistantId?: string;
    },
    model: TProviderWithModel
  ) {
    super('gemini', { ...data, model }, new IpcAgentEventEmitter());
    this.workspace = data.workspace;
    this.conversation_id = data.conversation_id;
    this.model = model;
    this.contextFileName = data.contextFileName;
    this.presetRules = data.presetRules;
    this.enabledSkills = data.enabledSkills;
    this.excludeBuiltinSkills = data.excludeBuiltinSkills;
    this.presetAssistantId = data.presetAssistantId;
    this.forceYoloMode = data.yoloMode;
    this.currentMode = data.sessionMode || 'default';
    this.webSearchEngine = data.webSearchEngine;
    this.teamMcpStdioConfig = data.teamMcpStdioConfig;
    mainLog(
      '[GeminiAgentManager]',
      'constructor teamMcpStdioConfig:',
      this.teamMcpStdioConfig ? `PRESENT (command=${this.teamMcpStdioConfig.command})` : 'MISSING'
    );
    // Backward compatible
    this.contextContent = data.contextContent || data.presetRules;
    this.bootstrap = this.createBootstrap();
    // Prevent unhandled rejection when bootstrap fails (e.g. missing OAuth credentials).
    // The error still propagates when sendMessage() awaits this.bootstrap.
    this.bootstrap.catch((e) => {
      mainLog('[GeminiAgentManager]', 'bootstrap failed:', e?.message || String(e));
    });
  }

  /**
   * Create bootstrap promise that initializes the worker with current config.
   * Extracted to allow re-bootstrapping when MCP config changes.
   */
  private createBootstrap(): Promise<void> {
    return Promise.all([ProcessConfig.get('gemini.config'), this.getMcpServers()])
      .then(async ([config, mcpServers]) => {
        // Resolve the provider key in main at dispatch (audit C4/C5): the model
        // blob carries only a non-secret handle, so the decrypted key is
        // fetched here - just before the gemini worker is started - rather than
        // shipped from the renderer. Each conversation runs in its own forked
        // worker, so this per-call resolution keeps concurrent accounts
        // isolated (audit C6). Back-compat: a legacy key-bearing model that is
        // not in the registry is returned unchanged.
        this.model = await hydrateModelForSpawn(this.model);
        let projectId: string | undefined;
        const authType = getProviderAuthType(this.model);
        const needsGoogleOAuth = authType === AuthType.LOGIN_WITH_GOOGLE || authType === AuthType.USE_VERTEX_AI;

        if (needsGoogleOAuth) {
          try {
            const credsPath = Storage.getOAuthCredsPath();
            if (fs.existsSync(credsPath)) {
              const oauthInfo = await getOauthInfoWithCache(config?.proxy);
              if (oauthInfo && oauthInfo.email && config?.accountProjects) {
                projectId = config.accountProjects[oauthInfo.email];
              }
            }
          } catch {
            // If account retrieval fails, don't set projectId
          }
        }

        // presetRules are now written to GEMINI.md by setupAssistantWorkspace()
        // and loaded natively by Gemini CLI via loadServerHierarchicalMemory()
        // Skills are symlinked into .gemini/skills/ and discovered natively by SkillManager
        // No prompt injection needed -> native mechanisms handle everything

        // Merge builtin skill names into enabledSkills for the worker's skill discovery
        // Merge builtin skill names into enabledSkills so the worker's SkillManager can find them
        const skillManager = AcpSkillManager.getInstance(this.enabledSkills);
        await skillManager.discoverSkills(this.enabledSkills);
        const excludeSet = new Set(this.excludeBuiltinSkills ?? []);
        const builtinSkillNames = skillManager
          .getBuiltinSkillsIndex()
          .map((s) => s.name)
          .filter((name) => !excludeSet.has(name));
        const allEnabledSkills = [...new Set([...builtinSkillNames, ...(this.enabledSkills || [])])];

        // Determine yoloMode from legacy config (SecurityModalContent)
        const legacyYoloMode = this.forceYoloMode ?? config?.yoloMode ?? false;
        if (legacyYoloMode && this.currentMode === 'default') {
          this.currentMode = 'yolo';
        }
        if (legacyYoloMode && this.currentMode !== 'yolo') {
          void this.clearLegacyYoloConfig();
        }
        const effectiveYoloMode = this.forceYoloMode ?? this.currentMode === 'yolo';

        // Build the full system prompt: presetRules + skills index + the
        // `wayland_search_skills` MCP advert + (when solo) the team-guide
        // prompt, all prepended with the Wayland Constitution and optional
        // specialist overlay. The helper returns undefined when there is
        // nothing to inject - in that case we keep the prior "no presetRules"
        // behaviour for fresh installs. Byte-identical turn-to-turn for
        // prompt-cache stability. (H2: GeminiAgentManager advertise the
        // second channel of the two-channel skill architecture.)
        const systemInstructions = await buildSystemInstructionsWithSkillsIndex({
          presetContext: this.presetRules,
          enabledSkills: this.enabledSkills,
          excludeBuiltinSkills: this.excludeBuiltinSkills,
          enableTeamGuide: !this.teamMcpStdioConfig,
          backend: 'gemini',
          presetAssistantId: this.presetAssistantId,
          capabilitiesManifest: await resolveCapabilitiesManifest({
            presetAssistantId: this.presetAssistantId,
            agentKey: 'gemini',
          }),
        });
        const effectivePresetRules = systemInstructions ?? this.presetRules;

        return this.start({
          ...config,
          GOOGLE_CLOUD_PROJECT: projectId,
          workspace: this.workspace,
          model: this.model,
          webSearchEngine: this.webSearchEngine,
          mcpServers,
          contextFileName: this.contextFileName,
          // presetRules are no longer injected here - they are in GEMINI.md
          // Keep for backward compatibility with existing conversations
          presetRules: effectivePresetRules,
          contextContent: this.contextContent,
          skillsDir: getSkillsDir(),
          // Enabled skills list (including builtins) for worker's SkillManager
          enabledSkills: allEnabledSkills,
          // Yolo mode: derived from currentMode, not directly from legacy config
          yoloMode: effectiveYoloMode,
        });
      })
      .then(async () => {
        await this.injectHistoryFromDatabase();
      });
  }

  /**
   * Compute a fingerprint of ALL MCP servers for change detection.
   * Includes name, enabled, status and transport key for every server so that
   * any add / remove / toggle / reconnect / config-change is detected -
   * even when a server is deleted and re-added with the same name.
   */
  private static computeMcpFingerprint(mcpServers: IMcpServer[] | undefined | null): string {
    if (!mcpServers || !Array.isArray(mcpServers)) return '[]';
    const entries = mcpServers
      .map((s: IMcpServer) => {
        // Include transport identity so config changes (e.g. different command/url) are detected
        const transportKey =
          s.transport.type === 'stdio'
            ? `${s.transport.command}|${(s.transport.args || []).join(',')}`
            : 'url' in s.transport
              ? s.transport.url
              : '';
        return { n: s.name, e: s.enabled, st: s.status, t: transportKey };
      })
      .toSorted((a, b) => a.n.localeCompare(b.n));
    return JSON.stringify(entries);
  }

  private async getMcpServers(): Promise<Record<string, UiMcpServerConfig>> {
    try {
      const mcpServers = await ProcessConfig.get('mcp.config');
      const allServers: IMcpServer[] = Array.isArray(mcpServers) ? mcpServers : [];

      // Merge extension-contributed MCP servers
      try {
        const registry = ExtensionRegistry.getInstance();
        const extServers = registry.getMcpServers();
        for (const extServer of extServers) {
          const transport = extServer.transport as IMcpServer['transport'];
          if (!transport) continue;
          // Only include enabled extension servers (they don't have status since they're declarative)
          if (extServer.enabled === false) continue;
          allServers.push({
            id: String(extServer.id || ''),
            name: String(extServer.name || ''),
            description: extServer.description as string | undefined,
            enabled: true,
            transport,
            status: 'connected', // Extension MCP servers are treated as available
            createdAt: (extServer.createdAt as number) || Date.now(),
            updatedAt: (extServer.updatedAt as number) || Date.now(),
            originalJson: String(extServer.originalJson || '{}'),
          });
        }
      } catch (extError) {
        console.warn('[GeminiAgentManager] Failed to load extension MCP servers:', extError);
      }

      // Only skip when we have NOTHING to inject: no user MCP, no team MCP, and no
      // aion team-guide MCP. Previously this shortcut fired whenever the user had
      // no custom MCP and wasn't in a team, which silently dropped the aion_* tools
      // (aion_create_team / aion_list_models) for every plain preset-assistant chat.
      const hasAionGuide = !this.teamMcpStdioConfig?.command && Boolean(getTeamGuideStdioConfig()?.command);
      if (allServers.length === 0 && !this.teamMcpStdioConfig?.command && !hasAionGuide) {
        this.mcpFingerprint = '[]';
        return {};
      }

      // Store fingerprint for later change detection
      this.mcpFingerprint = GeminiAgentManager.computeMcpFingerprint(allServers);

      // Convert into the format aioncli-core expects
      // MCPServerConfig supports: stdio (command/args/env), sse/http (url/type/headers)
      const mcpConfig: Record<string, UiMcpServerConfig> = {};
      allServers
        // Builtin servers (image gen, skill search) are seeded with status
        // undefined and never connection-tested; accept them on undefined to
        // match the ACP session path. User servers still require connected.
        .filter(shouldInjectSessionMcpServer)
        // The read-only concierge diagnostics server is Concierge-only: exposing
        // it to every assistant would bloat unrelated tool lists (and surface a
        // diagnostics tool where it doesn't belong). Gate it to the Concierge
        // preset assistant; all other servers pass through unchanged.
        .filter(
          (server: IMcpServer) =>
            server.id !== BUILTIN_CONCIERGE_DIAG_ID || isConciergeAssistant(this.presetAssistantId)
        )
        .forEach((server: IMcpServer) => {
          if (server.transport.type === 'stdio') {
            mcpConfig[server.name] = {
              command: server.transport.command,
              args: server.transport.args || [],
              env: server.transport.env || {},
              description: server.description,
            };
          } else if (
            server.transport.type === 'sse' ||
            server.transport.type === 'http' ||
            server.transport.type === 'streamable_http'
          ) {
            // aioncli-core MCPServerConfig.type only accepts "sse" | "http"
            const type = server.transport.type === 'streamable_http' ? 'http' : server.transport.type;
            mcpConfig[server.name] = {
              url: server.transport.url,
              type,
              headers: server.transport.headers || {},
              description: server.description,
            };
          }
        });

      // Inject team MCP server if this agent belongs to a team (stdio mode)
      if (this.teamMcpStdioConfig && this.teamMcpStdioConfig.command) {
        const envObj: Record<string, string> = {};
        for (const { name, value } of this.teamMcpStdioConfig.env || []) {
          envObj[name] = value;
        }
        mcpConfig[this.teamMcpStdioConfig.name] = {
          command: this.teamMcpStdioConfig.command,
          args: this.teamMcpStdioConfig.args || [],
          env: envObj,
        };
        mainLog('[GeminiAgentManager]', 'getMcpServers: injected team MCP server:', this.teamMcpStdioConfig.name);
      } else {
        mainLog('[GeminiAgentManager]', 'getMcpServers: no teamMcpStdioConfig, skipping team MCP injection');

        // Inject Aion team-guide MCP server for solo agents (not in team mode)
        // so Gemini can call aion_create_team after the user requests a Team
        // or explicitly approves Team for an exceptionally hard task.
        // AION_MCP_BACKEND tells the stdio bridge this is a gemini agent.
        const aionStdioConfig = getTeamGuideStdioConfig();
        if (aionStdioConfig) {
          const aionEnvObj: Record<string, string> = {};
          for (const { name, value } of aionStdioConfig.env || []) {
            aionEnvObj[name] = value;
          }
          aionEnvObj['AION_MCP_BACKEND'] = 'gemini';
          aionEnvObj['AION_MCP_CONVERSATION_ID'] = this.conversation_id;
          mcpConfig[aionStdioConfig.name] = {
            command: aionStdioConfig.command,
            args: aionStdioConfig.args || [],
            env: aionEnvObj,
          };
          mainLog('[GeminiAgentManager]', 'getMcpServers: injected aion team-guide MCP server');
        }
      }

      return mcpConfig;
    } catch (error) {
      this.mcpFingerprint = '[]';
      return {};
    }
  }

  async sendMessage(data: {
    input: string;
    msg_id: string;
    files?: string[];
    cronMeta?: CronMessageMeta;
    hidden?: boolean;
    silent?: boolean;
  }) {
    if (data.silent) {
      await this.refreshWorkerIfMcpChanged();
      this.status = 'pending';
      cronBusyGuard.setProcessing(this.conversation_id, true);
      await this.bootstrap
        .catch((e) => {
          cronBusyGuard.setProcessing(this.conversation_id, false);
          this.emit('gemini.message', {
            type: 'error',
            data: e.message || JSON.stringify(e),
            msg_id: data.msg_id,
          });
          return new Promise((_, reject) => {
            nextTickToLocalFinish(() => {
              reject(e);
            });
          });
        })
        .then(() => super.sendMessage(data))
        .finally(() => {
          cronBusyGuard.setProcessing(this.conversation_id, false);
        });
      return;
    }
    const message: TMessage = {
      id: data.msg_id,
      type: 'text',
      position: 'right',
      conversation_id: this.conversation_id,
      content: {
        content: data.input,
        ...(data.cronMeta && { cronMeta: data.cronMeta }),
      },
      ...(data.hidden && { hidden: true }),
    };
    addMessage(this.conversation_id, message);
    // Update conversation modifyTime so history list sorts correctly.
    // Without this, chat.history.refresh fires before modifyTime is updated,
    // causing stale sorting until a manual page refresh.
    try {
      (await getDatabase()).updateConversation(this.conversation_id, {});
    } catch {
      // Conversation might not exist in DB yet
    }
    // Emit user_content IPC for cron messages so the frontend can display them
    // even if the component mounts after the DB save but before the DB load completes.
    // Normal user-initiated messages are added locally by the frontend, so only cron needs this.
    if (data.cronMeta) {
      const userResponseMessage: IResponseMessage = {
        type: 'user_content',
        conversation_id: this.conversation_id,
        msg_id: data.msg_id,
        data: { content: message.content.content, cronMeta: data.cronMeta },
        ...(data.hidden && { hidden: true }),
      };
      ipcBridge.geminiConversation.responseStream.emit(userResponseMessage);
    }

    // Check if MCP config has changed since worker was initialized
    // If changed, kill old worker and re-bootstrap with fresh config
    await this.refreshWorkerIfMcpChanged();
    this.status = 'pending';
    cronBusyGuard.setProcessing(this.conversation_id, true);

    // Per-turn skill auto-load - surface relevant skills + inline-inject the clear
    // winner for THIS turn. Augment a copy for sending; the stored user message
    // (added above) keeps the clean original. Skipped for hidden turns.
    let sendData = data;
    if (!data.hidden) {
      try {
        // Skills the user added to this chat from the composer - inject once.
        const pending = await consumePendingSessionSkills(this.conversation_id);
        const turnSkill = await buildTurnSkillContext(data.input, {
          alwaysOnNames: this.enabledSkills,
          assistantId: this.presetAssistantId,
          agentKey: 'gemini',
        });
        const prefix = [pending, turnSkill.advert].filter(Boolean).join('\n\n');
        if (prefix) {
          sendData = { ...data, input: `${prefix}\n\n${data.input}` };
        }
        if (turnSkill.autoLoaded.length > 0) {
          await mergeLoadedSkillsExtra(this.conversation_id, turnSkill.autoLoaded);
        }
      } catch (error) {
        mainWarn('[GeminiAgentManager]', 'per-turn skill context failed', error);
      }
    }

    const result = await this.bootstrap
      .catch((e) => {
        cronBusyGuard.setProcessing(this.conversation_id, false);
        this.emit('gemini.message', {
          type: 'error',
          data: e.message || JSON.stringify(e),
          msg_id: data.msg_id,
        });
        return new Promise((_, reject) => {
          nextTickToLocalFinish(() => {
            reject(e);
          });
        });
      })
      .then(() => super.sendMessage(sendData))
      .finally(() => {
        cronBusyGuard.setProcessing(this.conversation_id, false);
      });
    return result;
  }

  /**
   * Re-bootstrap the worker if MCP config has changed since last initialization.
   * This ensures deleted/disabled MCP servers are no longer callable.
   */
  private async refreshWorkerIfMcpChanged(): Promise<void> {
    try {
      const mcpServers = await ProcessConfig.get('mcp.config');
      const currentFingerprint = GeminiAgentManager.computeMcpFingerprint(mcpServers);

      if (currentFingerprint !== this.mcpFingerprint) {
        mainLog(
          '[GeminiAgentManager]',
          `MCP config changed (${this.mcpFingerprint} -> ${currentFingerprint}), re-bootstrapping worker...`
        );
        // Kill old worker process and its child processes (MCP server connections).
        // kill() is async (AUDIT-05 F20 / M18) but we don't need to wait here -
        // re-bootstrap below spawns a fresh worker independent of the old one's exit.
        void this.kill();
        // Re-bootstrap with fresh config (getMcpServers will update the fingerprint)
        this.bootstrap = this.createBootstrap();
        await this.bootstrap;
        mainLog('[GeminiAgentManager]', 'Worker re-bootstrapped with updated MCP config');
      }
    } catch (error) {
      mainWarn('[GeminiAgentManager]', 'Failed to check MCP config changes', error);
      // Don't block message sending on MCP check failure
    }
  }

  private getConfirmationButtons = (
    confirmationDetails: IMessageToolGroup['content'][number]['confirmationDetails'],
    t: (key: string, options?: any) => string
  ) => {
    if (!confirmationDetails) return {};
    let question: string;
    let description: string;
    const options: Array<{
      label: string;
      value: ToolConfirmationOutcome;
      params?: Record<string, string>;
    }> = [];
    switch (confirmationDetails.type) {
      case 'edit':
        {
          question = t('messages.confirmation.applyChange');
          description = confirmationDetails.fileName;
          options.push(
            {
              label: t('messages.confirmation.yesAllowOnce'),
              value: ToolConfirmationOutcome.ProceedOnce,
            },
            {
              label: t('messages.confirmation.yesAllowAlways'),
              value: ToolConfirmationOutcome.ProceedAlways,
            },
            {
              label: t('messages.confirmation.no'),
              value: ToolConfirmationOutcome.Cancel,
            }
          );
        }
        break;
      case 'exec':
        {
          question = t('messages.confirmation.allowExecution');
          description = confirmationDetails.command;
          options.push(
            {
              label: t('messages.confirmation.yesAllowOnce'),
              value: ToolConfirmationOutcome.ProceedOnce,
            },
            {
              label: t('messages.confirmation.yesAllowAlways'),
              value: ToolConfirmationOutcome.ProceedAlways,
            },
            {
              label: t('messages.confirmation.no'),
              value: ToolConfirmationOutcome.Cancel,
            }
          );
        }
        break;
      case 'info':
        {
          question = t('messages.confirmation.proceed');
          description = confirmationDetails.urls?.join(';') || confirmationDetails.prompt;
          options.push(
            {
              label: t('messages.confirmation.yesAllowOnce'),
              value: ToolConfirmationOutcome.ProceedOnce,
            },
            {
              label: t('messages.confirmation.yesAllowAlways'),
              value: ToolConfirmationOutcome.ProceedAlways,
            },
            {
              label: t('messages.confirmation.no'),
              value: ToolConfirmationOutcome.Cancel,
            }
          );
        }
        break;
      case 'question':
        {
          // #504: AskUserQuestion is a wcore engine tool, so Gemini does not
          // emit it; this arm exists for confirmationDetails-union
          // exhaustiveness. Surface the question + a plain proceed/cancel.
          question = confirmationDetails.question;
          description = confirmationDetails.header ?? '';
          options.push(
            { label: t('messages.confirmation.yesAllowOnce'), value: ToolConfirmationOutcome.ProceedOnce },
            { label: t('messages.confirmation.no'), value: ToolConfirmationOutcome.Cancel }
          );
        }
        break;
      default: {
        const mcpProps = confirmationDetails;
        question = t('messages.confirmation.allowMCPTool', {
          toolName: mcpProps.toolName,
          serverName: mcpProps.serverName,
        });
        description = confirmationDetails.serverName + ':' + confirmationDetails.toolName;
        options.push(
          {
            label: t('messages.confirmation.yesAllowOnce'),
            value: ToolConfirmationOutcome.ProceedOnce,
          },
          {
            label: t('messages.confirmation.yesAlwaysAllowTool', {
              toolName: mcpProps.toolName,
              serverName: mcpProps.serverName,
            }),
            value: ToolConfirmationOutcome.ProceedAlwaysTool,
            params: {
              toolName: mcpProps.toolName,
              serverName: mcpProps.serverName,
            },
          },
          {
            label: t('messages.confirmation.yesAlwaysAllowServer', {
              serverName: mcpProps.serverName,
            }),
            value: ToolConfirmationOutcome.ProceedAlwaysServer,
            params: { serverName: mcpProps.serverName },
          },
          {
            label: t('messages.confirmation.no'),
            value: ToolConfirmationOutcome.Cancel,
          }
        );
      }
    }
    return {
      question,
      description,
      options,
    };
  };
  /**
   * Check if a confirmation should be auto-approved based on current mode.
   * Returns true if auto-approved (caller should skip UI), false otherwise.
   */
  private tryAutoApprove(content: IMessageToolGroup['content'][number]): boolean {
    const type = content.confirmationDetails?.type;
    console.debug(
      `[GeminiAgentManager] tryAutoApprove: currentMode=${this.currentMode}, confirmationType=${type}, callId=${content.callId}`
    );
    if (this.currentMode === 'yolo') {
      // yolo: auto-approve ALL operations
      console.debug(`[GeminiAgentManager] YOLO auto-approving ${type}: callId=${content.callId}`);
      void this.postMessagePromise(content.callId, ToolConfirmationOutcome.ProceedOnce);
      return true;
    }
    // Team MCP servers (wayland-team-*) are always auto-approved regardless of mode
    if (type === 'mcp') {
      const serverName = (content.confirmationDetails as { serverName?: string })?.serverName ?? '';
      if (serverName.startsWith('wayland-team-')) {
        console.log(
          `[GeminiAgentManager] Auto-approving team MCP tool: serverName=${serverName}, callId=${content.callId}`
        );
        void this.postMessagePromise(content.callId, ToolConfirmationOutcome.ProceedOnce);
        return true;
      }
    }
    if (this.currentMode === 'autoEdit') {
      // autoEdit: auto-approve edit (write/replace) and info (read) operations
      // Only exec and mcp still require manual confirmation
      if (type === 'edit' || type === 'info') {
        console.log(`[GeminiAgentManager] Auto-approving ${type}: callId=${content.callId}`);
        void this.postMessagePromise(content.callId, ToolConfirmationOutcome.ProceedOnce);
        return true;
      }
    }
    return false;
  }

  private handleConformationMessage(message: IMessageToolGroup) {
    const execMessages = message.content.filter((c) => c.status === 'Confirming');
    if (execMessages.length) {
      execMessages.forEach((content) => {
        // Check mode-based auto-approval before showing UI
        if (this.tryAutoApprove(content)) return;

        const { question, options, description } = this.getConfirmationButtons(content.confirmationDetails, (k) => k);
        const hasDetails = Boolean(content.confirmationDetails);
        const hasOptions = options && options.length > 0;
        if (!question && !hasDetails) {
          // Fallback confirmation when tool is waiting but missing details
          this.addConfirmation({
            title: 'Awaiting Confirmation',
            id: content.callId,
            action: 'confirm',
            description: content.description || content.name || 'Tool requires confirmation',
            callId: content.callId,
            options: [
              {
                label: 'messages.confirmation.yesAllowOnce',
                value: ToolConfirmationOutcome.ProceedOnce,
              },
              {
                label: 'messages.confirmation.no',
                value: ToolConfirmationOutcome.Cancel,
              },
            ],
          });
          return;
        }
        if (!question || !hasOptions) return;
        // Extract commandType from exec confirmations for "always allow" memory
        const commandType =
          content.confirmationDetails?.type === 'exec'
            ? (content.confirmationDetails as { rootCommand?: string }).rootCommand
            : undefined;
        this.addConfirmation({
          title: content.confirmationDetails?.title || '',
          id: content.callId,
          action: content.confirmationDetails.type,
          description: description || content.description || '',
          callId: content.callId,
          options: options,
          commandType,
        });
      });
    }
  }

  init() {
    super.init();
    this.on('exit', (data: { code: number | null; signal: NodeJS.Signals | null }) => {
      const crashMessage = {
        conversation_id: this.conversation_id,
        msg_id: uuid(),
        type: 'finish',
        data: {
          error: `Process exited unexpectedly (code: ${data.code === null ? 'null' : data.code}, signal: ${data.signal ?? 'null'})`,
          agentCrash: true,
        },
      } satisfies IResponseMessage;

      ipcBridge.geminiConversation.responseStream.emit(crashMessage);
      teamEventBus.emit('responseStream', crashMessage);
    });

    // Receive conversation messages from the child process
    this.on('gemini.message', (data) => {
      // Mark as finished when content is output (visible to user)
      // Gemini uses: content, tool_group
      const contentTypes = ['content', 'tool_group'];
      if (contentTypes.includes(data.type)) {
        this.status = 'finished';
      }

      // Capture per-turn token usage from the `'finished'` stats event in MAIN
      // (it is otherwise renderer-only). Gemini emits cumulative-per-turn counts,
      // so the last `'finished'` before `'finish'` holds the turn's final split.
      if (data.type === 'finished') {
        const usageMetadata = (
          data.data as {
            usageMetadata?: {
              promptTokenCount?: number;
              candidatesTokenCount?: number;
              cachedContentTokenCount?: number;
            };
          } | null
        )?.usageMetadata;
        if (usageMetadata) {
          this.lastGeminiUsage = {
            input: typeof usageMetadata.promptTokenCount === 'number' ? usageMetadata.promptTokenCount : 0,
            output: typeof usageMetadata.candidatesTokenCount === 'number' ? usageMetadata.candidatesTokenCount : 0,
            cacheRead:
              typeof usageMetadata.cachedContentTokenCount === 'number' ? usageMetadata.cachedContentTokenCount : 0,
          };
        }
      }

      if (data.type === 'finish') {
        // When stream finishes, check for cron commands in the accumulated message
        // Use longer delay and retry logic to ensure message is persisted
        this.checkCronWithRetry(0);
        // Check for SKILL_SUGGEST.md updates (registered by cron executor)
        skillSuggestWatcher.onFinish(this.conversation_id);
        // Finalize thinking message with done status
        if (this.thinkingMsgId) {
          this.emitThinkingMessage('', 'done');
          this.thinkingMsgId = null;
          this.thinkingStartTime = null;
          this.thinkingContent = '';
        }
        this.recordCost();
      }
      if (data.type === 'start') {
        this.status = 'running';
        const traceData = {
          agentType: 'gemini' as const,
          provider: this.model.name,
          modelId: this.model.useModel,
          baseUrl: this.model.baseUrl,
          platform: this.model.platform,
          authType: getProviderAuthType(this.model),
          timestamp: Date.now(),
        };
        // Emit request trace on each model generation start
        ipcBridge.geminiConversation.responseStream.emit({
          type: 'request_trace',
          conversation_id: this.conversation_id,
          msg_id: uuid(),
          data: traceData,
        });
      }

      // Handle preview open event (triggered by chrome-devtools navigation)
      if (handlePreviewOpenEvent(data)) {
        return; // No need to continue processing
      }

      data.conversation_id = this.conversation_id;

      // Convert thought events to thinking messages in conversation flow
      if (data.type === 'thought') {
        const thoughtData = data.data as { subject?: string; description?: string } | string;
        const content =
          typeof thoughtData === 'string' ? thoughtData : thoughtData?.description || thoughtData?.subject || '';
        if (content) {
          this.emitThinkingMessage(content, 'thinking');
        }
      } else if (this.thinkingMsgId) {
        // Any non-thought message means thinking phase is over
        this.emitThinkingMessage('', 'done');
        this.thinkingMsgId = null;
        this.thinkingStartTime = null;
        this.thinkingContent = '';
      }

      // Transform and persist message (skip transient UI state messages)
      // Skip thought (now handled as thinking above), thinking, finished, start, finish
      const skipTransformTypes = ['thought', 'thinking', 'finished', 'start', 'finish'];
      if (!skipTransformTypes.includes(data.type)) {
        const tMessage = transformMessage(data as IResponseMessage);
        if (tMessage) {
          addOrUpdateMessage(this.conversation_id, tMessage, 'gemini');
          if (tMessage.type === 'tool_group') {
            this.handleConformationMessage(tMessage);
          }
        }
      }

      // Strip inline <think> tags from content messages to prevent leaking
      // internal reasoning to the UI (e.g. models that embed think tags in content)
      if (data.type === 'content' && typeof data.data === 'string') {
        const { thinking, content: stripped } = extractAndStripThinkTags(data.data);
        if (thinking) {
          this.emitThinkingMessage(thinking, 'thinking');
        }
        if (stripped !== data.data) {
          data = { ...data, data: stripped };
        }
      }

      // Filter think tags from streaming content before emitting to UI
      const filteredData = this.filterThinkTagsFromMessage(data);
      ipcBridge.geminiConversation.responseStream.emit(filteredData);

      // Emit terminal events to main-process-local bus so TeammateManager can
      // manage agent lifecycle - ipcBridge.emit only delivers to renderer via webContents.send()
      if (filteredData.type === 'finish' || filteredData.type === 'error') {
        teamEventBus.emit('responseStream', filteredData);
      }

      // Emit to Channel global event bus (for Telegram and other external platforms)
      channelEventBus.emitAgentMessage(this.conversation_id, filteredData);
    });
  }

  /**
   * Record this gemini turn's cost to the ledger at finish. usageMetadata is a
   * per-turn input/output/cacheRead split (computed path): the recorder prices
   * it via ModelPricing keyed on `this.model.useModel`, falling back to
   * cost_source='unknown' (tokens only) when the model is unpriced. Skips when
   * no `'finished'` usage event arrived this turn so a no-usage turn records
   * nothing; resets the stash so the next turn starts clean.
   */
  private recordCost(): void {
    const usage = this.lastGeminiUsage;
    this.lastGeminiUsage = undefined;
    if (!usage || usage.input + usage.output + usage.cacheRead <= 0) return;
    getCostRecorder()?.recordTurnFinish({
      conversationId: this.conversation_id,
      backend: 'gemini',
      modelId: this.model?.useModel,
      costSource: 'computed',
      inputTokens: usage.input,
      outputTokens: usage.output,
      cacheReadTokens: usage.cacheRead,
      ts: Date.now(),
    });
  }

  /**
   * Retry checking for cron commands with increasing delays
   * Max 3 retries: 1s, 2s, 3s
   * @param attempt - current attempt number
   * @param checkAfterTimestamp - only process messages created after this timestamp
   */
  private checkCronWithRetry(attempt: number, checkAfterTimestamp?: number): void {
    const delays = [1000, 2000, 3000];
    const maxAttempts = delays.length;

    if (attempt >= maxAttempts) {
      return;
    }

    // Record timestamp on first attempt to avoid re-processing old messages
    const timestamp = checkAfterTimestamp ?? Date.now();
    const delay = delays[attempt];

    setTimeout(async () => {
      const found = await this.checkCronCommandsOnFinish(timestamp);
      if (!found && attempt < maxAttempts - 1) {
        // No assistant messages found, retry with same timestamp
        this.checkCronWithRetry(attempt + 1, timestamp);
      }
    }, delay);
  }

  /**
   * Check for cron commands when stream finishes
   * Gets recent assistant messages from database and processes them
   * @param afterTimestamp - Only process messages created after this timestamp
   * Returns true if assistant messages were found (regardless of cron commands)
   */
  private async checkCronCommandsOnFinish(afterTimestamp: number): Promise<boolean> {
    try {
      const { getDatabase } = await import('@process/services/database');
      const db = await getDatabase();
      const result = db.getConversationMessages(this.conversation_id, 0, 20, 'DESC');

      if (!result.data || result.data.length === 0) {
        return false;
      }

      // Check recent assistant messages for cron commands (position: left means assistant)
      // Filter by timestamp to avoid re-processing old messages
      const assistantMsgs = result.data.filter((m) => m.position === 'left' && (m.createdAt ?? 0) > afterTimestamp);

      // Return false if no assistant messages found after timestamp (will trigger retry)
      if (assistantMsgs.length === 0) {
        return false;
      }

      // Only check the LATEST assistant message to avoid re-processing old messages
      // Messages are sorted DESC, so the first one is the latest
      const latestMsg = assistantMsgs[0];
      const textContent = extractTextFromMessage(latestMsg);

      // Collect system responses to send back to AI
      const collectedResponses: string[] = [];

      // Detect [LOAD_SKILL: ...] requests and load skill content on demand
      if (textContent) {
        const skillRequests = detectSkillLoadRequest(textContent);
        if (skillRequests.length > 0) {
          const skillManager = AcpSkillManager.getInstance(this.enabledSkills);
          await skillManager.discoverSkills(this.enabledSkills);
          const skills = await skillManager.getSkills(skillRequests);
          if (skills.length > 0) {
            const skillContent = buildSkillContentText(skills);
            collectedResponses.push(skillContent);
            ipcBridge.geminiConversation.responseStream.emit({
              type: 'system',
              conversation_id: this.conversation_id,
              msg_id: uuid(),
              data: skillContent,
            });
          }
        }
      }

      // Detect cron commands OR Concierge config proposals ([CONCIERGE_PROPOSE]).
      if (textContent && (hasCronCommands(textContent) || hasConciergeProposals(textContent))) {
        // Create a message with finish status for middleware
        const msgWithStatus = { ...latestMsg, status: 'finish' as const };
        await processCronInMessage(this.conversation_id, 'gemini', msgWithStatus, (sysMsg) => {
          collectedResponses.push(sysMsg);
          // Also emit to frontend for display
          ipcBridge.geminiConversation.responseStream.emit({
            type: 'system',
            conversation_id: this.conversation_id,
            msg_id: uuid(),
            data: sysMsg,
          });
        });
      }

      // Send collected responses back to AI agent so it can continue
      if (collectedResponses.length > 0) {
        const feedbackMessage = `[System Response]\n${collectedResponses.join('\n')}`;
        await this.sendMessage({
          input: feedbackMessage,
          msg_id: uuid(),
        });
      }

      // Found assistant messages, no need to retry
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the current session mode.
   */
  getMode(): { mode: string; initialized: boolean } {
    return { mode: this.currentMode, initialized: true };
  }

  /**
   * Set the session mode (e.g., default, autoEdit).
   *
   * Unlike ACP agents, Gemini mode affects approval behavior at the manager layer,
   * not via a protocol-level session/set_mode call.
   */
  async setMode(mode: string): Promise<{ success: boolean; msg?: string; data?: { mode: string } }> {
    const prev = this.currentMode;
    this.currentMode = mode;
    this.saveSessionMode(mode);

    // Sync legacy yoloMode config: when leaving yolo mode, clear the old
    // SecurityModalContent setting to prevent it from re-activating on next session.
    if (prev === 'yolo' && mode !== 'yolo') {
      void this.clearLegacyYoloConfig();
    }

    return { success: true, data: { mode: this.currentMode } };
  }

  /**
   * Check if yoloMode is already enabled for this Gemini worker.
   * Gemini workers cannot change yoloMode at runtime (forked process),
   * so this only returns true if the worker was started with yoloMode.
   */
  async ensureYoloMode(): Promise<boolean> {
    return !!this.forceYoloMode;
  }

  /**
   * Save session mode to database for resume support.
   */
  private async saveSessionMode(mode: string): Promise<void> {
    try {
      const db = await getDatabase();
      const result = db.getConversation(this.conversation_id);
      if (result.success && result.data && result.data.type === 'gemini') {
        const conversation = result.data;
        const updatedExtra = {
          ...conversation.extra,
          sessionMode: mode,
        };
        db.updateConversation(this.conversation_id, {
          extra: updatedExtra,
        } as Partial<typeof conversation>);
      }
    } catch (error) {
      mainError('[GeminiAgentManager]', 'Failed to save session mode', error);
    }
  }

  /**
   * Clear legacy yoloMode in gemini.config.
   * This syncs back to the old SecurityModalContent config key so that
   * switching away from YOLO mode persists across new sessions.
   */
  private async clearLegacyYoloConfig(): Promise<void> {
    try {
      const config = await ProcessConfig.get('gemini.config');
      if (config?.yoloMode) {
        await ProcessConfig.set('gemini.config', {
          ...config,
          yoloMode: false,
        });
      }
    } catch (error) {
      mainError('[GeminiAgentManager]', 'Failed to clear legacy yoloMode config', error);
    }
  }

  confirm(id: string, callId: string, data: string) {
    // Store "always allow" decision before removing confirmation from cache
    if (data === ToolConfirmationOutcome.ProceedAlways) {
      const confirmation = this.confirmations.find((c) => c.callId === callId);
      if (confirmation?.action) {
        const keys = GeminiApprovalStore.createKeysFromConfirmation(confirmation.action, confirmation.commandType);
        this.approvalStore.approveAll(keys);
      }
    }

    super.confirm(id, callId, data);
    // Send confirmation to worker, using callId as message type
    return this.postMessagePromise(callId, data);
  }

  // Manually trigger context reload
  async reloadContext(): Promise<void> {
    await this.injectHistoryFromDatabase();
  }

  /**
   * Emit a thinking message to the UI stream.
   * Creates a new thinking msg_id on first call per turn, reuses it for subsequent calls.
   */
  private emitThinkingMessage(content: string, status: 'thinking' | 'done' = 'thinking'): void {
    if (!this.thinkingMsgId) {
      this.thinkingMsgId = uuid();
      this.thinkingStartTime = Date.now();
      this.thinkingContent = '';
    }

    // Accumulate content during streaming
    if (status === 'thinking') {
      this.thinkingContent += content;
    }

    const duration = status === 'done' && this.thinkingStartTime ? Date.now() - this.thinkingStartTime : undefined;

    const thinkingMessage = {
      type: 'thinking',
      conversation_id: this.conversation_id,
      msg_id: this.thinkingMsgId,
      data: {
        content,
        duration,
        status,
      },
    };

    ipcBridge.geminiConversation.responseStream.emit(thinkingMessage);
    channelEventBus.emitAgentMessage(this.conversation_id, thinkingMessage);

    // Persist: done flushes immediately, streaming chunks use buffered timer
    if (status === 'done') {
      this.flushThinkingToDb(duration, 'done');
    } else if (!this.thinkingDbFlushTimer) {
      this.thinkingDbFlushTimer = setTimeout(() => {
        this.flushThinkingToDb(undefined, 'thinking');
      }, this.thinkingDbFlushIntervalMs);
    }
  }

  private flushThinkingToDb(duration: number | undefined, status: 'thinking' | 'done'): void {
    if (this.thinkingDbFlushTimer) {
      clearTimeout(this.thinkingDbFlushTimer);
      this.thinkingDbFlushTimer = null;
    }
    if (!this.thinkingMsgId) return;
    const tMessage: TMessage = {
      id: this.thinkingMsgId,
      msg_id: this.thinkingMsgId,
      type: 'thinking',
      position: 'left',
      conversation_id: this.conversation_id,
      content: {
        content: this.thinkingContent,
        duration,
        status,
      },
      createdAt: this.thinkingStartTime || Date.now(),
    };
    addOrUpdateMessage(this.conversation_id, tMessage, 'gemini');
  }

  /**
   * Filter think tags from message content during streaming
   * This ensures users don't see internal reasoning tags in real-time
   * Handles both 'content' and 'thought' message types
   *
   * @param message - The streaming message to filter
   * @returns Message with think tags removed from content
   */
  private filterThinkTagsFromMessage(message: IResponseMessage): IResponseMessage {
    // Filter content messages: only strip complete <think>...</think> blocks.
    // Orphaned </think> tags must be preserved so the frontend can detect them
    // in accumulated content and strip all preceding thinking content.
    if (message.type === 'content' && typeof message.data === 'string') {
      const content = message.data;
      const completeBlockRegex = /<\s*think(?:ing)?\s*>[\s\S]*?<\s*\/\s*think(?:ing)?\s*>/i;
      if (completeBlockRegex.test(content)) {
        return {
          ...message,
          data: content
            .replace(/<\s*think\s*>([\s\S]*?)<\s*\/\s*think\s*>/gi, '')
            .replace(/<\s*thinking\s*>([\s\S]*?)<\s*\/\s*thinking\s*>/gi, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim(),
        };
      }
    }

    // Filter thought messages (they might contain think tags too)
    if (message.type === 'thought' && typeof message.data === 'string') {
      const content = message.data;
      if (/<\/?think(?:ing)?>/i.test(content)) {
        return {
          ...message,
          data: stripThinkTags(content),
        };
      }
    }

    return message;
  }
}
