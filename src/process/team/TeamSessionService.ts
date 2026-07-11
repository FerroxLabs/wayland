// src/process/team/TeamSessionService.ts
import { ipcBridge } from '@/common';
import { uuid } from '@/common/utils';
import { GOOGLE_AUTH_PROVIDER_ID } from '@/common/config/constants';
import {
  buildAgentConversationParams,
  getConversationTypeForBackend,
} from '@/common/utils/buildAgentConversationParams';
import {
  loadPresetAssistantResources,
  type PresetAssistantResourceDeps,
} from '@/common/utils/presetAssistantResources';
import type { ITeamRepository } from './repository/ITeamRepository';
import type { IWorkerTaskManager } from '@process/task/IWorkerTaskManager';
import type { IConversationService } from '@process/services/IConversationService';
import type { AgentType } from '@process/task/agentTypes';
import type { AgentBackend } from '@/common/types/acpTypes';
import type { IProvider, TChatConversation, TProviderWithModel } from '@/common/config/storage';
import { ProcessConfig } from '@process/utils/initStorage';
import { getAssistantsDir } from '@process/utils/initStorage';
import { CHATGPT_SUBSCRIPTION_PROVIDER_ID } from '@process/providers/catalog/chatgptSubscriptionModels';
import { EventLogger } from './EventLogger';
import { TaskManager } from './TaskManager';
import { Watchdog } from './Watchdog';
import { TeamSession } from './TeamSession';
import type { TTeam, TeamAgent, TeamTask } from './types';
import fs from 'fs/promises';
import path from 'path';
import { resolveLocaleKey } from '@/common/utils';
import { hasGeminiOauthCreds } from './googleAuthCheck';
import { buildTeamExport, serializeTeamExport, type RitualsResolver } from './importExport/exportTeam';
import type { RitualScheduler } from './ritualScheduler';
import {
  buildCapabilityGrants,
  isSandboxedAfterImport,
  previewImport,
  type ImportPreviewResult,
  type SpecialistCatalog,
} from './importExport/importTeam';
import { TeamExportSchema, type TeamExport } from './importExport/TeamExportSchema';
import { TeamImportError } from './importExport/errors';

export class TeamSessionService {
  private readonly sessions: Map<string, TeamSession> = new Map();
  /** Per-team mutex to serialize addAgent calls, preventing read-modify-write race conditions */
  private readonly addAgentLocks: Map<string, Promise<unknown>> = new Map();
  /** W1e - append-only event log writer shared with TeamSession primitives */
  private readonly eventLogger: EventLogger;
  /** P2 - periodic zombie reclaim sweep over lapsed task leases. */
  private readonly watchdog: Watchdog;

  constructor(
    private readonly repo: ITeamRepository,
    private readonly workerTaskManager: IWorkerTaskManager,
    private readonly conversationService: IConversationService,
    /**
     * Optional injection. When provided, Standing-Company rituals declared by
     * the source launcher fire as real cron jobs against the leader's
     * conversation. Absent (e.g. unit tests) = ritual install is a no-op so
     * the rest of TeamSessionService stays testable without a CronService.
     */
    private readonly ritualScheduler?: RitualScheduler
  ) {
    this.eventLogger = new EventLogger(repo);
    // P2 - one Watchdog per process (TeamSessionService is constructed once at
    // boot in initBridge). Sweep every 60s, matching TeammateManager's
    // LEASE_RENEW_THROTTLE_MS; the lease TTL is 3x that, so a lapsed lease is
    // reclaimed within one TTL window after the owner dies. Stopped in stopAllSessions.
    // checkUnblocks is roster-agnostic (it derives the team from the task), so a
    // bare TaskManager over the repo is enough to release dependents when the
    // Watchdog completes-through a verify-orphan.
    const unblocker = new TaskManager(repo, () => []);
    this.watchdog = new Watchdog(repo, this.eventLogger, {
      checkIntervalMs: 60 * 1000,
      onCompleted: async (taskId: string): Promise<void> => {
        await unblocker.checkUnblocks(taskId);
      },
    });
    this.watchdog.start();
  }

  /** Expose the shared event logger so TeamSession can wire it into Mailbox + TaskManager + TeammateManager. */
  getEventLogger(): EventLogger {
    return this.eventLogger;
  }

  /**
   * Returns the workspace path as-is, or empty string when not specified.
   * An empty workspace tells the downstream agent factory (initAgent.ts) to
   * create a temporary workspace (e.g. `gemini-temp-<timestamp>`), matching
   * the single-agent conversation behavior.
   */
  private resolveWorkspace(workspace: string | undefined): string {
    if (workspace && workspace.trim().length > 0) return workspace;
    return '';
  }

  private createGoogleAuthGeminiModel(useModel: string): TProviderWithModel {
    return {
      id: GOOGLE_AUTH_PROVIDER_ID,
      name: 'Gemini Google Auth',
      platform: 'gemini-with-google-auth',
      baseUrl: '',
      apiKey: '',
      model: [useModel],
      useModel,
      enabled: true,
    } as TProviderWithModel;
  }

  private createGeminiPlaceholderModel(): TProviderWithModel {
    return {
      id: 'gemini-placeholder',
      name: 'Gemini',
      useModel: 'default',
      platform: 'gemini-with-google-auth',
      baseUrl: '',
      apiKey: '',
    } as TProviderWithModel;
  }

  private async resolveDefaultGeminiModel(): Promise<TProviderWithModel> {
    const savedGeminiModel = await ProcessConfig.get('gemini.defaultModel');
    const configuredProviders = await ProcessConfig.get('model.config');
    const providers = Array.isArray(configuredProviders)
      ? configuredProviders.filter((provider) => provider.enabled !== false)
      : [];

    const buildProviderModel = (provider: (typeof providers)[number], useModel: string): TProviderWithModel => {
      return {
        ...provider,
        useModel,
      } as TProviderWithModel;
    };

    if (
      savedGeminiModel &&
      typeof savedGeminiModel === 'object' &&
      'id' in savedGeminiModel &&
      'useModel' in savedGeminiModel
    ) {
      if (savedGeminiModel.id === GOOGLE_AUTH_PROVIDER_ID && (await hasGeminiOauthCreds())) {
        return this.createGoogleAuthGeminiModel(savedGeminiModel.useModel);
      }

      const matchedProvider = providers.find(
        (provider) => provider.id === savedGeminiModel.id && provider.model?.includes(savedGeminiModel.useModel)
      );
      if (matchedProvider) {
        return buildProviderModel(matchedProvider, savedGeminiModel.useModel);
      }
    }

    if (typeof savedGeminiModel === 'string') {
      const matchedProvider = providers.find((provider) => provider.model?.includes(savedGeminiModel));
      if (matchedProvider) {
        return buildProviderModel(matchedProvider, savedGeminiModel);
      }
    }

    const geminiProvider = providers.find((provider) => provider.platform === 'gemini' && provider.model?.length);
    if (geminiProvider) {
      const enabledModel = geminiProvider.model.find((model) => geminiProvider.modelEnabled?.[model] !== false);
      return buildProviderModel(geminiProvider, enabledModel || geminiProvider.model[0]);
    }

    if (await hasGeminiOauthCreds()) {
      const oauthModel =
        typeof savedGeminiModel === 'object' && 'useModel' in savedGeminiModel
          ? savedGeminiModel.useModel
          : typeof savedGeminiModel === 'string'
            ? savedGeminiModel
            : 'gemini-2.0-flash';
      return this.createGoogleAuthGeminiModel(oauthModel);
    }

    const fallbackProvider = providers.find((provider) => provider.model?.length);
    if (fallbackProvider) {
      const enabledModel = fallbackProvider.model.find((model) => fallbackProvider.modelEnabled?.[model] !== false);
      return buildProviderModel(fallbackProvider, enabledModel || fallbackProvider.model[0]);
    }

    return this.createGoogleAuthGeminiModel('gemini-2.0-flash');
  }

