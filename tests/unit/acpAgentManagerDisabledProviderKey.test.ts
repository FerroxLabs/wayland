/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Issue #685 - a provider the user switched OFF must not have its API key
 * injected into an ACP backend spawn.
 *
 * `buildConnectedProviderEnv` used to ask exactly two questions: is the provider
 * `connected`, and is there a stored key. It never asked whether the user had
 * disabled the provider's models. The Models-page provider switch writes
 * per-model `enabled: false` rows into `model_registry_overrides`; it does NOT
 * change `provider.state`. So a user on a Claude Code SUBSCRIPTION who toggled
 * Anthropic off still had `ANTHROPIC_API_KEY` handed to the `claude` CLI - and
 * the CLI prefers an API key over a subscription. A real customer drained her
 * API quota in two days that way.
 *
 * The regression trap these tests exist to nail down: the overrides table
 * records ONLY models the user explicitly toggled. Zero rows means "the curated
 * defaults apply", NOT "nothing is enabled" - `[].every()` is `true`, so a naive
 * all-overrides-are-false check would strip the key from EVERY freshly connected
 * provider and break authentication for everyone. A provider is skipped only
 * when it has at least one explicit override AND nothing it offers is
 * effectively enabled (curated catalog defaults + custom models, overrides
 * applied) - the same notion the Models page provider switch renders.
 *
 * Mock scaffolding mirrors acpAgentManagerDbErrorLogging.test.ts. The
 * ProviderRepository is faked (it needs SQLite + the OS keychain), but the
 * Curator is the REAL one, so the catalog-defaults half of the gate is
 * genuinely exercised.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { CatalogModel } from '../../src/process/providers/types';
import type { RegistryCredsResult, RegistryOverride } from '../../src/process/providers/storage/ProviderRepository';

/** Everything the faked ProviderRepository serves, rewritten per test. */
type Fixture = {
  providers: Array<{ providerId: string; connectedVia: string; state: string; credsEncrypted: string }>;
  creds: Record<string, RegistryCredsResult>;
  overrides: Record<string, RegistryOverride[]>;
  catalog: Record<string, CatalogModel[]>;
  customModels: Record<string, string[]>;
};

const { fixture } = vi.hoisted(() => ({
  fixture: { providers: [], creds: {}, overrides: {}, catalog: {}, customModels: {} } as Fixture,
}));

vi.mock('@process/providers/storage/ProviderRepository', () => ({
  ProviderRepository: class {
    listRegistryProviders() {
      return fixture.providers;
    }
    getRegistryProviderCreds(providerId: string): RegistryCredsResult {
      return fixture.creds[providerId] ?? { status: 'not-found' };
    }
    listRegistryOverrides(providerId: string): RegistryOverride[] {
      return fixture.overrides[providerId] ?? [];
    }
    getRegistryCatalog(providerId: string): CatalogModel[] {
      return fixture.catalog[providerId] ?? [];
    }
    listCustomModels(providerId: string): string[] {
      return fixture.customModels[providerId] ?? [];
    }
  },
}));

