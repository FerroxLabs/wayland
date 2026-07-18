/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, FileText, Lock } from 'lucide-react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useWcoreConfig } from '@renderer/hooks/useWcoreConfig';
import WcSwitch from '../components/WcSwitch';
import WcSegmented from '../components/WcSegmented';
import ScopeLabel from '../components/ScopeLabel';
import styles from './Panes.module.css';

/**
 * One engine tool backend. Credential chips declare whether Desktop can
 * actually configure the dependency or can only explain its external setup.
 */
type ToolDef = {
  id: string;
  descKey: string;
  descDefault: string;
  /** Credential state shown by the chip. */
  needsKey?: 'key' | 'auth';
  /** Only this destination is interactive; external setup is explanatory. */
  keySetup?: 'services' | 'external';
  /** Honest external requirement when Services & Keys cannot satisfy it. */
  setupHint?: string;
  /** When the backend's key is already satisfied (e.g. the free web_search default). */
  keySatisfied?: boolean;
  /**
   * The TWO tools whose switch is a REAL registration gate, not the approval
   * posture used by the other curated rows. They write to `[builtin_tools.<gate>] enabled`
   * (config.rs / tools.rs), not to `[tools].allow_list`:
   *  - 'script'  → default OFF (turn on to register the Script tool at all)
   *  - 'repomap' → default ON  (turn off to stop registering RepoMap)
   * Every other switch only changes auto-run vs ask-first. It makes no claim
   * that a credential-gated, MCP, plugin, or version-specific tool is registered.
   */
  gate?: 'script' | 'repomap';
};

type ToolCategory = {
  id: 'file' | 'web' | 'media' | 'data' | 'cloud' | 'prod' | 'agent' | 'system';
  labelKey: string;
  labelDefault: string;
  tools: readonly ToolDef[];
};

/**
 * CURATED Desktop controls for stable built-in tool names. This is not the
 * complete live Core registry: credential-gated tools, MCP tools, plugins and
 * producer-version additions are dynamic and may not be registered in a given
 * session. Every listed `id` is a canonical allow-list name so read/write still
 * round-trips without claiming runtime availability.
 *
 * The auto-run/ask-first STATE is real, read from / written to
 * `config.toml [tools].allow_list`. An absent `allow_list` uses Core's exact
 * curated read-only default below; it does not mean every tool is registered
 * or approved.
 *
 * Credential-gated rows carry either a real Services & Keys deep-link or a
 * non-interactive external-setup explanation. CLI tools
 * (aws_cli/gcloud/kubectl) use their locally configured CLI and carry no chip.
 */