  private async resolveDefaultAionrsModel(): Promise<TProviderWithModel> {
    const configuredProviders = await ProcessConfig.get('model.config');
    const providers = Array.isArray(configuredProviders) ? configuredProviders.filter((p) => p.enabled !== false) : [];

    const provider = providers[0];
    if (!provider) {
      throw new Error('No enabled model provider for Wayland Core');
    }

    const enabledModel = provider.model?.find((m: string) => provider.modelEnabled?.[m] !== false);
    return {
      ...provider,
      useModel: enabledModel || provider.model?.[0],
    } as TProviderWithModel;
  }

  /**
   * Find the enabled provider that actually OWNS `modelId` (lists it in its
   * model[] and has not disabled it), mirroring the main session's
   * useWCoreModelSelection ownership check. Returns null when no provider owns
   * the model so callers can fall back. Fixes #87: a spawned teammate pinned to
   * a specific model must hydrate THAT provider's key/baseUrl, not the
   * default-resolved provider's (which could send an sk-flux key to an OpenAI
   * surface). Shared by the wcore and gemini pin paths.
   */
  private async resolveOwningProviderModelById(
    modelId: string,
    conversationType?: string
  ): Promise<TProviderWithModel | null> {
    const configuredProviders = await ProcessConfig.get('model.config');
    const providers = Array.isArray(configuredProviders) ? configuredProviders.filter((p) => p.enabled !== false) : [];

    const owns = (p: IProvider): boolean =>
      Array.isArray(p.model) && p.model.includes(modelId) && p.modelEnabled?.[modelId] !== false;

    // For a Gemini teammate, only a Gemini/Google provider may own the model id.
    // Otherwise an unrelated provider that merely lists the same id (e.g.
    // OpenRouter listing "gemma") hijacks the route and sends a Google model to
    // the wrong endpoint, which 401s (#207). When no Gemini provider owns it,
    // return null so the caller falls back to the default-resolved Gemini
    // provider rather than the first foreign match.
    if (conversationType === 'gemini') {
      const geminiOwner = providers.find((p) => {
        const platform = p.platform?.toLowerCase() || '';
        return owns(p) && (platform.includes('gemini') || platform.includes('google'));
      });
      return geminiOwner ? ({ ...geminiOwner, useModel: modelId } as TProviderWithModel) : null;
    }

    // Prefer the ChatGPT-subscription provider (OAuth, no per-token cost) when it
    // owns the pinned model id, so a subscription model is NOT hijacked by a
    // metered look-alike that merely lists the same id first in model.config
    // (direct OpenAI / OpenRouter). team_list_models hands the leader a BARE model
    // id (e.g. 'gpt-5.4') with no provider identity, so first-match-by-config-order
    // otherwise silently binds a subscription teammate to the metered API and
    // bills it there instead of the subscription the user connected (#555 teams).
    // Symmetric to the Gemini anti-hijack guard above (#207).
    const isSubscriptionProvider = (p: IProvider): boolean =>
      (p as unknown as Record<string, unknown>).__waylandModelRegistryBridge ===
      `v2:${CHATGPT_SUBSCRIPTION_PROVIDER_ID}`;
    const owner = providers.find((p) => owns(p) && isSubscriptionProvider(p)) ?? providers.find(owns);
    if (!owner) {
      return null;
    }

    return { ...owner, useModel: modelId } as TProviderWithModel;
  }

  /**
   * #555 teams — final safety net against a teammate billing a ChatGPT-subscription
   * model on a metered look-alike. Whatever path resolved the model (an explicit
   * pin via resolveOwningProviderModelById, the wcore default `providers[0]`, or
   * the gemini `fallbackProvider` first-match), if the resulting `useModel` is a
   * model the ChatGPT-subscription provider OWNS (lists + enabled) but the
   * resolved provider is NOT the subscription, re-bind to the subscription (OAuth,
   * no per-token cost) provider so envBuilder routes `--provider openai-chatgpt`
   * instead of the metered `--provider openai`. This is the choke point that
   * covers the default/fallback paths every shipped launcher hits (team_spawn_agent
   * is usually called with no explicit model), which bypass the pin resolver.
   *
   * WCORE-ONLY, self-enforced: only the wcore engine can auth the keyless
   * subscription provider (OAuth via ~/.codex/auth.json). Re-binding a non-wcore
   * (e.g. Gemini-CLI) teammate to that keyless row breaks bootstrap ("OpenAI API
   * key is required"), so the guard lives HERE - the invariant holds no matter
   * how the method is called, not just because a call site remembered to gate it.
   */
  private async preferSubscriptionForOwnedModel(
    model: TProviderWithModel,
    conversationType?: string
  ): Promise<TProviderWithModel> {
    if (conversationType !== 'wcore') return model;
    const useModel = model?.useModel;
    if (!useModel) return model;
    const subTag = `v2:${CHATGPT_SUBSCRIPTION_PROVIDER_ID}`;
    const currentTag = (model as unknown as Record<string, unknown>).__waylandModelRegistryBridge;
    if (currentTag === subTag) return model; // already the subscription - nothing to do

    const configuredProviders = await ProcessConfig.get('model.config');
    const providers = Array.isArray(configuredProviders) ? configuredProviders.filter((p) => p.enabled !== false) : [];
    const subscription = providers.find(
      (p) =>
        (p as unknown as Record<string, unknown>).__waylandModelRegistryBridge === subTag &&
        Array.isArray(p.model) &&
        p.model.includes(useModel) &&
        p.modelEnabled?.[useModel] !== false
    );
    return subscription ? ({ ...subscription, useModel } as TProviderWithModel) : model;
  }

  private async resolveConversationModel(params: {
    backend: string;
    isPreset: boolean;
    presetAgentType?: string;
  }): Promise<TProviderWithModel> {
    const { backend, isPreset, presetAgentType } = params;
    const type = getConversationTypeForBackend(isPreset ? presetAgentType || backend : backend);

    if (type === 'gemini') {
      try {
        return await this.resolveDefaultGeminiModel();
      } catch {
        return this.createGeminiPlaceholderModel();
      }
    }

    if (type === 'wcore') {
      return this.resolveDefaultAionrsModel();
    }

    return {} as TProviderWithModel;
  }

  private async resolvePreferredAcpModelId(agentType: string): Promise<string | undefined> {
    const acpConfig = await ProcessConfig.get('acp.config');
    const preferredModelId = (acpConfig as Record<string, { preferredModelId?: string } | undefined> | undefined)?.[
      agentType
    ]?.preferredModelId;
    if (typeof preferredModelId === 'string' && preferredModelId.trim().length > 0) {
      return preferredModelId;
    }

    const cachedModels = await ProcessConfig.get('acp.cachedModels');
    const cachedModelId = cachedModels?.[agentType]?.currentModelId;
    if (typeof cachedModelId === 'string' && cachedModelId.trim().length > 0) {
      return cachedModelId;
    }

    return undefined;
  }

