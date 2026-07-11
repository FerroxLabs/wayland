import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Drawer, Input, Message, Spin, Switch, Tabs, Tag, Tooltip } from '@arco-design/web-react';
import {
  Bot,
  Braces,
  ExternalLink,
  FileCode2,
  FolderOpen,
  LifeBuoy,
  Package,
  Palette,
  PanelTop,
  Plug,
  Puzzle,
  RefreshCw,
  Server,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
  TerminalSquare,
  Wrench,
} from 'lucide-react';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';
import { Card, EmptyState } from '@renderer/components/settings/shared';
import {
  extensions as extensionsIpc,
  type IExtensionBuilderCreateResult,
  type IExtensionBuilderDraftResult,
  type IExtensionBuilderMessage,
  type IExtensionBuilderPlan,
  type IExtensionInfo,
  type IExtensionPermissionSummary,
} from '@/common/adapter/ipcBridge';
import { useNavigate } from 'react-router-dom';

type CapabilityKey = keyof IExtensionInfo['contributes'];

type CapabilityMeta = {
  key: CapabilityKey;
  label: string;
  icon: React.ReactElement;
};

type BuilderPlan = IExtensionBuilderPlan;
type BuilderMessage = IExtensionBuilderMessage;
type MigrationStatus = 'ready' | 'review' | 'blocked' | 'core';

const ADVANCED_MODE_STORAGE_KEY = 'wayland.extensions.advancedMode';

type MigrationCandidate = {
  id: string;
  name: string;
  summary: string;
  target: string;
  status: MigrationStatus;
  reason: string;
  suggestedPrompt?: string;
};

const CAPABILITIES: CapabilityMeta[] = [
  { key: 'mcpServers', label: 'MCP', icon: <Server size={14} /> },
  { key: 'assistants', label: 'Assistants', icon: <Bot size={14} /> },
  { key: 'agents', label: 'Agents', icon: <Bot size={14} /> },
  { key: 'skills', label: 'Skills', icon: <Wrench size={14} /> },
  { key: 'settingsTabs', label: 'Settings Tabs', icon: <Settings size={14} /> },
  { key: 'webuiApiRoutes', label: 'WebUI APIs', icon: <Braces size={14} /> },
  { key: 'webuiStaticAssets', label: 'WebUI Assets', icon: <PanelTop size={14} /> },
  { key: 'themes', label: 'Themes', icon: <Palette size={14} /> },
  { key: 'acpAdapters', label: 'ACP', icon: <TerminalSquare size={14} /> },
  { key: 'channelPlugins', label: 'Channels', icon: <Plug size={14} /> },
  { key: 'modelProviders', label: 'Models', icon: <Package size={14} /> },
];

const MIGRATION_CANDIDATES: MigrationCandidate[] = [
  {
    id: 'research-connectors',
    name: 'Research Connectors',
    summary: 'Letterly, CrawlQ, source pulls, and research-provider configuration.',
    target: 'New extension',
    status: 'ready',
    reason: 'Mostly MCP/config/settings work with low blast radius.',
    suggestedPrompt:
      'Build a Research Connectors extension for Letterly, CrawlQ, and configurable research sources. It should expose MCP tools and a settings page for provider status and credentials.',
  },
  {
    id: 'infrastructure-tools',
    name: 'Infrastructure Tools',
    summary: 'Namecheap, Cloudflare, DNS checks, and short-link administration.',
    target: 'New extension',
    status: 'review',
    reason: 'Useful, but infrastructure writes need stricter review labels and safer defaults.',
    suggestedPrompt:
      'Build an Infrastructure Tools extension for Namecheap, Cloudflare, DNS checks, and short-link administration. It should require review before destructive or write actions.',
  },
  {
    id: 'comms-tools',
    name: 'Comms Tools',
    summary: 'BlueBubbles/iMessage, owner-message helpers, and notification/send-message utilities.',
    target: 'New extension',
    status: 'ready',
    reason: 'Clean user-facing tool bundle that should not bloat Project Tools.',
    suggestedPrompt:
      'Build a Comms Tools extension for BlueBubbles/iMessage, owner-message helpers, and notification tools. Keep it separate from Project Tools.',
  },
  {
    id: 'diagnostics',
    name: 'Diagnostics / Reliability',
    summary: 'MCP health checks, config warnings, missing credentials, and email delivery diagnostics.',
    target: 'Extensions page',
    status: 'ready',
    reason: 'Fits naturally as extension management and support UI.',
    suggestedPrompt:
      'Build a Diagnostics extension that shows MCP health, missing credentials, config warnings, and email delivery diagnostics under Settings > Extensions.',
  },
  {
    id: 'slash-commands',
    name: 'Slash Commands / Prompt Recipes',
    summary: 'Saved slash commands, prompt recipes, and composer expansion.',
    target: 'Needs hook check',
    status: 'blocked',
    reason: 'Good extension, but composer injection needs a real extension hook first.',
    suggestedPrompt:
      'Build a Slash Commands extension for saved prompt recipes and slash command expansion. First identify the required composer hook.',
  },
  {
    id: 'project-references',
    name: 'Project References',
    summary: 'Reference upload, preview, drag/drop, and project file helpers.',
    target: 'Extension or workspace hook',
    status: 'blocked',
    reason: 'Namespaced extension page is feasible; native workspace placement needs workspace-tab hooks.',
    suggestedPrompt:
      'Build a Project References extension for upload, preview, drag/drop, and project file helpers. Keep the first version under Settings > Extensions unless workspace-tab hooks exist.',
  },
  {
    id: 'mcp-library-polish',
    name: 'MCP Library Polish',
    summary: 'Catalog search, installed/reliability navigation, provider labels, and status polish.',
    target: 'Extension or upstream',
    status: 'review',
    reason: 'Some pieces are extension-friendly; catalog ownership may belong upstream.',
    suggestedPrompt:
      'Build an MCP Library polish extension that adds catalog search, installed/reliability navigation, provider labels, and connection status where hooks allow it.',
  },
  {
    id: 'updater-local-layer',
    name: 'Updater / Local Safety Layer',
    summary: 'Updater, local custom layer, doctor, proxy, and hashed renderer patch safety scripts.',
    target: 'Do not migrate',
    status: 'core',
    reason: 'Safety infrastructure should stay core/local or become upstream fixes, not user extensions.',
  },
];

