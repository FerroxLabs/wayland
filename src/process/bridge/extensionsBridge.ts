/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type {
  IExtensionAgentActivitySnapshot,
  IExtensionBuilderCreateResult,
  IExtensionBuilderDraftResult,
  IExtensionBuilderMessage,
  IExtensionBuilderPlan,
} from '@/common/adapter/ipcBridge';
import { ExtensionRegistry } from '@process/extensions';
import { getInstallTargetDir } from '@process/extensions/constants';
import { ExtensionManifestSchema } from '@process/extensions/types';
import type { ExtContributes } from '@process/extensions';
import { oneShotCompleteBest } from '@process/services/completion/oneShot';
import type { IConversationRepository } from '@process/services/database/IConversationRepository';
import type { IWorkerTaskManager } from '@process/task/IWorkerTaskManager';
import { ActivitySnapshotBuilder } from './services/ActivitySnapshotBuilder';
import fs from 'node:fs/promises';
import path from 'node:path';

const ACTIVITY_SNAPSHOT_TTL_MS = 3000;

let activitySnapshotCache: IExtensionAgentActivitySnapshot | null = null;
let activitySnapshotCachedAt = 0;
let activitySnapshotInFlight: Promise<IExtensionAgentActivitySnapshot> | null = null;

const makeGetActivitySnapshot =
  (builder: ActivitySnapshotBuilder) => async (): Promise<IExtensionAgentActivitySnapshot> => {
    const now = Date.now();
    if (activitySnapshotCache && now - activitySnapshotCachedAt <= ACTIVITY_SNAPSHOT_TTL_MS) {
      return activitySnapshotCache;
    }

    if (activitySnapshotInFlight) {
      return activitySnapshotInFlight;
    }

    activitySnapshotInFlight = Promise.resolve()
      .then(async () => {
        const snapshot = await builder.build();
        activitySnapshotCache = snapshot;
        activitySnapshotCachedAt = Date.now();
        return snapshot;
      })
      .finally(() => {
        activitySnapshotInFlight = null;
      });

    return activitySnapshotInFlight;
  };

function countContributions(contributes: ExtContributes | undefined) {
  const webui = contributes?.webui;

  return {
    acpAdapters: contributes?.acpAdapters?.length ?? 0,
    mcpServers: contributes?.mcpServers?.length ?? 0,
    assistants: contributes?.assistants?.length ?? 0,
    agents: contributes?.agents?.length ?? 0,
    skills: contributes?.skills?.length ?? 0,
    channelPlugins: contributes?.channelPlugins?.length ?? 0,
    webuiApiRoutes: webui?.apiRoutes?.length ?? 0,
    webuiStaticAssets: webui?.staticAssets?.length ?? 0,
    themes: contributes?.themes?.length ?? 0,
    settingsTabs: contributes?.settingsTabs?.length ?? 0,
    modelProviders: contributes?.modelProviders?.length ?? 0,
    acronyms: contributes?.acronyms?.length ?? 0,
    workspacePanels: contributes?.workspacePanels?.length ?? 0,
    filePreviewActions: contributes?.filePreviewActions?.length ?? 0,
    scheduledTaskTemplates: contributes?.scheduledTaskTemplates?.length ?? 0,
    workflowTemplates: contributes?.workflowTemplates?.length ?? 0,
  };
}

function normalizeBuilderSlug(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 64);

  if (!/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(slug)) {
    throw new Error('Extension package name must be kebab-case and at least 3 characters.');
  }

  return slug;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function planIncludes(plan: IExtensionBuilderPlan, token: string): boolean {
  const lower = token.toLowerCase();
  return [...plan.permissions, ...plan.contributions, ...plan.files].some((item) => item.toLowerCase().includes(lower));
}

function isSettingsSurfaceRequest(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    lower.includes('settings tab') ||
    lower.includes('settings/') ||
    lower.includes('settings page') ||
    lower.includes('settings surface') ||
    lower.includes('dashboard') ||
    lower.includes('host bridge') ||
    lower.endsWith('.html')
  );
}

