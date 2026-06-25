/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, FileText, Lock } from 'lucide-react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useWcoreConfig } from '@renderer/hooks/useWcoreConfig';
import WcSwitch from '../components/WcSwitch';
import WcSegmented from '../components/WcSegmented';
import ScopeLabel from '../components/ScopeLabel';
import styles from './Panes.module.css';

/**
 * One engine tool backend. `needsKey` marks a tool whose backend requires a
 * credential set under Services & Keys; `keyState` lets the chip show "on" once
 * a key is present (representative here; see CATALOG note below).
 */
type ToolDef = {
  id: string;
  descKey: string;
  descDefault: string;
  /** Shows a "needs key / needs auth" chip that deep-links to Services & Keys. */
  needsKey?: 'key' | 'auth';
  /** When the backend's key is already satisfied (e.g. the free web_search default). */
  keySatisfied?: boolean;
  /**
   * The TWO tools whose switch is a REAL registration gate, not the auto-approve
   * posture every other tool uses. They write to `[builtin_tools.<gate>] enabled`
   * (config.rs / tools.rs), not to `[tools].allow_list`:
   *  - 'script'  → default OFF (turn on to register the Script tool at all)
   *  - 'repomap' → default ON  (turn off to stop registering RepoMap)
   * Every other tool is ALWAYS registered; its switch only flips whether it
   * auto-runs or asks for approval first.
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
 * AUTHORITATIVE engine tool catalogue, mirroring the Wayland Core v0.11.0
 * built-in registry assembled in `wcore-agent/src/bootstrap.rs`. Every `id`
 * here is the EXACT canonical tool name the engine registers (the string a
 * tool returns from `fn name()`), so the allow_list read/write round-trips
 * correctly: an enabled tool renders ON and toggling writes the right name.
 *
 * The enable/disable STATE is real, read from / written to
 * `config.toml [tools].allow_list`. An empty/absent `allow_list` means
 * "all tools on" (engine default), so the UI seeds every tool on until the
 * user revokes one.
 *
 * `needsKey` reflects the engine's conditional registration: tools the engine
 * gates on an env var / credential (and hides via `is_available()` when it's
 * absent) carry a chip. CLI tools (aws_cli/gcloud/kubectl) shell out to a
 * locally-configured CLI rather than an engine key, so they carry no chip.
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
      },
      {
        id: 'transcribe_audio',
        descKey: 'settings.wcoreConfig.tools.descTranscribe',
        descDefault: 'Transcribe speech to text (Whisper)',
        needsKey: 'key',
      },
      {
        id: 'text_to_speech',
        descKey: 'settings.wcoreConfig.tools.descTts',
        descDefault: 'Synthesize speech audio from text',
        needsKey: 'key',
      },
      {
        id: 'video_analyze',
        descKey: 'settings.wcoreConfig.tools.descVideo',
        descDefault: 'Sample & analyze video frames',
        needsKey: 'key',
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
      { id: 'github_api', descKey: 'settings.wcoreConfig.tools.descGithub', descDefault: 'GitHub PRs, issues, releases' },
      {
        id: 'gitlab_api',
        descKey: 'settings.wcoreConfig.tools.descGitlab',
        descDefault: 'GitLab merge requests & pipelines',
        needsKey: 'key',
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
      },
      {
        id: 'linear_api',
        descKey: 'settings.wcoreConfig.tools.descLinear',
        descDefault: 'Create & update Linear issues',
        needsKey: 'key',
      },
      {
        id: 'discord_server',
        descKey: 'settings.wcoreConfig.tools.descDiscord',
        descDefault: 'Manage a Discord server & channels',
        needsKey: 'key',
      },
      {
        id: 'homeassistant',
        descKey: 'settings.wcoreConfig.tools.descHass',
        descDefault: 'Control smart-home devices',
        needsKey: 'key',
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

type FilterKey = 'all' | ToolCategory['id'];

type ToolsPaneProps = {
  /** Deep-link to the Services & Keys pane (for needs-key chips). */
  onGoServices: () => void;
};

