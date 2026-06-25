/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WorkflowDetailModal - opens when a WorkflowCard is clicked.
 *
 * Surfaces the workflow's name + description + (when present) the SKILL.md
 * body so the user can see exactly what they're about to run. Two CTAs:
 *
 *   - **Launch** - start a new chat with the workflow loaded as the
 *     agent's first directive. Backed by a light "Run on" picker (backend
 *     + model) that defaults to the user's last-selected agent and
 *     persists the selection on launch.
 *   - **Schedule** - opens the existing Create Scheduled Task modal with
 *     this workflow pre-filled.
 */

import { Button, Message, Modal, Select, Spin } from '@arco-design/web-react';
import { Calendar, Rocket, Sparkles } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ipcBridge } from '@/common';
import { ConfigStorage } from '@/common/config/storage';
import type { TProviderWithModel } from '@/common/config/storage';
import type { SkillIndexEntry } from '@/common/types/skillTypes';
import type { WorkflowSession } from '@/common/types/workflowTypes';
import { WorkflowResumePrompt } from '@renderer/pages/guid/components/workflow/WorkflowResumePrompt';
import { toDisplayName } from '@renderer/pages/settings/SkillsSettings/displayName';
import { getAgentKey } from '@renderer/pages/guid/hooks/agentSelectionUtils';
import { resolveSelectedProvider } from '@renderer/components/model/modelSelector/resolveSelectedProvider';
import { fetchDetectedAgents } from '@renderer/utils/model/agentTypes';
import type { AvailableAgent } from '@renderer/utils/model/agentTypes';
import type { AcpBackendAll } from '@/common/types/acpTypes';

type LaunchTarget = {
  backend: string;
  cliPath: string | undefined;
  model: TProviderWithModel;
  agentName: string | undefined;
  customAgentId: string | undefined;
  presetAssistantId: string | undefined;
  sessionMode: string | undefined;
};

interface WorkflowDetailModalProps {
  entry: SkillIndexEntry | null;
  onClose: () => void;
}

/**
 * Normalize `metadata.depends` into a string array. The vendored index
 * ships it as a space-separated string (`"a b c"`), but the
 * SkillMetadata type also allows the array shape that future user-built
 * workflows would write directly. Handle both without trusting either.
 */
function parseDepends(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((d): d is string => typeof d === 'string' && d.length > 0);
  }
  if (typeof raw === 'string') {
    return raw.split(/\s+/).filter((d) => d.length > 0);
  }
  return [];
}