function uniq(items: string[]): string[] {
  return Array.from(new Set(items));
}

function includesAny(value: string, words: string[]): boolean {
  return words.some((word) => value.includes(word));
}

function titleizeSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function createFallbackBuilderPlan(idea: string): IExtensionBuilderPlan {
  const normalized = idea.trim().replace(/\s+/g, ' ');
  const lower = normalized.toLowerCase();
  const seed = normalized.split(/[.!?]/)[0] || normalized || 'new extension';
  let slug = seed
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 64);
  if (!/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(slug)) {
    slug = 'new-extension';
  }
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
  const riskLevel: IExtensionBuilderPlan['riskLevel'] = needsShell
    ? 'dangerous'
    : needsNetwork || needsFilesystem
      ? 'moderate'
      : 'safe';
  const permissions = new Set<string>(['storage: extension-scoped']);
  const contributions = new Set<string>();
  const files = new Set<string>(['aion-extension.json', `assets/${slug}.svg`]);

  if (needsFilesystem) permissions.add('filesystem: workspace');
  if (needsNetwork) permissions.add('network: restricted host allow-list');
  if (needsShell) permissions.add('shell: requires review before enablement');
  if (needsModel) permissions.add('ai: user-approved planning/build actions');

  if (needsSettings || needsModel) {
    contributions.add('MCP server');
    files.add(`mcp/${slug}.js`);
    files.add('README.md');
  }
  if (needsChannel) contributions.add('channel plugin');
  if (needsModel) contributions.add('assistant workflow');
  if (needsNetwork || needsFilesystem || needsShell || contributions.size === 0) {
    contributions.add('MCP server');
    files.add(`mcp/${slug}.js`);
  }

  return {
    name: titleizeSlug(slug),
    slug,
    summary: normalized || 'New extension scaffold.',
    riskLevel,
    permissions: Array.from(permissions),
    contributions: Array.from(contributions),
    files: Array.from(files),
    reviewItems: [
      'Settings tabs and host-bridge UI are first-party bundled only until the approval layer exists.',
      'Confirm the permission level is acceptable before enabling it by default.',
      'Define the first smoke test a user can run after install.',
      'Keep extension files outside the app bundle so Wayland updates do not overwrite them.',
    ],
    creationPath: `user-data/extensions/${slug}`,
  };
}

function extractJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new Error('Model did not return a JSON object.');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function coerceStringList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.map((item) => String(item).trim()).filter(Boolean);
  return items.length > 0 ? items : fallback;
}

function normalizeLocalBuilderPlan(plan: IExtensionBuilderPlan): IExtensionBuilderPlan {
  const slug = normalizeBuilderSlug(plan.slug);
  const hadSettingsSurface = [...plan.contributions, ...plan.files].some(isSettingsSurfaceRequest);
  const contributions = plan.contributions.filter((item) => !isSettingsSurfaceRequest(item));
  const files = plan.files
    .filter((item) => !isSettingsSurfaceRequest(item))
    .map((file) => file.replaceAll(plan.slug, slug));
  const reviewItems = [...plan.reviewItems];

  if (hadSettingsSurface) {
    contributions.push('MCP server');
    files.push(`mcp/${slug}.js`, 'README.md');
    reviewItems.unshift(
      'Settings tabs and host-bridge UI are first-party bundled only until the approval layer exists.'
    );
  }

  if (contributions.length === 0) {
    contributions.push('MCP server');
  }
  if (!files.some((file) => file === 'aion-extension.json')) {
    files.unshift('aion-extension.json');
  }
  if (!files.some((file) => file === `assets/${slug}.svg`)) {
    files.push(`assets/${slug}.svg`);
  }
  if (
    contributions.some((item) => item.toLowerCase().includes('mcp')) &&
    !files.some((file) => file.startsWith('mcp/'))
  ) {
    files.push(`mcp/${slug}.js`);
  }

  return {
    ...plan,
    slug,
    contributions: uniq(contributions),
    files: uniq(files),
    reviewItems: uniq(reviewItems),
    creationPath: `user-data/extensions/${slug}`,
  };
}