  /**
   * Resolve a launcher id (bare or `ext-` prefixed) to its bundle entry and
   * return whether the bundle declares `standing: true`. Used at createTeam
   * time to auto-promote standing-flagged teams so ritual kickoff cards
   * surface without requiring a manual promote click.
   */
  private async isStandingFlaggedLauncher(sourceLauncherId: string): Promise<boolean> {
    try {
      // A launcher id may arrive bare, `builtin-` prefixed (native catalog
      // records), or `ext-` prefixed (extension/custom). Build candidate ids
      // covering every shape so the lookup matches regardless of source.
      const bare = sourceLauncherId.startsWith('ext-')
        ? sourceLauncherId.slice(4)
        : sourceLauncherId.startsWith('builtin-')
          ? sourceLauncherId.slice(8)
          : sourceLauncherId;
      const candidates = new Set([sourceLauncherId, bare, `ext-${bare}`, `builtin-${bare}`]);
      const matches = (record: { id?: string; standing?: boolean } | undefined): boolean => {
        const id = record?.id;
        return typeof id === 'string' && candidates.has(id) && record?.standing === true;
      };

      // 1) Extension registry (custom/extension teams).
      const { ExtensionRegistry } = await import('@process/extensions/ExtensionRegistry');
      const registryAssistants = ExtensionRegistry.getInstance().getAssistants() as Array<{
        id?: string;
        standing?: boolean;
      }>;
      if (registryAssistants.some(matches)) return true;

      // 2) Native built-in catalog (waylandteams). ExtensionLoader skips the
      // native bundle, so native standing teams (`builtin-<slug>`) are absent
      // from the registry above and must be resolved from the catalog.
      const { getBuiltinCatalogAssistants } = await import('@process/utils/builtinCatalog');
      const catalogAssistants = getBuiltinCatalogAssistants() as Array<{ id?: string; standing?: boolean }>;
      if (catalogAssistants.some(matches)) return true;

      // 3) Merged config.assistants (covers any record not in the two above).
      const storedAssistants = ((await ProcessConfig.get('assistants')) ?? []) as Array<{
        id?: string;
        standing?: boolean;
      }>;
      return storedAssistants.some(matches);
    } catch {
      return false;
    }
  }

  private async findBuiltinResourceDir(resourceType: 'rules' | 'skills'): Promise<string> {
    const base = process.cwd();
    const devDir = resourceType === 'skills' ? 'src/process/resources/skills' : resourceType;
    const candidates = [path.join(base, devDir), path.join(base, '..', devDir), path.join(base, resourceType)];

    for (const candidate of candidates) {
      try {
        await fs.access(candidate);
        return candidate;
      } catch {
        // Try next candidate
      }
    }

    return candidates[0];
  }

  private async readAssistantResource(
    resourceType: 'rules' | 'skills',
    assistantId: string,
    locale: string
  ): Promise<string> {
    // ext-* extension assistants: AssistantResolver embedded the bundle's
    // contextFile into the registry record's `context` field at registry
    // build time. The on-disk filename pattern `${assistantId}.${locale}.md`
    // does NOT match the bare-named files in the waylandteams bundle, so the
    // disk lookup below would silently return '' and the agent would spawn
    // without its domain system prompt (regulatory exposure for Quiet Money).
    // Consult the registry first for rules.
    if (resourceType === 'rules' && assistantId.startsWith('ext-')) {
      try {
        const { ExtensionRegistry } = await import('@process/extensions/ExtensionRegistry');
        const record = ExtensionRegistry.getInstance()
          .getAssistants()
          .find((a) => (a as { id?: string }).id === assistantId);
        const context = (record as { context?: string } | undefined)?.context;
        if (typeof context === 'string' && context.length > 0) {
          return context;
        }
      } catch {
        // Registry not initialized - fall through to filename lookup.
      }
    }

    const assistantsDir = getAssistantsDir();
    const locales = [locale, 'en-US', 'zh-CN'].filter((value, index, values) => values.indexOf(value) === index);
    const fileName = (targetLocale: string) =>
      resourceType === 'rules' ? `${assistantId}.${targetLocale}.md` : `${assistantId}-skills.${targetLocale}.md`;

    for (const currentLocale of locales) {
      try {
        return await fs.readFile(path.join(assistantsDir, fileName(currentLocale)), 'utf-8');
      } catch {
        // Try next locale
      }
    }

    const builtinDir = await this.findBuiltinResourceDir(resourceType);
    for (const currentLocale of locales) {
      try {
        return await fs.readFile(path.join(builtinDir, fileName(currentLocale)), 'utf-8');
      } catch {
        // Try next locale
      }
    }

    return '';
  }

  private async loadPresetResources(
    customAgentId: string
  ): Promise<{ rules?: string; enabledSkills?: string[]; excludeBuiltinSkills?: string[] }> {
    const language = await ProcessConfig.get('language');
    const localeKey = resolveLocaleKey(language || 'en-US');
    const deps: PresetAssistantResourceDeps = {
      readAssistantRule: ({ assistantId, locale }) => this.readAssistantResource('rules', assistantId, locale),
      readAssistantSkill: ({ assistantId, locale }) => this.readAssistantResource('skills', assistantId, locale),
      readBuiltinRule: async ({ fileName }) => {
        const builtinDir = await this.findBuiltinResourceDir('rules');
        return fs.readFile(path.join(builtinDir, path.basename(fileName)), 'utf-8');
      },
      readBuiltinSkill: async ({ fileName }) => {
        const builtinDir = await this.findBuiltinResourceDir('skills');
        return fs.readFile(path.join(builtinDir, path.basename(fileName)), 'utf-8');
      },
      getEnabledSkills: async (assistantId) => {
        const customAgents = await ProcessConfig.get('assistants');
        return customAgents?.find((agent) => agent.id === assistantId)?.enabledSkills;
      },
      getDisabledBuiltinSkills: async (assistantId) => {
        const customAgents = await ProcessConfig.get('assistants');
        return customAgents?.find((agent) => agent.id === assistantId)?.disabledBuiltinSkills;
      },
      warn: (message, error) => {
        console.warn(message, error);
      },
    };
    const resources = await loadPresetAssistantResources({ customAgentId, localeKey }, deps);

    return {
      rules: resources.rules,
      enabledSkills: resources.enabledSkills,
      excludeBuiltinSkills: resources.disabledBuiltinSkills,
    };
  }

  private async buildConversationParams(params: {
    teamId: string;
    teamName: string;
    workspace: string;
    agent: Omit<TeamAgent, 'slotId'> | TeamAgent;
    agents: TeamAgent[];
    inheritedSessionMode?: string;
    /** When true, workspace was inherited (not user-specified) - setupAssistantWorkspace should still run */
    isInheritedWorkspace?: boolean;
  }): Promise<{
    type: AgentType;
    name: string;
    model: TProviderWithModel;
    extra: Record<string, unknown>;
  }> {
    const { teamId, teamName, workspace, agent, agents, inheritedSessionMode, isInheritedWorkspace } = params;
    const backend = this.resolveBackend(agent.agentType, agents) as AgentBackend;
    // remote agents use customAgentId as remoteAgentId, not as a preset indicator
    const isPreset = Boolean(agent.customAgentId) && backend !== 'remote';
    const preferredModelId =
      agent.model ||
      (getConversationTypeForBackend(backend) === 'acp' ? await this.resolvePreferredAcpModelId(backend) : undefined);
    const presetResources =
      isPreset && agent.customAgentId ? await this.loadPresetResources(agent.customAgentId) : undefined;
    let model = await this.resolveConversationModel({
      backend,
      isPreset,
      presetAgentType: isPreset ? backend : undefined,
    });

    const conversationType = getConversationTypeForBackend(backend);

    // Override the working model when the agent pins one explicitly.
    if (agent.model) {
      if (conversationType === 'wcore' || conversationType === 'gemini') {
        // Re-select the provider that OWNS this model id so the spawn hydrates
        // the right key/baseUrl (#87). Without this a pinned teammate keeps the
        // default-resolved provider and only swaps the model name, so a
        // Flux-backed Gemini/WCore teammate sends its sk-flux key to
        // api.openai.com (no Flux base URL applied) and 401s. Fall back to a
        // useModel-only override on the already-resolved provider when no
        // enabled provider claims it - e.g. a Google-auth Gemini model that
        // lives outside model.config.
        const owned = await this.resolveOwningProviderModelById(agent.model, conversationType);
        model = owned ?? { ...model, useModel: agent.model };
      }
    }

    // #555 teams choke point: covers the wcore default (`providers[0]`) path that
    // resolves a subscription model id onto the metered OpenAI provider (tag
    // v2:openai) and would bill the API instead of the subscription. The method
    // self-enforces the wcore-only invariant (a Gemini-CLI teammate cannot auth
    // the keyless subscription provider, so it keeps the metered route), so we
    // pass conversationType and let it decide rather than gating here.
    model = await this.preferSubscriptionForOwnedModel(model, conversationType);

    return buildAgentConversationParams({
      backend,
      name: `${teamName} - ${agent.agentName}`,
      agentName: agent.agentName,
      workspace,
      customWorkspace: Boolean(workspace) && !isInheritedWorkspace,
      model,
      cliPath: agent.cliPath,
      customAgentId: agent.customAgentId,
      isPreset,
      presetAgentType: isPreset ? backend : undefined,
      presetResources,
      sessionMode: inheritedSessionMode,
      currentModelId: preferredModelId,
      extra: {
        teamId,
      },
    }) as {
      type: AgentType;
      name: string;
      model: TProviderWithModel;
      extra: Record<string, unknown>;
    };
  }

