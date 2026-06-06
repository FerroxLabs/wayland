/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bot, ChevronDown, Workflow as WorkflowIcon } from 'lucide-react';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Input, Select, Message, TimePicker, Radio, Button } from '@arco-design/web-react';
import ModalWrapper from '@renderer/components/base/ModalWrapper';
import { ipcBridge } from '@/common';
import type { ICreateCronJobParams, ICronAgentConfig, ICronJob } from '@/common/adapter/ipcBridge';
import type { SkillIndexEntry } from '@/common/types/skillTypes';
import { toDisplayName } from '@renderer/pages/settings/SkillsSettings/displayName';
import { useConversationAgents } from '@renderer/pages/conversation/hooks/useConversationAgents';
import { getAgentLogo } from '@renderer/utils/model/agentLogo';
import { CUSTOM_AVATAR_IMAGE_MAP } from '@/renderer/pages/guid/constants';
import dayjs from 'dayjs';
import AcpConfigSelector from '@renderer/components/agent/AcpConfigSelector';
import { getFullAutoMode } from '@renderer/utils/model/agentModes';
import type { TProviderWithModel } from '@/common/config/storage';
import { ConfigStorage } from '@/common/config/storage';
import type { AcpBackendAll, AcpModelInfo, AcpSessionConfigOption, AgentBackend } from '@/common/types/acpTypes';
import { useModelProviderList } from '@renderer/hooks/agent/useModelProviderList';
import GuidModelSelector from '@renderer/pages/guid/components/GuidModelSelector';
import { WorkspaceFolderSelect } from '@renderer/components/workspace';

const FormItem = Form.Item;
const TextArea = Input.TextArea;
const Option = Select.Option;
const OptGroup = Select.OptGroup;

interface CreateTaskDialogProps {
  visible: boolean;
  onClose: () => void;
  /**
   * v0.6.2.6 - pre-fill the Prompt field on create when the dialog opens
   * from a chat. Typically the filtered concat of the chat's user
   * messages from extractCronPromptFromUserMessages. Editable by user.
   */
  initialPrompt?: string;
  /**
   * v0.6.2.6.1 (Gemini G-P-03) - pre-fill Name / schedule when opening
   * from an Edit click on a CronProposeCard. Passed via the
   * `cron.modal.openWithProposal` emitter event from CronJobManager.
   * Each is independent; supplied subset still works.
   */
  initialName?: string;
  initialSchedule?: string;
  initialScheduleDescription?: string;
  /** When provided, the dialog operates in edit mode */
  editJob?: ICronJob;
  conversationId?: string;
  conversationTitle?: string;
  agentType?: string;
  /**
   * When set, the dialog opens in 'From workflow' mode with this slug
   * pre-selected. Used by the Workflows page's Schedule button to route
   * users into the same modal pre-filled with the recipe they picked.
   */
  initialWorkflowSlug?: string;
}

type FrequencyType = 'manual' | 'hourly' | 'daily' | 'weekdays' | 'weekly' | 'custom';
type ExecutionMode = 'new_conversation' | 'existing';
type TaskSource = 'manual' | 'workflow';

const WEEKDAYS = [
  { value: 'MON', label: 'monday' },
  { value: 'TUE', label: 'tuesday' },
  { value: 'WED', label: 'wednesday' },
  { value: 'THU', label: 'thursday' },
  { value: 'FRI', label: 'friday' },
  { value: 'SAT', label: 'saturday' },
  { value: 'SUN', label: 'sunday' },
];

/**
 * Infer frequency type and time/weekday from a cron expression for edit mode.
 * Returns 'custom' for expressions that don't match our preset formats.
 */
function parseCronExpr(expr: string): { frequency: FrequencyType; time: string; weekday: string } {
  if (!expr) return { frequency: 'manual', time: '09:00', weekday: 'MON' };

  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5) return { frequency: 'daily', time: '09:00', weekday: 'MON' };

  const [min, hour, day, month, dow] = parts;

  // Hourly: 0 * * * *
  if (hour === '*' && min === '0' && day === '*' && month === '*' && dow === '*') {
    return { frequency: 'hourly', time: '09:00', weekday: 'MON' };
  }

  // Weekdays: min hour * * MON-FRI
  if (dow === 'MON-FRI' && day === '*' && month === '*') {
    const hh = String(hour).padStart(2, '0');
    const mm = String(min).padStart(2, '0');
    const time = `${hh}:${mm}`;
    return { frequency: 'weekdays', time, weekday: 'MON' };
  }

  // Weekly: min hour * * DAY
  if (dow !== '*' && day === '*' && month === '*') {
    const dayUpper = dow.toUpperCase();
    const matched = WEEKDAYS.find((d) => d.value === dayUpper);
    if (matched) {
      const hh = String(hour).padStart(2, '0');
      const mm = String(min).padStart(2, '0');
      const time = `${hh}:${mm}`;
      return { frequency: 'weekly', time, weekday: dayUpper };
    }
    return { frequency: 'daily', time: '09:00', weekday: 'MON' };
  }

  // Daily: min hour * * * - only if all parts match the expected pattern
  if (day === '*' && month === '*' && dow === '*') {
    // Check if hour and minute are simple numbers (not expressions like */4)
    const hourNum = Number(hour);
    const minNum = Number(min);
    if (!isNaN(hourNum) && !isNaN(minNum) && hourNum >= 0 && hourNum <= 23 && minNum >= 0 && minNum <= 59) {
      const hh = String(hourNum).padStart(2, '0');
      const mm = String(minNum).padStart(2, '0');
      const time = `${hh}:${mm}`;
      return { frequency: 'daily', time, weekday: 'MON' };
    }
  }

  // Custom: any expression that doesn't match our presets
  return { frequency: 'custom', time: '09:00', weekday: 'MON' };
}