const WorkflowDetailModal: React.FC<WorkflowDetailModalProps> = ({ entry, onClose }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'workflows' });
  const navigate = useNavigate();
  const [body, setBody] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // SPEC §5.7 / §10.2 - when a non-complete session exists within the
  // 14-day window, swap the modal body for an inline resume prompt
  // instead of immediately starting a new session.
  const [resumeCandidate, setResumeCandidate] = useState<WorkflowSession | null>(null);
  const [launching, setLaunching] = useState(false);

  // Picker state - loaded on modal open from ConfigStorage + fetchDetectedAgents
  const [availableAgents, setAvailableAgents] = useState<AvailableAgent[] | null>(null);
  const [selectedAgentKey, setSelectedAgentKey] = useState<string>('claude');
  const [modelOptions, setModelOptions] = useState<Array<{ id: string; label: string; providerId?: string }>>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');

  const depends = useMemo(() => parseDepends(entry?.metadata?.depends), [entry]);

  const handleSkillClick = (slug: string) => {
    onClose();
    void navigate(`/settings/skills?q=${encodeURIComponent(slug)}`);
  };

  // Load model options for the given backend key from ConfigStorage
  const loadModelOptionsForAgent = async (agentKey: string, agents: AvailableAgent[]): Promise<void> => {
    const agent = agents.find((a) => getAgentKey(a) === agentKey);
    const isPreset = Boolean(agent?.isPreset);
    const backend = isPreset ? (agent?.presetAgentType ?? 'gemini') : (agent?.backend ?? agentKey);

    try {
      const [cachedModels, acpConfig] = await Promise.all([
        ConfigStorage.get('acp.cachedModels'),
        ConfigStorage.get('acp.config'),
      ]);

      const modelInfo = cachedModels?.[backend];
      let models: Array<{ id: string; label: string; providerId?: string }> = modelInfo?.availableModels ?? [];

      // The ACP cache only fills as a side-effect of running that backend in a
      // chat, so a backend the user hasn't opened yet (commonly Wayland Core or
      // Gemini) shows an empty picker. Fall back to the model registry's curated
      // set for the backend - the same source the home picker uses - so the
      // picker is self-sufficient and never dead-ends the launch.
      if (models.length === 0) {
        try {
          const curated = await ipcBridge.modelRegistry.curatedForAgent.invoke({ agentKey: backend });
          // Keep providerId so buildLaunchTarget can resolve the real connected
          // provider (e.g. 'openai', 'perplexity') instead of a synthetic
          // backend-keyed row that useWCoreModelSelection later clears (#198).
          models = curated.map((m) => ({ id: m.id, label: m.displayName, providerId: m.providerId }));
        } catch {
          // Registry unavailable - leave empty; the picker shows the connect hint.
        }
      }
      setModelOptions(models);

      const backendConfig = acpConfig?.[backend as AcpBackendAll] as Record<string, unknown> | undefined;
      const preferred = backendConfig?.preferredModelId as string | undefined;
      const defaultModel = preferred ?? modelInfo?.currentModelId ?? models[0]?.id ?? '';
      setSelectedModelId(defaultModel);
    } catch {
      setModelOptions([]);
      setSelectedModelId('');
    }
  };

  useEffect(() => {
    if (!entry) {
      setBody(null);
      setResumeCandidate(null);
      setLaunching(false);
      return;
    }

    // Stale-resolve guard: set cancelled = true in cleanup so async callbacks
    // from a previous entry cannot clobber state for the current one.
    let cancelled = false;

    // New entry opened - clear any resume prompt left over from a
    // previous workflow.
    setResumeCandidate(null);
    setLoading(true);
    void ipcBridge.skills.getBody
      .invoke({ name: entry.name })
      .then((md) => {
        if (cancelled) return;
        setBody(md);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // SPEC §6.3 / acceptance #9: probe for an in-flight session so we can
    // show the resume prompt instead of going straight to the picker. The
    // findActive endpoint enforces the 14-day cutoff server-side, so any
    // non-null result is a valid candidate.
    void ipcBridge.workflow.findActive
      .invoke({ workflow_name: entry.name })
      .then((result) => {
        if (cancelled) return;
        if (result.session !== null) {
          setResumeCandidate(result.session);
        }
      })
      .catch((err: unknown) => {
        // Best-effort - a probe failure must never block a fresh launch.
        console.warn('[WorkflowDetailModal] findActive probe failed:', err);
      });

    // Load picker state: fetch detected agents + restore last selection
    void (async () => {
      try {
        const agents = await fetchDetectedAgents();
        if (cancelled) return;
        setAvailableAgents(agents);

        const savedKey = await ConfigStorage.get('guid.lastSelectedAgent');
        if (cancelled) return;
        let resolvedKey: string;

        if (savedKey) {
          const exists =
            savedKey.startsWith('custom:') ||
            savedKey.startsWith('remote:') ||
            agents.some((a) => getAgentKey(a) === savedKey);
          resolvedKey = exists ? savedKey : agents[0] ? getAgentKey(agents[0]) : 'claude';
        } else {
          resolvedKey = agents[0] ? getAgentKey(agents[0]) : 'claude';
        }

        setSelectedAgentKey(resolvedKey);
        await loadModelOptionsForAgent(resolvedKey, agents);
      } catch {
        if (!cancelled) setAvailableAgents([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [entry]); // eslint-disable-line react-hooks/exhaustive-deps

  // When the user changes backend, refresh the model list
  const handleAgentChange = (key: string) => {
    setSelectedAgentKey(key);
    if (availableAgents) {
      void loadModelOptionsForAgent(key, availableAgents);
    }
  };

  /** Resolve the full launch target from current picker state. */
  const buildLaunchTarget = async (): Promise<LaunchTarget | null> => {
    const agents = availableAgents ?? [];
    const agent = agents.find((a) => getAgentKey(a) === selectedAgentKey);
    if (!agent) {
      Message.error(t('picker.noAgent', 'No backend selected'));
      return null;
    }

    const isPreset = Boolean(agent.isPreset);
    const backend = isPreset ? (agent.presetAgentType ?? 'gemini') : agent.backend;
    const cliPath = agent.cliPath;

    // Resolve the model id. Race-safe re-resolution: if the picker hasn't
    // populated selectedModelId yet (user clicked Start fresh from the
    // resume prompt before loadModelOptionsForAgent completed), fall back
    // to acp.cachedModels[backend].currentModelId. Literal 'auto' is NOT a
    // valid model identifier - upstream providers reject it with
    // model_not_found (live smoke caught this).
    let resolvedModelId = selectedModelId;
    if (!resolvedModelId) {
      try {
        const cachedModels = await ConfigStorage.get('acp.cachedModels');
        const cachedFor = cachedModels?.[backend];
        resolvedModelId = cachedFor?.currentModelId ?? cachedFor?.availableModels?.[0]?.id ?? '';
      } catch {
        // Cached models unavailable - fall through to provider list.
      }
    }

    // Build the model record from model.config, falling back to a minimal object
    let model: TProviderWithModel;
    try {
      const providers = await ConfigStorage.get('model.config');
      const providerList = Array.isArray(providers) ? providers : [];
      // Resolve the REAL provider that owns the selected model. The picker
      // carries the registry providerId (e.g. 'openai', 'perplexity'); match on
      // that first - via the same resolver the WCore model selector uses - so a
      // Wayland Core model binds to its actual connected provider. Matching only
      // on `platform === backend` failed for wcore (backend 'wcore' never equals
      // a provider platform like 'openai'), so the launcher built a synthetic
      // 'wcore-fallback' row that useWCoreModelSelection then cleared as stale,
      // leaving the send box stuck on "No model selected" (#198). The legacy
      // backend match stays as the fallback for options with no providerId (an
      // ACP-cache model for a backend the user already opened).
      const selectedProviderId = modelOptions.find((m) => m.id === selectedModelId)?.providerId ?? '';
      const match =
        resolveSelectedProvider(providerList, (p) => p.model ?? [], resolvedModelId, selectedProviderId) ??
        providerList.find((p) => p.platform === backend || p.id === backend);
      if (match) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { model: _modelArr, ...rest } = match;
        // Final fallback chain: resolvedModelId (selectedModelId OR cached) →
        // provider's first model → fail loudly (no synthetic 'auto').
        const useModel = resolvedModelId || match.model[0] || '';
        if (!useModel) {
          Message.error(
            t('picker.noModel', 'No model available for {{backend}} - pick one in Settings → Models', {
              backend,
            })
          );
          return null;
        }
        model = { ...rest, useModel };
      } else {
        // No provider configured for this backend at all.
        if (!resolvedModelId) {
          Message.error(
            t('picker.noModel', 'No model available for {{backend}} - pick one in Settings → Models', {
              backend,
            })
          );
          return null;
        }
        model = {
          id: `${backend}-fallback`,
          name: backend,
          platform: backend,
          useModel: resolvedModelId,
          baseUrl: '',
          apiKey: '',
        };
      }
    } catch (err) {
      console.warn('[WorkflowDetailModal] model.config read failed:', err);
      if (!resolvedModelId) {
        Message.error(
          t('picker.noModel', 'No model available for {{backend}} - pick one in Settings → Models', {
            backend,
          })
        );
        return null;
      }
      model = {
        id: `${backend}-fallback`,
        name: backend,
        platform: backend,
        useModel: resolvedModelId,
        baseUrl: '',
        apiKey: '',
      };
    }

    // Read preferred session mode for this backend
    let sessionMode: string | undefined;
    try {
      const acpConfig = await ConfigStorage.get('acp.config');
      const backendConfig = acpConfig?.[backend as AcpBackendAll] as Record<string, unknown> | undefined;
      sessionMode = backendConfig?.preferredMode as string | undefined;
    } catch {
      // sessionMode stays undefined - service defaults to whatever it picks
    }

    return {
      backend,
      cliPath,
      model,
      agentName: isPreset ? agent.name : undefined,
      customAgentId: agent.customAgentId,
      presetAssistantId: isPreset ? agent.customAgentId : undefined,
      sessionMode,
    };
  };

  const handleLaunch = async () => {
    if (!entry || launching) return;
    setLaunching(true);
    try {
      const target = await buildLaunchTarget();
      if (!target) {
        setLaunching(false);
        return;
      }
      const startResult = await ipcBridge.workflow.start.invoke({
        workflow_name: entry.name,
        ...target,
      });
      if (!startResult?.sessionId || !startResult.session) {
        throw new Error('workflow.start returned an empty payload');
      }
      // Persist the user's selection so the picker remembers next time
      void ConfigStorage.set('guid.lastSelectedAgent', selectedAgentKey);
      onClose();
      void navigate(`/conversation/${startResult.session.conversation_id}`, {
        state: {
          workflowSessionId: startResult.sessionId,
          initialWorkflowSession: startResult.session,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      Message.error(t('launchError', 'Failed to launch workflow: {{msg}}', { msg }));
      onClose();
    } finally {
      setLaunching(false);
    }
  };

  const handleResume = () => {
    if (!resumeCandidate) return;
    const sessionId = resumeCandidate.id;
    const session = resumeCandidate;
    onClose();
    void navigate(`/conversation/${session.conversation_id}`, {
      state: { workflowSessionId: sessionId, initialWorkflowSession: session },
    });
  };

  const handleStartFresh = async () => {
    if (!entry || !resumeCandidate || launching) return;
    // Validate picker FIRST - before archiving the existing session - so the
    // user doesn't lose their resume candidate to a failed launch.
    if (!availableAgents || availableAgents.length === 0) {
      Message.error(t('picker.notReady', 'Pick a backend before starting fresh'));
      return;
    }
    if (!selectedModelId) {
      Message.error(t('picker.notReady', 'Pick a model before starting fresh'));
      return;
    }
    setLaunching(true);
    try {
      const target = await buildLaunchTarget();
      if (!target) {
        setLaunching(false);
        return;
      }
      // Archive the existing session only AFTER the picker validated - this
      // way a "no model selected" misclick doesn't blow away the resume
      // candidate.
      await ipcBridge.workflow.updateSessionState.invoke({
        sessionId: resumeCandidate.id,
        patch: { setSessionStatus: 'ended' },
      });
      const startResult = await ipcBridge.workflow.start.invoke({
        workflow_name: entry.name,
        ...target,
      });
      if (!startResult?.sessionId || !startResult.session) {
        throw new Error('workflow.start returned an empty payload');
      }
      void ConfigStorage.set('guid.lastSelectedAgent', selectedAgentKey);
      onClose();
      void navigate(`/conversation/${startResult.session.conversation_id}`, {
        state: {
          workflowSessionId: startResult.sessionId,
          initialWorkflowSession: startResult.session,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      Message.error(t('launchError', 'Failed to launch workflow: {{msg}}', { msg }));
      onClose();
    } finally {
      setLaunching(false);
    }
  };

  const handleSchedule = () => {
    if (!entry) return;
    // Route through /scheduled?workflow=<slug>. The Scheduled Tasks page
    // reads the param on mount, opens the Create Task dialog in
    // 'From workflow' mode, and clears the param so refreshes don't
    // re-fire the dialog.
    onClose();
    void navigate(`/scheduled?workflow=${encodeURIComponent(entry.name)}`);
  };

  // Build agent select options from detected agents
  const agentOptions = useMemo(() => {
    if (!availableAgents) return [];
    return availableAgents.map((a) => ({ value: getAgentKey(a), label: a.name }));
  }, [availableAgents]);

  return (
    <Modal
      visible={entry !== null}
      onCancel={onClose}
      footer={null}
      autoFocus={false}
      style={{ width: 640 }}
      title={entry ? (entry.title ?? toDisplayName(entry.name)) : ''}
    >
      {entry ? (
        <div className='flex flex-col gap-16px'>
          <p className='text-13px m-0' style={{ color: 'var(--text-secondary)' }}>
            {entry.description || t('noDescription', 'No description provided.')}
          </p>

          <div
            className='p-12px rd-8px text-12px'
            style={{
              background: 'var(--color-fill-1)',
              border: '1px solid var(--color-border-1)',
              color: 'var(--text-secondary)',
            }}
          >
            {loading ? (
              <Spin size={16} />
            ) : (
              <>
                <div className='font-semibold mb-4px' style={{ color: 'var(--text-primary)' }}>
                  {t('whatHappens', 'When you launch this')}
                </div>
                {body
                  ? body.slice(0, 600) + (body.length > 600 ? '…' : '')
                  : t(
                      'bodyFallback',
                      'The agent loads this workflow as its first directive and walks you through it step by step. You can interrupt or change direction at any point.'
                    )}
              </>
            )}
          </div>

          {/* Skill dependencies - every vendored workflow declares the
              skills it activates via `metadata.depends`. Surfacing them
              here turns workflows into discoverable entry points to the
              broader skill library (Sean's "connect that shit up"). */}
          {depends.length > 0 ? (
            <div className='flex flex-col gap-6px'>
              <div
                className='text-12px font-semibold flex items-center gap-6px'
                style={{ color: 'var(--text-primary)' }}
              >
                <Sparkles size={12} />
                <span>{t('depends.title', 'Uses these skills')}</span>
                <span style={{ color: 'var(--color-text-3)', fontWeight: 400 }}>· {depends.length}</span>
              </div>
              <div className='flex flex-wrap gap-6px'>
                {depends.map((slug) => (
                  <button
                    key={slug}
                    type='button'
                    onClick={() => handleSkillClick(slug)}
                    className='text-12px px-8px py-3px rd-6px cursor-pointer transition-colors'
                    style={{
                      background: 'var(--color-fill-2)',
                      border: '1px solid var(--color-border-1)',
                      color: 'var(--text-secondary)',
                    }}
                    title={t('depends.openSkill', 'Open in Skills page')}
                  >
                    {toDisplayName(slug)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Backend + model picker - ALWAYS visible. Both fresh launches AND
              resume/start-fresh paths use the picker target, so the user
              always sees which backend + model the workflow will run on
              before committing. */}
          <div className='flex flex-col gap-8px pt-8px'>
            <div className='flex items-center gap-8px flex-wrap'>
              <span className='text-12px flex-shrink-0' style={{ color: 'var(--text-secondary)' }}>
                {t('actions.runOn', 'Run on')}
              </span>
              <Select
                value={selectedAgentKey}
                onChange={handleAgentChange}
                size='small'
                style={{ minWidth: 160 }}
                options={agentOptions}
                disabled={!availableAgents || availableAgents.length === 0 || launching}
                placeholder={t('picker.loading', 'Loading agents…')}
                data-testid='workflow-backend-select'
              />
              {modelOptions.length > 0 ? (
                <Select
                  value={selectedModelId}
                  onChange={(v) => setSelectedModelId(v as string)}
                  size='small'
                  style={{ minWidth: 180 }}
                  options={modelOptions.map((m) => ({ value: m.id, label: m.label }))}
                  disabled={launching}
                  data-testid='workflow-model-select'
                />
              ) : (
                <span className='text-12px italic' style={{ color: 'var(--color-text-3)' }}>
                  {availableAgents === null
                    ? t('picker.loadingModels', 'Loading models…')
                    : t('picker.noModelsForBackend', 'No models yet — connect a provider in Settings → Models')}
                </span>
              )}
            </div>

            {/* Action area - content depends on whether an in-flight session
                exists. Both paths use the picker selection above. */}
            {resumeCandidate ? (
              <WorkflowResumePrompt
                existingSession={resumeCandidate}
                onResume={handleResume}
                onStartFresh={() => {
                  void handleStartFresh();
                }}
              />
            ) : (
              <div className='flex items-center justify-end gap-12px'>
                <Button
                  icon={<Calendar size={14} />}
                  onClick={handleSchedule}
                  style={{ borderRadius: 8 }}
                  className='px-16px'
                >
                  {t('actions.schedule', 'Schedule')}
                </Button>
                <Button
                  type='primary'
                  icon={<Rocket size={14} />}
                  onClick={() => {
                    void handleLaunch();
                  }}
                  loading={launching || availableAgents === null}
                  disabled={launching || availableAgents === null || !selectedModelId}
                >
                  {t('actions.launch', 'Launch now')}
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default WorkflowDetailModal;