vi.mock('@process/services/cron/CronBusyGuard', () => ({
  cronBusyGuard: { setProcessing: vi.fn(), isProcessing: vi.fn(() => false) },
}));
vi.mock('@process/utils/mainLogger', () => ({ mainLog: vi.fn(), mainWarn: vi.fn(), mainError: vi.fn() }));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { getConfig: vi.fn(() => ({})), get: vi.fn() },
}));
vi.mock('@/common', () => ({ ipcBridge: { acpConversation: { responseStream: { emit: vi.fn() } } } }));
vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(() => Promise.resolve({ getDriver: () => ({}), updateConversation: vi.fn() })),
}));
vi.mock('@process/utils/message', () => ({
  addMessage: vi.fn(),
  addOrUpdateMessage: vi.fn(),
  nextTickToLocalFinish: vi.fn((cb: () => void) => cb()),
}));
vi.mock('@process/channels/agent/ChannelEventBus', () => ({
  channelEventBus: { emit: vi.fn(), on: vi.fn(), off: vi.fn(), emitAgentMessage: vi.fn() },
}));
vi.mock('@process/utils/previewUtils', () => ({ handlePreviewOpenEvent: vi.fn() }));
vi.mock('@process/extensions', () => ({
  ExtensionRegistry: { getInstance: vi.fn(() => ({ getAll: vi.fn(() => []), getAcpAdapters: vi.fn(() => []) })) },
}));
vi.mock('@process/agent/acp', () => ({
  AcpAgent: class {
    sendMessage = vi.fn().mockResolvedValue({ success: true });
    stop = vi.fn();
    kill = vi.fn();
    cancelPrompt = vi.fn();
  },
}));
vi.mock('@process/task/BaseAgentManager', () => ({
  default: class {
    conversation_id = '';
    status: string | undefined;
    workspace = '';
    bootstrapping = false;
    yoloMode = false;
    constructor(_type: string, data: Record<string, unknown>, _emitter: unknown) {
      if (data?.conversation_id) this.conversation_id = data.conversation_id as string;
      if (data?.workspace) this.workspace = data.workspace as string;
    }
    isYoloMode() {
      return false;
    }
    addConfirmation() {}
    getConfirmations() {
      return [];
    }
  },
}));
vi.mock('@process/task/ConversationTurnCompletionService', () => ({
  ConversationTurnCompletionService: { getInstance: () => ({ notifyPotentialCompletion: vi.fn() }) },
}));
vi.mock('@process/task/IpcAgentEventEmitter', () => ({ IpcAgentEventEmitter: vi.fn() }));
vi.mock('@process/task/CronCommandDetector', () => ({ hasCronCommands: vi.fn(() => false) }));
vi.mock('@process/task/MessageMiddleware', () => ({
  extractTextFromMessage: vi.fn(() => ''),
  processCronInMessage: vi.fn((x: unknown) => x),
}));
vi.mock('@process/task/ThinkTagDetector', () => ({ stripThinkTags: vi.fn((x: unknown) => x) }));
vi.mock('@process/utils/initAgent', () => ({ hasNativeSkillSupport: vi.fn(() => false) }));
vi.mock('@process/task/agentUtils', () => ({
  prepareFirstMessageWithSkillsIndex: vi.fn((x: string) => Promise.resolve({ content: x, loadedSkills: [] })),
  isConciergeAssistant: vi.fn(() => false),
}));
vi.mock('@/common/utils', () => ({ parseError: vi.fn((e: unknown) => e), uuid: vi.fn(() => 'test-uuid') }));
vi.mock('@/common/chat/chatLib', () => ({ transformMessage: vi.fn(), uuid: vi.fn(() => 'uuid') }));

import AcpAgentManager from '../../src/process/task/AcpAgentManager';
import type { AcpBackend } from '../../src/common/types/acpTypes';

const ANTHROPIC_KEY = 'sk-ant-from-the-in-app-registry';
const OPENAI_KEY = 'sk-openai-from-the-in-app-registry';

/** An enriched, dated catalog model - the Curator curates this `enabled: true`. */
function catalogModel(id: string, family: string, providerId: string): CatalogModel {
  return {
    id,
    providerId: providerId as CatalogModel['providerId'],
    displayName: id,
    family,
    kind: 'text',
    releaseDate: '2026-02-01',
    enriched: true,
    tags: [],
  };
}

const ANTHROPIC_CATALOG = [
  catalogModel('claude-opus-4', 'claude-opus', 'anthropic'),
  catalogModel('claude-sonnet-4', 'claude-sonnet', 'anthropic'),
];

/** A connected Anthropic + a connected OpenAI, both with a stored API key. */
function connectTwoProviders(): void {
  fixture.providers = [
    { providerId: 'anthropic', connectedVia: 'api-key', state: 'connected', credsEncrypted: 'x' },
    { providerId: 'openai', connectedVia: 'api-key', state: 'connected', credsEncrypted: 'x' },
  ];
  fixture.creds = {
    anthropic: { status: 'ok', creds: { key: ANTHROPIC_KEY } },
    openai: { status: 'ok', creds: { key: OPENAI_KEY } },
  };
  fixture.catalog = { anthropic: ANTHROPIC_CATALOG, openai: [catalogModel('gpt-5', 'gpt', 'openai')] };
}

