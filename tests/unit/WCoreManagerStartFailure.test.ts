/**
 * WCoreManager bootstrap-failure honesty - unit test (bug S2)
 *
 * Regression guard: when the agent bootstrap (`start()`) fails (missing/old
 * wcore binary, auth failure, bad model config), the held turn must surface a
 * real error + finish instead of silently hanging with no reply, no error, and
 * no finish (the old `this.start().catch(() => {})` swallow left `this.agent`
 * null, so `sendMessage`'s `if (this.agent)` send was skipped and the turn
 * spun forever).
 *
 * Mirrors WCoreManagerProcessExit.test.ts's mock setup.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────

const { emitResponseStream, mockDb, mockMainError, agentStart } = vi.hoisted(() => ({
  emitResponseStream: vi.fn(),
  mockDb: {
    getConversationMessages: vi.fn(() => ({ data: [] })),
    getConversation: vi.fn(() => ({ success: false })),
    updateConversation: vi.fn(),
    createConversation: vi.fn(() => ({ success: true })),
    insertMessage: vi.fn(),
    updateMessage: vi.fn(),
  },
  mockMainError: vi.fn(),
  // Default: succeeds. Individual tests override to reject.
  agentStart: vi.fn().mockResolvedValue(undefined),
}));

// ── Module mocks ───────────────────────────────────────────────────

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      responseStream: { emit: emitResponseStream },
      confirmation: {
        add: { emit: vi.fn() },
        update: { emit: vi.fn() },
        remove: { emit: vi.fn() },
      },
    },
    cron: {
      onJobCreated: { emit: vi.fn() },
      onJobRemoved: { emit: vi.fn() },
    },
    cost: {
      budgetGateBlocked: { emit: vi.fn() },
    },
  },
}));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: { isPackaged: () => false, getAppPath: () => null, getLogsDir: () => '/test/logs' },
    worker: {
      fork: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        postMessage: vi.fn(),
        kill: vi.fn(),
      })),
    },
  }),
}));

vi.mock('@process/utils/shellEnv', () => ({
  getEnhancedEnv: vi.fn(() => ({})),
}));

vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(() => Promise.resolve(mockDb)),
}));

vi.mock('@process/services/database/export', () => ({
  getDatabase: vi.fn(() => Promise.resolve(mockDb)),
}));

vi.mock('@process/utils/initStorage', () => ({
  ProcessChat: { get: vi.fn(() => Promise.resolve([])) },
  ProcessConfig: {
    get: vi.fn((key: string) => Promise.resolve(key === 'wcore.rawEngineMode' ? false : undefined)),
    remove: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('@process/utils/message', () => ({
  addMessage: vi.fn(),
  addOrUpdateMessage: vi.fn(),
}));

vi.mock('@/common/utils', () => {
  let counter = 0;
  return { uuid: vi.fn(() => `uuid-${++counter}`) };
});

vi.mock('@/renderer/utils/common', () => {
  let counter = 0;
  return { uuid: vi.fn(() => `pipe-${++counter}`) };
});

vi.mock('@process/utils/mainLogger', () => ({
  mainError: mockMainError,
  mainLog: vi.fn(),
  mainWarn: vi.fn(),
}));

vi.mock('@process/services/cron/cronServiceSingleton', () => ({
  cronService: {
    addJob: vi.fn(async () => ({ id: 'cron-1', name: 'test', enabled: true })),
    removeJob: vi.fn(async () => {}),
    listJobsByConversation: vi.fn(async () => []),
  },
}));

vi.mock('@process/agent/wcore', () => ({
  // Use a plain function (not vi.fn) so test-level mock clearing/resetting can
  // never strip the constructor implementation (which previously produced
  // "WCoreAgent is not a constructor").
  WCoreAgent: function WCoreAgentMock(this: Record<string, unknown>) {
    this.start = agentStart;
    this.stop = vi.fn();
    this.kill = vi.fn();
    this.send = vi.fn().mockResolvedValue(undefined);
    this.approveTool = vi.fn();
    this.denyTool = vi.fn();
    this.setConfig = vi.fn();
    this.setMode = vi.fn();
    this.sendCommand = vi.fn();
    this.ping = vi.fn();
    this.isAlive = true;
    this.capabilities = null;
    this.injectConversationHistory = vi.fn().mockResolvedValue(undefined);
  },
}));

// Per-turn skill context helpers are best-effort and not under test here.
vi.mock('@/process/task/agentUtils', () => ({
  buildSystemInstructionsWithSkillsIndex: vi.fn(async () => undefined),
  buildTurnSkillContext: vi.fn(async () => ({ advert: undefined, autoLoaded: [] })),
  consumePendingSessionSkills: vi.fn(async () => undefined),
  mergeLoadedSkillsExtra: vi.fn(async () => {}),
  resolveCapabilitiesManifest: vi.fn(async () => undefined),
}));

// ── Import under test ──────────────────────────────────────────────

import { WCoreManager } from '@/process/task/WCoreManager';
import { buildSystemInstructionsWithSkillsIndex } from '@/process/task/agentUtils';
import { ConstitutionFsTransactionError } from '@process/services/constitution/constitutionFsTransaction';
import { DesktopProfileSpliceError } from '@process/agent/wcore/desktopProfileSplice';

// ── Helpers ────────────────────────────────────────────────────────

function createManager(conversationId = 'conv-sf-1'): WCoreManager {
  const data = {
    workspace: '/test/workspace',
    model: { name: 'test-provider', useModel: 'test-model', baseUrl: '', platform: 'test' },
    conversation_id: conversationId,
  };
  return new WCoreManager(data as Record<string, unknown>, data.model as Record<string, unknown>);
}

function findEmissions(type: string) {
  return emitResponseStream.mock.calls
    .filter(([e]: [{ type: string }]) => e.type === type)
    .map(([e]: [Record<string, unknown>]) => e);
}

// ── Tests ──────────────────────────────────────────────────────────

describe('WCoreManager bootstrap failure surfaces error + finish (S2)', () => {
  beforeEach(() => {
    emitResponseStream.mockClear();
    mockMainError.mockClear();
    agentStart.mockReset();
    agentStart.mockResolvedValue(undefined);
  });

  it('emits error then finish when start() fails, instead of hanging the turn', async () => {
    agentStart.mockRejectedValue(new Error('wcore binary not found'));
    const manager = createManager();

    await manager.sendMessage({ content: 'hello', msg_id: 'msg-sf-1' });

    const errors = findEmissions('error');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ type: 'error', conversation_id: 'conv-sf-1', msg_id: 'msg-sf-1' });
    expect(String(errors[0].data)).toContain('wcore binary not found');

    const finishes = findEmissions('finish');
    expect(finishes).toHaveLength(1);
    expect(finishes[0]).toMatchObject({ type: 'finish', conversation_id: 'conv-sf-1' });

    // The send must NOT have proceeded against a null agent.
    expect((manager as unknown as { agent: unknown }).agent).toBeNull();
  });

  it('logs the bootstrap failure (no longer silently swallowed)', async () => {
    agentStart.mockRejectedValue(new Error('auth failed'));
    const manager = createManager('conv-sf-2');

    await manager.sendMessage({ content: 'hi', msg_id: 'msg-sf-2' });

    expect(mockMainError).toHaveBeenCalled();
  });

  it('does NOT emit a start-failure error/finish when start() succeeds (happy path preserved)', async () => {
    agentStart.mockResolvedValue(undefined);
    const manager = createManager('conv-sf-3');

    await manager.sendMessage({ content: 'normal turn', msg_id: 'msg-sf-3' });

    // No bootstrap-failure error frame should be emitted on success.
    const failureErrors = findEmissions('error').filter((e) => String(e.data).startsWith('Agent failed to start'));
    expect(failureErrors).toHaveLength(0);
    expect((manager as unknown as { agent: unknown }).agent).not.toBeNull();
  });

  // ── Constitution authority failures must stay routable ────────────
  //
  // A Constitution the app cannot unlock throws out of the system-prompt
  // composition inside `start()` (composePrompt -> readConstitution), which is
  // exactly where `buildSystemInstructionsWithSkillsIndex` sits. The prose is
  // for the user; the code is what lets the renderer put the recovery flow in
  // front of them instead of a dead-end bubble.

  it('carries the Constitution authority code alongside the prose so the turn can be routed to recovery', async () => {
    vi.mocked(buildSystemInstructionsWithSkillsIndex).mockRejectedValueOnce(
      new ConstitutionFsTransactionError(
        'CONSTITUTION_FS_REVISION_AUTHORITY_UNAUTHENTICATED',
        'The Constitution revision authority on this machine could not be unlocked. Open Settings > Constitution to restore from a recovery archive.'
      )
    );
    const manager = createManager('conv-sf-constitution');

    await manager.sendMessage({ content: 'hello', msg_id: 'msg-sf-constitution' });

    const errors = findEmissions('error');
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('CONSTITUTION_FS_REVISION_AUTHORITY_UNAUTHENTICATED');
    expect(String(errors[0].data)).toContain('could not be unlocked');
    // The raw crypto failure must never be what reaches the chat.
    expect(String(errors[0].data)).not.toContain('safeStorage');
  });

  // ── #1024: an invalid engine config.toml must stay routable ───────
  //
  // `spliceDesktopMcpProfile` refuses to touch an unparseable global
  // `config.toml` and is right to - that file holds the user's providers,
  // credentials and memory/skills settings. But the refusal's prose ('Fix the
  // file by hand before Desktop can launch against it') was a DEAD END for a
  // non-technical user. The code is what lets the renderer put the config
  // recovery card in front of them instead.

  it('carries the splice code alongside the prose so the turn can be routed to config recovery', async () => {
    agentStart.mockRejectedValue(
      new DesktopProfileSpliceError('existing content is not valid TOML: Invalid TOML document: invalid value')
    );
    const manager = createManager('conv-sf-splice-code');

    await manager.sendMessage({ content: 'hello', msg_id: 'msg-sf-splice-code' });

    const errors = findEmissions('error');
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('DESKTOP_PROFILE_SPLICE_INVALID');
    expect(String(errors[0].data)).toContain('is not valid TOML');
  });

  it('leaves the code off a bootstrap failure that carries no classification', async () => {
    agentStart.mockRejectedValue(new Error('wcore binary not found'));
    const manager = createManager('conv-sf-uncoded');

    await manager.sendMessage({ content: 'hello', msg_id: 'msg-sf-uncoded' });

    const errors = findEmissions('error');
    expect(errors).toHaveLength(1);
    // An unclassified failure must not masquerade as a routable one.
    expect(errors[0].code).toBeUndefined();
  });

  // ── #853: real exec-failure reason + discoverable log link ─────────

  it('surfaces the real errno launch reason and appends the discoverable logs path', async () => {
    agentStart.mockRejectedValue(
      new Error('Wayland Core could not be launched: the engine binary is missing or was blocked (ENOENT).')
    );
    const manager = createManager('conv-sf-853-errno');

    await manager.sendMessage({ content: 'hello', msg_id: 'msg-sf-853-errno' });

    const errors = findEmissions('error');
    expect(errors).toHaveLength(1);
    const data = String(errors[0].data);
    // The real errno reason survives to the user...
    expect(data).toContain('ENOENT');
    // ...and the user is pointed at the log that holds the detail.
    expect(data).toContain('/test/logs');
  });

  it('masks a secret-shaped token in the surfaced start-failure reason (redaction proof)', async () => {
    const token = 'sk-ant-abcdef0123456789ABCDEF';
    agentStart.mockRejectedValue(new Error(`Wayland Core could not be launched: leaked ${token} in the reason`));
    const manager = createManager('conv-sf-853-redact');

    await manager.sendMessage({ content: 'hello', msg_id: 'msg-sf-853-redact' });

    const errors = findEmissions('error');
    expect(errors).toHaveLength(1);
    const data = String(errors[0].data);
    // redactCommandSecrets must have masked the recognized secret shape.
    expect(data).not.toContain(token);
  });

  // ── K-02: DesktopProfileSpliceError (K-01) already-redacted regression lock ──
  //
  // This is a regression LOCK, not a RED case - it is expected to pass
  // immediately with no production code changes, because the existing
  // WCoreManager-level redactCommandSecrets already covers this shape
  // (verified by execution against the REAL smol-toml error-context echo, see
  // K-02-PLAN.md's "what I verified by execution" section). It pins that
  // protection so it cannot silently regress later.
  it('masks a leaked provider key embedded in a DesktopProfileSpliceError-shaped message (K-01 regression lock)', async () => {
    const spliceMessage =
      'Cannot safely update the reserved [profiles.__wayland_desktop_session] table in the global Wayland Core ' +
      'config (Invalid TOML document: invalid literal string.\n' +
      '3 | api_key = "sk-ant-SUPERSECRETVALUE1234567890"\n' +
      '4 | broken = [1, 2,\n' +
      '  |          ^\n' +
      'expected value). Fix the file by hand before Desktop can launch against it.';
    agentStart.mockRejectedValue(new Error(spliceMessage));
    const manager = createManager('conv-sf-k02-splice-redact');

    await manager.sendMessage({ content: 'hello', msg_id: 'msg-sf-k02-splice-redact' });

    const errors = findEmissions('error');
    expect(errors).toHaveLength(1);
    const data = String(errors[0].data);
    expect(data).not.toContain('sk-ant-SUPERSECRETVALUE1234567890');
    expect(data).toContain('Fix the file by hand');
  });

  // ── W-1b: a failed bootstrap must not be cached forever ──────────
  //
  // startError had one writer and no reset, so the FIRST failure was replayed
  // by every later turn with no fresh spawn. Observed live: identical message,
  // identical PID, 95 seconds apart, no second "(start) failed" line between
  // them, and the crash sentinel it named already gone from disk. The only
  // recovery was restarting the app.

  it('retries the bootstrap on the next turn instead of replaying the cached error', async () => {
    // Fail once, then succeed - exactly the transient case (stale sentinel,
    // contended lease, a config the user has since fixed).
    agentStart.mockRejectedValueOnce(new Error('crash sentinel found at .dirty-death.89279'));
    agentStart.mockResolvedValue(undefined);

    const manager = createManager('conv-sf-w1b-retry');

    await manager.sendMessage({ content: 'first', msg_id: 'msg-w1b-1' });
    const firstErrors = findEmissions('error');
    expect(firstErrors).toHaveLength(1);
    expect(String(firstErrors[0].data)).toContain('.dirty-death.89279');
    expect((manager as unknown as { agent: unknown }).agent).toBeNull();

    emitResponseStream.mockClear();

    // The second turn must SPAWN AGAIN rather than replay the stale failure.
    await manager.sendMessage({ content: 'second', msg_id: 'msg-w1b-2' });

    expect(agentStart).toHaveBeenCalledTimes(2);
    expect((manager as unknown as { agent: unknown }).agent).not.toBeNull();
    const replayed = findEmissions('error').filter((e) => String(e.data).includes('.dirty-death.89279'));
    expect(replayed).toHaveLength(0);
  });

  it('surfaces the NEW reason when the retry also fails, not the stale one', async () => {
    agentStart.mockRejectedValueOnce(new Error('crash sentinel found at .dirty-death.111'));
    agentStart.mockRejectedValueOnce(new Error('auth failed for provider'));

    const manager = createManager('conv-sf-w1b-second-fail');

    await manager.sendMessage({ content: 'first', msg_id: 'msg-w1b-3' });
    emitResponseStream.mockClear();
    await manager.sendMessage({ content: 'second', msg_id: 'msg-w1b-4' });

    const errors = findEmissions('error');
    expect(errors).toHaveLength(1);
    // A permanently-failing engine must keep telling the truth each turn.
    expect(String(errors[0].data)).toContain('auth failed for provider');
    expect(String(errors[0].data)).not.toContain('.dirty-death.111');
    expect(agentStart).toHaveBeenCalledTimes(2);
  });

  it('does not respawn on a turn whose bootstrap already succeeded', async () => {
    agentStart.mockResolvedValue(undefined);
    const manager = createManager('conv-sf-w1b-happy');

    await manager.sendMessage({ content: 'one', msg_id: 'msg-w1b-5' });
    await manager.sendMessage({ content: 'two', msg_id: 'msg-w1b-6' });

    // Retry is gated on startError; a healthy conversation must spawn once.
    expect(agentStart).toHaveBeenCalledTimes(1);
  });

  it('rate-limits retries after the first, so an automatic caller cannot spawn-storm', async () => {
    // Cron drives sendMessage on every firing, and emitStartFailure returns
    // normally rather than throwing - so cron records the run as SUCCESSFUL and
    // never backs off. Without a cooldown, a broken config would turn every
    // firing into a fresh engine spawn.
    agentStart.mockRejectedValue(new Error('config is broken'));
    const manager = createManager('conv-sf-w1b-storm');

    await manager.sendMessage({ content: 'one', msg_id: 'msg-w1b-7' });
    expect(agentStart).toHaveBeenCalledTimes(1);

    // First retry is immediate: this is the case a human hits.
    await manager.sendMessage({ content: 'two', msg_id: 'msg-w1b-8' });
    expect(agentStart).toHaveBeenCalledTimes(2);

    // Everything after that is bounded, however many turns arrive.
    for (const [i, id] of ['msg-w1b-9', 'msg-w1b-10', 'msg-w1b-11'].entries()) {
      await manager.sendMessage({ content: `burst-${i}`, msg_id: id });
    }
    expect(agentStart).toHaveBeenCalledTimes(2);

    // The user still gets an honest failure on every one of those turns.
    const errors = findEmissions('error').filter((e) => String(e.data).includes('config is broken'));
    expect(errors.length).toBeGreaterThanOrEqual(4);
  });
});