const CATEGORIES: readonly ToolCategory[] = [
  {
    id: 'file',
    labelKey: 'settings.wcoreConfig.tools.catFile',
    labelDefault: 'File & Code',
    tools: [
      { id: 'Read', descKey: 'settings.wcoreConfig.tools.descRead', descDefault: 'Read any file in the workspace' },
      { id: 'Write', descKey: 'settings.wcoreConfig.tools.descWrite', descDefault: 'Create or overwrite files' },
      { id: 'Edit', descKey: 'settings.wcoreConfig.tools.descEdit', descDefault: 'Surgical string-replace edits' },
      { id: 'Glob', descKey: 'settings.wcoreConfig.tools.descGlob', descDefault: 'Find files by pattern' },
      { id: 'Grep', descKey: 'settings.wcoreConfig.tools.descGrep', descDefault: 'Search file contents by regex' },
      { id: 'Bash', descKey: 'settings.wcoreConfig.tools.descBash', descDefault: 'Run shell commands in the sandbox' },
      {
        id: 'Script',
        descKey: 'settings.wcoreConfig.tools.descScript',
        descDefault: 'Run a sandboxed script step (off until you enable it)',
        gate: 'script',
      },
      {
        id: 'RepoMap',
        descKey: 'settings.wcoreConfig.tools.descRepoMap',
        descDefault: 'Map the repository structure & symbols',
        gate: 'repomap',
      },
    ],
  },
  {
    id: 'web',
    labelKey: 'settings.wcoreConfig.tools.catWeb',
    labelDefault: 'Web & Search',
    tools: [
      {
        id: 'web',
        descKey: 'settings.wcoreConfig.tools.descWeb',
        descDefault: 'Search, extract, or crawl the web · free DuckDuckGo default',
        needsKey: 'key',
        keySetup: 'services',
        keySatisfied: true,
      },
      {
        id: 'WebFetch',
        descKey: 'settings.wcoreConfig.tools.descWebFetch',
        descDefault: 'Fetch a URL & read it as clean markdown',
      },
    ],
  },
  {
    id: 'media',
    labelKey: 'settings.wcoreConfig.tools.catMedia',
    labelDefault: 'Vision & Media',
    tools: [
      {
        id: 'vision_analyze',
        descKey: 'settings.wcoreConfig.tools.descVision',
        descDefault: 'Describe & reason over images',
      },
      {
        id: 'image_inspect',
        descKey: 'settings.wcoreConfig.tools.descImageInspect',
        descDefault: 'Inspect image dimensions & metadata',
      },
      {
        id: 'image_generate',
        descKey: 'settings.wcoreConfig.tools.descImageGen',
        descDefault: 'Generate images from a text prompt',
        needsKey: 'key',
        keySetup: 'services',
      },
      {
        id: 'transcribe_audio',
        descKey: 'settings.wcoreConfig.tools.descTranscribe',
        descDefault: 'Transcribe speech to text (Whisper)',
        needsKey: 'key',
        keySetup: 'services',
      },
      {
        id: 'text_to_speech',
        descKey: 'settings.wcoreConfig.tools.descTts',
        descDefault: 'Synthesize speech audio from text',
        needsKey: 'key',
        keySetup: 'services',
      },
      {
        id: 'video_analyze',
        descKey: 'settings.wcoreConfig.tools.descVideo',
        descDefault: 'Sample & analyze video frames',
        needsKey: 'key',
        keySetup: 'external',
        setupHint:
          'Requires a vision-capable model provider configured in Desktop Models; Services & Keys cannot configure it.',
      },
      { id: 'pdf_extract', descKey: 'settings.wcoreConfig.tools.descPdf', descDefault: 'Extract text from PDFs' },
    ],
  },
  {
    id: 'data',
    labelKey: 'settings.wcoreConfig.tools.catData',
    labelDefault: 'Data & Files',
    tools: [
      { id: 'Jsonl', descKey: 'settings.wcoreConfig.tools.descJsonl', descDefault: 'Stream & query large JSON Lines' },
      {
        id: 'sql_query',
        descKey: 'settings.wcoreConfig.tools.descSqlQuery',
        descDefault: 'Run SQL against a local SQLite file',
      },
      {
        id: 'postgres_schema',
        descKey: 'settings.wcoreConfig.tools.descPostgres',
        descDefault: 'Inspect a Postgres schema',
        needsKey: 'key',
        keySetup: 'external',
        setupHint: 'Requires DATABASE_URL, POSTGRES_URL, or PG_CONN_STRING in the Core launch environment.',
      },
      {
        id: 'markdown_table',
        descKey: 'settings.wcoreConfig.tools.descMarkdownTable',
        descDefault: 'Format & align markdown tables',
      },
      { id: 'Archive', descKey: 'settings.wcoreConfig.tools.descArchive', descDefault: 'Inspect & extract archives' },
      {
        id: 'email_parse',
        descKey: 'settings.wcoreConfig.tools.descEmailParse',
        descDefault: 'Parse raw email into headers & body',
      },
    ],
  },
  {
    id: 'cloud',
    labelKey: 'settings.wcoreConfig.tools.catCloud',
    labelDefault: 'Dev & Cloud',
    tools: [
      { id: 'Git', descKey: 'settings.wcoreConfig.tools.descGit', descDefault: 'Stage, commit, branch, diff' },
      {
        id: 'github_api',
        descKey: 'settings.wcoreConfig.tools.descGithub',
        descDefault: 'GitHub PRs, issues, releases',
      },
      {
        id: 'gitlab_api',
        descKey: 'settings.wcoreConfig.tools.descGitlab',
        descDefault: 'GitLab merge requests & pipelines',
        needsKey: 'key',
        keySetup: 'external',
        setupHint: 'Requires external or MCP authentication; Services & Keys cannot configure it.',
      },
      { id: 'kubectl', descKey: 'settings.wcoreConfig.tools.descKubectl', descDefault: 'Inspect & manage Kubernetes' },
      { id: 'aws_cli', descKey: 'settings.wcoreConfig.tools.descAws', descDefault: 'AWS CLI operations' },
      { id: 'gcloud', descKey: 'settings.wcoreConfig.tools.descGcloud', descDefault: 'Google Cloud CLI operations' },
    ],
  },
  {
    id: 'prod',
    labelKey: 'settings.wcoreConfig.tools.catProd',
    labelDefault: 'Productivity',
    tools: [
      {
        id: 'notion_api',
        descKey: 'settings.wcoreConfig.tools.descNotion',
        descDefault: 'Read & write Notion pages',
        needsKey: 'key',
        keySetup: 'external',
        setupHint: 'Requires external or MCP authentication; Services & Keys cannot configure it.',
      },
      {
        id: 'linear_api',
        descKey: 'settings.wcoreConfig.tools.descLinear',
        descDefault: 'Create & update Linear issues',
        needsKey: 'key',
        keySetup: 'external',
        setupHint: 'Requires external or MCP authentication; Services & Keys cannot configure it.',
      },
      {
        id: 'discord_server',
        descKey: 'settings.wcoreConfig.tools.descDiscord',
        descDefault: 'Manage a Discord server & channels',
        needsKey: 'key',
        keySetup: 'external',
        setupHint: 'Requires external or MCP authentication; Services & Keys cannot configure it.',
      },
      {
        id: 'homeassistant',
        descKey: 'settings.wcoreConfig.tools.descHass',
        descDefault: 'Control smart-home devices',
        needsKey: 'key',
        keySetup: 'external',
        setupHint: 'Requires HASS_URL and HASS_TOKEN in the Core launch environment.',
      },
      {
        id: 'send_message',
        descKey: 'settings.wcoreConfig.tools.descSendMessage',
        descDefault: 'Send messages to a connected channel',
      },
      {
        id: 'cronjob',
        descKey: 'settings.wcoreConfig.tools.descCron',
        descDefault: 'Schedule recurring agent runs',
      },
    ],
  },
  {
    id: 'agent',
    labelKey: 'settings.wcoreConfig.tools.catAgent',
    labelDefault: 'Agent & Planning',
    tools: [
      {
        id: 'Spawn',
        descKey: 'settings.wcoreConfig.tools.descSpawn',
        descDefault: 'Spawn named sub-agents for parallel work',
      },
      {
        id: 'Delegate',
        descKey: 'settings.wcoreConfig.tools.descDelegate',
        descDefault: 'Delegate a focused single task or batch',
      },
      {
        id: 'Workflow',
        descKey: 'settings.wcoreConfig.tools.descWorkflow',
        descDefault: 'Run a multi-stage dynamic workflow',
      },
      { id: 'todo', descKey: 'settings.wcoreConfig.tools.descTodo', descDefault: 'Track multi-step task progress' },
      {
        id: 'clarify',
        descKey: 'settings.wcoreConfig.tools.descClarify',
        descDefault: 'Ask the user a clarifying question',
      },
      {
        id: 'AskUserQuestion',
        descKey: 'settings.wcoreConfig.tools.descAskUser',
        descDefault: 'Ask the user a structured multi-choice question',
      },
      {
        id: 'EnterPlanMode',
        descKey: 'settings.wcoreConfig.tools.descEnterPlan',
        descDefault: 'Enter read-only plan mode',
      },
      {
        id: 'ExitPlanMode',
        descKey: 'settings.wcoreConfig.tools.descExitPlan',
        descDefault: 'Exit plan mode & begin executing',
      },
    ],
  },
  {
    id: 'system',
    labelKey: 'settings.wcoreConfig.tools.catSystem',
    labelDefault: 'Wayland & Memory',
    tools: [
      {
        id: 'ToolSearch',
        descKey: 'settings.wcoreConfig.tools.descToolSearch',
        descDefault: 'Search the tool catalogue by intent',
      },
      { id: 'Skill', descKey: 'settings.wcoreConfig.tools.descSkill', descDefault: 'Run an installed skill' },
      {
        id: 'session_search',
        descKey: 'settings.wcoreConfig.tools.descSessionSearch',
        descDefault: 'Search past sessions & transcripts',
      },
      {
        id: 'record_episode',
        descKey: 'settings.wcoreConfig.tools.descRecordEpisode',
        descDefault: 'Store a durable memory episode',
      },
      {
        id: 'assert_fact',
        descKey: 'settings.wcoreConfig.tools.descAssertFact',
        descDefault: 'Store a durable fact in memory',
      },
      {
        id: 'wayland_status',
        descKey: 'settings.wcoreConfig.tools.descWaylandStatus',
        descDefault: 'Read live session status & token usage',
      },
      {
        id: 'wayland_telemetry_query',
        descKey: 'settings.wcoreConfig.tools.descWaylandTelemetry',
        descDefault: 'Query per-tool call counts & telemetry',
      },
    ],
  },
];