  private extractRecoveredSlotId(
    extra: { teamMcpStdioConfig?: { env?: Array<{ name?: string; value?: string }> } } | undefined
  ): string | undefined {
    return extra?.teamMcpStdioConfig?.env?.find((entry) => entry.name === 'TEAM_AGENT_SLOT_ID')?.value;
  }

  private resolveRecoveredAgentType(conversation: TChatConversation): string | undefined {
    switch (conversation.type) {
      case 'gemini':
        return 'gemini';
      case 'wcore':
        return 'wcore';
      case 'remote':
        return 'remote';
      case 'nanobot':
        return 'nanobot';
      case 'openclaw-gateway':
        return (conversation.extra as { backend?: string } | undefined)?.backend || 'openclaw-gateway';
      case 'acp':
        return (conversation.extra as { backend?: string } | undefined)?.backend;
      default:
        return undefined;
    }
  }

  private resolveRecoveredAgentName(team: TTeam, conversation: TChatConversation, isLead: boolean): string {
    const extra = conversation.extra as { agentName?: string } | undefined;
    const explicitName = extra?.agentName?.trim();
    if (explicitName) return explicitName;

    const prefix = `${team.name} - `;
    if (conversation.name.startsWith(prefix)) {
      const derivedName = conversation.name.slice(prefix.length).trim();
      if (derivedName) return derivedName;
    }

    return isLead ? 'Leader' : 'Teammate';
  }

  private mapRecoveredStatus(status: TChatConversation['status']): TeamAgent['status'] {
    switch (status) {
      case 'running':
        return 'active';
      case 'finished':
        return 'idle';
      default:
        return 'pending';
    }
  }

  private buildRecoveredAgent(team: TTeam, conversation: TChatConversation): TeamAgent | null {
    const extra = conversation.extra as {
      cliPath?: string;
      customAgentId?: string;
      presetAssistantId?: string;
      gateway?: { cliPath?: string };
      teamMcpStdioConfig?: { env?: Array<{ name?: string; value?: string }> };
      currentModelId?: string;
    };
    const slotId = this.extractRecoveredSlotId(extra);
    const agentType = this.resolveRecoveredAgentType(conversation);
    if (!slotId || !agentType) return null;

    const isLeader = slotId === team.leaderAgentId;
    return {
      slotId,
      conversationId: conversation.id,
      role: isLeader ? 'leader' : 'teammate',
      agentType,
      agentName: this.resolveRecoveredAgentName(team, conversation, isLeader),
      conversationType: conversation.type,
      status: this.mapRecoveredStatus(conversation.status),
      cliPath: extra.cliPath || extra.gateway?.cliPath,
      customAgentId: extra.customAgentId || extra.presetAssistantId,
      model: extra.currentModelId || (conversation as { model?: { useModel?: string } }).model?.useModel,
    };
  }

  private async repairTeamAgentsIfMissing(team: TTeam): Promise<TTeam> {
    if (team.agents.length > 0) return team;

    const conversations = await this.conversationService.listAllConversations();
    const linkedConversations = conversations
      .filter((conversation) => (conversation.extra as { teamId?: string } | undefined)?.teamId === team.id)
      .toSorted((left, right) => (right.modifyTime ?? 0) - (left.modifyTime ?? 0));

    if (linkedConversations.length === 0) return team;

    const recoveredBySlot = new Map<string, TeamAgent>();
    for (const conversation of linkedConversations) {
      const recovered = this.buildRecoveredAgent(team, conversation);
      if (recovered && !recoveredBySlot.has(recovered.slotId)) {
        recoveredBySlot.set(recovered.slotId, recovered);
      }
    }

    const recoveredAgents = [...recoveredBySlot.values()];
    if (recoveredAgents.length === 0) return team;

    let repairedAgents = recoveredAgents;
    if (!repairedAgents.some((agent) => agent.role === 'leader')) {
      repairedAgents = repairedAgents.map((agent, index) => ({
        ...agent,
        role: index === 0 ? 'leader' : 'teammate',
      }));
    }

    repairedAgents = repairedAgents.toSorted((left, right) => {
      if (left.role === right.role) return left.agentName.localeCompare(right.agentName);
      return left.role === 'leader' ? -1 : 1;
    });

    const repairedLead = repairedAgents.find((agent) => agent.role === 'leader') ?? repairedAgents[0];
    const repairedTeam: TTeam = {
      ...team,
      leaderAgentId: repairedLead.slotId,
      agents: repairedAgents,
      updatedAt: Date.now(),
    };

    try {
      await this.repo.update(team.id, {
        agents: repairedTeam.agents,
        leaderAgentId: repairedTeam.leaderAgentId,
        updatedAt: repairedTeam.updatedAt,
      });
    } catch (error) {
      console.warn(`[TeamSessionService] Failed to persist repaired agents for team ${team.id}:`, error);
    }

    return repairedTeam;
  }