function normalizeModelPlan(raw: unknown, fallbackIdea: string): IExtensionBuilderPlan {
  const fallback = createFallbackBuilderPlan(fallbackIdea);
  const value = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const slug = normalizeBuilderSlug(String(value.slug || fallback.slug));
  const risk = value.riskLevel;
  const riskLevel: IExtensionBuilderPlan['riskLevel'] =
    risk === 'safe' || risk === 'moderate' || risk === 'dangerous' ? risk : fallback.riskLevel;

  return normalizeLocalBuilderPlan({
    name: String(value.name || fallback.name).trim() || fallback.name,
    slug,
    summary: String(value.summary || fallback.summary).trim() || fallback.summary,
    riskLevel,
    permissions: coerceStringList(value.permissions, fallback.permissions),
    contributions: coerceStringList(value.contributions, fallback.contributions),
    files: coerceStringList(value.files, fallback.files).map((file) => file.replaceAll(fallback.slug, slug)),
    reviewItems: coerceStringList(value.reviewItems, fallback.reviewItems),
    creationPath: `user-data/extensions/${slug}`,
  });
}

export async function draftExtensionPlanWithModel(
  messages: IExtensionBuilderMessage[],
  fallbackIdea: string
): Promise<IExtensionBuilderDraftResult> {
  const transcript = messages
    .map((message) => `${message.role === 'user' ? 'User' : 'Builder'}: ${message.content}`)
    .join('\n\n');
  const content = await oneShotCompleteBest(
    [
      'You are the Wayland Extension Builder.',
      'Turn a user conversation into one reviewable extension plan.',
      'Return only JSON with keys: name, slug, summary, riskLevel, permissions, contributions, files, reviewItems, reply.',
      'riskLevel must be safe, moderate, or dangerous.',
      'Slug must be kebab-case.',
      'Do not propose settingsTabs, settings pages, host bridges, or HTML tabs for local builder output.',
      'Local builder output may scaffold MCP servers and other non-host-bridge contributions.',
      'Prefer grouped job-based extensions, not one page per tiny feature.',
      '',
      `Conversation:\n${transcript}`,
      '',
      `Fallback idea:\n${fallbackIdea}`,
    ].join('\n'),
    { maxTokens: 1600, timeoutMs: 45_000 }
  );
  const parsed = extractJsonObject(content) as Record<string, unknown>;
  return {
    plan: normalizeModelPlan(parsed, fallbackIdea),
    reply:
      typeof parsed.reply === 'string' && parsed.reply.trim()
        ? parsed.reply.trim()
        : 'I drafted a reviewable extension plan from the conversation.',
    source: 'ai',
    model: 'configured model',
  };
}

function renderBuilderMcpStub(plan: IExtensionBuilderPlan): string {
  return `#!/usr/bin/env node
const manifest = {
  name: ${JSON.stringify(plan.slug)},
  title: ${JSON.stringify(plan.name)},
  summary: ${JSON.stringify(plan.summary)}
};

process.stdin.setEncoding('utf8');
let buffer = '';

function send(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\\n');
}

function sendError(id, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code: -32603, message } }) + '\\n');
}

function handle(message) {
  if (message.method === 'initialize') {
    send(message.id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: manifest.name, version: '0.1.0' }
    });
    return;
  }
  if (message.method === 'tools/list') {
    send(message.id, {
      tools: [{
        name: manifest.name + '_status',
        description: 'Return scaffold status for ' + manifest.title,
        inputSchema: { type: 'object', properties: {} }
      }]
    });
    return;
  }
  if (message.method === 'tools/call' && message.params?.name === manifest.name + '_status') {
    send(message.id, {
      content: [{ type: 'text', text: manifest.title + ' scaffold is installed. ' + manifest.summary }]
    });
    return;
  }
  if (message.id !== undefined) {
    sendError(message.id, 'Method not implemented in scaffold: ' + message.method);
  }
}

process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let index;
  while ((index = buffer.indexOf('\\n')) >= 0) {
    const line = buffer.slice(0, index).trim();
    buffer = buffer.slice(index + 1);
    if (!line) continue;
    try {
      handle(JSON.parse(line));
    } catch (error) {
      sendError(null, error instanceof Error ? error.message : String(error));
    }
  }
});
`;
}