/**
 * The engine's `[tools].allow_list` default (config.rs `default_allow_list`):
 * the read-only, safe-to-auto-run tools. When the `allow_list` key is ABSENT
 * from config.toml, the engine seeds exactly these - NOT "every tool" - so the
 * UI must seed the same set, or it would imply tools auto-run that actually ask.
 */
const DEFAULT_ALLOW_LIST: readonly string[] = [
  'Read',
  'Grep',
  'Glob',
  'web',
  'WebFetch',
  'vision_analyze',
  'transcribe_audio',
  'ToolSearch',
  'Skill',
  'wayland_status',
  'wayland_telemetry_query',
];

type ApprovalMode = 'default' | 'auto-edit' | 'force';

const AUTO_EDIT_TOOL_IDS = new Set(['Write', 'Edit']);

type FilterKey = 'all' | ToolCategory['id'];

type ToolsPaneProps = {
  /** Deep-link to the Services & Keys pane (for needs-key chips). */
  onGoServices: () => void;
};

type ToolsTruth = {
  autoRun: Set<string>;
  scriptOn: boolean;
  repomapOn: boolean;
  mode: ApprovalMode;
};

const ToolsPane: React.FC<ToolsPaneProps> = ({ onGoServices }) => {
  const { t } = useTranslation();
  const { getSection, patchField } = useWcoreConfig();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [truth, setTruth] = useState<ToolsTruth | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(false);
  const readVersion = useRef(0);
  const writeVersion = useRef(0);

  const refresh = useCallback(
    async (showLoading = true): Promise<void> => {
      const version = ++readVersion.current;
      if (showLoading) setLoading(true);
      try {
        const [tools, builtin, def] = await Promise.all([
          getSection<{ allow_list?: unknown }>('tools'),
          getSection<{ script?: { enabled?: unknown }; repomap?: { enabled?: unknown } }>('builtin_tools'),
          getSection<{ approval_mode?: unknown }>('default'),
        ]);
        const list = tools?.allow_list;
        if (list !== undefined && (!Array.isArray(list) || list.some((item) => typeof item !== 'string'))) {
          throw new Error('Core returned an invalid tools.allow_list.');
        }
        const script = builtin?.script?.enabled;
        const repomap = builtin?.repomap?.enabled;
        if (script !== undefined && typeof script !== 'boolean')
          throw new Error('Core returned an invalid Script gate.');
        if (repomap !== undefined && typeof repomap !== 'boolean')
          throw new Error('Core returned an invalid RepoMap gate.');
        const approval = def?.approval_mode;
        if (approval !== undefined && !['default', 'auto-edit', 'force'].includes(String(approval))) {
          throw new Error('Core returned an invalid approval mode.');
        }
        if (mounted.current && readVersion.current === version) {
          setTruth({
            autoRun: new Set(Array.isArray(list) ? (list as string[]) : DEFAULT_ALLOW_LIST),
            scriptOn: (script as boolean | undefined) ?? false,
            repomapOn: (repomap as boolean | undefined) ?? true,
            mode: (approval as ApprovalMode | undefined) ?? 'default',
          });
          setError(null);
        }
      } catch (readError) {
        if (mounted.current && readVersion.current === version) {
          setTruth(null);
          setError(readError instanceof Error ? readError.message : String(readError));
        }
      } finally {
        if (mounted.current && readVersion.current === version) setLoading(false);
      }
    },
    [getSection]
  );

  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => {
      mounted.current = false;
      readVersion.current += 1;
      writeVersion.current += 1;
    };
  }, [refresh]);

  const persist = useCallback(
    async (patch: Parameters<typeof patchField>[0]): Promise<void> => {
      if (!truth || saving) return;
      const version = ++writeVersion.current;
      setSaving(true);
      setError(null);
      let failure: string | null = null;
      try {
        const result = await patchField(patch);
        if (!mounted.current || writeVersion.current !== version) return;
        if (!result.ok) failure = 'error' in result ? result.error : 'Tool setting could not be saved.';
        await refresh(false);
      } catch (writeError) {
        if (mounted.current && writeVersion.current === version) {
          failure = writeError instanceof Error ? writeError.message : String(writeError);
          await refresh(false);
        }
      } finally {
        if (mounted.current && writeVersion.current === version) {
          if (failure) setError(failure);
          setSaving(false);
        }
      }
    },
    [patchField, refresh, saving, truth]
  );

  const toggleAutoRun = useCallback(
    (id: string): void => {
      if (!truth || saving) return;
      const next = new Set(truth.autoRun);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      void persist({ section: 'tools', field: 'allow_list', value: Array.from(next).toSorted() });
    },
    [persist, saving, truth]
  );

  const toggleGate = useCallback(
    (gate: 'script' | 'repomap'): void => {
      if (!truth || saving) return;
      const next = gate === 'script' ? !truth.scriptOn : !truth.repomapOn;
      void persist({ section: 'builtin_tools', field: `${gate}.enabled`, value: next });
    },
    [persist, saving, truth]
  );

  const changeMode = useCallback(
    (next: ApprovalMode): void => {
      if (!truth || saving) return;
      void persist({ section: 'default', field: 'approval_mode', value: next });
    },
    [persist, saving, truth]
  );

  const filters = useMemo(
    () =>
      [
        { value: 'all', label: t('settings.wcoreConfig.tools.filterAll', { defaultValue: 'All' }) },
        ...CATEGORIES.map((c) => ({ value: c.id, label: t(c.labelKey, { defaultValue: c.labelDefault }) })),
      ] as const,
    [t]
  );

  const modeOptions = useMemo(
    () =>
      [
        { value: 'default', label: t('settings.wcoreConfig.tools.modeDefault', { defaultValue: 'Ask first' }) },
        { value: 'auto-edit', label: t('settings.wcoreConfig.tools.modeAutoEdit', { defaultValue: 'Auto-edit' }) },
        { value: 'force', label: t('settings.wcoreConfig.tools.modeForce', { defaultValue: 'Force' }) },
      ] as const,
    [t]
  );

  const visibleCats = filter === 'all' ? CATEGORIES : CATEGORIES.filter((c) => c.id === filter);
  const auto = truth?.autoRun;

  // Gates use their real registration state. Posture rows mirror Core's exact
  // approval semantics: Force overrides every registered tool, AutoEdit
  // overrides only the built-in Write/Edit tools, and allow_list applies in all
  // other cases.
  const isToolOn = (tool: ToolDef): boolean => {
    if (!truth || !auto) return false;
    if (tool.gate === 'script') return truth.scriptOn;
    if (tool.gate === 'repomap') return truth.repomapOn;
    if (truth.mode === 'force') return true;
    if (truth.mode === 'auto-edit' && AUTO_EDIT_TOOL_IDS.has(tool.id)) return true;
    return auto.has(tool.id);
  };

  const toolModeOverride = (tool: ToolDef): ApprovalMode | null => {
    if (!truth || tool.gate) return null;
    if (truth.mode === 'force') return 'force';
    if (truth.mode === 'auto-edit' && AUTO_EDIT_TOOL_IDS.has(tool.id)) return 'auto-edit';
    return null;
  };

  const modeHint =
    truth?.mode === 'force'
      ? t('settings.wcoreConfig.tools.modeHintForce', {
          defaultValue:
            'Force: every registered non-gate tool auto-runs. Script and RepoMap registration gates remain independent.',
        })
      : truth?.mode === 'auto-edit'
        ? t('settings.wcoreConfig.tools.modeHintAutoEdit', {
            defaultValue:
              'Auto-edit: the built-in Write and Edit tools auto-run; every other tool follows its per-tool setting.',
          })
        : t('settings.wcoreConfig.tools.modeHintDefault', {
            defaultValue: 'Ask first: tools below marked “Auto-runs” skip the prompt; the rest ask before acting.',
          });

  return (
    <div className={styles.pane}>
      <div className={styles.head}>
        <div className={styles.eyebrow}>Wayland Core</div>
        <h1 className={styles.title}>{t('settings.wcoreConfig.rail.tools', { defaultValue: 'Tools' })}</h1>
        <p className={styles.sub}>
          {t('settings.wcoreConfig.tools.subtitle', {
            defaultValue:
              'Approval defaults for a curated set of stable Core tools. A switch controls auto-run versus ask-first; it does not prove that a credential-gated, MCP, plugin, voice, or version-specific tool is registered in this session. Script and RepoMap are explicit registration gates.',
          })}
        </p>
        <ScopeLabel />
      </div>

      {loading ? (
        <div className={styles.runtimeTruthLoading} role='status'>
          {t('settings.wcoreConfig.tools.loading', { defaultValue: 'Reading authoritative tool settings…' })}
        </div>
      ) : error || !truth ? (
        <div className={styles.runtimeTruthError} role='alert'>
          {t('settings.wcoreConfig.tools.readError', {
            defaultValue: 'Tool settings are unknown. Writes are disabled until Core can be read:',
          })}{' '}
          {error}
        </div>
      ) : (
        <>
          {/* Global approval posture - the master control over every per-tool row. */}
          <div className={styles.modeBar} aria-busy={saving}>
            <span className={styles.modeBarLabel}>
              {t('settings.wcoreConfig.tools.modeLabel', { defaultValue: 'Approval mode' })}
            </span>
            <WcSegmented
              options={modeOptions}
              value={truth.mode}
              onChange={(v) => changeMode(v as ApprovalMode)}
              label={t('settings.wcoreConfig.tools.modeAria', { defaultValue: 'Default tool approval mode' })}
            />
          </div>
          <div className={styles.modeHint}>{modeHint}</div>
          {saving ? (
            <div className={styles.runtimeTruthLoading} role='status'>
              {t('settings.wcoreConfig.tools.saving', { defaultValue: 'Saving and re-reading Core settings…' })}
            </div>
          ) : null}
        </>
      )}

      <div style={{ marginBottom: 8 }}>
        <WcSegmented
          options={filters}
          value={filter}
          onChange={(v) => setFilter(v as FilterKey)}
          label={t('settings.wcoreConfig.tools.filterLabel', { defaultValue: 'Filter tools by category' })}
        />
      </div>

      {truth && auto
        ? visibleCats.map((cat) => {
            const autoCount = cat.tools.filter((tool) => !tool.gate && isToolOn(tool)).length;
            const postureTotal = cat.tools.filter((tool) => !tool.gate).length;
            return (
              <div key={cat.id} className={styles.toolCat}>
                <div className={styles.toolCatLabel}>
                  {t(cat.labelKey, { defaultValue: cat.labelDefault })}
                  <span className={styles.toolCatCount}>
                    {t('settings.wcoreConfig.tools.catCount', {
                      defaultValue: '{{total}} tools · {{on}} auto-run',
                      total: cat.tools.length,
                      on: `${autoCount}/${postureTotal}`,
                    })}
                  </span>
                </div>
                <div className={styles.group}>
                  {cat.tools.map((tool) => {
                    const on = isToolOn(tool);
                    const isGate = !!tool.gate;
                    const modeOverride = toolModeOverride(tool);
                    return (
                      <div key={tool.id} className={styles.toolRow}>
                        <div>
                          <div className={styles.toolName}>
                            {tool.id}
                            {isGate && (
                              <span className={styles.gateChip}>
                                {t('settings.wcoreConfig.tools.chipGate', { defaultValue: 'on/off gate' })}
                              </span>
                            )}
                            {tool.needsKey &&
                              (tool.keySetup === 'services' ? (
                                <span
                                  role='button'
                                  tabIndex={0}
                                  onClick={onGoServices}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      onGoServices();
                                    }
                                  }}
                                  className={classNames(styles.chipKey, tool.keySatisfied && styles.ok)}
                                  aria-label={t('settings.wcoreConfig.tools.configureCredentialAria', {
                                    defaultValue: 'Configure {{tool}} in Services & Keys',
                                    tool: tool.id,
                                  })}
                                >
                                  {tool.keySatisfied ? <Check size={9} /> : <Lock size={9} />}
                                  {tool.keySatisfied
                                    ? t('settings.wcoreConfig.tools.chipOnDdg', { defaultValue: 'on · DuckDuckGo' })
                                    : tool.needsKey === 'auth'
                                      ? t('settings.wcoreConfig.tools.chipNeedsAuth', { defaultValue: 'needs auth' })
                                      : t('settings.wcoreConfig.tools.chipNeedsKey', { defaultValue: 'needs key' })}
                                </span>
                              ) : (
                                <span className={styles.chipKey} title={tool.setupHint} aria-label={tool.setupHint}>
                                  <Lock size={9} />
                                  {t('settings.wcoreConfig.tools.chipExternalSetup', {
                                    defaultValue: 'external setup',
                                  })}
                                </span>
                              ))}
                          </div>
                          <div className={styles.toolDesc}>{t(tool.descKey, { defaultValue: tool.descDefault })}</div>
                        </div>
                        <div className={styles.toolCtrl}>
                          <span className={classNames(styles.posture, on ? styles.postureAuto : styles.postureAsk)}>
                            {isGate
                              ? on
                                ? t('settings.wcoreConfig.tools.stateEnabled', { defaultValue: 'Enabled' })
                                : t('settings.wcoreConfig.tools.stateOff', { defaultValue: 'Off' })
                              : on
                                ? modeOverride === 'force'
                                  ? t('settings.wcoreConfig.tools.stateAutoRunsForce', {
                                      defaultValue: 'Auto-runs · Force',
                                    })
                                  : modeOverride === 'auto-edit'
                                    ? t('settings.wcoreConfig.tools.stateAutoRunsAutoEdit', {
                                        defaultValue: 'Auto-runs · Auto-edit',
                                      })
                                    : t('settings.wcoreConfig.tools.stateAutoRuns', { defaultValue: 'Auto-runs' })
                                : t('settings.wcoreConfig.tools.stateAsksFirst', { defaultValue: 'Asks first' })}
                          </span>
                          <WcSwitch
                            size='xs'
                            checked={on}
                            disabled={saving || modeOverride !== null}
                            onChange={() => (isGate ? toggleGate(tool.gate!) : toggleAutoRun(tool.id))}
                            label={
                              isGate
                                ? t('settings.wcoreConfig.tools.gateAria', {
                                    defaultValue: 'Enable {{tool}}',
                                    tool: tool.id,
                                  })
                                : t('settings.wcoreConfig.tools.autoRunAria', {
                                    defaultValue: 'Auto-run {{tool}} without asking',
                                    tool: tool.id,
                                  })
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        : null}

      <div className={styles.scopeLabel} style={{ marginTop: 20 }}>
        <FileText size={13} />
        {t('settings.wcoreConfig.tools.catalogTruthNote', {
          defaultValue:
            'These curated switches set auto-run vs ask-first ([tools].allow_list); they do not prove a tool is registered. Script and RepoMap write their real on/off gate. Settings are read from and written to your config.toml.',
        })}
      </div>
    </div>
  );
};

export default ToolsPane;