function makeManager() {
  return new AcpAgentManager({
    conversation_id: 'conv-685',
    backend: 'claude' as AcpBackend,
    workspace: '/tmp/workspace',
  });
}

/** Drive the real private `buildConnectedProviderEnv` and read back its env. */
async function buildEnv(manager: AcpAgentManager): Promise<Record<string, string>> {
  return (
    manager as unknown as { buildConnectedProviderEnv: () => Promise<Record<string, string>> }
  ).buildConnectedProviderEnv();
}

/** What the manager recorded as injected - drives auth-failure invalidation. */
function injectedIds(manager: AcpAgentManager): string[] {
  return (manager as unknown as { injectedProviderKeys: Array<{ providerId: string }> }).injectedProviderKeys.map(
    (i) => i.providerId
  );
}

describe('buildConnectedProviderEnv respects the provider off switch (#685)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fixture.providers = [];
    fixture.creds = {};
    fixture.overrides = {};
    fixture.catalog = {};
    fixture.customModels = {};
  });

  it('does NOT inject the key of a provider whose every model is toggled off', async () => {
    connectTwoProviders();
    // The Models-page provider switch turned OFF: an explicit `false` row for
    // every model that was on. This is the customer's exact state - Claude Code
    // subscription selected, Anthropic API models switched off.
    fixture.overrides = {
      anthropic: [
        { modelId: 'claude-opus-4', enabled: false },
        { modelId: 'claude-sonnet-4', enabled: false },
      ],
    };

    const manager = makeManager();
    const env = await buildEnv(manager);

    expect(env).not.toHaveProperty('ANTHROPIC_API_KEY');
    // Only the disabled provider is skipped - the other connection is untouched.
    expect(env.OPENAI_API_KEY).toBe(OPENAI_KEY);
    // Bookkeeping must agree with what was actually injected, or
    // maybeInvalidateProviderKeyOnAuthError would invalidate a provider whose
    // key never reached the spawn.
    expect(injectedIds(manager)).toEqual(['openai']);
  });

  it('injects the key when at least one model override is still enabled', async () => {
    connectTwoProviders();
    fixture.overrides = {
      anthropic: [
        { modelId: 'claude-opus-4', enabled: false },
        { modelId: 'claude-sonnet-4', enabled: true },
      ],
    };

    const env = await buildEnv(makeManager());

    expect(env.ANTHROPIC_API_KEY).toBe(ANTHROPIC_KEY);
  });

  it('injects the key when the provider has ZERO override rows (fresh connect)', async () => {
    // The regression trap: `[].every(...)` is `true`. A freshly connected
    // provider has no override rows and runs on curated defaults, so it must
    // still be injected. Getting this wrong breaks auth for every new user.
    connectTwoProviders();
    fixture.overrides = {};

    const env = await buildEnv(makeManager());

    expect(env.ANTHROPIC_API_KEY).toBe(ANTHROPIC_KEY);
    expect(env.OPENAI_API_KEY).toBe(OPENAI_KEY);
  });

  it('injects the key when a catalog model outside the overrides is still on by default', async () => {
    // A catalog refresh after the user switched the provider off can publish a
    // new flagship, which the Curator enables BY DEFAULT and which has no
    // override row. The Models page reads the provider back ON, so the key must
    // flow again.
    connectTwoProviders();
    // `claude-sonnet-4` stands in for that new flagship: catalogued, enabled by
    // the Curator, and absent from the overrides table.
    fixture.overrides = { anthropic: [{ modelId: 'claude-opus-4', enabled: false }] };

    const env = await buildEnv(makeManager());

    expect(env.ANTHROPIC_API_KEY).toBe(ANTHROPIC_KEY);
  });

  it('injects the key when a custom model with no override is still enabled', async () => {
    // A user-typed custom model id is enabled by default and never appears in
    // the fetched catalog, so the overrides table alone cannot see it.
    connectTwoProviders();
    fixture.overrides = {
      anthropic: [
        { modelId: 'claude-opus-4', enabled: false },
        { modelId: 'claude-sonnet-4', enabled: false },
      ],
    };
    fixture.customModels = { anthropic: ['claude-experimental-preview'] };

    const env = await buildEnv(makeManager());

    expect(env.ANTHROPIC_API_KEY).toBe(ANTHROPIC_KEY);
  });
});