const ToolsPane: React.FC<ToolsPaneProps> = ({ onGoServices }) => {
  const { t } = useTranslation();
  const { getSection, setSection } = useWcoreConfig();
  const [filter, setFilter] = useState<FilterKey>('all');
  // Auto-approve posture: a Set of tool ids that auto-run (are in allow_list).
  // Everything NOT in this set asks for approval first. `null` until loaded.
  const [autoRun, setAutoRun] = useState<Set<string> | null>(null);
  // Real registration gates (builtin_tools.*). Engine defaults: script off,
  // repomap on. `null` until loaded.
  const [scriptOn, setScriptOn] = useState<boolean | null>(null);
  const [repomapOn, setRepomapOn] = useState<boolean | null>(null);
  // Global approval posture (`[default].approval_mode`). Master control.
  const [mode, setMode] = useState<ApprovalMode>('default');

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      getSection<{ allow_list?: string[] }>('tools'),
      getSection<{ script?: { enabled?: boolean }; repomap?: { enabled?: boolean } }>('builtin_tools'),
      getSection<{ approval_mode?: ApprovalMode }>('default'),
    ]).then(([tools, builtin, def]) => {
      if (cancelled) return;
      const list = tools?.allow_list;
      // The KEY being present (even as an empty array) is an explicit posture;
      // only an ABSENT key falls back to the engine default allow-list.
      setAutoRun(new Set(Array.isArray(list) ? list : DEFAULT_ALLOW_LIST));
      setScriptOn(builtin?.script?.enabled ?? false);
      setRepomapOn(builtin?.repomap?.enabled ?? true);
      setMode(def?.approval_mode ?? 'default');
    });
    return () => {
      cancelled = true;
    };
  }, [getSection]);

  // Persist the auto-approve allow_list, merging so unknown engine keys
  // (auto_approve, skills, ...) survive the round-trip.
  const persistAutoRun = useCallback(
    (next: Set<string>): void => {
      void getSection<Record<string, unknown>>('tools').then((prev) => {
        void setSection('tools', { ...prev, allow_list: Array.from(next).toSorted() });
      });
    },
    [getSection, setSection]
  );

  // Persist a registration gate (builtin_tools.script / .repomap), merging the
  // OTHER gate + any unknown keys so a single toggle never drops the sibling.
  const persistGate = useCallback(
    (gate: 'script' | 'repomap', enabled: boolean): void => {
      void getSection<Record<string, unknown>>('builtin_tools').then((prev) => {
        const base = prev ?? {};
        const prevGate = (base[gate] as Record<string, unknown> | undefined) ?? {};
        void setSection('builtin_tools', { ...base, [gate]: { ...prevGate, enabled } });
      });
    },
    [getSection, setSection]
  );

  const toggleAutoRun = useCallback(
    (id: string): void => {
      setAutoRun((cur) => {
        const next = new Set(cur ?? DEFAULT_ALLOW_LIST);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        persistAutoRun(next);
        return next;
      });
    },
    [persistAutoRun]
  );

  const toggleGate = useCallback(
    (gate: 'script' | 'repomap'): void => {
      const setter = gate === 'script' ? setScriptOn : setRepomapOn;
      setter((cur) => {
        const fallback = gate === 'repomap';
        const nextVal = !(cur ?? fallback);
        persistGate(gate, nextVal);
        return nextVal;
      });
    },
    [persistGate]
  );

  const changeMode = useCallback(
    (next: ApprovalMode): void => {
      setMode(next);
      void getSection<Record<string, unknown>>('default').then((prev) => {
        void setSection('default', { ...prev, approval_mode: next });
      });
    },
    [getSection, setSection]
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
  const auto = autoRun ?? new Set<string>(DEFAULT_ALLOW_LIST);

  // Is a given tool ON? Gates use their real registration state; everything else
  // is "ON" when it auto-runs (is in the allow_list).
  const isToolOn = (tool: ToolDef): boolean => {
    if (tool.gate === 'script') return scriptOn ?? false;
    if (tool.gate === 'repomap') return repomapOn ?? true;
    return auto.has(tool.id);
  };

  const modeHint =
    mode === 'force'
      ? t('settings.wcoreConfig.tools.modeHintForce', {
          defaultValue: 'Force: every tool auto-runs, ignoring the per-tool settings below.',
        })
      : mode === 'auto-edit'
        ? t('settings.wcoreConfig.tools.modeHintAutoEdit', {
            defaultValue: 'Auto-edit: read and edit tools auto-run; commands and sends still ask first.',
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
              'Every tool is always available to the engine. These switches set whether a tool auto-runs or asks for approval first - they do not turn tools off. Script and RepoMap are the only real on/off gates. Tools that need a credential link straight to where you set it.',
          })}
        </p>
        <ScopeLabel />
      </div>

      {/* Global approval posture - the master control over every per-tool row. */}
      <div className={styles.modeBar}>
        <span className={styles.modeBarLabel}>
          {t('settings.wcoreConfig.tools.modeLabel', { defaultValue: 'Approval mode' })}
        </span>
        <WcSegmented
          options={modeOptions}
          value={mode}
          onChange={(v) => changeMode(v as ApprovalMode)}
          label={t('settings.wcoreConfig.tools.modeAria', { defaultValue: 'Default tool approval mode' })}
        />
      </div>
      <div className={styles.modeHint}>{modeHint}</div>

      <div style={{ marginBottom: 8 }}>
        <WcSegmented
          options={filters}
          value={filter}
          onChange={(v) => setFilter(v as FilterKey)}
          label={t('settings.wcoreConfig.tools.filterLabel', { defaultValue: 'Filter tools by category' })}
        />
      </div>

      {visibleCats.map((cat) => {
        const autoCount = cat.tools.filter((tool) => !tool.gate && auto.has(tool.id)).length;
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
                          (tool.keySatisfied ? (
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
                              className={classNames(styles.chipKey, styles.ok)}
                            >
                              <Check size={9} />
                              {t('settings.wcoreConfig.tools.chipOnDdg', { defaultValue: 'on · DuckDuckGo' })}
                            </span>
                          ) : (
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
                              className={styles.chipKey}
                            >
                              <Lock size={9} />
                              {tool.needsKey === 'auth'
                                ? t('settings.wcoreConfig.tools.chipNeedsAuth', { defaultValue: 'needs auth' })
                                : t('settings.wcoreConfig.tools.chipNeedsKey', { defaultValue: 'needs key' })}
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
                            ? t('settings.wcoreConfig.tools.stateAutoRuns', { defaultValue: 'Auto-runs' })
                            : t('settings.wcoreConfig.tools.stateAsksFirst', { defaultValue: 'Asks first' })}
                      </span>
                      <WcSwitch
                        size='xs'
                        checked={on}
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
      })}

      <div className={styles.scopeLabel} style={{ marginTop: 20 }}>
        <FileText size={13} />
        {t('settings.wcoreConfig.tools.catalogNote', {
          defaultValue:
            'Tools always run; these switches only set auto-run vs ask-first ([tools].allow_list). Script and RepoMap write their real on/off gate. All read from and written to your config.toml.',
        })}
      </div>
    </div>
  );
};

export default ToolsPane;