function renderBuilderReadme(plan: IExtensionBuilderPlan): string {
  const lines = [
    `# ${plan.name}`,
    '',
    plan.summary,
    '',
    '## Generated Scaffold',
    '',
    'This extension was generated by the local Wayland Extension Builder.',
    '',
    'Local builder output intentionally avoids settings tabs and other host-bridge UI surfaces. Those are first-party bundled only until the centralized approval layer exists.',
    '',
    '## Review Checklist',
    '',
    ...plan.reviewItems.map((item) => `- ${item}`),
    '',
    '## Smoke Test',
    '',
    `Enable the extension, then call the \`${plan.slug}_status\` MCP tool. It should report that the scaffold is installed.`,
    '',
  ];

  return `${lines.join('\n')}\n`;
}

function renderBuilderIcon(plan: IExtensionBuilderPlan): string {
  const initials = plan.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${escapeHtml(plan.name)}">
  <rect width="64" height="64" rx="14" fill="#165DFF"/>
  <path d="M17 42V22h30v20H17Zm4-4h22V26H21v12Z" fill="#fff" opacity=".92"/>
  <text x="32" y="36" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="12" font-weight="700" fill="#165DFF">${escapeHtml(
    initials || 'EX'
  )}</text>
</svg>
`;
}

export async function createExtensionFromBuilderPlan(
  requestedPlan: IExtensionBuilderPlan
): Promise<IExtensionBuilderCreateResult> {
  const plan = normalizeLocalBuilderPlan(requestedPlan);
  const slug = normalizeBuilderSlug(plan.slug);
  const displayName = plan.name.trim() || slug;
  const installRoot = getInstallTargetDir();
  const targetDir = path.join(installRoot, slug);
  const relativeFiles = new Set<string>(['aion-extension.json', 'README.md', `assets/${slug}.svg`]);
  const needsMcp = planIncludes(plan, 'mcp') || !plan.contributions.length;
  const needsShell = planIncludes(plan, 'shell');
  const needsFilesystem = planIncludes(plan, 'filesystem');
  const needsNetwork = planIncludes(plan, 'network');

  try {
    await fs.mkdir(installRoot, { recursive: true });
    await fs.mkdir(targetDir, { recursive: false });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'EEXIST') {
      throw new Error(`Extension "${slug}" already exists. Choose a different package name before creating it.`, {
        cause: error,
      });
    }
    throw error;
  }

  try {
    await fs.mkdir(path.join(targetDir, 'assets'), { recursive: true });

    const contributes: ExtContributes = {};
    if (needsMcp) {
      const mcpFile = `mcp/${slug}.js`;
      await fs.mkdir(path.join(targetDir, 'mcp'), { recursive: true });
      await fs.writeFile(path.join(targetDir, mcpFile), renderBuilderMcpStub({ ...plan, slug, name: displayName }), {
        encoding: 'utf-8',
        mode: 0o755,
      });
      relativeFiles.add(mcpFile);
      contributes.mcpServers = [
        {
          name: slug,
          description: plan.summary,
          transport: {
            type: 'stdio',
            command: 'node',
            args: [path.join(targetDir, mcpFile)],
          },
          enabled: true,
        },
      ];
    }

    await fs.writeFile(
      path.join(targetDir, 'assets', `${slug}.svg`),
      renderBuilderIcon({ ...plan, slug, name: displayName }),
      'utf-8'
    );
    await fs.writeFile(
      path.join(targetDir, 'README.md'),
      renderBuilderReadme({ ...plan, slug, name: displayName }),
      'utf-8'
    );

    const manifest = {
      name: slug,
      displayName,
      version: '0.1.0',
      description: plan.summary,
      author: 'Wayland Extension Builder',
      icon: `assets/${slug}.svg`,
      apiVersion: '^1.0.0',
      engine: {
        wayland: '>=0.11.0 <1.0.0',
      },
      permissions: {
        storage: true,
        network: needsNetwork
          ? {
              allowedDomains: ['example.com'],
              reasoning: 'Replace with the real host allow-list before enabling network calls.',
            }
          : false,
        shell: needsShell,
        filesystem: needsFilesystem ? 'workspace' : 'extension-only',
        clipboard: false,
        activeUser: false,
        events: true,
      },
      contributes,
    };

    const validation = ExtensionManifestSchema.safeParse(manifest);
    if (!validation.success) {
      throw new Error(validation.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '));
    }

    await fs.writeFile(
      path.join(targetDir, 'aion-extension.json'),
      `${JSON.stringify(validation.data, null, 2)}\n`,
      'utf-8'
    );

    await ExtensionRegistry.hotReload();

    return {
      name: slug,
      displayName,
      directory: targetDir,
      files: Array.from(relativeFiles).toSorted(),
      restartRequired: false,
    };
  } catch (error) {
    await fs.rm(targetDir, { recursive: true, force: true }).catch((): undefined => undefined);
    throw error;
  }
}

/**
 * Initialize IPC bridge for extension system.
 * Provides extension-contributed themes (and future extension data) to the renderer process.
 */
export function initExtensionsBridge(repo: IConversationRepository, taskManager: IWorkerTaskManager): void {
  const getActivitySnapshot = makeGetActivitySnapshot(new ActivitySnapshotBuilder(repo, taskManager));
  // Get all extension-contributed CSS themes (converted to ICssTheme format)
  ipcBridge.extensions.getThemes.provider(async () => {
    try {
      const registry = ExtensionRegistry.getInstance();
      return registry.getThemes();
    } catch (error) {
      console.error('[Extensions] Failed to get themes:', error);
      return [];
    }
  });

  // Get summary of all loaded extensions (with enabled/disabled status and permissions)
  ipcBridge.extensions.getLoadedExtensions.provider(async () => {
    try {
      const registry = ExtensionRegistry.getInstance();
      return registry.getLoadedExtensions().map((ext) => {
        const state = registry.getExtensionState(ext.manifest.name);
        return {
          name: ext.manifest.name,
          displayName: ext.manifest.displayName,
          version: ext.manifest.version,
          description: ext.manifest.description,
          author: ext.manifest.author,
          homepage: ext.manifest.homepage,
          icon: ext.manifest.icon,
          apiVersion: ext.manifest.apiVersion,
          engine: ext.manifest.engine,
          dependencies: ext.manifest.dependencies,
          source: ext.source,
          directory: ext.directory,
          enabled: registry.isExtensionEnabled(ext.manifest.name),
          disabledReason: state?.disabledReason,
          installError: state?.installError,
          riskLevel: registry.getExtensionRiskLevel(ext.manifest.name),
          permissionReview: state?.permissionReview
            ? {
                approvedAt: state.permissionReview.approvedAt.toISOString(),
                approvedRiskLevel: state.permissionReview.approvedRiskLevel,
                approvedPermissions: state.permissionReview.approvedPermissions,
              }
            : undefined,
          hasLifecycle: !!ext.manifest.lifecycle,
          contributes: countContributions(ext.manifest.contributes),
        };
      });
    } catch (error) {
      console.error('[Extensions] Failed to get loaded extensions:', error);
      return [];
    }
  });

  // Get all extension-contributed assistants
  ipcBridge.extensions.getAssistants.provider(async () => {
    try {
      const registry = ExtensionRegistry.getInstance();
      return registry.getAssistants();
    } catch (error) {
      console.error('[Extensions] Failed to get assistants:', error);
      return [];
    }
  });

  // Get all extension-contributed ACP adapters
  ipcBridge.extensions.getAcpAdapters.provider(async () => {
    try {
      const registry = ExtensionRegistry.getInstance();
      return registry.getAcpAdapters();
    } catch (error) {
      console.error('[Extensions] Failed to get ACP adapters:', error);
      return [];
    }
  });

  // Get all extension-contributed agents (autonomous agent presets)
  ipcBridge.extensions.getAgents.provider(async () => {
    try {
      const registry = ExtensionRegistry.getInstance();
      return registry.getAgents();
    } catch (error) {
      console.error('[Extensions] Failed to get agents:', error);
      return [];
    }
  });

  // Get all extension-contributed MCP servers
  ipcBridge.extensions.getMcpServers.provider(async () => {
    try {
      const registry = ExtensionRegistry.getInstance();
      return registry.getMcpServers();
    } catch (error) {
      console.error('[Extensions] Failed to get MCP servers:', error);
      return [];
    }
  });

  // Get all extension-contributed skills
  ipcBridge.extensions.getSkills.provider(async () => {
    try {
      const registry = ExtensionRegistry.getInstance();
      return registry.getSkills();
    } catch (error) {
      console.error('[Extensions] Failed to get skills:', error);
      return [];
    }
  });

  // Get all extension-contributed settings tabs
  ipcBridge.extensions.getSettingsTabs.provider(async () => {
    try {
      const registry = ExtensionRegistry.getInstance();
      return registry.getSettingsTabs();
    } catch (error) {
      console.error('[Extensions] Failed to get settings tabs:', error);
      return [];
    }
  });

  // Get extension-contributed WebUI metadata (api routes + static assets)
  ipcBridge.extensions.getWebuiContributions.provider(async () => {
    try {
      const registry = ExtensionRegistry.getInstance();
      return registry.getWebuiContributions().map((item) => ({
        extensionName: item.extensionName,
        apiRoutes: (item.config.apiRoutes || []).map((route) => ({
          path: route.path,
          auth: route.auth !== false,
        })),
        staticAssets: (item.config.staticAssets || []).map((asset) => ({
          urlPrefix: asset.urlPrefix,
          directory: asset.directory,
        })),
      }));
    } catch (error) {
      console.error('[Extensions] Failed to get webui contributions:', error);
      return [];
    }
  });

  // Get activity snapshot for extension settings tabs (e.g. Star Office)
  ipcBridge.extensions.getAgentActivitySnapshot.provider(async () => {
    try {
      return await getActivitySnapshot();
    } catch (error) {
      console.error('[Extensions] Failed to build agent activity snapshot:', error);
      return {
        generatedAt: Date.now(),
        totalConversations: 0,
        runningConversations: 0,
        agents: [],
      };
    }
  });

  // Get merged extension i18n translations for a specific locale
  ipcBridge.extensions.getExtI18nForLocale.provider(async ({ locale }) => {
    try {
      const registry = ExtensionRegistry.getInstance();
      return registry.getExtI18nForLocale(locale);
    } catch (error) {
      console.error('[Extensions] Failed to get ext i18n for locale:', error);
      return {};
    }
  });

  // --- Extension Management API (NocoBase-inspired) ---

  ipcBridge.extensions.draftBuilderPlan.provider(async ({ messages, fallbackIdea }) => {
    try {
      const drafted = await draftExtensionPlanWithModel(messages, fallbackIdea);
      return {
        success: true,
        data: drafted,
      };
    } catch (error) {
      console.warn('[Extensions] AI builder draft failed; using fallback plan:', error);
      return {
        success: true,
        data: {
          plan: createFallbackBuilderPlan(fallbackIdea),
          source: 'fallback',
          error: error instanceof Error ? error.message : String(error),
          reply: 'I could not reach a model cleanly, so I drafted a fallback plan you can still review and edit.',
        },
      };
    }
  });

  ipcBridge.extensions.createFromBuilder.provider(async ({ plan }) => {
    try {
      const created = await createExtensionFromBuilderPlan(plan);
      const registry = ExtensionRegistry.getInstance();
      ipcBridge.extensions.stateChanged.emit({
        name: created.name,
        enabled: registry.isExtensionEnabled(created.name),
      });
      return {
        success: true,
        data: created,
      };
    } catch (error) {
      console.error('[Extensions] Failed to create extension from builder:', error);
      return {
        success: false,
        msg: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Enable an extension
  ipcBridge.extensions.enableExtension.provider(async ({ name }) => {
    try {
      const registry = ExtensionRegistry.getInstance();
      const success = await registry.enableExtension(name);
      if (success) {
        ipcBridge.extensions.stateChanged.emit({ name, enabled: true });
      }
      return {
        success,
        msg: success ? undefined : `Failed to enable "${name}"`,
      };
    } catch (error) {
      console.error(`[Extensions] Failed to enable "${name}":`, error);
      return {
        success: false,
        msg: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Disable an extension
  ipcBridge.extensions.disableExtension.provider(async ({ name, reason }) => {
    try {
      const registry = ExtensionRegistry.getInstance();
      const success = await registry.disableExtension(name, reason);
      if (success) {
        ipcBridge.extensions.stateChanged.emit({
          name,
          enabled: false,
          reason,
        });
      }
      return {
        success,
        msg: success ? undefined : `Failed to disable "${name}"`,
      };
    } catch (error) {
      console.error(`[Extensions] Failed to disable "${name}":`, error);
      return {
        success: false,
        msg: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcBridge.extensions.approvePermissions.provider(async ({ name }) => {
    try {
      const registry = ExtensionRegistry.getInstance();
      const state = registry.approveExtensionPermissions(name);
      if (!state) {
        return {
          success: false,
          msg: `Failed to approve permissions for "${name}"`,
        };
      }
      ipcBridge.extensions.stateChanged.emit({ name, enabled: state.enabled });
      return { success: true };
    } catch (error) {
      console.error(`[Extensions] Failed to approve permissions for "${name}":`, error);
      return {
        success: false,
        msg: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcBridge.extensions.revokePermissionApproval.provider(async ({ name }) => {
    try {
      const registry = ExtensionRegistry.getInstance();
      const state = await registry.revokeExtensionPermissionApproval(name);
      if (!state) {
        return {
          success: false,
          msg: `Failed to revoke permission approval for "${name}"`,
        };
      }
      ipcBridge.extensions.stateChanged.emit({ name, enabled: state.enabled });
      return { success: true };
    } catch (error) {
      console.error(`[Extensions] Failed to revoke permission approval for "${name}":`, error);
      return {
        success: false,
        msg: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Get permission summary for an extension (Figma-inspired)
  ipcBridge.extensions.getPermissions.provider(async ({ name }) => {
    try {
      const registry = ExtensionRegistry.getInstance();
      return registry.getExtensionPermissions(name);
    } catch (error) {
      console.error(`[Extensions] Failed to get permissions for "${name}":`, error);
      return [];
    }
  });

  // Get risk level for an extension
  ipcBridge.extensions.getRiskLevel.provider(async ({ name }) => {
    try {
      const registry = ExtensionRegistry.getInstance();
      return registry.getExtensionRiskLevel(name);
    } catch (error) {
      console.error(`[Extensions] Failed to get risk level for "${name}":`, error);
      return 'safe';
    }
  });
}
