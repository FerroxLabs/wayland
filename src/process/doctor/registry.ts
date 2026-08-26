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
import { app } from 'electron';
import { agentRegistry } from '@process/agent/AgentRegistry';
import { getDatabase } from '@process/services/database';
import { ProviderRepository } from '@process/providers/storage/ProviderRepository';
import { ConnectionTester } from '@process/providers/detection/ConnectionTester';
import { Curator } from '@process/providers/catalog/Curator';
import type { ProviderId } from '@process/providers/types';
import { detectWCore, resolveWCoreBinary } from '@process/agent/wcore/binaryResolver';
import { DESKTOP_CORE_V1_PIN } from '@process/agent/wcore/desktopContractV1';
import { nativeConfigDir } from '@process/agent/wcore/profilePaths';
import { getConfigPath } from '@process/utils/utils';
import { isEncryptionAvailable } from '@process/secrets/safeStorage';
import { getConstitutionFsService } from '@process/services/constitution/constitutionFsService';
import { mcpService } from '@process/services/mcpServices/McpService';
import { ProcessConfig } from '@process/utils/initStorage';
import type { IMcpServer } from '@/common/config/storage';
import { projectServiceSingleton } from '@process/services/projectServiceSingleton';
import { conversationServiceSingleton } from '@process/services/conversationServiceSingleton';
import { defaultWorkspaceBaseDir } from '@process/services/projectWorkspace';
import type { DoctorCheck } from './types';
import { extractFromFile } from './fileMarker';

/**
 * The contract schema digest a Core binary advertises, as embedded in its own
 * manifest. Verified against the real binary: the manifest is compact JSON, so
 * the digest appears exactly once in `"key":"value"` form. The string
 * `schema_digest` also occurs twice more as an interned Rust string-table
 * entry (`schema_digestsource_inputs_digestavailable…`), which is why the
 * pattern requires the full JSON shape rather than just the key name.
 */
const SCHEMA_DIGEST_PATTERN = /"schema_digest"\s*:\s*"(sha256:[0-9a-f]{64})"/;

/** Comfortably longer than the ~90-character match, so no boundary can split it. */
const SCHEMA_DIGEST_LOOKBACK = 256;
import { checkProviderConnectivity, checkModelRegistrySanity } from './checks/providerChecks';
import { checkEngineReachable, checkEngineRouting, checkEngineContractPin } from './checks/engineChecks';
import { checkMcpServers } from './checks/mcpChecks';
import { checkBackends } from './checks/backendChecks';
import { checkWorkspaceDrift, checkWorkspaceConfigured } from './checks/workspaceChecks';
import { checkSecretStorage, checkEngineConfigIntegrity, checkConfigPaths } from './checks/configChecks';
import { checkAppArchitecture } from './checks/platformChecks';
import { checkConstitutionActive, type ConstitutionCapability } from './checks/constitutionChecks';
import { probeEngineConfig } from './engineConfigProbe';
import { collectConfiguredWorkspaces, collectWorkspaceConfigEntries } from './workspaceInventory';
import type { WorkspaceInventoryDeps } from './workspaceInventory';

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
 * Build the ordered list of Doctor checks with live dependencies bound.
 *
 * The order here is the display order in the UI. Each entry binds its pure
 * check to real singletons; the checks never reach a singleton themselves.
 */
export function buildDoctorChecks(): DoctorCheck[] {
  const connectionTester = new ConnectionTester();
  const listingServices = {
    listProjects: () => projectServiceSingleton.listProjects(),
    listConversations: () => conversationServiceSingleton.listAllConversations(),
  };
  /**
   * The listing services PLUS the app's own workspace base dir, which the
   * inventory needs to know which paths are app-derived and must have their leaf
   * withheld (a project's default workspace is `<base>/<project-name>`, so the
   * name IS the path). Read through `defaultWorkspaceBaseDir` rather than
   * rebuilding the literal here - a second copy would fail open silently if the
   * allocator's base ever moves. A failure to resolve it yields `null`, which the
   * inventory treats as "withhold nothing" rather than crashing the check.
   */
  const workspaceServices = async (): Promise<WorkspaceInventoryDeps> => ({
    ...listingServices,
    appManagedWorkspaceBase: await defaultWorkspaceBaseDir().catch((): string | null => null),
  });

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
      id: 'engine.contractPin',
      titleKey: 'settings.doctor.checks.engineContractPin',
      category: 'engine',
      run: () => {
        // `resolveWCoreBinary`, not `detectWCore`: the latter shells out to the
        // engine with `--version` on every call, and this check needs the PATH
        // twice. Two redundant synchronous spawns on the main process for a
        // string we do not use is a poor trade.
        const binary = resolveWCoreBinary();
        return checkEngineContractPin(
          {
            binaryPath: () => binary ?? undefined,
            advertisedSchemaDigest: () =>
              binary ? extractFromFile(binary, SCHEMA_DIGEST_PATTERN, SCHEMA_DIGEST_LOOKBACK) : Promise.resolve(null),
          },
          DESKTOP_CORE_V1_PIN.schemaDigest
        );
      },
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
      run: async () => {
        const services = await workspaceServices();
        return checkWorkspaceDrift({ listWorkspaces: () => collectConfiguredWorkspaces(services), pathExists });
      },
    },
    {
      id: 'workspace.configured',
      titleKey: 'settings.doctor.checks.workspaceConfigured',
      category: 'workspace',
      run: async () => {
        const services = await workspaceServices();
        return checkWorkspaceConfigured({
          listWorkspaces: () => collectWorkspaceConfigEntries(services),
          tmpDir: tmpdir(),
        });
      },
    },
    {
      id: 'config.paths',
      titleKey: 'settings.doctor.checks.configPaths',
      category: 'config',
      run: () => checkConfigPaths({ appConfigDir: getConfigPath, engineConfigDir: nativeConfigDir }),
    },
    {
      // Grouped under `config` deliberately: it belongs with the other
      // "is this install set up correctly" checks, and `category` exists only
      // to group checks — no new union member is warranted for one check.
      id: 'config.appArchitecture',
      titleKey: 'settings.doctor.checks.appArchitecture',
      category: 'config',
      run: () =>
        checkAppArchitecture({
          platform: process.platform,
          arch: process.arch,
          // Undefined on Linux (the property is darwin/win32 only).
          runningUnderARM64Translation: app.runningUnderARM64Translation === true,
        }),
    },
    {
      // #1040: on win32 the Constitution FS helper does not ship, so both the
      // Constitution and the specialist overlay are silently dropped from every
      // system prompt. Doctor is where a user - and a support thread - can find
      // that out.
      id: 'config.constitution',
      titleKey: 'settings.doctor.checks.constitution',
      category: 'config',
      run: () =>
        checkConstitutionActive({
          platform: process.platform,
          // The service is initialised during bootstrap. Reading it defensively
          // keeps a Doctor run that happens before (or after a failed) bootstrap
          // reporting "could not read" rather than dying into the runner's
          // catch-all as an opaque `fail`.
          capability: ((): ConstitutionCapability | null => {
            try {
              return getConstitutionFsService().capability();
            } catch {
              return null;
            }
          })(),
        }),
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
      // `probeEngineConfig`, not an inline read: it is the sanitisation point
      // for GHSA-2g2m-r86j-jg6h (the raw `smol-toml` message echoes the user's
      // own config lines, `api_key`s included, and Doctor reports get copied
      // into support threads), and it lives in its own Electron-free module so
      // that boundary is reachable from a unit test.
      run: () => checkEngineConfigIntegrity(() => probeEngineConfig()),
    },
  ];
}