function getRiskIcon(risk: IExtensionInfo['riskLevel']) {
  if (risk === 'dangerous') return <ShieldAlert size={14} />;
  if (risk === 'moderate') return <ShieldQuestion size={14} />;
  return <ShieldCheck size={14} />;
}

function getRiskColor(risk: IExtensionInfo['riskLevel']) {
  if (risk === 'dangerous') return 'orange';
  if (risk === 'moderate') return 'arcoblue';
  return 'green';
}

function getRiskLabel(risk: IExtensionInfo['riskLevel']) {
  if (risk === 'dangerous') return 'Needs Review';
  if (risk === 'moderate') return 'Elevated';
  return 'Safe';
}

function isPermissionReviewNeeded(extension: IExtensionInfo) {
  return extension.enabled && extension.riskLevel !== 'safe' && !extension.permissionReview;
}

function getExtensionRiskStatusLabel(extension: IExtensionInfo) {
  if (!extension.enabled) return 'Disabled';
  if (extension.riskLevel === 'safe') return 'Safe';
  if (extension.permissionReview) return 'Approved';
  return getRiskLabel(extension.riskLevel);
}

function getExtensionRiskStatusColor(extension: IExtensionInfo) {
  if (!extension.enabled) return 'gray';
  if (extension.riskLevel === 'safe') return 'green';
  if (extension.permissionReview) return 'green';
  return getRiskColor(extension.riskLevel);
}

function getExtensionRiskStatusIcon(extension: IExtensionInfo) {
  if (!extension.enabled) return <ShieldQuestion size={14} />;
  if (extension.riskLevel === 'safe' || extension.permissionReview) return <ShieldCheck size={14} />;
  return getRiskIcon(extension.riskLevel);
}

function getMigrationStatusColor(status: MigrationStatus) {
  if (status === 'ready') return 'green';
  if (status === 'review') return 'orange';
  if (status === 'blocked') return 'red';
  return 'gray';
}

function getMigrationStatusLabel(status: MigrationStatus) {
  if (status === 'ready') return 'Ready';
  if (status === 'review') return 'Review First';
  if (status === 'blocked') return 'Needs Hook';
  return 'Keep Core';
}

function getCapabilityEntries(extension: IExtensionInfo): Array<CapabilityMeta & { count: number }> {
  return CAPABILITIES.map((capability) => ({
    ...capability,
    count: extension.contributes[capability.key] ?? 0,
  })).filter((capability) => capability.count > 0);
}

function includesAny(value: string, words: string[]) {
  return words.some((word) => value.includes(word));
}

function getInitialAdvancedMode() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(ADVANCED_MODE_STORAGE_KEY) === 'true';
}

function slugifyExtensionName(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 40);

  return slug || 'new-extension';
}

function titleizeSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildExtensionPlan(idea: string): BuilderPlan {
  const normalized = idea.trim().replace(/\s+/g, ' ');
  const lower = normalized.toLowerCase();
  const seed = normalized.split(/[.!?]/)[0] || normalized;
  const slug = slugifyExtensionName(seed.split(/\s+/).slice(0, 6).join(' '));
  const name = titleizeSlug(slug);
  const needsNetwork = includesAny(lower, ['web', 'search', 'download', 'url', 'api', 'email', 'send', 'fetch']);
  const needsFilesystem = includesAny(lower, ['file', 'folder', 'project', 'reference', 'pdf', 'spreadsheet', 'write']);
  const needsShell = includesAny(lower, [
    'command',
    'terminal',
    'shell',
    'build',
    'test',
    'restart',
    'pm2',
    'run script',
  ]);
  const needsSettings = includesAny(lower, [
    'settings',
    'configure',
    'config',
    'dashboard',
    'page',
    'button',
    'screen',
  ]);
  const needsChannel = includesAny(lower, ['discord', 'slack', 'chat', 'message', 'notify', 'notification']);
  const needsModel = includesAny(lower, ['ai', 'agent', 'assistant', 'plan', 'summarize', 'draft']);
  const riskLevel: IExtensionInfo['riskLevel'] = needsShell
    ? 'dangerous'
    : needsNetwork || needsFilesystem
      ? 'moderate'
      : 'safe';
  const contributions = new Set<string>();
  const permissions = new Set<string>(['storage: extension-scoped']);
  const files = new Set<string>(['aion-extension.json', `assets/${slug}.svg`]);

  if (needsFilesystem) permissions.add('filesystem: workspace');
  if (needsNetwork) permissions.add('network: restricted host allow-list');
  if (needsShell) permissions.add('shell: requires review before enablement');
  if (needsModel) permissions.add('ai: user-approved planning/build actions');

  if (needsSettings || needsModel) {
    contributions.add('settings tab');
    files.add(`settings/${slug}.html`);
  }

  if (needsChannel) {
    contributions.add('channel plugin');
  }

  if (needsModel) {
    contributions.add('assistant workflow');
  }

  if (needsNetwork || needsFilesystem || needsShell || contributions.size === 0) {
    contributions.add('MCP server');
    files.add(`mcp/${slug}.js`);
  }

  return {
    name,
    slug,
    summary: normalized,
    riskLevel,
    permissions: Array.from(permissions),
    contributions: Array.from(contributions),
    files: Array.from(files),
    reviewItems: [
      'Confirm the extension belongs under Settings > Extensions instead of the main sidebar.',
      'Confirm the permission level is acceptable before enabling it by default.',
      'Define the first smoke test a user can run after install.',
      'Keep extension files outside the app bundle so Wayland updates do not overwrite them.',
    ],
    creationPath: `user-data/extensions/${slug}`,
  };
}