  async createTeam(params: {
    userId: string;
    name: string;
    workspace: string;
    workspaceMode: TTeam['workspaceMode'];
    agents: TeamAgent[];
    sessionMode?: string;
    sourceLauncherId?: string;
  }): Promise<TTeam> {
    const now = Date.now();
    const teamId = uuid(36);
    let workspace = this.resolveWorkspace(params.workspace);

    // Create a real conversation for each agent (or reuse an existing one for the leader)
    const agentsWithConversations = await Promise.all(
      params.agents.map(async (agent) => {
        const slotId = agent.slotId || `slot-${uuid(8)}`;

        // If the agent already has a conversationId (e.g., leader reusing caller's conversation),
        // verify it exists and adopt it into the team instead of creating a new conversation.
        if (agent.conversationId) {
          const existing = await this.conversationService.getConversation(agent.conversationId);
          if (existing) {
            // Only include workspace in the update when it has a real value.
            // An empty string would overwrite the conversation's existing workspace
            // (e.g. the temp dir created during solo-chat init), causing mkdir('') failures.
            const extraUpdate: Record<string, unknown> = { teamId };
            if (workspace) {
              extraUpdate.workspace = workspace;
            }
            await this.conversationService.updateConversation(
              agent.conversationId,
              { extra: extraUpdate } as any,
              true
            );
            return { ...agent, slotId, conversationId: agent.conversationId };
          }
          // Fall through to create new if conversation was not found
        }

        const conversationParams = await this.buildConversationParams({
          teamId,
          teamName: params.name,
          workspace,
          agent,
          agents: params.agents,
          inheritedSessionMode: params.sessionMode,
          isInheritedWorkspace: !params.workspace,
        });
        const conversation = await this.conversationService.createConversation(conversationParams);
        // Ensure teamId is in extra regardless of which factory function was used
        // (some factories like createCodexAgent/createGeminiAgent drop unknown extra fields)
        await this.conversationService.updateConversation(conversation.id, { extra: { teamId } } as any, true);
        return { ...agent, slotId, conversationId: conversation.id };
      })
    );

    const leadAgent = agentsWithConversations.find((a) => a.role === 'leader');

    // If workspace was not specified, back-fill from the leader agent's actual conversation workspace.
    // The conversation factory may auto-assign a workspace (stored in extra.workspace), and we need
    // TTeam.workspace to reflect that so all subsequent addAgent calls share the same directory.
    if (!workspace && leadAgent?.conversationId) {
      const leadConv = await this.conversationService.getConversation(leadAgent.conversationId);
      const leadExtra = leadConv?.extra as Record<string, unknown> | undefined;
      if (leadExtra?.workspace && typeof leadExtra.workspace === 'string') {
        workspace = leadExtra.workspace;
      }
    }
    if (!leadAgent) throw new Error('Team must have at least one leader agent');

    // Auto-promote teams created from a launcher whose bundle entry has
    // `standing: true`. Without this, ritual crons install at createTeam but
    // SignalCollector.detectRecentRitualOutput gates post-fire kickoff cards
    // on `promotedToStanding === true`, which only gets set by the explicit
    // user-facing promote button. Standing-flagged bundles already declare
    // intent at the bundle layer; making the user click promote is a UX gap.
    const isStandingByBundle = params.sourceLauncherId
      ? await this.isStandingFlaggedLauncher(params.sourceLauncherId)
      : false;

    const team: TTeam = {
      id: teamId,
      userId: params.userId,
      name: params.name,
      workspace,
      workspaceMode: params.workspaceMode,
      leaderAgentId: leadAgent.slotId,
      agents: agentsWithConversations,
      sessionMode: params.sessionMode,
      sourceLauncherId: params.sourceLauncherId,
      promotedToStanding: isStandingByBundle ? true : undefined,
      createdAt: now,
      updatedAt: now,
    };
    await this.repo.create(team);
    // Install launcher rituals if the source bundle declared any. The
    // scheduler resolves rituals from the live ExtensionRegistry; bundles
    // without rituals (the vast majority of launchers) yield a no-op.
    if (this.ritualScheduler && team.sourceLauncherId) {
      try {
        await this.ritualScheduler.installRituals(team);
      } catch (err) {
        console.warn(
          `[TeamSessionService] failed to install rituals for new team ${team.id}:`,
          err instanceof Error ? err.message : err
        );
      }
    }
    // Notify the sidebar + library page so newly-created teams appear without
    // a manual refresh. Without this emit, useTeamList()'s SWR cache only
    // re-fetched on revalidation triggers, and brand-new teams were invisible
    // in the sidebar until the user reloaded.
    ipcBridge.team.listChanged.emit({ teamId: team.id, action: 'created' });
    return team;
  }

  async getTeam(id: string): Promise<TTeam | null> {
    const team = await this.repo.findById(id);
    if (!team) return null;
    return this.repairTeamAgentsIfMissing(team);
  }

  async listTeams(userId: string): Promise<TTeam[]> {
    return this.repo.findAll(userId);
  }

  /**
   * Passive read of a team's task board straight from persistence. Never starts
   * a session or mutates anything - used by Mission Control to project the
   * unified task ledger.
   */
  async listTasksForTeam(teamId: string): Promise<TeamTask[]> {
    return this.repo.findTasksByTeam(teamId);
  }

  async deleteTeam(id: string): Promise<void> {
    // Kill all agent processes before disposing session and deleting data.
    // This prevents orphan processes that keep running after the team is deleted.
    const team = await this.repo.findById(id);
    if (team && this.ritualScheduler) {
      // Tear down rituals first so cron timers stop firing before we delete
      // the underlying conversation. Otherwise CronService.cleanupOrphanJobs
      // only catches the dangling row on the next app start.
      try {
        await this.ritualScheduler.uninstallRituals(team);
      } catch (err) {
        console.warn(
          `[TeamSessionService] failed to uninstall rituals during team delete ${id}:`,
          err instanceof Error ? err.message : err
        );
      }
    }
    if (team) {
      const killResults = await Promise.allSettled(
        team.agents
          .filter((agent) => agent.conversationId)
          .map((agent) => {
            this.workerTaskManager.kill(agent.conversationId, 'team_deleted');
            return Promise.resolve();
          })
      );
      killResults.forEach((r) => {
        if (r.status === 'rejected') {
          console.warn(`[TeamSessionService] Failed to kill agent process:`, r.reason);
        }
      });
    }

    await this.sessions.get(id)?.dispose();
    this.sessions.delete(id);

    // Delete conversations owned by this team's agents
    if (team) {
      const results = await Promise.allSettled(
        team.agents
          .filter((agent) => agent.conversationId)
          .map((agent) => this.conversationService.deleteConversation(agent.conversationId))
      );
      results.forEach((r) => {
        if (r.status === 'rejected') {
          console.warn(`[TeamSessionService] Failed to delete conversation:`, r.reason);
        }
      });
    }

    await this.repo.deleteMailboxByTeam(id);
    await this.repo.deleteTasksByTeam(id);
    await this.repo.delete(id);
    // Mirror the create-emit so the sidebar/library removes the row without
    // a manual refresh.
    ipcBridge.team.listChanged.emit({ teamId: id, action: 'removed' });
  }

  async addAgent(teamId: string, agent: Omit<TeamAgent, 'slotId'>): Promise<TeamAgent> {
    // Serialize per-team to prevent concurrent read-modify-write races on the agents array.
    // Without this lock, parallel team_spawn_agent calls read the same stale agents list,
    // and the last writer wins - silently dropping agents added by concurrent calls.
    const prev = this.addAgentLocks.get(teamId) ?? Promise.resolve();
    let resolve!: () => void;
    const lock = new Promise<void>((r) => {
      resolve = r;
    });
    this.addAgentLocks.set(teamId, lock);
    try {
      await prev;
      return await this.addAgentUnsafe(teamId, agent);
    } finally {
      resolve();
      // Clean up the lock entry when it's the last in the chain
      if (this.addAgentLocks.get(teamId) === lock) {
        this.addAgentLocks.delete(teamId);
      }
    }
  }

  private async addAgentUnsafe(teamId: string, agent: Omit<TeamAgent, 'slotId'>): Promise<TeamAgent> {
    const team = await this.repo.findById(teamId);
    if (!team) throw new Error(`Team "${teamId}" not found`);

    const workspace = this.resolveWorkspace(team.workspace);
    // Inherit sessionMode: prefer persisted team.sessionMode, fallback to leader agent's conversation extra
    let inheritedSessionMode: string | undefined = team.sessionMode;
    if (!inheritedSessionMode) {
      const leadAgent = team.agents.find((a) => a.role === 'leader');
      if (leadAgent?.conversationId) {
        const leadConv = await this.conversationService.getConversation(leadAgent.conversationId);
        const leadExtra = leadConv?.extra as Record<string, unknown> | undefined;
        if (leadExtra?.sessionMode && typeof leadExtra.sessionMode === 'string') {
          inheritedSessionMode = leadExtra.sessionMode;
        }
      }
    }

    const conversationParams = await this.buildConversationParams({
      teamId,
      teamName: team.name,
      workspace,
      agent,
      agents: team.agents,
      inheritedSessionMode,
      isInheritedWorkspace: true,
    });
    const conversation = await this.conversationService.createConversation(conversationParams);
    // Ensure teamId is in extra regardless of which factory function was used
    await this.conversationService.updateConversation(conversation.id, { extra: { teamId } } as any, true);

    const newAgent: TeamAgent = {
      ...agent,
      agentType: this.resolveBackend(agent.agentType, team.agents),
      slotId: `slot-${uuid(8)}`,
      conversationId: conversation.id,
    };
    const updatedAgents = [...team.agents, newAgent];
    await this.repo.update(teamId, { agents: updatedAgents, updatedAt: Date.now() });
    this.sessions.get(teamId)?.addAgent(newAgent);

    // W1e: log spawn AFTER the agent is durably persisted to the team roster.
    void this.eventLogger.append({
      teamId,
      eventType: 'spawn',
      targetSlotId: newAgent.slotId,
      payload: {
        agent_name: newAgent.agentName,
        agent_type: newAgent.agentType,
        role: newAgent.role,
        conversation_id: newAgent.conversationId,
      },
    });

    // Notify renderer so SWR caches (useTeamList, useSiderTeamBadges) revalidate
    ipcBridge.team.listChanged.emit({ teamId, action: 'agent_added' });
    return newAgent;
  }

