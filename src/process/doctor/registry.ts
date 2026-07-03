/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Doctor check registry — wires each pure check to its real dependencies and
 * returns the ordered {@link DoctorCheck} list the runner executes.
 *
 * This is the ONLY module that reaches into the app's live singletons (the
 * provider repository, the agent registry, MCP service, project/conversation
 * services, the engine config bridge). The checks themselves stay dependency-
 * injected and unit-testable; this module is the composition root.
 *
 * Extensibility: adding a check is a single `{ id, titleKey, category, run }`
 * entry in `buildDoctorChecks` below — bind its dependencies inline.
 */

import { access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { agentRegistry } from '@process/agent/AgentRegistry';
import { getDatabase } from '@process/services/database';
import { ProviderRepository } from '@process/providers/storage/ProviderRepository';
import { ConnectionTester } from '@process/providers/detection/ConnectionTester';
import { Curator } from '@process/providers/catalog/Curator';
import type { ProviderId } from '@process/providers/types';
import { detectWCore } from '@process/agent/wcore/binaryResolver';
import { readConfig, resolveUserConfigPath } from '@process/agent/wcore/configBridge';
import { nativeConfigDir } from '@process/agent/wcore/profilePaths';
import { getConfigPath } from '@process/utils/utils';
import { isEncryptionAvailable } from '@process/secrets/safeStorage';
import { mcpService } from '@process/services/mcpServices/McpService';
import { ProcessConfig } from '@process/utils/initStorage';
import type { IMcpServer, TChatConversation } from '@/common/config/storage';
import type { IProject } from '@/common/types/project';
import { projectServiceSingleton } from '@process/services/projectServiceSingleton';
import { conversationServiceSingleton } from '@process/services/conversationServiceSingleton';
import type { DoctorCheck } from './types';
import { checkProviderConnectivity, checkModelRegistrySanity } from './checks/providerChecks';
import { checkEngineReachable, checkEngineRouting } from './checks/engineChecks';
import { checkMcpServers } from './checks/mcpChecks';
import { checkBackends } from './checks/backendChecks';
import {
  checkWorkspaceDrift,
  checkWorkspaceConfigured,
  type WorkspaceEntry,
  type WorkspaceConfigEntry,
} from './checks/workspaceChecks';
import { checkSecretStorage, checkEngineConfigIntegrity, checkConfigPaths } from './checks/configChecks';

/** Build a `ProviderRepository` bound to the live UI database. */
async function providerRepo(): Promise<ProviderRepository> {
  const db = await getDatabase();
  return new ProviderRepository(db.getDriver());
}

/**
 * Effectively-enabled model count for a provider — the curated catalog with the
 * user's per-model overrides applied, mirroring the Models page provider on/off
 * toggle (a provider reads "off" when this is `0`). Drives the Doctor's
 * skip-disabled rule (#271); the connectivity check treats a provider with a
 * non-empty catalog but `0` enabled models as user-switched-off.
 */
function countEnabledModels(repo: ProviderRepository, curator: Curator, providerId: ProviderId): number {
  const curated = curator.curate(repo.getRegistryCatalog(providerId));
  const overrides = new Map(repo.listRegistryOverrides(providerId).map((o) => [o.modelId, o.enabled]));
  let enabled = 0;
  for (const model of curated) {
    const override = overrides.get(model.id);
    if (override === undefined ? model.enabled : override) enabled += 1;
  }
  return enabled;
}

/** True when `path` exists on disk (an `fs.access` probe). */
async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * The persisted MCP server list (the `mcp.config` key the MCP Library writes).
 *
 * Read through `ProcessConfig` (the main-process, file-backed config) rather
 * than `ConfigStorage`. `ConfigStorage.get` is a renderer↔main bridge round-trip;
 * because this check runs INSIDE the `doctor.runDoctor` bridge invocation, a
 * nested bridge call never resolves (reentrancy) and the whole MCP check hangs
 * until the runner's 30s timeout — collapsing into the opaque "Check timed out
 * after 30s" with no per-server detail (issue #273). `ProcessConfig` reads the
 * same backing file directly in-process, so it resolves immediately and the
 * per-server probes below can actually run.
 */
async function listMcpServers(): Promise<IMcpServer[]> {
  return (await ProcessConfig.get('mcp.config').catch(() => [] as IMcpServer[])) ?? [];
}

/**
 * Collect every configured workspace path: project workspaces plus
 * conversation `extra.workspace` directories. Deduplicated by path so a project
 * and its conversations sharing a folder are reported once.
 */
async function listConfiguredWorkspaces(): Promise<WorkspaceEntry[]> {
  const entries: WorkspaceEntry[] = [];
  const seen = new Set<string>();

  const add = (label: string, path: unknown): void => {
    if (typeof path !== 'string' || path.trim().length === 0) return;
    if (seen.has(path)) return;
    seen.add(path);
    entries.push({ label, path });
  };

  const projects = await projectServiceSingleton.listProjects().catch((): IProject[] => []);
  for (const project of projects) {
    add(`Project "${project.name}"`, project.workspace);
  }

  const conversations = await conversationServiceSingleton.listAllConversations().catch((): TChatConversation[] => []);
  for (const conversation of conversations) {
    // `extra.workspace` exists on gemini/acp conversations; read defensively
    // since the union is wide and some kinds carry no workspace.
    const extra = conversation.extra as { workspace?: unknown } | undefined;
    add(`Chat "${conversation.name ?? conversation.id}"`, extra?.workspace);
  }

  return entries;
}

/**
 * Collect every configured workspace with its persistent-vs-temp classification
 * inputs: project workspaces (no `customWorkspace` flag → `null`) plus
 * conversation `extra.workspace` / `extra.customWorkspace`. Conversations that
 * carry no workspace binding at all are skipped (nothing to assess).
 */
async function listWorkspaceConfigEntries(): Promise<WorkspaceConfigEntry[]> {
  const entries: WorkspaceConfigEntry[] = [];

  const asPath = (value: unknown): string | null =>
    typeof value === 'string' && value.trim().length > 0 ? value : null;

  const projects = await projectServiceSingleton.listProjects().catch((): IProject[] => []);
  for (const project of projects) {
    entries.push({ label: `Project "${project.name}"`, path: asPath(project.workspace), customWorkspace: null });
  }

  const conversations = await conversationServiceSingleton.listAllConversations().catch((): TChatConversation[] => []);
  for (const conversation of conversations) {
    const extra = conversation.extra as { workspace?: unknown; customWorkspace?: unknown } | undefined;
    const path = asPath(extra?.workspace);
    const customWorkspace = typeof extra?.customWorkspace === 'boolean' ? extra.customWorkspace : null;
    if (path === null && customWorkspace === null) continue;
    entries.push({ label: `Chat "${conversation.name ?? conversation.id}"`, path, customWorkspace });
  }

  return entries;
}

/**
 * Build the ordered list of Doctor checks with live dependencies bound.
 *
 * The order here is the display order in the UI. Each entry binds its pure
 * check to real singletons; the checks never reach a singleton themselves.
 */
export function buildDoctorChecks(): DoctorCheck[] {
  const connectionTester = new ConnectionTester();

  return [
    {
      id: 'providers.connectivity',
      titleKey: 'settings.doctor.checks.providerConnectivity',
      category: 'providers',
      run: async () => {
        const repo = await providerRepo();
        const curator = new Curator();
        return checkProviderConnectivity(
          {
            listRegistryProviders: () => repo.listRegistryProviders(),
            getRegistryProviderCreds: (id) => repo.getRegistryProviderCreds(id),
            countRegistryCatalog: (id) => repo.countRegistryCatalog(id),
            countEnabledModels: (id) => countEnabledModels(repo, curator, id),
            hasModelOverrides: (id) => repo.listRegistryOverrides(id).length > 0,
          },
          connectionTester
        );
      },
    },
    {
      id: 'models.registry',
      titleKey: 'settings.doctor.checks.modelRegistry',
      category: 'models',
      run: async () => {
        const repo = await providerRepo();
        return checkModelRegistrySanity({
          listRegistryProviders: () => repo.listRegistryProviders(),
          getRegistryProviderCreds: (id) => repo.getRegistryProviderCreds(id),
          countRegistryCatalog: (id) => repo.countRegistryCatalog(id),
        });
      },
    },
    {
      id: 'engine.reachable',
      titleKey: 'settings.doctor.checks.engineReachable',
      category: 'engine',
      run: () => checkEngineReachable(detectWCore),
    },
    {
      id: 'engine.routing',
      titleKey: 'settings.doctor.checks.engineRouting',
      category: 'engine',
      run: async () => {
        const repo = await providerRepo();
        const providers = repo.listRegistryProviders();
        return checkEngineRouting({
          providerCount: () => providers.length,
          totalModelCount: () =>
            providers.reduce((sum, provider) => sum + repo.countRegistryCatalog(provider.providerId), 0),
        });
      },
    },
    {
      id: 'mcp.servers',
      titleKey: 'settings.doctor.checks.mcpServers',
      category: 'mcp',
      run: () =>
        checkMcpServers({
          listServers: listMcpServers,
          testConnection: (server) => mcpService.testMcpConnection(server),
        }),
    },
    {
      id: 'backends.detected',
      titleKey: 'settings.doctor.checks.backends',
      category: 'backends',
      run: () =>
        checkBackends({
          getDetectedAgents: () => agentRegistry.getDetectedAgents(),
          getLoadErrors: () => agentRegistry.getLoadErrors(),
        }),
    },
    {
      id: 'workspace.drift',
      titleKey: 'settings.doctor.checks.workspaceDrift',
      category: 'workspace',
      run: () => checkWorkspaceDrift({ listWorkspaces: listConfiguredWorkspaces, pathExists }),
    },
    {
      id: 'workspace.configured',
      titleKey: 'settings.doctor.checks.workspaceConfigured',
      category: 'workspace',
      run: () => checkWorkspaceConfigured({ listWorkspaces: listWorkspaceConfigEntries, tmpDir: tmpdir() }),
    },
    {
      id: 'config.paths',
      titleKey: 'settings.doctor.checks.configPaths',
      category: 'config',
      run: () => checkConfigPaths({ appConfigDir: getConfigPath, engineConfigDir: nativeConfigDir }),
    },
    {
      id: 'config.secretStorage',
      titleKey: 'settings.doctor.checks.secretStorage',
      category: 'config',
      run: () => checkSecretStorage(isEncryptionAvailable),
    },
    {
      id: 'config.engineConfig',
      titleKey: 'settings.doctor.checks.engineConfig',
      category: 'config',
      run: () =>
        checkEngineConfigIntegrity(async () => {
          const path = resolveUserConfigPath();
          const existed = await pathExists(path);
          try {
            await readConfig(path);
            return { status: 'ok', existed };
          } catch (error) {
            return { status: 'corrupt', message: error instanceof Error ? error.message : String(error) };
          }
        }),
    },
  ];
}