function getDescriptionInitialValue(job: ICronJob): string {
  const storedDescription = job.description?.trim();
  if (storedDescription) return storedDescription;
  return '';
}

/**
 * Infer the agent selection key from an ICronJob's agentConfig.
 */
function getAgentKeyFromJob(job: ICronJob): string | undefined {
  const config = job.metadata.agentConfig;
  if (config) {
    if (config.isPreset && config.customAgentId) return `preset:${config.customAgentId}`;
    return `cli:${config.backend}`;
  }
  // Fallback for legacy jobs without agentConfig
  if (job.metadata.agentType) return `cli:${job.metadata.agentType}`;
  return undefined;
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  visible,
  onClose,
  editJob,
  conversationId,
  conversationTitle,
  agentType,
  initialWorkflowSlug,
  initialPrompt,
  initialName,
  initialSchedule,
  initialScheduleDescription,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const { cliAgents, presetAssistants } = useConversationAgents();
  const { providers, getAvailableModels } = useModelProviderList();
  const [frequency, setFrequency] = useState<FrequencyType>('manual');
  const [time, setTime] = useState('09:00');
  const [weekday, setWeekday] = useState('MON');
  const [customCronExpr, setCustomCronExpr] = useState<string>('');

  const isEditMode = !!editJob;
  // v0.6.2.6 - ExecutionMode default depends on context:
  //   - From a chat (conversationId set): NO preselect. Force the user to
  //     pick because "existing" appends to this chat (long-running thread)
  //     vs "new_conversation" creates a fresh chat per fire - meaningfully
  //     different UX, deserves an explicit choice.
  //   - From /scheduled + New Task (no conversationId): default
  //     'new_conversation' since 'existing' makes no sense without a source.
  // Save button gates on executionMode !== null in chat-source mode.
  const initialExecutionMode = useMemo<ExecutionMode | null>(
    () => (conversationId ? null : 'new_conversation'),
    [conversationId]
  );
  const [executionMode, setExecutionMode] = useState<ExecutionMode | null>(initialExecutionMode);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Workflow-source state (step #6 of the Skills/Workflows split): when
  // `taskSource === 'workflow'` the dialog renders a workflow Select above
  // the Name field. Picking a workflow loads its body via skills.getBody
  // and auto-fills name/description/prompt - the user can still tweak
  // each field afterward (no field is locked). `manual` keeps the
  // original 'describe-a-task' UX intact.
  const [taskSource, setTaskSource] = useState<TaskSource>('manual');
  const [workflows, setWorkflows] = useState<SkillIndexEntry[]>([]);
  const [workflowSlug, setWorkflowSlug] = useState<string | null>(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);

  // Advanced settings state
  const [modelId, setModelId] = useState<string | undefined>(undefined);
  const [configOptions, setConfigOptions] = useState<Record<string, string> | undefined>(undefined);
  const [workspace, setWorkspace] = useState<string | undefined>(undefined);
  const [cachedConfigOptions, setCachedConfigOptions] = useState<unknown[] | undefined>(undefined);
  const [acpCachedModelInfo, setAcpCachedModelInfo] = useState<AcpModelInfo | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);

  // Load the workflow list once per modal open - cheap (already cached
  // server-side). Skipped in edit mode since edit operates on a saved
  // cron job, not a workflow recipe.
  useEffect(() => {
    if (!visible || isEditMode) return;
    void ipcBridge.skills.list.invoke({ type: 'workflow' }).then(setWorkflows);
  }, [visible, isEditMode]);

  // Pre-select the workflow when the caller passed `initialWorkflowSlug`
  // (Workflows page → Schedule button). Also flips the source toggle.
  useEffect(() => {
    if (!visible || isEditMode) return;
    if (initialWorkflowSlug) {
      setTaskSource('workflow');
      setWorkflowSlug(initialWorkflowSlug);
    } else {
      setTaskSource('manual');
      setWorkflowSlug(null);
    }
  }, [visible, isEditMode, initialWorkflowSlug]);

  // When a workflow is selected, fetch its body via skills.getBody and
  // auto-fill the form. Best-effort - if the body is unavailable (e.g.
  // a `cli-discovered` workflow whose source disappeared) we still fill
  // name + description from the index entry.
  useEffect(() => {
    if (taskSource !== 'workflow' || !workflowSlug) return;
    const entry = workflows.find((w) => w.name === workflowSlug);
    if (!entry) return;
    setWorkflowLoading(true);
    void ipcBridge.skills.getBody
      .invoke({ name: workflowSlug })
      .then((body) => {
        form.setFieldsValue({
          name: toDisplayName(entry.name),
          description: entry.description,
          prompt: body ?? entry.description,
        });
      })
      .finally(() => setWorkflowLoading(false));
  }, [taskSource, workflowSlug, workflows, form]);

  // Populate form when entering edit mode
  useEffect(() => {
    if (!visible) return;
    if (editJob) {
      const cronExpr = editJob.schedule.kind === 'cron' ? editJob.schedule.expr : '';
      const parsed = parseCronExpr(cronExpr);
      setFrequency(parsed.frequency);
      setTime(parsed.time);
      setWeekday(parsed.weekday);
      setCustomCronExpr(parsed.frequency === 'custom' ? cronExpr : '');
      setExecutionMode(editJob.target.executionMode || 'existing');
      setAdvancedOpen(
        Boolean(
          editJob.metadata.agentConfig?.modelId ||
          editJob.metadata.agentConfig?.workspace ||
          (editJob.metadata.agentConfig?.configOptions &&
            Object.keys(editJob.metadata.agentConfig.configOptions).length > 0)
        )
      );
      const agentKey = getAgentKeyFromJob(editJob);
      setSelectedAgent(agentKey);
      form.setFieldsValue({
        name: editJob.name,
        description: getDescriptionInitialValue(editJob),
        prompt: editJob.target.payload.text,
        agent: agentKey,
      });
      // Populate advanced settings from editJob
      setModelId(editJob.metadata.agentConfig?.modelId);
      setConfigOptions(editJob.metadata.agentConfig?.configOptions);
      setWorkspace(editJob.metadata.agentConfig?.workspace);
    } else {
      form.resetFields();
      setFrequency('manual');
      setTime('09:00');
      setWeekday('MON');
      setCustomCronExpr('');
      setExecutionMode(initialExecutionMode);
      setAdvancedOpen(false);
      setModelId(undefined);
      setConfigOptions(undefined);
      setWorkspace(undefined);
      setSelectedAgent(undefined);

      // v0.6.2.6 smart prefill - when launched from a chat, seed Name from
      // the chat title (truncated for the cron list/sidebar display - full
      // title still goes into prompt context if needed), Description with
      // a scaffold the user can replace, and Prompt with the filtered concat
      // of the chat's user messages (passed by the caller via `initialPrompt`).
      // Each field stays editable; this just removes the typing tax for the
      // common case of "turn this chat I just finished into a daily task."
      //
      // v0.6.2.6.1 (Gemini G-P-03) - also accept initialName, initialSchedule,
      // initialScheduleDescription (passed via cron.modal.openWithProposal
      // emitter event when CronProposeCard Edit fires). initialName wins over
      // the chat-title-derived name; initialSchedule populates the cron
      // frequency UI via parseCronExpr.
      if (conversationId) {
        const seed: Record<string, string> = {};
        const NAME_CAP = 80;
        const truncate = (s: string): string => {
          const clean = s.replace(/\s+/g, ' ').trim();
          return clean.length > NAME_CAP ? `${clean.slice(0, NAME_CAP - 1).trimEnd()}…` : clean;
        };
        if (initialName) {
          seed.name = truncate(initialName);
          // Don't auto-scaffold description when caller already has a proposed
          // name - the proposal flow has its own intent. Let user fill it.
        } else if (conversationTitle) {
          seed.name = truncate(conversationTitle);
          seed.description = t('cron.smartPrefill.descriptionScaffold', { chatTitle: seed.name });
        }
        if (initialPrompt) {
          seed.prompt = initialPrompt;
        }
        if (Object.keys(seed).length > 0) {
          form.setFieldsValue(seed);
        }
        // Seed the frequency UI from the proposed cron expression so the
        // user lands on the same schedule the agent suggested. Falls back
        // to 'custom' if the expression doesn't match a preset.
        if (initialSchedule) {
          const parsed = parseCronExpr(initialSchedule);
          setFrequency(parsed.frequency);
          setTime(parsed.time);
          setWeekday(parsed.weekday);
          if (parsed.frequency === 'custom') {
            setCustomCronExpr(initialSchedule);
          }
        }
      }
    }
  }, [
    visible,
    editJob,
    form,
    initialExecutionMode,
    conversationId,
    conversationTitle,
    initialPrompt,
    initialName,
    initialSchedule,
    initialScheduleDescription,
    t,
  ]);

  // Resolve backend from selectedAgent (handles both CLI and preset agents)
  const resolvedBackend = useMemo(() => {
    if (!selectedAgent) return undefined;
    const colonIdx = selectedAgent.indexOf(':');
    const agentKind = selectedAgent.substring(0, colonIdx);
    const agentId = selectedAgent.substring(colonIdx + 1);

    if (agentKind === 'preset') {
      const agent = presetAssistants.find((a) => a.customAgentId === agentId);
      return agent?.backend;
    }
    // CLI agent: agentId is the backend
    return agentId;
  }, [selectedAgent, presetAssistants]);

  // Load cached config options when backend changes
  useEffect(() => {
    if (!resolvedBackend) {
      setCachedConfigOptions(undefined);
      return;
    }

    ConfigStorage.get('acp.cachedConfigOptions')
      .then((cached) => {
        if (cached && cached[resolvedBackend]) {
          // Filter out model/mode categories - those are handled by dedicated selectors
          const filtered = (cached[resolvedBackend] as Array<{ category?: string }>).filter(
            (opt) => opt.category !== 'model' && opt.category !== 'mode'
          );
          setCachedConfigOptions(filtered as unknown[]);
        } else {
          setCachedConfigOptions(undefined);
        }
      })
      .catch(() => setCachedConfigOptions(undefined));
  }, [resolvedBackend]);

  const isGeminiMode = resolvedBackend === 'gemini' || resolvedBackend === 'wcore';

  // WaylandCLI does not support Google Auth - filter it out (mirrors GuidPage.tsx logic)
  const filteredProviders = useMemo(
    () =>
      resolvedBackend === 'wcore'
        ? providers.filter((p) => !p.platform?.toLowerCase().includes('gemini-with-google-auth'))
        : providers,
    [resolvedBackend, providers]
  );

  // Build Gemini currentModel from modelId for GuidModelSelector
  const geminiCurrentModel = useMemo<TProviderWithModel | undefined>(() => {
    if ((resolvedBackend !== 'gemini' && resolvedBackend !== 'wcore') || !modelId) return undefined;
    for (const p of filteredProviders) {
      if (getAvailableModels(p).includes(modelId)) {
        return { ...p, useModel: modelId } as TProviderWithModel;
      }
    }
    return undefined;
  }, [resolvedBackend, modelId, filteredProviders, getAvailableModels]);

  const handleGeminiModelSelect = useCallback(async (model: TProviderWithModel) => {
    setModelId(model.useModel);
  }, []);

  const handleAcpModelSelect: React.Dispatch<React.SetStateAction<string | null>> = useCallback(
    (action: React.SetStateAction<string | null>) => {
      setModelId((prev) => {
        const next = typeof action === 'function' ? action(prev ?? null) : action;
        return next ?? undefined;
      });
    },
    []
  );

  // Load ACP cached model info when backend changes
  useEffect(() => {
    if (!resolvedBackend || resolvedBackend === 'gemini' || resolvedBackend === 'wcore') {
      setAcpCachedModelInfo(null);
      return;
    }
    ConfigStorage.get('acp.cachedModels')
      .then((cached) => {
        const info = cached?.[resolvedBackend];
        setAcpCachedModelInfo(info?.availableModels?.length ? info : null);
      })
      .catch(() => setAcpCachedModelInfo(null));
  }, [resolvedBackend]);

  // Set default modelId from user preferences when backend changes
  useEffect(() => {
    if (!resolvedBackend || modelId) return;
    if (resolvedBackend === 'gemini') {
      ConfigStorage.get('gemini.defaultModel')
        .then((saved) => {
          const preferred = typeof saved === 'string' ? saved : saved?.useModel;
          if (preferred) setModelId(preferred);
        })
        .catch((err) => console.warn('[CreateTaskDialog.get gemini.defaultModel]', err));
    } else if (resolvedBackend === 'wcore') {
      ConfigStorage.get('wcore.defaultModel')
        .then((saved) => {
          if (saved?.useModel) setModelId(saved.useModel);
        })
        .catch((err) => console.warn('[CreateTaskDialog.get wcore.defaultModel]', err));
    }
  }, [resolvedBackend, modelId]);

  const showTimePicker = frequency === 'daily' || frequency === 'weekdays' || frequency === 'weekly';
  const showWeekdayPicker = frequency === 'weekly';

  // Build cron expression and description from frequency settings
  const scheduleInfo = useMemo(() => {
    const [hour, minute] = time.split(':').map(Number);
    switch (frequency) {
      case 'manual':
        return { expr: '', description: t('cron.page.scheduleDesc.manual') };
      case 'hourly':
        return { expr: '0 * * * *', description: t('cron.page.scheduleDesc.hourly') };
      case 'daily':
        return { expr: `${minute} ${hour} * * *`, description: t('cron.page.scheduleDesc.dailyAt', { time }) };
      case 'weekdays':
        return { expr: `${minute} ${hour} * * MON-FRI`, description: t('cron.page.scheduleDesc.weekdaysAt', { time }) };
      case 'weekly': {
        const dayLabel = WEEKDAYS.find((d) => d.value === weekday)?.label ?? weekday;
        return {
          expr: `${minute} ${hour} * * ${weekday}`,
          description: t('cron.page.scheduleDesc.weeklyAt', { day: t(`cron.page.weekday.${dayLabel}`), time }),
        };
      }
      case 'custom':
        return { expr: customCronExpr, description: editJob?.schedule.description || customCronExpr };
      default:
        return { expr: '', description: '' };
    }
  }, [frequency, time, weekday, t, customCronExpr, editJob]);

  const executionModeOptions = useMemo(
    () => [
      // Ongoing-conversation first per Sean's 2026-05-21 directive -
      // 'existing' is the default, so the radio order mirrors the
      // default state (selected option leftmost).
      {
        value: 'existing' as const,
        label: t('cron.page.form.existingConversation'),
        description: t('cron.detail.executionModeDescriptionExisting'),
      },
      {
        value: 'new_conversation' as const,
        label: t('cron.page.form.newConversation'),
        description: t('cron.detail.executionModeDescriptionNew'),
      },
    ],
    [t]
  );

  // v0.6.2.6 - executionMode can be null when launched from a chat (user
  // must pick before Save is enabled). When null we suppress the option
  // description block and show a "pick first" hint instead.
  const selectedExecutionModeOption = executionMode
    ? (executionModeOptions.find((option) => option.value === executionMode) ?? null)
    : null;
  const showModelSelector = Boolean(resolvedBackend && (isGeminiMode || acpCachedModelInfo));
  const showConfigSelector = resolvedBackend === 'codex';
  const advancedFieldCount = Number(showModelSelector) + Number(showConfigSelector) + 1;

  const handleFrequencyChange = (value: FrequencyType) => {
    setFrequency(value);
    if (value !== 'custom') {
      setCustomCronExpr('');
    }
  };

  const handleAgentChange = useCallback((value: string) => {
    setSelectedAgent(value);
    // Reset model and configOptions when agent changes
    setModelId(undefined);
    setConfigOptions(undefined);
    // Workspace remains unchanged (agent-agnostic)
  }, []);

  const handleWorkspaceClear = useCallback(() => {
    setWorkspace(undefined);
  }, []);

  const handleConfigOptionSelect = useCallback((configId: string, value: string) => {
    setConfigOptions((prev) => ({ ...prev, [configId]: value }));
  }, []);

  const resolveAgentConfig = (agentValue: string) => {
    const colonIdx = agentValue.indexOf(':');
    const agentKind = agentValue.substring(0, colonIdx);
    const agentId = agentValue.substring(colonIdx + 1);

    // Merge cached config option defaults with user overrides
    const mergedConfigOptions = (() => {
      if (!Array.isArray(cachedConfigOptions) || cachedConfigOptions.length === 0) return configOptions;
      const defaults: Record<string, string> = {};
      for (const opt of cachedConfigOptions as AcpSessionConfigOption[]) {
        const val = opt.currentValue || opt.selectedValue;
        if (opt.id && val) defaults[opt.id] = val;
      }
      return Object.keys(defaults).length > 0 ? { ...defaults, ...configOptions } : configOptions;
    })();

    let agentConfig: ICronAgentConfig | undefined;
    let resolvedAgentType: ICreateCronJobParams['agentType'] = (agentType ||
      'claude') as ICreateCronJobParams['agentType'];

    if (agentKind === 'cli') {
      const agent = cliAgents.find((a) => a.backend === agentId);
      if (agent) {
        resolvedAgentType = agent.backend as AcpBackendAll;
        agentConfig = {
          backend: agent.backend as AgentBackend,
          name: agent.name,
          cliPath: agent.cliPath,
          mode: getFullAutoMode(agent.backend),
          modelId,
          configOptions: mergedConfigOptions,
          workspace,
        };
      }
    } else if (agentKind === 'preset') {
      const agent = presetAssistants.find((a) => a.customAgentId === agentId);
      if (agent) {
        resolvedAgentType = agent.backend as AcpBackendAll;
        agentConfig = {
          backend: agent.backend as AgentBackend,
          name: agent.name,
          isPreset: true,
          customAgentId: agent.customAgentId,
          presetAgentType: agent.presetAgentType,
          mode: getFullAutoMode(agent.backend),
          modelId,
          configOptions: mergedConfigOptions,
          workspace,
        };
      }
    }

    return { agentConfig, resolvedAgentType };
  };

  const handleSubmit = async () => {
    try {
      // Defense-in-depth - Save button is gated on executionMode !== null
      // for chat-source mode, but bail early if somehow reached without
      // a mode pick (e.g. programmatic onOk call).
      if (executionMode === null) {
        Message.error(t('cron.detail.executionModePickFirst'));
        return;
      }
      const values = await form.validate();
      setSubmitting(true);

      const scheduleExpr = scheduleInfo.expr;
      const scheduleDesc = scheduleInfo.description;

      const { agentConfig, resolvedAgentType } = resolveAgentConfig(values.agent);

      if (isEditMode) {
        // Edit mode: update existing job
        await ipcBridge.cron.updateJob.invoke({
          jobId: editJob!.id,
          updates: {
            name: values.name,
            description: values.description,
            schedule: { kind: 'cron', expr: scheduleExpr, description: scheduleDesc },
            target: {
              ...editJob!.target,
              payload: { kind: 'message', text: values.prompt },
              executionMode,
            },
            metadata: {
              ...editJob!.metadata,
              agentType: resolvedAgentType,
              agentConfig,
              updatedAt: Date.now(),
            },
          },
        });
        Message.success(t('cron.page.updateSuccess'));
      } else {
        // Create mode
        const params: ICreateCronJobParams = {
          name: values.name,
          description: values.description,
          schedule: { kind: 'cron', expr: scheduleExpr, description: scheduleDesc },
          prompt: values.prompt,
          // v0.6.2.5: pass through the conversationId prop so the per-chat
          // cron pill flow can bind the job to its source chat. The dialog
          // launched from /scheduled "+ New Task" passes undefined here, which
          // falls back to empty string - preserves prior behavior for that path.
          conversationId: conversationId ?? '',
          conversationTitle,
          agentType: resolvedAgentType,
          createdBy: 'user',
          executionMode,
          agentConfig,
        };
        await ipcBridge.cron.addJob.invoke(params);
        Message.success(t('cron.page.createSuccess'));
      }

      onClose();
    } catch (err) {
      if (err instanceof Error) {
        Message.error(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper
      title={isEditMode ? t('cron.page.editTask') : t('cron.page.createTask')}
      visible={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okButtonProps={{ disabled: executionMode === null }}
      okText={t('cron.page.save')}
      cancelText={t('cron.page.cancel')}
      className='w-[min(560px,calc(100vw-32px))] max-w-560px rd-16px'
      unmountOnExit
    >
      <div className='overflow-y-auto px-24px pb-16px pr-18px max-h-[min(68vh,640px)]'>
        <Form form={form} layout='vertical'>
          {/* Source toggle - hidden in edit mode since the saved job is
              already past the "did we start from a workflow?" choice.
              In create mode the two tabs route to the same submit path;
              "From workflow" is just an auto-fill convenience on top of
              the existing manual flow. */}
          {!isEditMode && (
            <FormItem label={t('cron.page.form.source', { defaultValue: 'Source' })} className='mb-12px'>
              <Radio.Group
                type='button'
                value={taskSource}
                onChange={(v: TaskSource) => {
                  setTaskSource(v);
                  if (v === 'manual') setWorkflowSlug(null);
                }}
              >
                <Radio value='manual'>{t('cron.page.form.sourceDescribe', { defaultValue: 'Describe task' })}</Radio>
                <Radio value='workflow'>
                  <span className='inline-flex items-center gap-4px'>
                    <WorkflowIcon size={12} />
                    {t('cron.page.form.sourceFromWorkflow', { defaultValue: 'From workflow' })}
                  </span>
                </Radio>
              </Radio.Group>
            </FormItem>
          )}

          {/* Workflow picker - only shown in "From workflow" mode. Selecting
              a workflow triggers the auto-fill effect above. */}
          {!isEditMode && taskSource === 'workflow' && (
            <FormItem label={t('cron.page.form.workflow', { defaultValue: 'Workflow' })}>
              <Select
                placeholder={t('cron.page.form.workflowPlaceholder', { defaultValue: 'Pick a workflow…' })}
                value={workflowSlug ?? undefined}
                onChange={(v: string) => setWorkflowSlug(v)}
                showSearch
                loading={workflowLoading}
                filterOption={(input, option) => {
                  const label = (option as { props?: { children?: unknown } } | null)?.props?.children;
                  return String(label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase());
                }}
              >
                {workflows.map((w) => (
                  <Option key={w.name} value={w.name}>
                    {toDisplayName(w.name)}
                  </Option>
                ))}
              </Select>
              {workflowSlug && (
                <p className='mb-0 mt-6px text-12px leading-18px text-t-secondary'>
                  {t('cron.page.form.workflowHint', {
                    defaultValue: 'The workflow body becomes the prompt. Tweak any field below before saving.',
                  })}
                </p>
              )}
            </FormItem>
          )}

          <FormItem
            label={t('cron.page.form.name')}
            field='name'
            rules={[{ required: true, message: t('cron.page.form.nameRequired') }]}
          >
            <Input placeholder={t('cron.page.form.namePlaceholder')} />
          </FormItem>

          <FormItem
            label={t('cron.page.form.description')}
            field='description'
            rules={[{ required: true, message: t('cron.page.form.descriptionRequired') }]}
          >
            <Input placeholder={t('cron.page.form.descriptionPlaceholder')} />
          </FormItem>

          <FormItem
            label={t('cron.page.form.agent')}
            field='agent'
            rules={[{ required: true, message: t('cron.page.form.agentRequired') }]}
          >
            <Select
              placeholder={t('cron.page.form.agentPlaceholder')}
              onChange={handleAgentChange}
              renderFormat={(_option, value) => {
                // Find selected agent to render logo + name in the trigger
                const strVal = value as unknown as string;
                if (!strVal) return '';
                const [type, id] = strVal.split(':');
                let name = id;
                let logo: React.ReactNode = <Bot size={16} />;
                if (type === 'cli') {
                  const agent = cliAgents.find((a) => a.backend === id);
                  if (agent) {
                    name = agent.name;
                    const logoSrc = getAgentLogo(agent.backend);
                    if (logoSrc) {
                      logo = <img src={logoSrc} alt={agent.name} className='w-16px h-16px object-contain' />;
                    }
                  }
                } else if (type === 'preset') {
                  const agent = presetAssistants.find((a) => a.customAgentId === id);
                  if (agent) {
                    name = agent.name;
                    const avatarImage = agent.avatar ? CUSTOM_AVATAR_IMAGE_MAP[agent.avatar] : undefined;
                    const isEmoji = agent.avatar && !avatarImage && !agent.avatar.endsWith('.svg');
                    if (avatarImage) {
                      logo = <img src={avatarImage} alt={agent.name} className='w-16px h-16px object-contain' />;
                    } else if (isEmoji) {
                      logo = <span className='text-14px leading-16px'>{agent.avatar}</span>;
                    }
                  }
                }
                return (
                  <div className='flex items-center gap-8px'>
                    {logo}
                    <span>{name}</span>
                  </div>
                );
              }}
            >
              {cliAgents.length > 0 && (
                <OptGroup label={t('conversation.dropdown.cliAgents')}>
                  {cliAgents.map((agent) => {
                    const logo = getAgentLogo(agent.backend);
                    return (
                      <Option key={`cli:${agent.backend}`} value={`cli:${agent.backend}`}>
                        <div className='flex items-center gap-8px'>
                          {logo ? (
                            <img src={logo} alt={agent.name} className='w-16px h-16px object-contain' />
                          ) : (
                            <Bot size={16} />
                          )}
                          <span>{agent.name}</span>
                        </div>
                      </Option>
                    );
                  })}
                </OptGroup>
              )}
              {presetAssistants.length > 0 && (
                <OptGroup label={t('conversation.dropdown.presetAssistants')}>
                  {presetAssistants.map((agent) => {
                    const avatarImage = agent.avatar ? CUSTOM_AVATAR_IMAGE_MAP[agent.avatar] : undefined;
                    const isEmoji = agent.avatar && !avatarImage && !agent.avatar.endsWith('.svg');
                    return (
                      <Option key={`preset:${agent.customAgentId}`} value={`preset:${agent.customAgentId}`}>
                        <div className='flex items-center gap-8px'>
                          {avatarImage ? (
                            <img src={avatarImage} alt={agent.name} className='w-16px h-16px object-contain' />
                          ) : isEmoji ? (
                            <span className='text-14px leading-16px'>{agent.avatar}</span>
                          ) : (
                            <Bot size={16} />
                          )}
                          <span>{agent.name}</span>
                        </div>
                      </Option>
                    );
                  })}
                </OptGroup>
              )}
            </Select>
          </FormItem>

          <FormItem label={t('cron.page.form.executionMode')}>
            <Radio.Group
              value={executionMode}
              onChange={(value) => setExecutionMode(value as ExecutionMode)}
              className='flex flex-wrap items-center gap-20px'
            >
              {executionModeOptions.map((option) => {
                return (
                  <Radio
                    key={option.value}
                    value={option.value}
                    className='m-0 min-w-0 text-14px text-t-secondary cursor-pointer'
                  >
                    <span className='pl-4px text-14px font-medium text-t-primary'>{option.label}</span>
                  </Radio>
                );
              })}
            </Radio.Group>
            <div className='mt-10px rounded-12px border border-solid border-[var(--color-border-2)] bg-fill-2 px-14px py-12px'>
              <p className='m-0 text-12px leading-18px text-t-primary'>
                {selectedExecutionModeOption
                  ? selectedExecutionModeOption.description
                  : t('cron.detail.executionModePickFirst')}
              </p>
            </div>
          </FormItem>

          <FormItem
            label={t('cron.page.form.prompt')}
            field='prompt'
            rules={[{ required: true, message: t('cron.page.form.promptRequired') }]}
          >
            <TextArea placeholder={t('cron.page.form.promptPlaceholder')} autoSize={{ minRows: 3, maxRows: 8 }} />
          </FormItem>

          {/* Frequency */}
          <FormItem label={t('cron.page.form.frequency')}>
            <Select value={frequency} onChange={handleFrequencyChange}>
              <Option value='manual'>{t('cron.page.freq.manual')}</Option>
              <Option value='hourly'>{t('cron.page.freq.hourly')}</Option>
              <Option value='daily'>{t('cron.page.freq.daily')}</Option>
              <Option value='weekdays'>{t('cron.page.freq.weekdays')}</Option>
              <Option value='weekly'>{t('cron.page.freq.weekly')}</Option>
              {frequency === 'custom' && <Option value='custom'>{t('cron.page.freq.custom')}</Option>}
            </Select>
            {frequency === 'custom' && (
              <p className='mb-0 mt-8px text-12px leading-18px text-t-secondary'>
                {t('cron.page.customCronWarning', { expr: customCronExpr })}
              </p>
            )}
          </FormItem>

          {/* Time picker - shown for daily/weekdays/weekly */}
          {showTimePicker && (
            <div className='flex items-center gap-12px mb-16px'>
              <TimePicker
                format='HH:mm'
                value={dayjs(`2000-01-01 ${time}`)}
                onChange={(_timeStr, pickedTime) => {
                  if (pickedTime) {
                    setTime(pickedTime.format('HH:mm'));
                  }
                }}
                allowClear={false}
                className='w-120px'
              />
            </div>
          )}

          {/* Weekday picker - shown for weekly */}
          {showWeekdayPicker && (
            <div className='mb-16px'>
              <Select value={weekday} onChange={setWeekday}>
                {WEEKDAYS.map((d) => (
                  <Option key={d.value} value={d.value}>
                    {t(`cron.page.weekday.${d.label}`)}
                  </Option>
                ))}
              </Select>
            </div>
          )}

          <div className='mt-16px'>
            <Button
              type='text'
              onClick={() => setAdvancedOpen((open) => !open)}
              className='!h-auto !p-0 hover:!bg-transparent'
            >
              <span className='flex items-center gap-6px text-14px font-medium text-t-primary'>
                <ChevronDown
                  size={14}
                  className={`shrink-0 transition-transform ${advancedOpen ? 'rotate-180' : ''}`}
                />
                <span>{t('cron.page.form.advancedSettings')}</span>
              </span>
            </Button>

            {advancedOpen && (
              <div className='mt-12px grid gap-x-16px gap-y-16px md:grid-cols-2'>
                {showModelSelector && (
                  <div className='min-w-0'>
                    <label className='mb-8px block text-14px font-medium text-t-primary'>
                      {t('cron.page.form.model')}
                    </label>
                    <GuidModelSelector
                      isGeminiMode={isGeminiMode}
                      modelList={filteredProviders}
                      currentModel={geminiCurrentModel}
                      setCurrentModel={handleGeminiModelSelect}
                      agentKey={resolvedBackend ?? 'wcore'}
                      currentAcpCachedModelInfo={acpCachedModelInfo}
                      selectedAcpModel={modelId ?? null}
                      setSelectedAcpModel={handleAcpModelSelect}
                    />
                  </div>
                )}

                {showConfigSelector && (
                  <div className='min-w-0'>
                    <label className='mb-8px block text-14px font-medium text-t-primary'>
                      {t('acp.config.reasoning_effort')}
                    </label>
                    <AcpConfigSelector
                      backend={resolvedBackend}
                      compact={false}
                      initialConfigOptions={cachedConfigOptions}
                      onOptionSelect={handleConfigOptionSelect}
                    />
                  </div>
                )}

                <div className={advancedFieldCount === 1 ? 'md:col-span-2' : ''}>
                  <label className='mb-8px block text-14px font-medium text-t-primary'>
                    {t('cron.page.form.workspace')}
                  </label>
                  <WorkspaceFolderSelect
                    value={workspace}
                    onChange={(next) => setWorkspace(next || undefined)}
                    onClear={handleWorkspaceClear}
                    placeholder={t('cron.page.form.selectFolder')}
                    inputPlaceholder={t('cron.page.form.workspacePlaceholder')}
                    recentLabel={t('team.create.recentLabel', { defaultValue: 'Recent' })}
                    chooseDifferentLabel={t('team.create.chooseDifferentFolder', {
                      defaultValue: 'Choose a different folder',
                    })}
                    triggerTestId='cron-workspace-trigger'
                    menuTestId='cron-workspace-menu'
                    menuZIndex={10020}
                  />
                </div>
              </div>
            )}
          </div>
        </Form>
      </div>
    </ModalWrapper>
  );
};

export default CreateTaskDialog;