  private resolveBackend(agentType: string, agents: TeamAgent[]): string {
    if (agentType !== 'acp') return agentType;
    const leader = agents.find((a) => a.role === 'leader');
    return leader && leader.agentType !== 'acp' ? leader.agentType : 'claude';
  }

  private resolveConversationType(agentType: string): AgentType {
    // Delegate to the canonical backend→type map so this can never drift from
    // it again. A divergent copy here is exactly what broke Teams for Wayland
    // Core (#204): the `wayland-core`/`agent-profile` aliases - both the WCore
    // engine, not an ACP CLI - fell through to 'acp', so an in-place backend
    // swap to "wayland-core" passed the same-type guard, kept its 'acp'
    // conversation, and then died on spawn with `No CLI path for backend
    // "wayland-core"`. With the alias mapped to 'wcore', that swap is now
    // correctly rejected as a cross-type change (remove + re-add instead).
    const type = getConversationTypeForBackend(agentType);
    // getConversationTypeForBackend's return type includes 'codex' (a
    // create-params type) but it never returns it - codex maps to 'acp'. Narrow
    // back to the team layer's AgentType.
    return type === 'codex' ? 'acp' : type;
  }

  async renameAgent(teamId: string, slotId: string, newName: string): Promise<void> {
    // Update in-memory session if running
    const session = this.sessions.get(teamId);
    if (session) {
      session.renameAgent(slotId, newName);
      return; // TeamSession.renameAgent already persists
    }
    // No active session - update DB directly
    const team = await this.repo.findById(teamId);
    if (!team) throw new Error(`Team "${teamId}" not found`);
    const updatedAgents = team.agents.map((a) => (a.slotId === slotId ? { ...a, agentName: newName.trim() } : a));
    await this.repo.update(teamId, { agents: updatedAgents, updatedAt: Date.now() });
  }