const ExtensionsSettings: React.FC = () => {
  const navigate = useNavigate();
  const [extensions, setExtensions] = useState<IExtensionInfo[]>([]);
  const [permissions, setPermissions] = useState<Record<string, IExtensionPermissionSummary[]>>({});
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyExtension, setBusyExtension] = useState<string | null>(null);
  const [busyReviewExtension, setBusyReviewExtension] = useState<string | null>(null);
  const [selected, setSelected] = useState<IExtensionInfo | null>(null);
  const [activeTab, setActiveTab] = useState('installed');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderIdea, setBuilderIdea] = useState('');
  const [builderMessages, setBuilderMessages] = useState<BuilderMessage[]>([]);
  const [builderPlan, setBuilderPlan] = useState<BuilderPlan | null>(null);
  const [builderDraft, setBuilderDraft] = useState<IExtensionBuilderDraftResult | null>(null);
  const [builderDrafting, setBuilderDrafting] = useState(false);
  const [builderApproved, setBuilderApproved] = useState(false);
  const [builderCreating, setBuilderCreating] = useState(false);
  const [builderCreated, setBuilderCreated] = useState<IExtensionBuilderCreateResult | null>(null);
  const [advancedMode, setAdvancedMode] = useState(getInitialAdvancedMode);

  const updateAdvancedMode = (enabled: boolean) => {
    setAdvancedMode(enabled);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ADVANCED_MODE_STORAGE_KEY, enabled ? 'true' : 'false');
    }
    if (!enabled) {
      setBuilderOpen(false);
    }
  };

  const loadExtensions = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = (await extensionsIpc.getLoadedExtensions.invoke()) ?? [];
      setExtensions(loaded);
    } catch (error) {
      console.error('[ExtensionsSettings] Failed to load extensions:', error);
      Message.error('Failed to load extensions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExtensions();
    const unsubscribe = extensionsIpc.stateChanged.on(() => {
      void loadExtensions();
    });
    return () => unsubscribe();
  }, [loadExtensions]);

  useEffect(() => {
    if (!selected || permissions[selected.name]) return;

    void extensionsIpc.getPermissions
      .invoke({ name: selected.name })
      .then((items) => setPermissions((current) => ({ ...current, [selected.name]: items ?? [] })))
      .catch((error) => {
        console.error(`[ExtensionsSettings] Failed to load permissions for ${selected.name}:`, error);
      });
  }, [permissions, selected]);

  const stats = useMemo(() => {
    const enabled = extensions.filter((extension) => extension.enabled).length;
    const reviewNeeded = extensions.filter(isPermissionReviewNeeded).length;
    const approved = extensions.filter(
      (extension) => extension.enabled && extension.riskLevel !== 'safe' && extension.permissionReview
    ).length;
    const withTabs = extensions.filter((extension) => extension.contributes.settingsTabs > 0).length;
    const totalCapabilities = extensions.reduce(
      (sum, extension) => sum + Object.values(extension.contributes).reduce((inner, count) => inner + count, 0),
      0
    );

    return {
      installed: extensions.length,
      enabled,
      disabled: extensions.length - enabled,
      reviewNeeded,
      approved,
      withTabs,
      totalCapabilities,
    };
  }, [extensions]);

  const visibleExtensions = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return extensions;

    return extensions.filter((extension) =>
      [extension.displayName, extension.name, extension.description, extension.author, extension.source]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [extensions, filter]);

  const openBuilderWithPrompt = (prompt: string) => {
    if (!advancedMode) return;
    setBuilderIdea(prompt);
    setBuilderMessages([]);
    setBuilderPlan(null);
    setBuilderDraft(null);
    setBuilderApproved(false);
    setBuilderCreated(null);
    setBuilderOpen(true);
  };

  const updateBuilderPlan = <K extends keyof BuilderPlan>(key: K, value: BuilderPlan[K]) => {
    setBuilderPlan((current) => (current ? { ...current, [key]: value } : current));
    setBuilderApproved(false);
    setBuilderCreated(null);
  };

  const updateBuilderList = (key: 'permissions' | 'contributions' | 'files' | 'reviewItems', value: string) => {
    const items = value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
    updateBuilderPlan(key, items);
  };

  const updateBuilderSlug = (value: string) => {
    const slug = slugifyExtensionName(value);
    setBuilderPlan((current) => {
      if (!current) return current;
      const previousSlug = current.slug;
      return {
        ...current,
        slug,
        creationPath: `user-data/extensions/${slug}`,
        files: current.files.map((file) => file.replaceAll(previousSlug, slug)),
      };
    });
    setBuilderApproved(false);
    setBuilderCreated(null);
  };

  const toggleExtension = async (extension: IExtensionInfo, enabled: boolean) => {
    setBusyExtension(extension.name);
    try {
      const response = enabled
        ? await extensionsIpc.enableExtension.invoke({ name: extension.name })
        : await extensionsIpc.disableExtension.invoke({
            name: extension.name,
            reason: 'Disabled from Settings > Extensions',
          });

      if (!response.success) {
        Message.error(response.msg || `Failed to ${enabled ? 'enable' : 'disable'} ${extension.displayName}`);
        return;
      }

      Message.success(`${extension.displayName} ${enabled ? 'enabled' : 'disabled'}`);
      await loadExtensions();
    } catch (error) {
      console.error(`[ExtensionsSettings] Failed to toggle ${extension.name}:`, error);
      Message.error(`Failed to ${enabled ? 'enable' : 'disable'} ${extension.displayName}`);
    } finally {
      setBusyExtension(null);
    }
  };

  const updatePermissionReview = async (extension: IExtensionInfo, approved: boolean) => {
    setBusyReviewExtension(extension.name);
    try {
      const response = approved
        ? await extensionsIpc.approvePermissions.invoke({ name: extension.name })
        : await extensionsIpc.revokePermissionApproval.invoke({ name: extension.name });

      if (!response.success) {
        Message.error(response.msg || `Failed to ${approved ? 'approve' : 'revoke'} ${extension.displayName}`);
        return;
      }

      Message.success(
        approved
          ? `${extension.displayName} permissions approved`
          : `${extension.displayName} permission approval revoked`
      );
      await loadExtensions();
      const updated = (await extensionsIpc.getLoadedExtensions.invoke()).find((item) => item.name === extension.name);
      if (updated) {
        setSelected(updated);
      }
    } catch (error) {
      console.error(`[ExtensionsSettings] Failed to update permission review for ${extension.name}:`, error);
      Message.error(`Failed to ${approved ? 'approve' : 'revoke'} ${extension.displayName}`);
    } finally {
      setBusyReviewExtension(null);
    }
  };

  const openFirstSettingsTab = async (extension: IExtensionInfo) => {
    const tabs = (await extensionsIpc.getSettingsTabs.invoke()) ?? [];
    const tab = tabs.find((item) => item._extensionName === extension.name);
    if (tab) {
      void navigate(`/settings/ext/${tab.id}`);
    }
  };

  const draftBuilderPlan = async () => {
    if (!advancedMode) return;
    if (builderIdea.trim().length < 12) {
      Message.warning('Describe the extension you want in a little more detail.');
      return;
    }

    const nextMessages: BuilderMessage[] = [...builderMessages, { role: 'user', content: builderIdea.trim() }];
    setBuilderMessages(nextMessages);
    setBuilderDrafting(true);
    setBuilderApproved(false);
    setBuilderCreated(null);
    try {
      const response = await extensionsIpc.draftBuilderPlan.invoke({
        messages: nextMessages,
        fallbackIdea: builderIdea,
      });
      if (!response.success || !response.data) {
        throw new Error(response.msg || 'Failed to draft extension plan');
      }
      setBuilderDraft(response.data);
      setBuilderPlan(response.data.plan);
      setBuilderMessages((current) => [...current, { role: 'assistant', content: response.data!.reply }]);
      if (response.data.source === 'ai') {
        Message.success(`AI drafted a plan with ${response.data.model || 'the configured model'}`);
      } else {
        Message.warning('No model-backed plan was available; drafted a fallback plan.');
      }
    } catch (error) {
      console.error('[ExtensionsSettings] AI builder draft failed:', error);
      const fallbackPlan = buildExtensionPlan(builderIdea);
      const fallbackReply = 'I could not reach the AI planner, so I drafted a fallback plan you can review and edit.';
      setBuilderDraft({
        plan: fallbackPlan,
        reply: fallbackReply,
        source: 'fallback',
        error: error instanceof Error ? error.message : String(error),
      });
      setBuilderPlan(fallbackPlan);
      setBuilderMessages((current) => [...current, { role: 'assistant', content: fallbackReply }]);
      Message.warning('AI planner failed; drafted a fallback plan.');
    } finally {
      setBuilderDrafting(false);
    }
  };

  const createBuilderExtension = async () => {
    if (!advancedMode) return;
    if (!builderPlan || !builderApproved) return;

    setBuilderCreating(true);
    try {
      const response = await extensionsIpc.createFromBuilder.invoke({ plan: builderPlan });
      if (!response.success || !response.data) {
        Message.error(response.msg || 'Failed to create extension');
        return;
      }

      setBuilderCreated(response.data);
      Message.success(`${response.data.displayName} extension created`);
      await loadExtensions();
    } catch (error) {
      console.error('[ExtensionsSettings] Failed to create extension from builder:', error);
      Message.error(error instanceof Error ? error.message : 'Failed to create extension');
    } finally {
      setBuilderCreating(false);
    }
  };

  const renderExtensionCard = (extension: IExtensionInfo) => {
    const capabilityEntries = getCapabilityEntries(extension);
    const settingsTabs = extension.contributes.settingsTabs;
    const hasProblem = !!extension.installError || (!extension.enabled && !!extension.disabledReason);

    return (
      <Card
        key={extension.name}
        className='cursor-pointer hover:border-[rgba(var(--primary-6),0.45)] transition-colors'
        title={
          <span className='flex items-center gap-8px min-w-0'>
            <Puzzle size={16} className='text-[var(--color-text-3)] shrink-0' />
            <span className='truncate'>{extension.displayName}</span>
          </span>
        }
        statusBadge={
          <span className='flex items-center gap-6px'>
            <Tag color={extension.enabled ? 'green' : 'gray'}>{extension.enabled ? 'Enabled' : 'Disabled'}</Tag>
            <Tag color={getExtensionRiskStatusColor(extension)} icon={getExtensionRiskStatusIcon(extension)}>
              {getExtensionRiskStatusLabel(extension)}
            </Tag>
          </span>
        }
      >
        <div onClick={() => setSelected(extension)} role='button' tabIndex={0} className='flex flex-col gap-12px'>
          <div className='flex items-start justify-between gap-16px'>
            <div className='min-w-0 flex-1'>
              <div className='text-12px text-[var(--color-text-3)] truncate'>
                {extension.name} · v{extension.version} · {extension.source}
              </div>
              {extension.description && (
                <div className='mt-6px text-13px text-[var(--color-text-2)] line-clamp-2'>{extension.description}</div>
              )}
              {hasProblem && (
                <div className='mt-8px text-12px text-[rgb(var(--danger-6))]'>
                  {extension.installError || extension.disabledReason}
                </div>
              )}
            </div>
            <Switch
              checked={extension.enabled}
              loading={busyExtension === extension.name}
              onClick={(event) => event.stopPropagation()}
              onChange={(checked) => void toggleExtension(extension, checked)}
            />
          </div>

          <div className='flex flex-wrap gap-6px'>
            {capabilityEntries.length > 0 ? (
              capabilityEntries.map((capability) => (
                <Tag key={capability.key} icon={capability.icon}>
                  {capability.label}: {capability.count}
                </Tag>
              ))
            ) : (
              <Tag color='gray'>Metadata only</Tag>
            )}
            {extension.hasLifecycle && <Tag color='arcoblue'>Lifecycle hooks</Tag>}
          </div>

          <div className='flex items-center justify-between gap-12px pt-4px'>
            <div className='text-12px text-[var(--color-text-3)] truncate'>{extension.directory}</div>
            {settingsTabs > 0 && (
              <Button
                size='mini'
                type='secondary'
                icon={<Settings size={13} />}
                onClick={(event) => {
                  event.stopPropagation();
                  void openFirstSettingsTab(extension);
                }}
              >
                Open Settings
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <SettingsPageShell
      title='Extensions'
      subtitle='Installed Wayland extensions, contributed capabilities, permissions, and developer install paths.'
      contentClassName='md:max-w-[1280px]'
      actions={
        <div className='flex items-center gap-8px'>
          <span className='flex items-center gap-6px text-12px text-[var(--color-text-3)]'>
            Advanced
            <Switch size='small' checked={advancedMode} onChange={updateAdvancedMode} />
          </span>
          {advancedMode && (
            <Button
              type='primary'
              icon={<Sparkles size={14} />}
              onClick={() => {
                setBuilderIdea('');
                setBuilderMessages([]);
                setBuilderDraft(null);
                setBuilderPlan(null);
                setBuilderApproved(false);
                setBuilderCreated(null);
                setBuilderOpen(true);
              }}
            >
              Build Extension
            </Button>
          )}
          <Button icon={<RefreshCw size={14} />} onClick={() => void loadExtensions()} loading={loading}>
            Refresh
          </Button>
        </div>
      }
    >
      <div className='grid grid-cols-2 lg:grid-cols-5 gap-12px'>
        <Card title='Installed' titleIcon={Package}>
          <div className='text-24px font-semibold'>{stats.installed}</div>
          <div className='text-12px text-[var(--color-text-3)]'>{stats.enabled} enabled</div>
        </Card>
        <Card title='Disabled' titleIcon={ShieldQuestion}>
          <div className='text-24px font-semibold'>{stats.disabled}</div>
          <div className='text-12px text-[var(--color-text-3)]'>User or lifecycle state</div>
        </Card>
        <Card title='Capabilities' titleIcon={Plug}>
          <div className='text-24px font-semibold'>{stats.totalCapabilities}</div>
          <div className='text-12px text-[var(--color-text-3)]'>Registered contributions</div>
        </Card>
        <Card title='Settings Tabs' titleIcon={Settings}>
          <div className='text-24px font-semibold'>{stats.withTabs}</div>
          <div className='text-12px text-[var(--color-text-3)]'>Extensions with UI</div>
        </Card>
        <Card title='Needs Review' titleIcon={ShieldAlert}>
          <div className='text-24px font-semibold'>{stats.reviewNeeded}</div>
          <div className='text-12px text-[var(--color-text-3)]'>{stats.approved} approved</div>
        </Card>
      </div>

      <Tabs activeTab={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane key='installed' title='Installed'>
          <div className='flex flex-col gap-12px'>
            <Input.Search
              allowClear
              placeholder='Search extensions by name, source, author, or description'
              value={filter}
              onChange={setFilter}
            />
            {loading ? (
              <div className='py-48px flex items-center justify-center'>
                <Spin />
              </div>
            ) : visibleExtensions.length > 0 ? (
              <div className='grid grid-cols-1 xl:grid-cols-2 gap-12px'>
                {visibleExtensions.map(renderExtensionCard)}
              </div>
            ) : (
              <Card>
                <EmptyState
                  title='No extensions found'
                  body='Install an extension in the user-data extensions folder or set WAYLAND_EXTENSIONS_PATH.'
                  icon={Puzzle}
                />
              </Card>
            )}
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane key='migration' title='Migration Queue'>
          <div className='flex flex-col gap-12px'>
            <Card title='Extension Migration Rules' titleIcon={ShieldCheck}>
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-12px text-13px text-[var(--color-text-2)]'>
                <div className='rounded-8px bg-[var(--color-fill-1)] px-12px py-10px'>
                  <div className='font-medium text-[var(--color-text-1)]'>One home</div>
                  <div className='mt-4px'>
                    Extension UI stays under Settings &gt; Extensions unless WL adds a native hook.
                  </div>
                </div>
                <div className='rounded-8px bg-[var(--color-fill-1)] px-12px py-10px'>
                  <div className='font-medium text-[var(--color-text-1)]'>No junk drawer</div>
                  <div className='mt-4px'>
                    Project Tools stays focused; research, comms, and infrastructure get their own packages.
                  </div>
                </div>
                <div className='rounded-8px bg-[var(--color-fill-1)] px-12px py-10px'>
                  <div className='font-medium text-[var(--color-text-1)]'>Hooks before hacks</div>
                  <div className='mt-4px'>
                    If a feature needs renderer patching, propose the hook upstream before migrating it.
                  </div>
                </div>
              </div>
            </Card>

            <div className='grid grid-cols-1 xl:grid-cols-2 gap-12px'>
              {MIGRATION_CANDIDATES.map((candidate) => (
                <Card
                  key={candidate.id}
                  title={candidate.name}
                  titleIcon={Puzzle}
                  statusBadge={
                    <Tag color={getMigrationStatusColor(candidate.status)}>
                      {getMigrationStatusLabel(candidate.status)}
                    </Tag>
                  }
                >
                  <div className='flex flex-col gap-10px'>
                    <div className='text-13px text-[var(--color-text-2)]'>{candidate.summary}</div>
                    <div className='grid grid-cols-[92px_1fr] gap-x-10px gap-y-6px text-13px'>
                      <span className='text-[var(--color-text-3)]'>Target</span>
                      <span>{candidate.target}</span>
                      <span className='text-[var(--color-text-3)]'>Reason</span>
                      <span>{candidate.reason}</span>
                    </div>
                    {advancedMode && (
                      <div className='flex justify-end'>
                        <Button
                          size='small'
                          type={candidate.status === 'ready' ? 'primary' : 'secondary'}
                          disabled={!candidate.suggestedPrompt || candidate.status === 'core'}
                          icon={<Sparkles size={13} />}
                          onClick={() => candidate.suggestedPrompt && openBuilderWithPrompt(candidate.suggestedPrompt)}
                        >
                          Draft Builder Plan
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane key='developer' title='Developer'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12px'>
            {advancedMode && (
              <Card title='Extension Builder' titleIcon={Sparkles}>
                <div className='flex flex-col gap-10px text-13px text-[var(--color-text-2)]'>
                  <div>
                    Start with plain English, turn it into a reviewable extension plan, then approve it before files are
                    created.
                  </div>
                  <Button
                    type='primary'
                    icon={<Sparkles size={14} />}
                    onClick={() => {
                      setBuilderIdea('');
                      setBuilderMessages([]);
                      setBuilderDraft(null);
                      setBuilderPlan(null);
                      setBuilderApproved(false);
                      setBuilderCreated(null);
                      setBuilderOpen(true);
                    }}
                  >
                    Open Builder
                  </Button>
                </div>
              </Card>
            )}

            <Card title='Load Order' titleIcon={FolderOpen}>
              <div className='flex flex-col gap-10px text-13px text-[var(--color-text-2)]'>
                <div>
                  <span className='font-medium text-[var(--color-text-1)]'>1. WAYLAND_EXTENSIONS_PATH</span>
                  <div className='text-12px text-[var(--color-text-3)]'>
                    Fastest lane for local extension development.
                  </div>
                </div>
                <div>
                  <span className='font-medium text-[var(--color-text-1)]'>2. user-data/extensions</span>
                  <div className='text-12px text-[var(--color-text-3)]'>
                    Best lane for update-safe installed extensions.
                  </div>
                </div>
                <div>
                  <span className='font-medium text-[var(--color-text-1)]'>3. app data extensions</span>
                  <div className='text-12px text-[var(--color-text-3)]'>
                    Per-user installed extensions outside the app bundle.
                  </div>
                </div>
                <div>
                  <span className='font-medium text-[var(--color-text-1)]'>4. bundled extensions</span>
                  <div className='text-12px text-[var(--color-text-3)]'>Read-only extensions shipped with Wayland.</div>
                </div>
              </div>
            </Card>

            <Card title='SDK Surfaces' titleIcon={FileCode2}>
              <div className='flex flex-wrap gap-6px'>
                {CAPABILITIES.map((capability) => (
                  <Tag key={capability.key} icon={capability.icon}>
                    {capability.label}
                  </Tag>
                ))}
              </div>
              <div className='mt-12px text-12px text-[var(--color-text-3)]'>
                Extensions are declared with an aion-extension.json manifest and loaded from outside the app bundle, so
                updates should not overwrite local extension packages.
              </div>
            </Card>

            <Card title='Installed Paths' titleIcon={FolderOpen} className='lg:col-span-2'>
              <div className='flex flex-col gap-8px'>
                {extensions.length > 0 ? (
                  extensions.map((extension) => (
                    <div
                      key={extension.name}
                      className='flex items-center gap-10px rounded-8px bg-[var(--color-fill-1)] px-10px py-8px'
                    >
                      <Tag>{extension.source}</Tag>
                      <span className='text-13px font-medium text-[var(--color-text-1)] min-w-140px'>
                        {extension.name}
                      </span>
                      <Tooltip content={extension.directory}>
                        <span className='text-12px text-[var(--color-text-3)] truncate flex-1'>
                          {extension.directory}
                        </span>
                      </Tooltip>
                    </div>
                  ))
                ) : (
                  <div className='text-13px text-[var(--color-text-3)]'>No extension paths loaded yet.</div>
                )}
              </div>
            </Card>
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane key='hub' title='Browse Hub'>
          <Card title='Extension Hub' titleIcon={LifeBuoy}>
            <div className='text-13px text-[var(--color-text-2)]'>
              This page is ready for installed extension management. Remote extension discovery still needs a real hub
              catalog endpoint before it can safely show install/update actions here.
            </div>
          </Card>
        </Tabs.TabPane>
      </Tabs>

      <Drawer
        width={560}
        title={selected?.displayName ?? 'Extension'}
        visible={!!selected}
        onCancel={() => setSelected(null)}
        footer={null}
      >
        {selected && (
          <div className='flex flex-col gap-14px'>
            <div className='flex items-center gap-8px'>
              <Tag color={selected.enabled ? 'green' : 'gray'}>{selected.enabled ? 'Enabled' : 'Disabled'}</Tag>
              <Tag color={getExtensionRiskStatusColor(selected)} icon={getExtensionRiskStatusIcon(selected)}>
                {getExtensionRiskStatusLabel(selected)}
              </Tag>
              <Tag>{selected.source}</Tag>
              <Tag>v{selected.version}</Tag>
            </div>

            {selected.description && <div className='text-13px text-[var(--color-text-2)]'>{selected.description}</div>}

            <Card title='Metadata' titleIcon={Package}>
              <div className='grid grid-cols-[120px_1fr] gap-x-10px gap-y-8px text-13px'>
                <span className='text-[var(--color-text-3)]'>Name</span>
                <span>{selected.name}</span>
                <span className='text-[var(--color-text-3)]'>Author</span>
                <span>{selected.author || 'Unknown'}</span>
                <span className='text-[var(--color-text-3)]'>API</span>
                <span>{selected.apiVersion || 'Not declared'}</span>
                <span className='text-[var(--color-text-3)]'>Engine</span>
                <span>{selected.engine?.wayland || 'Not declared'}</span>
                <span className='text-[var(--color-text-3)]'>Directory</span>
                <Tooltip content={selected.directory}>
                  <span className='truncate'>{selected.directory}</span>
                </Tooltip>
                {selected.homepage && (
                  <>
                    <span className='text-[var(--color-text-3)]'>Homepage</span>
                    <a href={selected.homepage} target='_blank' rel='noreferrer' className='flex items-center gap-4px'>
                      Open <ExternalLink size={12} />
                    </a>
                  </>
                )}
              </div>
            </Card>

            <Card title='Capabilities' titleIcon={Plug}>
              <div className='flex flex-wrap gap-6px'>
                {getCapabilityEntries(selected).length > 0 ? (
                  getCapabilityEntries(selected).map((capability) => (
                    <Tag key={capability.key} icon={capability.icon}>
                      {capability.label}: {capability.count}
                    </Tag>
                  ))
                ) : (
                  <Tag color='gray'>No runtime contributions</Tag>
                )}
              </div>
            </Card>

            <Card title='Permissions' titleIcon={ShieldCheck}>
              <div className='flex flex-col gap-8px'>
                {(permissions[selected.name] ?? []).length > 0 ? (
                  permissions[selected.name].map((permission) => (
                    <div key={permission.name} className='flex items-start gap-8px'>
                      <Tag color={getRiskColor(permission.level)}>{getRiskLabel(permission.level)}</Tag>
                      <div className='min-w-0'>
                        <div className='text-13px font-medium'>{permission.name}</div>
                        <div className='text-12px text-[var(--color-text-3)]'>{permission.description}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='text-13px text-[var(--color-text-3)]'>No special permissions declared.</div>
                )}
              </div>
            </Card>

            {selected.riskLevel !== 'safe' && (
              <Card title='Permission Review' titleIcon={ShieldAlert}>
                <div className='flex flex-col gap-12px'>
                  <div className='text-13px text-[var(--color-text-2)]'>
                    {selected.permissionReview
                      ? `Reviewed ${new Date(selected.permissionReview.approvedAt).toLocaleString()}. This extension is approved for its declared ${getRiskLabel(
                          selected.permissionReview.approvedRiskLevel
                        ).toLowerCase()} permissions.`
                      : 'This extension requests elevated permissions. Review the permission list before approving it as trusted on this install.'}
                  </div>
                  {selected.permissionReview && selected.permissionReview.approvedPermissions.length > 0 && (
                    <div className='flex flex-wrap gap-6px'>
                      {selected.permissionReview.approvedPermissions.map((permission) => (
                        <Tag key={permission} color='green'>
                          {permission}
                        </Tag>
                      ))}
                    </div>
                  )}
                  <div className='flex justify-end gap-8px'>
                    {selected.permissionReview ? (
                      <Button
                        status='warning'
                        loading={busyReviewExtension === selected.name}
                        onClick={() => void updatePermissionReview(selected, false)}
                      >
                        Revoke Approval
                      </Button>
                    ) : (
                      <Button
                        type='primary'
                        status='warning'
                        loading={busyReviewExtension === selected.name}
                        onClick={() => void updatePermissionReview(selected, true)}
                      >
                        Approve Permissions
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </Drawer>

      <Drawer
        width={720}
        title='Extension Builder'
        visible={advancedMode && builderOpen}
        onCancel={() => setBuilderOpen(false)}
        footer={null}
      >
        <div className='flex flex-col gap-14px'>
          <Card title='Builder Conversation' titleIcon={Sparkles}>
            <div className='flex flex-col gap-10px'>
              {builderMessages.length > 0 && (
                <div className='flex max-h-260px flex-col gap-8px overflow-auto rounded-8px bg-[var(--color-fill-1)] p-10px'>
                  {builderMessages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`rounded-8px px-10px py-8px text-13px leading-20px ${
                        message.role === 'user'
                          ? 'ml-24px bg-[rgba(var(--primary-6),0.12)] text-[var(--color-text-1)]'
                          : 'mr-24px bg-[var(--color-bg-2)] text-[var(--color-text-2)]'
                      }`}
                    >
                      <div className='mb-4px text-11px font-medium uppercase text-[var(--color-text-3)]'>
                        {message.role === 'user' ? 'You' : 'Builder'}
                      </div>
                      {message.content}
                    </div>
                  ))}
                </div>
              )}
              <Input.TextArea
                value={builderIdea}
                onChange={setBuilderIdea}
                autoSize={{ minRows: 5, maxRows: 9 }}
                placeholder='Describe the extension in plain English. The builder will use a configured AI model when available, then return a reviewable plan before anything is created.'
              />
              <div className='flex items-center justify-between gap-10px'>
                <div className='text-12px text-[var(--color-text-3)]'>
                  The plan is review-only until you approve it. If no model is available, WL uses the fallback planner
                  and labels it.
                </div>
                <Button
                  type='primary'
                  icon={<Sparkles size={14} />}
                  loading={builderDrafting}
                  onClick={() => void draftBuilderPlan()}
                >
                  Ask AI
                </Button>
              </div>
            </div>
          </Card>

          {builderPlan ? (
            <>
              <Card
                title={builderPlan.name}
                titleIcon={Puzzle}
                statusBadge={
                  <span className='flex flex-wrap items-center gap-6px'>
                    {builderDraft && (
                      <Tag color={builderDraft.source === 'ai' ? 'green' : 'orange'}>
                        {builderDraft.source === 'ai' ? 'AI Draft' : 'Fallback Draft'}
                      </Tag>
                    )}
                    <Tag color={getRiskColor(builderPlan.riskLevel)} icon={getRiskIcon(builderPlan.riskLevel)}>
                      {getRiskLabel(builderPlan.riskLevel)}
                    </Tag>
                  </span>
                }
              >
                <div className='flex flex-col gap-10px'>
                  <div className='text-13px text-[var(--color-text-2)]'>{builderPlan.summary}</div>
                  {builderDraft?.model && (
                    <div className='text-12px text-[var(--color-text-3)]'>Drafted with {builderDraft.model}</div>
                  )}
                  {builderDraft?.error && (
                    <div className='text-12px text-[rgb(var(--warning-6))]'>{builderDraft.error}</div>
                  )}
                  <div className='grid grid-cols-[130px_1fr] gap-x-12px gap-y-8px text-13px'>
                    <span className='text-[var(--color-text-3)]'>Package</span>
                    <span>{builderPlan.slug}</span>
                    <span className='text-[var(--color-text-3)]'>Install path</span>
                    <span>{builderPlan.creationPath}</span>
                  </div>
                </div>
              </Card>

              <Card title='Review And Adjust' titleIcon={FileCode2}>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-12px'>
                  <div className='flex flex-col gap-6px'>
                    <span className='text-12px text-[var(--color-text-3)]'>Display name</span>
                    <Input value={builderPlan.name} onChange={(value) => updateBuilderPlan('name', value)} />
                  </div>
                  <div className='flex flex-col gap-6px'>
                    <span className='text-12px text-[var(--color-text-3)]'>Package slug</span>
                    <Input value={builderPlan.slug} onChange={updateBuilderSlug} />
                  </div>
                  <div className='flex flex-col gap-6px lg:col-span-2'>
                    <span className='text-12px text-[var(--color-text-3)]'>Summary</span>
                    <Input.TextArea
                      value={builderPlan.summary}
                      autoSize={{ minRows: 2, maxRows: 4 }}
                      onChange={(value) => updateBuilderPlan('summary', value)}
                    />
                  </div>
                </div>
              </Card>

              <div className='grid grid-cols-1 lg:grid-cols-2 gap-12px'>
                <Card title='Contributions' titleIcon={Plug}>
                  <Input.TextArea
                    value={builderPlan.contributions.join('\n')}
                    autoSize={{ minRows: 4, maxRows: 8 }}
                    onChange={(value) => updateBuilderList('contributions', value)}
                  />
                </Card>

                <Card title='Permissions' titleIcon={ShieldCheck}>
                  <Input.TextArea
                    value={builderPlan.permissions.join('\n')}
                    autoSize={{ minRows: 4, maxRows: 8 }}
                    onChange={(value) => updateBuilderList('permissions', value)}
                  />
                </Card>
              </div>

              <Card title='Files To Create' titleIcon={FileCode2}>
                <Input.TextArea
                  value={builderPlan.files.join('\n')}
                  autoSize={{ minRows: 4, maxRows: 8 }}
                  onChange={(value) => updateBuilderList('files', value)}
                />
              </Card>

              <Card title='Review Before Build' titleIcon={ShieldQuestion}>
                <Input.TextArea
                  value={builderPlan.reviewItems.join('\n')}
                  autoSize={{ minRows: 4, maxRows: 8 }}
                  onChange={(value) => updateBuilderList('reviewItems', value)}
                />
              </Card>

              <div className='flex flex-wrap justify-end gap-8px'>
                <Button
                  onClick={() => {
                    setBuilderPlan(null);
                    setBuilderApproved(false);
                    setBuilderCreated(null);
                  }}
                >
                  Revise Prompt
                </Button>
                <Button
                  type='primary'
                  onClick={() => {
                    setBuilderApproved(true);
                    Message.success('Extension plan approved');
                  }}
                >
                  Approve Plan
                </Button>
                <Button
                  disabled={!builderApproved || !!builderCreated}
                  loading={builderCreating}
                  onClick={createBuilderExtension}
                >
                  Create Extension
                </Button>
              </div>

              {builderCreated && (
                <Card
                  title='Created Extension'
                  titleIcon={ShieldCheck}
                  statusBadge={<Tag color='green'>Installed</Tag>}
                >
                  <div className='flex flex-col gap-10px'>
                    <div className='grid grid-cols-[110px_1fr] gap-x-12px gap-y-8px text-13px'>
                      <span className='text-[var(--color-text-3)]'>Name</span>
                      <span>{builderCreated.displayName}</span>
                      <span className='text-[var(--color-text-3)]'>Directory</span>
                      <Tooltip content={builderCreated.directory}>
                        <span className='truncate'>{builderCreated.directory}</span>
                      </Tooltip>
                    </div>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-8px'>
                      {builderCreated.files.map((file) => (
                        <div key={file} className='rounded-8px bg-[var(--color-fill-1)] px-10px py-8px text-13px'>
                          {file}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <EmptyState
                title='No builder plan yet'
                body='Describe what the extension should do, then draft a plan to review surfaces, permissions, files, and tests.'
                icon={Sparkles}
              />
            </Card>
          )}
        </div>
      </Drawer>
    </SettingsPageShell>
  );
};

export default ExtensionsSettings;