  async renameTeam(id: string, name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) return;
    await this.repo.update(id, { name: trimmed, updatedAt: Date.now() });
  }

  async setSessionMode(teamId: string, sessionMode: string): Promise<void> {
    await this.repo.update(teamId, { sessionMode, updatedAt: Date.now() });
  }

  async updateWorkspace(teamId: string, newWorkspace: string): Promise<void> {
    const team = await this.repo.findById(teamId);
    if (!team) throw new Error(`Team "${teamId}" not found`);

    const now = Date.now();
    await this.repo.update(teamId, { workspace: newWorkspace, updatedAt: now });

    for (const agent of team.agents) {
      if (!agent.conversationId) continue;
      await this.conversationService.updateConversation(
        agent.conversationId,
        {
          extra: { workspace: newWorkspace, customWorkspace: true },
          modifyTime: now,
        } as Partial<TChatConversation>,
        true
      );
    }
  }

  /**
   * Restart a crashed teammate's CLI process while keeping the slot + history
   * intact. Refuses to act mid-wake to avoid corrupting an in-flight turn.
   *
   * Flow: kill residual process (if any) → reset status to 'pending' → emit
   * IPC so the right rail flips the dot back → append a `wake` event with
   * `{ outcome: 'restarted_by_user', actor: 'user' }` for the Activity tab.
   * The next user message or leader wake will rebuild the worker task and the
   * full role prompt is replayed because `status === 'pending'`.
   */
  async restartAgent(teamId: string, slotId: string): Promise<void> {
    const team = await this.repo.findById(teamId);
    if (!team) throw new Error(`Team "${teamId}" not found`);

    const agent = team.agents.find((a) => a.slotId === slotId);
    if (!agent) throw new Error(`Agent "${slotId}" not found in team "${teamId}"`);

    const session = this.sessions.get(teamId);
    if (session?.isWakeActive(slotId)) {
      throw new Error('Cannot restart while wake in progress');
    }

    // Kill residual process + clear wake state when a session is live; otherwise
    // there's nothing in-memory to clean up - the repo update below is the only
    // state change needed.
    session?.killAgentProcess(slotId);

    const updatedAgents = team.agents.map((a) => (a.slotId === slotId ? { ...a, status: 'pending' as const } : a));
    await this.repo.update(teamId, { agents: updatedAgents, updatedAt: Date.now() });

    ipcBridge.team.agentStatusChanged.emit({ teamId, slotId, status: 'pending' });

    void this.eventLogger.append({
      teamId,
      eventType: 'wake',
      actorSlotId: slotId,
      payload: {
        outcome: 'restarted_by_user',
        actor: 'user',
      },
    });
  }

  /**
   * Live-smoke fix #4b (2026-05-19) - swap a teammate's backend CLI in
   * place. Same-conversationType swaps only (e.g. claude ↔ codex, both
   * 'acp'). Cross-type swaps (gemini ↔ claude, wcore ↔ remote, etc.)
   * are rejected with a descriptive error because the agent's
   * conversation row is typed at creation and would have to be torn
   * down + recreated to host a different protocol - losing chat
   * history in the process. The renderer surfaces the error as a
   * toast so the user can fall back to recreating the agent.
   *
   * Flow on the success path mirrors restartAgent: refuse if a wake
   * is in flight → kill the worker process (clears ACP team context,
   * worker task, wake state) → flip agent to {pending, new backend,
   * new model?} → persist → emit agentStatusChanged → log a
   * `decision` event with the from/to backends so the Activity tab
   * tells the story.
   */
  async changeAgentBackend(params: {
    teamId: string;
    slotId: string;
    newBackend: string;
    newModel?: string;
  }): Promise<void> {
    const { teamId, slotId, newBackend, newModel } = params;
    const team = await this.repo.findById(teamId);
    if (!team) throw new Error(`Team "${teamId}" not found`);

    const agent = team.agents.find((a) => a.slotId === slotId);
    if (!agent) throw new Error(`Agent "${slotId}" not found in team "${teamId}"`);

    const fromBackend = agent.agentType;
    if (fromBackend === newBackend) return; // idempotent no-op

    // Conversation type is locked at conversation creation. Swapping
    // backends across protocols would require deleting + recreating the
    // conversation, dropping chat history. Refuse rather than silently
    // wipe.
    const newConversationType = this.resolveConversationType(newBackend);
    if (newConversationType !== agent.conversationType) {
      throw new Error(
        `Cannot swap backend "${fromBackend}" → "${newBackend}": ` +
          `conversation type "${agent.conversationType}" → "${newConversationType}" ` +
          `is not supported in place. Remove the agent and add a new one instead to preserve a clean history.`
      );
    }

    const session = this.sessions.get(teamId);
    if (session?.isWakeActive(slotId)) {
      throw new Error('Cannot change backend while wake in progress');
    }

    // Kill residual worker + clear ACP context + wake state.
    session?.killAgentProcess(slotId);

    const updatedAgents = team.agents.map((a) =>
      a.slotId === slotId
        ? {
            ...a,
            agentType: newBackend,
            status: 'pending' as const,
          }
        : a
    );
    await this.repo.update(teamId, { agents: updatedAgents, updatedAt: Date.now() });

    // The conversation row carries the live model; the agent record
    // does not. Update the conversation's model when a new one is
    // supplied so the next wake reflects the user's pick.
    if (newModel && agent.conversationId) {
      try {
        await this.conversationService.updateConversation(agent.conversationId, {
          extra: { backend: newBackend, currentModelId: newModel },
        } as Partial<TChatConversation>);
      } catch (error) {
        console.warn(
          `[TeamSessionService] changeAgentBackend: failed to persist new model on conversation "${agent.conversationId}":`,
          error instanceof Error ? error.message : error
        );
      }
    }

    ipcBridge.team.agentStatusChanged.emit({ teamId, slotId, status: 'pending' });

    void this.eventLogger.append({
      teamId,
      eventType: 'decision',
      actorSlotId: slotId,
      payload: {
        outcome: 'backend_changed',
        actor: 'user',
        from_backend: fromBackend,
        to_backend: newBackend,
        slot_id: slotId,
      },
    });
  }

  /**
   * W3b - User-driven promotion of a team to Standing Company status.
   * Idempotent: a no-op if the team is already promoted. The flag is
   * persisted, a `decision` event is appended for the Activity tab, and a
   * `standing_changed` listChanged event signals SWR caches to revalidate.
   */
  async promoteTeamToStanding(teamId: string): Promise<void> {
    const team = await this.repo.findById(teamId);
    if (!team) throw new Error(`Team "${teamId}" not found`);
    if (team.promotedToStanding === true) return;

    await this.repo.update(teamId, { promotedToStanding: true, updatedAt: Date.now() });

    void this.eventLogger.append({
      teamId,
      eventType: 'decision',
      payload: {
        outcome: 'promoted_to_standing',
        actor: 'user',
      },
    });

    // Install the launcher's rituals as actual cron jobs targeting the
    // leader's conversation. Without this step, the "Standing" badge is
    // display-only and no autonomous behavior fires. Errors are swallowed
    // so the promotion itself stays atomic.
    if (this.ritualScheduler) {
      try {
        await this.ritualScheduler.installRituals(team);
      } catch (err) {
        console.warn(
          `[TeamSessionService] failed to install rituals for team ${teamId}:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    ipcBridge.team.listChanged.emit({ teamId, action: 'standing_changed' });
  }

  /**
   * W3b - Reverse a previous promotion. Idempotent when the team was never
   * promoted (or has already been demoted). Bundle-derived Standing teams
   * (`launcher._standing`) are unaffected because the flag we toggle is the
   * user-promotion flag, not the bundle attribute.
   */
  async demoteTeamFromStanding(teamId: string): Promise<void> {
    const team = await this.repo.findById(teamId);
    if (!team) throw new Error(`Team "${teamId}" not found`);
    if (!team.promotedToStanding) return;

    await this.repo.update(teamId, { promotedToStanding: false, updatedAt: Date.now() });

    void this.eventLogger.append({
      teamId,
      eventType: 'decision',
      payload: {
        outcome: 'demoted_from_standing',
        actor: 'user',
      },
    });

    // Tear down the cron rows installed by promoteTeamToStanding so the
    // leader stops being woken by a no-longer-Standing team.
    if (this.ritualScheduler) {
      try {
        await this.ritualScheduler.uninstallRituals(team);
      } catch (err) {
        console.warn(
          `[TeamSessionService] failed to uninstall rituals for team ${teamId}:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    ipcBridge.team.listChanged.emit({ teamId, action: 'standing_changed' });
  }

  /**
   * W4 (T4.1) - Build the whitelist-only JSON export for a team. The caller
   * (renderer save dialog) is responsible for actually writing the file.
   * Throws when the team is unknown or has no leader.
   *
   * `resolveRituals` is optional so callers without access to the extension
   * registry (e.g. tests) can omit it; rituals will simply be absent from
   * the payload.
   */
  async exportTeam(teamId: string, resolveRituals?: RitualsResolver): Promise<string> {
    const team = await this.repo.findById(teamId);
    if (!team) throw new Error(`Team "${teamId}" not found`);
    const payload = await buildTeamExport(team, resolveRituals);
    return serializeTeamExport(payload);
  }

  /**
   * W4 (T4.2 + T4.6 + T4.6.1) - Validate an import payload and surface
   * missing-specialist info to the caller. Throws TeamImportError on any
   * guard failure (DOS, prototype-pollution, depth, schema). Throws
   * TeamImportBusyError when the bounded parse queue is saturated.
   */
  async previewTeamImport(jsonText: string, specialistCatalog: SpecialistCatalog): Promise<ImportPreviewResult> {
    return previewImport(jsonText, specialistCatalog);
  }

  /**
   * W4 (T4.5 + T4.6) - Persist an imported team with origin tracking +
   * sandbox-flag derived from the caller-supplied capability grants.
   * Hard-rejects if any specialist in the payload is missing from the
   * receiver's bundle.
   *
   * For W4a the IPC handler trusts whatever grants the caller passes. W4b
   * adds the per-cap review dialog + 5s cool-off; until then, the renderer
   * MUST pass an all-false grants map for any preview that came back with
   * `specialistsAvailable=false`.
   */
  async acceptTeamImport(params: {
    userId: string;
    parsed: TeamExport;
    capabilityGrants: Record<string, boolean>;
    source: string;
    specialistCatalog: SpecialistCatalog;
  }): Promise<TTeam> {
    const { userId, parsed: rawParsed, capabilityGrants, source, specialistCatalog } = params;

    // W5 audit HIGH-1 fix (2026-05-19): re-validate the parsed payload at the
    // service boundary. The bridge layer also validates structurally via Zod,
    // but the accept path used to trust whatever object the renderer handed
    // back from the preview round-trip. If a malicious renderer (compromised
    // preload, dev-mode injection) skipped preview and crafted a `parsed`
    // object directly, the only previous safety net was specialist-id +
    // capability whitelisting. Re-running the strict schema here closes the
    // gap with zero behavior change for honest callers.
    const reparse = TeamExportSchema.safeParse(rawParsed);
    if (!reparse.success) {
      throw new TeamImportError(`Invalid parsed payload: ${reparse.error.message}`, 'TEAM_IMPORT_VALIDATION');
    }
    const parsed = reparse.data;

    // Re-check specialist availability at accept-time so a payload that was
    // valid at preview cannot slip past if the user uninstalled a bundle in
    // between. Hard reject (no soft-warn in v1 per T4.6).
    const installed = await specialistCatalog();
    const referenced = [parsed.leader.id, ...parsed.teammates.map((t) => t.id)];
    const missing = referenced.filter((id) => !installed.has(id));
    if (missing.length > 0) {
      const dedup = Array.from(new Set(missing));
      throw new Error(`Missing specialists: ${dedup.join(', ')}. Install them first or use a different team.`);
    }

    const now = Date.now();
    // W4 audit CRIT-2 + HIGH-1 fix (2026-05-19):
    //  - Whitelist grants to ONLY capabilities the import file declared.
    //    Any incoming grant for an undeclared cap is dropped.
    //  - Force `canNetworkRequest` to `by_user: false`: the capability has
    //    no runtime gate in v1 (HIGH-1), so we never honor a grant for it.
    //  - Imported teams ALWAYS persist `isSandboxed: true`. The flag is
    //    informational (drives UI badges + prompt-injection wrap); the
    //    security gate is the per-cap grant map consulted by
    //    `isCapGranted` whenever `importedFrom` is set.
    const declaredCaps = (Object.keys(parsed.capabilities) as Array<keyof TeamExport['capabilities']>).filter(
      (k) => parsed.capabilities[k] === true
    );
    const sanitizedGrants: Record<string, boolean> = {};
    for (const cap of declaredCaps) {
      // Never honor a grant for canNetworkRequest until W4 v2 wires the gate.
      sanitizedGrants[cap] = cap === 'canNetworkRequest' ? false : capabilityGrants[cap] === true;
    }
    const grants = buildCapabilityGrants(sanitizedGrants, now);
    // Mark the by_user=false grants explicitly so the audit trail records
    // that the user was shown the capability and we deliberately denied it.
    for (const cap of declaredCaps) {
      if (!grants[cap]) {
        grants[cap] = { granted_at: now, by_user: false };
      }
    }
    // Reference isSandboxedAfterImport to keep the legacy helper exported
    // for the unit-test surface; the value is intentionally ignored - imports
    // are always sandboxed per the audit fix.
    void isSandboxedAfterImport;
    const sandboxed = true;

    // Build the agents roster from the payload. Leader first, then teammates.
    // The renderer-side launcher path also uses `ext-${id}` for customAgentId,
    // and the backend resolver reads it back the same way.
    const leaderAgent: TeamAgent = {
      slotId: '',
      conversationId: '',
      role: 'leader',
      agentType: parsed.leader.recommendBackend || 'gemini',
      agentName: parsed.name.slice(0, 100),
      conversationType: this.resolveConversationType(parsed.leader.recommendBackend || 'gemini'),
      status: 'pending',
      customAgentId: `ext-${parsed.leader.id}`,
    };
    const teammateAgents: TeamAgent[] = parsed.teammates.map((t) => ({
      slotId: '',
      conversationId: '',
      role: 'teammate',
      agentType: t.recommendBackend || parsed.leader.recommendBackend || 'gemini',
      agentName: t.name,
      conversationType: this.resolveConversationType(t.recommendBackend || parsed.leader.recommendBackend || 'gemini'),
      status: 'pending',
      customAgentId: `ext-${t.id}`,
    }));

    const team = await this.createTeam({
      userId,
      name: parsed.name,
      workspace: '',
      workspaceMode: 'shared',
      agents: [leaderAgent, ...teammateAgents],
    });

    // Stamp provenance + sandbox flag on the freshly-created team. Done as a
    // follow-up update so `createTeam` stays single-responsibility and the
    // origin fields cannot accidentally be set by callers other than this
    // import path.
    await this.repo.update(team.id, {
      importedFrom: source,
      importedAt: now,
      importedSignatureStatus: 'unsigned-v1',
      importCapabilityGrants: grants,
      isSandboxed: sandboxed,
      updatedAt: now,
    });
    const refreshed = await this.repo.findById(team.id);
    return refreshed ?? { ...team, importedFrom: source, importedAt: now, isSandboxed: sandboxed };
  }

  async removeAgent(teamId: string, slotId: string): Promise<void> {
    const team = await this.repo.findById(teamId);
    if (!team) throw new Error(`Team "${teamId}" not found`);

    // removeAgent handles: kill process + clear in-memory state + persist via onAgentRemoved callback
    const session = this.sessions.get(teamId);
    if (session) {
      session.removeAgent(slotId);
    } else {
      // No active session - update DB directly
      const updatedAgents = team.agents.filter((a) => a.slotId !== slotId);
      await this.repo.update(teamId, { agents: updatedAgents, updatedAt: Date.now() });
    }
    // Notify renderer so SWR caches (useTeamList, useSiderTeamBadges) revalidate
    ipcBridge.team.listChanged.emit({ teamId, action: 'agent_removed' });
  }

  async getOrStartSession(teamId: string): Promise<TeamSession> {
    const existing = this.sessions.get(teamId);
    if (existing) return existing;
    const team = await this.getTeam(teamId);
    if (!team) throw new Error(`Team "${teamId}" not found`);
    let session!: TeamSession;
    const spawnAgent = async (agentName: string, agentType?: string, model?: string, customAgentId?: string) => {
      // Default to the leader's agent type instead of hardcoding 'claude'
      const leadAgent = team.agents.find((a) => a.role === 'leader');
      const resolvedType = agentType || leadAgent?.agentType || 'claude';
      const newAgent = await this.addAgent(teamId, {
        conversationId: '',
        role: 'teammate',
        agentType: resolvedType,
        agentName,
        status: 'pending',
        conversationType: this.resolveConversationType(resolvedType) as 'acp',
        model,
        customAgentId,
      });
      // Inject team MCP stdio config into the new agent's conversation (with agent identity)
      const stdioConfig = session?.getStdioConfig(newAgent.slotId);
      if (stdioConfig && newAgent.conversationId) {
        await this.conversationService.updateConversation(
          newAgent.conversationId,
          { extra: { teamMcpStdioConfig: stdioConfig } } as any,
          true
        );
      }
      return newAgent;
    };
    session = new TeamSession(team, this.repo, this.workerTaskManager, spawnAgent, this.eventLogger);
    // Do NOT add to sessions map yet - only add after MCP server is running and
    // teamMcpStdioConfig is written to DB. If we add early and then fail, a
    // subsequent getOrStartSession call would return a broken session (no MCP config).

    try {
      // Start MCP server and inject per-agent stdio config into all agent conversations.
      // After DB update, rebuild cached agent tasks so they pick up teamMcpStdioConfig.
      await session.startMcpServer();
      await Promise.all(
        team.agents.map(async (agent) => {
          if (agent.conversationId) {
            const agentStdioConfig = session.getStdioConfig(agent.slotId);
            try {
              await this.conversationService.updateConversation(
                agent.conversationId,
                { extra: { teamMcpStdioConfig: agentStdioConfig } } as any,
                true
              );
              // Force-rebuild cached agent task so it reads the updated extra from DB
              await this.workerTaskManager.getOrBuildTask(agent.conversationId, { skipCache: true });
            } catch (err) {
              const error = err instanceof Error ? err.message : String(err);
              console.error(`[TeamSessionService] Failed to write MCP config for agent ${agent.slotId}:`, error);
              ipcBridge.team.mcpStatus.emit({
                teamId: team.id,
                slotId: agent.slotId,
                phase: 'config_write_failed',
                error,
              });
            }
          }
        })
      );
    } catch (err) {
      // MCP server failed to start - do not cache the broken session so next call can retry
      console.error(`[TeamSessionService] Failed to start session for team ${teamId}:`, err);
      throw err;
    }

    // W3b - best-effort bump of the promote-to-Standing eligibility counters.
    // First successful in-process start for this team increments sessionCount
    // and stamps firstActiveAt (if unset). Failures are logged and swallowed -
    // the counters are tracking-only and must never block session start.
    const nextSessionCount = (team.sessionCount ?? 0) + 1;
    const nextFirstActiveAt = team.firstActiveAt ?? Date.now();
    void this.repo
      .update(teamId, {
        sessionCount: nextSessionCount,
        firstActiveAt: nextFirstActiveAt,
        updatedAt: Date.now(),
      })
      .catch((err) => console.warn('[TeamSessionService] failed to bump sessionCount', err));

    // Only register the session after full initialization so that getOrStartSession
    // always returns a session with a live MCP server and injected DB config.
    this.sessions.set(teamId, session);

    return session;
  }

  async stopSession(teamId: string): Promise<void> {
    await this.sessions.get(teamId)?.dispose();
    this.sessions.delete(teamId);
  }

  /**
   * W1e - read append-only events for a team, newest first. Backs the W2c
   * Activity tab and the W2d cost meter.
   */
  async listEvents(
    teamId: string,
    options?: {
      since?: number;
      limit?: number;
      eventType?: import('./types').TeamEventType;
    }
  ): Promise<import('./types').TeamEvent[]> {
    return this.repo.listEvents(teamId, options);
  }

  async stopAllSessions(): Promise<void> {
    // P2 - halt the zombie-reclaim sweep before tearing down sessions so it does
    // not fire against a repo that is being disposed.
    this.watchdog.stop();
    // AUDIT-05 F21: use allSettled so one failing session.dispose() does not
    // block the others - app-quit teardown must make best effort to release
    // every TCP server + child process, not bail on the first error.
    const ids = Array.from(this.sessions.keys());
    const results = await Promise.allSettled(ids.map((id) => this.stopSession(id)));
    results.forEach((result, idx) => {
      if (result.status === 'rejected') {
        console.error(`[TeamSessionService] stopSession(${ids[idx]}) failed:`, result.reason);
      }
    });
  }
}
