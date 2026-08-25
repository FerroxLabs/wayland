/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1099 — the process half of the folder grant, end to end from an escalated
 * `tool_request` to the `ApprovalScope::AlwaysPath` command on the wire.
 *
 * Three properties are load-bearing and each is asserted with a positive
 * control in the same file:
 *   - a `path_boundary` escalation is NEVER auto-approved, in any mode. Every
 *     auto-approve path in this manager answers with `once`, and Core cannot
 *     run a boundary call under a one-shot grant — so an auto-approval is both
 *     a silent grant of authority outside the workspace AND a refused read.
 *   - the root is CLASSIFIED HOST-SIDE on the live path, before anything is
 *     sent, for BOTH grant buttons. Core's own refusals do not know about
 *     Wayland's user-data directory, so a root Wayland refuses to persist must
 *     be refused here or the engine will happily accept it.
 *   - granting sends `{ always_path: { root, write: false } }`, scoped to the
 *     CONTAINING FOLDER the engine suggested, never to the target file and
 *     never with write.
 *
 * THE ROOTS BELOW ARE REAL DIRECTORIES. The vetting is production code running
 * against a real filesystem here - `vetFolderGrantRoot` is NOT mocked - because
 * a classifier proved against a stub tells you nothing about whether the call
 * site reaches it.
 *
 * Contract source: wayland-core main `56ec176e` (`ApprovalScope` in
 * `crates/wcore-protocol/src/commands.rs:587`). v0.13.4 is unpublished, so this
 * is a contract test — no live engine was involved. The bytes that scope
 * serializes to are pinned against the production `writeCommand` in
 * `tests/unit/process/agent/wcore/pathGrantSeam.test.ts`.
 */
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────

const {
  emitResponseStream,
  emitConfirmationAdd,
  emitConfirmationUpdate,
  emitConfirmationRemove,
  mockDb,
  mockTeamEventBusEmit,
  mockChannelEmitAgentMessage,
  mockNotifyPotentialCompletion,
  mockGrantAdd,
  mockGrantList,
  mockResolveWorkspaceId,
  mockAddMessage,
  mockRootContext,
} = vi.hoisted(() => ({
  emitResponseStream: vi.fn(),
  emitConfirmationAdd: vi.fn(),
  emitConfirmationUpdate: vi.fn(),
  emitConfirmationRemove: vi.fn(),
  mockDb: {
    getConversationMessages: vi.fn(() => ({ data: [] })),
    getConversation: vi.fn(() => ({ success: false })),
    updateConversation: vi.fn(),
    createConversation: vi.fn(() => ({ success: true })),
    insertMessage: vi.fn(),
    updateMessage: vi.fn(),
  },
  mockTeamEventBusEmit: vi.fn(),
  mockChannelEmitAgentMessage: vi.fn(),
  mockNotifyPotentialCompletion: vi.fn().mockResolvedValue(undefined),
  mockGrantAdd: vi.fn(),
  // #982 - the revalidating read the spawn-time replay consults. Empty by
  // default, so every describe that is not ABOUT replay keeps the behaviour it
  // pinned: nothing is ever replayed and the card is always drawn.
  mockGrantList: vi.fn(async () => ({ workspaceId: '', grants: [], withheld: [] })),
  mockResolveWorkspaceId: vi.fn(),
  mockAddMessage: vi.fn(),
  mockRootContext: vi.fn(),
}));

// ── Module mocks ───────────────────────────────────────────────────

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      responseStream: { emit: emitResponseStream },
      confirmation: {
        add: { emit: emitConfirmationAdd },
        update: { emit: emitConfirmationUpdate },
        remove: { emit: emitConfirmationRemove },
      },
    },
    cron: {
      onJobCreated: { emit: vi.fn() },
      onJobRemoved: { emit: vi.fn() },
    },
  },
}));

vi.mock('@process/team/teamEventBus', () => ({
  teamEventBus: { emit: mockTeamEventBusEmit },
}));

vi.mock('@process/channels/agent/ChannelEventBus', () => ({
  channelEventBus: { emitAgentMessage: mockChannelEmitAgentMessage },
}));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: { isPackaged: () => false, getAppPath: () => null },
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
}));

vi.mock('@process/utils/message', () => ({
  addMessage: mockAddMessage,
  addOrUpdateMessage: vi.fn(),
}));

// The STORE is stubbed - this file is not about the durable file format. The
// root CONTEXT is not: it is the only thing standing between the live grant and
// Wayland's own credential storage, so it names real fixture directories and
// the real `vetFolderGrantRoot` classifies against them.
vi.mock('@process/services/workspace/folderGrantStore', () => ({
  defaultWorkspaceFolderGrantStore: () => ({ add: mockGrantAdd, list: mockGrantList }),
  defaultFolderGrantRootContext: mockRootContext,
}));

vi.mock('@process/services/workspace/folderGrantWorkspaceId', () => ({
  resolveFolderGrantWorkspaceId: mockResolveWorkspaceId,
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
  mainError: vi.fn(),
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

vi.mock('./ConversationTurnCompletionService', async () => {
  const actual = await vi.importActual<typeof import('@/process/task/ConversationTurnCompletionService')>(
    '@/process/task/ConversationTurnCompletionService'
  );
  return actual;
});

vi.mock('@/process/task/ConversationTurnCompletionService', () => ({
  ConversationTurnCompletionService: {
    getInstance: vi.fn(() => ({
      notifyPotentialCompletion: mockNotifyPotentialCompletion,
    })),
  },
}));

vi.mock('@process/agent/wcore', () => ({
  WCoreAgent: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    kill: vi.fn(),
    send: vi.fn().mockResolvedValue(undefined),
    approveTool: vi.fn(),
    denyTool: vi.fn(),
    injectConversationHistory: vi.fn().mockResolvedValue(undefined),
    get bootstrap() {
      return Promise.resolve();
    },
  })),
}));

// ── Import under test ──────────────────────────────────────────────

import { WCoreManager, folderGrantNotRememberedText } from '@/process/task/WCoreManager';
import {
  PATH_BOUNDARY_DENY,
  FOLDER_GRANT_REPLAY_AVAILABLE,
  pathBoundaryRootOf,
  PATH_BOUNDARY_GRANT_FOLDER,
  PATH_BOUNDARY_REMEMBER_FOLDER,
  PATH_BOUNDARY_ROOT_PARAM,
} from '@/common/chat/pathBoundaryConsent';

// ── Fixture filesystem ─────────────────────────────────────────────
//
// Real directories, because the host-side classifier canonicalises and stats
// every root it is given. A string fixture would be refused as "not a
// directory" and every grant assertion below would pass for the wrong reason.

/**
 * The canonical form of `p` as the OPERATING SYSTEM reports it.
 *
 * NOT `fs.realpathSync`, which is a JS reimplementation: on Windows it expands
 * neither an 8.3 short name nor the on-disk case, so a fixture built with it
 * disagrees with every root the store returns - the store canonicalises with
 * `fs/promises.realpath`, which is the same OS call this one makes. On a GitHub
 * Windows runner `os.tmpdir()` is `C:\\Users\\RUNNER~1\\AppData\\Local\\Temp`.
 */
const canonical = (p: string): string => realpathSync.native(p);

const FIXTURE = canonical(mkdtempSync(path.join(canonical(os.tmpdir()), 'wl-boundary-')));
const HOME = path.join(FIXTURE, 'home');
/** An ordinary folder outside the workspace: the grantable one. */
const ROOT = path.join(HOME, 'Documents', 'reports');
const TARGET = path.join(ROOT, 'q3.md');
/** Wayland's own user-data tree. Core has never heard of it; the host has. */
const WAYLAND_PRIVATE = path.join(FIXTURE, 'app-data');
/** A folder INSIDE it - where `wayland-config.txt` and safeStorage material live. */
const WAYLAND_CONFIG = path.join(WAYLAND_PRIVATE, 'config');
/** A `$HOME`-relative credential store from Core's own list. */
const CREDENTIAL_STORE = path.join(HOME, '.ssh');
/** A symlink to the grantable root, for the canonicalisation assertion. */
const ROOT_VIA_SYMLINK = path.join(HOME, 'reports-link');

mkdirSync(ROOT, { recursive: true });
writeFileSync(TARGET, '# Q3\n');
mkdirSync(WAYLAND_CONFIG, { recursive: true });
mkdirSync(CREDENTIAL_STORE, { recursive: true });
symlinkSync(ROOT, ROOT_VIA_SYMLINK);

afterAll(() => {
  try {
    rmSync(FIXTURE, { recursive: true, force: true });
  } catch {
    // Temp dirs are reaped by the OS.
  }
});

// ── Helpers ────────────────────────────────────────────────────────

const CONV_ID = 'conv-1099';

function createManager(conversationId = CONV_ID) {
  const data = {
    workspace: '/test/workspace',
    model: { name: 'test-provider', useModel: 'test-model', baseUrl: '', platform: 'test' },
    conversation_id: conversationId,
  };
  return new WCoreManager(data as any, data.model as any);
}

type FakeAgent = { approveTool: ReturnType<typeof vi.fn>; denyTool: ReturnType<typeof vi.fn> };

function attachAgent(manager: WCoreManager): FakeAgent {
  const agent: FakeAgent = { approveTool: vi.fn(), denyTool: vi.fn() };
  (manager as any).agent = agent;
  return agent;
}

/** A `tool_group` frame carrying a `path_boundary` escalation, as the wcore adapter maps it. */
function boundaryFrame(callId = 'call-boundary', suggestedRoot = ROOT) {
  const target = path.join(suggestedRoot, 'q3.md');
  return {
    type: 'tool_group',
    msg_id: 'turn-1',
    data: [
      {
        callId,
        name: 'Read',
        description: `Read ${target}`,
        status: 'Confirming',
        renderOutputAsMarkdown: false,
        confirmationDetails: {
          type: 'path_boundary',
          title: `Read ${target}`,
          target,
          suggestedRoot,
          access: 'read',
        },
      },
    ],
  };
}

/** The same frame shape for an ordinary `info` call — the positive control. */
function infoFrame(callId = 'call-info') {
  return {
    type: 'tool_group',
    msg_id: 'turn-1',
    data: [
      {
        callId,
        name: 'Read',
        description: 'Read README.md',
        status: 'Confirming',
        renderOutputAsMarkdown: false,
        confirmationDetails: { type: 'info', title: 'Read README.md', prompt: '{}' },
      },
    ],
  };
}

function emitEvent(manager: WCoreManager, event: Record<string, unknown>) {
  (manager as any).emit('wcore.message', event);
}

/** What `defaultFolderGrantRootContext` returns for every test in this file. */
const ROOT_CONTEXT = { homeDir: HOME, waylandPrivateRoots: [WAYLAND_PRIVATE] };

/**
 * The root that actually went out on `always_path`, or a throw.
 *
 * Never `approveTool.mock.calls[0]?.[1]?.always_path?.root`: an optional chain
 * over a call that never happened collapses to `undefined`, and comparing two
 * `undefined`s is how a guard that stopped running keeps a test green.
 */
function grantedRoot(agent: FakeAgent): string {
  const calls = agent.approveTool.mock.calls;
  if (calls.length !== 1) throw new Error(`expected exactly one approveTool, saw ${calls.length}`);
  const scope = calls[0][1] as { always_path?: { root?: unknown } };
  const root = scope?.always_path?.root;
  if (typeof root !== 'string') throw new Error(`expected an always_path scope, got ${JSON.stringify(scope)}`);
  return root;
}

// ── Tests ──────────────────────────────────────────────────────────

describe('#1099 a path boundary is never auto-approved', () => {
  let manager: WCoreManager;
  let agent: FakeAgent;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRootContext.mockResolvedValue(ROOT_CONTEXT);
    manager = createManager();
    agent = attachAgent(manager);
    vi.spyOn(manager as any, 'postMessagePromise').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  for (const mode of ['yolo', 'auto_edit']) {
    it(`renders a card instead of auto-approving in ${mode} mode`, () => {
      (manager as any).currentMode = mode;
      (manager as any).yoloMode = mode === 'yolo';

      emitEvent(manager, boundaryFrame());

      expect(agent.approveTool).not.toHaveBeenCalled();
      expect(agent.denyTool).not.toHaveBeenCalled();
      expect(emitConfirmationAdd).toHaveBeenCalledTimes(1);
    });

    it(`CONTROL: an ordinary info call IS auto-approved in ${mode} mode`, () => {
      (manager as any).currentMode = mode;
      (manager as any).yoloMode = mode === 'yolo';

      emitEvent(manager, infoFrame());

      expect(agent.approveTool).toHaveBeenCalledWith('call-info', 'once');
      expect(emitConfirmationAdd).not.toHaveBeenCalled();
    });
  }

  // Isolates the INDEX-keyed gate in BaseAgentManager.addConfirmation, which is
  // reachable on its own: `yoloMode` and `sessionMode` are independent fields,
  // so a session can carry yoloMode without currentMode === 'yolo'. That gate
  // picks options[0] by position — on this card, the grant itself — so own
  // option values give it no protection at all.
  it('is not auto-confirmed by the index-keyed yolo gate when sessionMode is not yolo', () => {
    (manager as any).currentMode = 'default';
    (manager as any).yoloMode = true;

    emitEvent(manager, boundaryFrame());

    expect(emitConfirmationAdd).toHaveBeenCalledTimes(1);
    expect(agent.approveTool).not.toHaveBeenCalled();
    expect(agent.denyTool).not.toHaveBeenCalled();
  });

  it('CONTROL: the index-keyed yolo gate DOES auto-confirm an ordinary card', async () => {
    vi.useFakeTimers();
    (manager as any).currentMode = 'default';
    (manager as any).yoloMode = true;
    const confirmSpy = vi.spyOn(manager, 'confirm').mockImplementation(() => undefined as never);

    emitEvent(manager, infoFrame());
    await vi.advanceTimersByTimeAsync(100);

    expect(emitConfirmationAdd).not.toHaveBeenCalled();
    expect(confirmSpy).toHaveBeenCalled();
    // options[0] — picked by POSITION, which is the whole hazard.
    expect(confirmSpy.mock.calls[0][2]).toBe('proceed_once');
    vi.useRealTimers();
  });

  /**
   * Pins the CALL SITE with a card that carries the durable value and nothing
   * else from the vocabulary. `BaseAgentManager.addConfirmation`'s yolo gate is
   * INDEX-keyed - it would pick `options[0]`, here the durable grant itself -
   * and it is excluded via `isPathBoundaryConfirmation`. If that exclusion were
   * ever keyed on the session-grant value instead of the predicate, every other
   * boundary test in this file would still pass and this one would auto-confirm
   * a permanent filesystem grant with nobody at the window.
   */
  it('excludes a card whose ONLY grant option is the durable one from the yolo gate', async () => {
    vi.useFakeTimers();
    (manager as any).yoloMode = true;
    const confirmSpy = vi.spyOn(manager, 'confirm').mockImplementation(() => undefined as never);

    (manager as any).addConfirmation({
      id: 'call-remember-only',
      callId: 'call-remember-only',
      title: 'Read q3.md',
      description: TARGET,
      options: [
        { label: 'l', value: PATH_BOUNDARY_REMEMBER_FOLDER, params: { [PATH_BOUNDARY_ROOT_PARAM]: ROOT } },
        { label: 'd', value: PATH_BOUNDARY_DENY },
      ],
    });
    await vi.advanceTimersByTimeAsync(100);

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(emitConfirmationAdd).toHaveBeenCalledTimes(1);

    // CONTROL, same gate and same manager: an ordinary card IS auto-confirmed
    // by index, so the exclusion above is the guard and not a dead yoloMode.
    vi.clearAllMocks();
    (manager as any).addConfirmation({
      id: 'call-plain',
      callId: 'call-plain',
      title: 'Run',
      description: '',
      options: [
        { label: 'a', value: 'proceed_once' },
        { label: 'c', value: 'cancel' },
      ],
    });
    await vi.advanceTimersByTimeAsync(100);
    expect(confirmSpy).toHaveBeenCalled();
    expect(confirmSpy.mock.calls[0][2]).toBe('proceed_once');
    vi.useRealTimers();
  });

  it('builds the card with its own option values, the grant first, and no allow-once', () => {
    emitEvent(manager, boundaryFrame());

    const card = emitConfirmationAdd.mock.calls[0][0] as {
      action?: string;
      options: Array<{ value: string; params?: Record<string, string> }>;
    };

    // Derived from the gate, not hard-coded: the durable option is offered only
    // when a remembered folder is actually re-applied at session start. Written
    // this way so the assertion keeps its meaning on the day the gate flips,
    // rather than becoming a test somebody has to remember to rewrite.
    expect(card.options.map((o) => o.value)).toEqual([
      PATH_BOUNDARY_GRANT_FOLDER,
      ...(FOLDER_GRANT_REPLAY_AVAILABLE ? [PATH_BOUNDARY_REMEMBER_FOLDER] : []),
      PATH_BOUNDARY_DENY,
    ]);
    // The grant is options[0] because it is the PRIMARY action: Core cannot
    // resolve a boundary with a one-shot approval, so there is no allow-once.
    // It is the SESSION grant and not the durable one on purpose - see the
    // dedicated assertion below for why that ordering is load-bearing.
    expect(card.options[0].value).toBe(PATH_BOUNDARY_GRANT_FOLDER);
    expect(card.options.map((o) => o.value)).not.toContain('proceed_once');
    expect(card.options.map((o) => o.value)).not.toContain('proceed_always');
    // No `action`: the approval store is category-keyed and cannot say WHICH
    // folder, so there is no key it would be honest to store or replay.
    expect(card.action).toBeUndefined();
    // The button carries the root it opens, so the label and the grant are one value.
    expect(card.options[0].params?.folder).toBe(ROOT);
  });

  it('puts the NARROWER grant in the index-picked slot', () => {
    // Both auto-confirm paths that pick by INDEX (BaseAgentManager's yolo gate,
    // ConversationChatConfirm's Enter binding) exclude this card - so this
    // ordering never fires today. It is the blast radius if either exclusion is
    // ever regressed, and the difference between the two grants is not cosmetic:
    // the durable one keeps the folder open to every future session of this
    // workspace, including unattended cron runs with nobody at the window.
    emitEvent(manager, boundaryFrame());

    const card = emitConfirmationAdd.mock.calls[0][0] as { options: Array<{ value: string }> };
    expect(card.options[0].value).toBe(PATH_BOUNDARY_GRANT_FOLDER);
    expect(card.options[0].value).not.toBe(PATH_BOUNDARY_REMEMBER_FOLDER);
    // ...and when the durable grant is offered at all it is still ON the card,
    // so this stays an ordering assertion rather than quietly becoming an
    // assertion that the option went missing.
    expect(card.options.map((o) => o.value).includes(PATH_BOUNDARY_REMEMBER_FOLDER)).toBe(
      FOLDER_GRANT_REPLAY_AVAILABLE
    );
  });

  it('builds both grant options from ONE suggestedRoot, so they cannot name different folders', () => {
    emitEvent(manager, boundaryFrame());

    const card = emitConfirmationAdd.mock.calls[0][0] as {
      options: Array<{ value: string; params?: Record<string, string> }>;
    };
    const roots = card.options
      .filter((o) => o.value === PATH_BOUNDARY_GRANT_FOLDER || o.value === PATH_BOUNDARY_REMEMBER_FOLDER)
      .map((o) => o.params?.[PATH_BOUNDARY_ROOT_PARAM]);

    // However many grant options are offered, they all name ONE folder, and it
    // is the folder the card was built from. The count follows the gate; the
    // agreement does not.
    expect(roots).toHaveLength(FOLDER_GRANT_REPLAY_AVAILABLE ? 2 : 1);
    expect(new Set(roots).size).toBe(1);
    expect(roots[0]).toBe(ROOT);
  });

  it('gives each grant option its own hint key, so neither button can misstate how long it lasts', () => {
    // The two buttons differ ONLY in duration. Sharing one hint string is how
    // "Read-only, for the rest of this session" ends up printed under a button
    // that writes a permanent record.
    emitEvent(manager, boundaryFrame());

    const card = emitConfirmationAdd.mock.calls[0][0] as {
      options: Array<{ value: string; label: string; description?: string }>;
    };
    const session = card.options.find((o) => o.value === PATH_BOUNDARY_GRANT_FOLDER);
    const durable = card.options.find((o) => o.value === PATH_BOUNDARY_REMEMBER_FOLDER);

    // The session hint is asserted unconditionally - it is the button that is
    // always offered, and a card with no hint at all would otherwise slip past
    // everything below.
    expect(session?.description).toBeTruthy();
    if (FOLDER_GRANT_REPLAY_AVAILABLE) {
      expect(durable?.description).toBeTruthy();
      expect(durable?.description).not.toBe(session?.description);
      expect(durable?.label).not.toBe(session?.label);
    } else {
      expect(durable).toBeUndefined();
    }
  });

  it('CONTROL: an ordinary card still gets proceed_once / proceed_always / cancel and an action', () => {
    emitEvent(manager, infoFrame());

    const card = emitConfirmationAdd.mock.calls[0][0] as { action?: string; options: Array<{ value: string }> };
    expect(card.options.map((o) => o.value)).toEqual(['proceed_once', 'proceed_always', 'cancel']);
    expect(card.action).toBe('info');
  });
});

describe('#1099 granting sends ApprovalScope::AlwaysPath', () => {
  let manager: WCoreManager;
  let agent: FakeAgent;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRootContext.mockResolvedValue(ROOT_CONTEXT);
    manager = createManager();
    agent = attachAgent(manager);
    vi.spyOn(manager as any, 'postMessagePromise').mockResolvedValue(undefined);
    emitEvent(manager, boundaryFrame());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the folder root read-only, not the target file and never write', async () => {
    manager.confirm('call-boundary', 'call-boundary', PATH_BOUNDARY_GRANT_FOLDER);
    await vi.waitFor(() => expect(agent.approveTool).toHaveBeenCalled());

    expect(agent.approveTool).toHaveBeenCalledTimes(1);
    const [callId, scope] = agent.approveTool.mock.calls[0];
    expect(callId).toBe('call-boundary');
    expect(scope).toEqual({ always_path: { root: ROOT, write: false } });
    // The grant opens the CONTAINING FOLDER. Granting `target` would be a
    // button that lies about its own scope in the other direction.
    expect((scope as any).always_path.root).not.toBe(TARGET);
    expect(agent.denyTool).not.toHaveBeenCalled();
  });

  /**
   * The bytes that scope becomes are pinned where they are actually produced -
   * `pathGrantSeam.test.ts`, against a real `WCoreAgent` writing to a fake
   * stdin through the production `writeCommand`. This file used to assert the
   * wire form by running `JSON.stringify` on a value it had just read off a
   * FAKE agent, which is a test of `JSON.stringify`: mutating the production
   * `approveTool` to send `scope: 'once'` unconditionally left it green.
   */
  it('grants the CANONICAL directory, so a symlink cannot drift from what was vetted', async () => {
    // The card names a symlink. What is vetted is the directory it resolves to,
    // and what is sent must be the same string - otherwise there is a window in
    // which the host approved one place and the engine resolves another.
    emitEvent(manager, boundaryFrame('call-link', ROOT_VIA_SYMLINK));
    manager.confirm('call-link', 'call-link', PATH_BOUNDARY_GRANT_FOLDER);
    await vi.waitFor(() => expect(agent.approveTool).toHaveBeenCalled());

    expect(grantedRoot(agent)).toBe(ROOT);
    // CONTROL: the card really did carry the symlink, so the equality above is
    // canonicalisation and not a fixture that never differed.
    expect(ROOT_VIA_SYMLINK).not.toBe(ROOT);
    expect(canonical(ROOT_VIA_SYMLINK)).toBe(ROOT);
  });

  /**
   * A REMOTE surface must not be able to answer this card.
   *
   * `ActionExecutor`'s generic arm offers "Confirm"/"Cancel" carrying
   * `proceed_once`, and `ChatActions.handleToolConfirm` passes the callback
   * `value` straight through with no allowlisting. Before this guard, that
   * value fell past the boundary route into the ordinary approval path, where
   * `super.confirm` CLEARED the desktop user's card and `approveTool(callId,
   * 'once')` approved the tool without any grant. The read then failed for want
   * of authority and the folder could never be granted for the rest of the
   * session - the feature defeated from a chat window.
   */
  it('refuses a foreign approval vocabulary on a boundary call and leaves the card standing', async () => {
    for (const foreign of ['proceed_once', 'proceed_always', 'proceed_always_tool', 'proceed_always_server']) {
      vi.clearAllMocks();
      manager.confirm('call-boundary', 'call-boundary', foreign as never);

      expect(agent.approveTool, `${foreign} must not approve`).not.toHaveBeenCalled();
      expect(agent.denyTool, `${foreign} must not deny`).not.toHaveBeenCalled();
      expect(emitConfirmationRemove, `${foreign} must not clear the card`).not.toHaveBeenCalled();
    }

    // CONTROL, same card and same manager: the card is still live, so the
    // refusals above are the guard deciding and not a dead fixture.
    vi.clearAllMocks();
    manager.confirm('call-boundary', 'call-boundary', PATH_BOUNDARY_GRANT_FOLDER);
    await vi.waitFor(() => expect(agent.approveTool).toHaveBeenCalledTimes(1));
    expect(agent.approveTool.mock.calls[0][1]).toEqual({ always_path: { root: ROOT, write: false } });
  });

  it('denies the tool call outright when the folder is refused', () => {
    manager.confirm('call-boundary', 'call-boundary', PATH_BOUNDARY_DENY);

    expect(agent.denyTool).toHaveBeenCalledTimes(1);
    expect(agent.denyTool.mock.calls[0][0]).toBe('call-boundary');
    expect(agent.approveTool).not.toHaveBeenCalled();
  });

  it('CONTROL: an ordinary approval still sends the bare `once` string scope', () => {
    vi.clearAllMocks();
    emitEvent(manager, infoFrame());
    manager.confirm('call-info', 'call-info', 'proceed_once');

    expect(agent.approveTool).toHaveBeenCalledWith('call-info', 'once', undefined);
  });
});

/**
 * #1099 — the DURABLE answer: the same in-band grant, plus a record on this
 * workspace's folder-grant list.
 *
 * Two independent effects, and the file asserts they stay independent in both
 * directions: the record must not be written by the session-only button, and a
 * refusal to write it must not withdraw the approval that already unblocked
 * the call the user is looking at.
 */
describe('#1099 remembering a folder for the workspace', () => {
  const WORKSPACE_ID = 'path:/test/workspace';
  let manager: WCoreManager;
  let agent: FakeAgent;

  /**
   * The single `add` payload, or a throw.
   *
   * Never `expect(mockGrantAdd.mock.calls[0]?.[0]?.root).toBe(...)`: an
   * optional chain over a call that never happened collapses to `undefined`,
   * and `undefined === undefined` is how a guard that stopped running keeps
   * passing. This raises instead.
   */
  function persistedGrant(): { workspaceId: string; root: string; origin: string } {
    const calls = mockGrantAdd.mock.calls;
    if (calls.length !== 1) throw new Error(`expected exactly one store add, saw ${calls.length}`);
    return calls[0][0] as { workspaceId: string; root: string; origin: string };
  }

  /** The `tips` notices this manager emitted, as their prose. */
  function notices(): string[] {
    return emitResponseStream.mock.calls
      .map((call) => call[0] as { type?: string; data?: { content?: string } })
      .filter((frame) => frame?.type === 'tips')
      .map((frame) => frame.data?.content ?? '');
  }

  /** Wait for the fire-and-forget persist to settle. */
  const settled = () => vi.waitFor(() => expect(mockResolveWorkspaceId).toHaveBeenCalled());

  beforeEach(() => {
    vi.clearAllMocks();
    mockRootContext.mockResolvedValue(ROOT_CONTEXT);
    mockResolveWorkspaceId.mockResolvedValue(WORKSPACE_ID);
    mockGrantAdd.mockResolvedValue({
      ok: true,
      addition: {
        grant: { grantId: 'g1', root: ROOT, access: 'read', grantedAtMs: 1, origin: 'consent_card' },
        created: true,
        superseded: [],
      },
    });
    manager = createManager();
    agent = attachAgent(manager);
    vi.spyOn(manager as any, 'postMessagePromise').mockResolvedValue(undefined);
    emitEvent(manager, boundaryFrame());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes the grant to this workspace, attributed to the consent card', async () => {
    manager.confirm('call-boundary', 'call-boundary', PATH_BOUNDARY_REMEMBER_FOLDER);
    await settled();

    expect(persistedGrant()).toEqual({ workspaceId: WORKSPACE_ID, root: ROOT, origin: 'consent_card' });
  });

  it('files the SAME root it handed the engine, and the card displayed', async () => {
    // Three values that must be one folder: what the button SAID, what went out
    // on the wire, and what was written down.
    //
    // The card names a SYMLINK deliberately. With a plain directory all three
    // values are the same string no matter which of them the code passes
    // around, so the test could not tell a divergence from an agreement -
    // persisting the raw card string instead of the vetted root survived it.
    // Through a symlink the displayed name and the canonical directory are
    // different strings, and only one of them is the folder that was vetted.
    vi.clearAllMocks();
    emitEvent(manager, boundaryFrame('call-link', ROOT_VIA_SYMLINK));
    const card = emitConfirmationAdd.mock.calls[0][0] as {
      options: Array<{ value: string; params?: Record<string, string> }>;
    };
    // Read through the PRODUCTION accessor rather than off a chosen option.
    // `pathBoundaryRootOf` is the one accessor the card renders from, the route
    // grants from and the store files from, so asking it what the card shows is
    // asking the same question the product asks - and it does not care which
    // grant options happen to be offered.
    const shown = pathBoundaryRootOf(card);
    expect(shown).toBe(ROOT_VIA_SYMLINK);
    expect(shown).not.toBe(ROOT);

    manager.confirm('call-link', 'call-link', PATH_BOUNDARY_REMEMBER_FOLDER);
    await settled();
    await vi.waitFor(() => expect(agent.approveTool).toHaveBeenCalled());

    expect(persistedGrant().root).toBe(grantedRoot(agent));
    expect(persistedGrant().root).toBe(canonical(shown!));
    expect(persistedGrant().root).not.toBe(TARGET);
  });

  it('also sends the in-band approval, so the call in front of the user proceeds', async () => {
    manager.confirm('call-boundary', 'call-boundary', PATH_BOUNDARY_REMEMBER_FOLDER);
    await settled();
    await vi.waitFor(() => expect(agent.approveTool).toHaveBeenCalled());

    expect(agent.approveTool).toHaveBeenCalledTimes(1);
    expect(agent.approveTool.mock.calls[0][1]).toEqual({ always_path: { root: ROOT, write: false } });
    expect(agent.denyTool).not.toHaveBeenCalled();
  });

  it('the SESSION grant writes nothing durable', async () => {
    manager.confirm('call-boundary', 'call-boundary', PATH_BOUNDARY_GRANT_FOLDER);
    await vi.waitFor(() => expect(agent.approveTool).toHaveBeenCalled());

    expect(mockGrantAdd).not.toHaveBeenCalled();
    expect(mockResolveWorkspaceId).not.toHaveBeenCalled();

    // CONTROL, same manager and same card: the durable value DOES write, so the
    // absence above is the route discriminating and not a dead store mock.
    vi.clearAllMocks();
    emitEvent(manager, boundaryFrame('call-boundary-2'));
    manager.confirm('call-boundary-2', 'call-boundary-2', PATH_BOUNDARY_REMEMBER_FOLDER);
    await settled();
    expect(persistedGrant().root).toBe(ROOT);
  });

  it('DENY writes nothing durable and denies the call', async () => {
    manager.confirm('call-boundary', 'call-boundary', PATH_BOUNDARY_DENY);
    await vi.waitFor(() => expect(agent.denyTool).toHaveBeenCalled());

    expect(mockGrantAdd).not.toHaveBeenCalled();
    expect(agent.approveTool).not.toHaveBeenCalled();
  });

  it('says nothing in the thread when the grant was remembered', async () => {
    manager.confirm('call-boundary', 'call-boundary', PATH_BOUNDARY_REMEMBER_FOLDER);
    await settled();
    await vi.waitFor(() => expect(mockGrantAdd).toHaveBeenCalled());

    expect(notices()).toEqual([]);
    expect(mockAddMessage).not.toHaveBeenCalled();
  });

  describe('when the folder cannot be remembered', () => {
    /**
     * The refusal must not cost the user the read. The in-band approval sent
     * here is byte-identical to the one the session-only button sends, so
     * keeping it hands out no authority the other button would not have handed
     * out anyway - while withdrawing it would mean a button advertised as doing
     * MORE quietly did LESS.
     */
    //
    // NOTE ON WHAT IS NOT IN THIS LIST. `credential_store` / `wayland_private`
    // / `home_directory` / `root_of_filesystem` used to appear here as "the
    // store refuses the root", asserting that the live approval went out
    // ANYWAY. That assertion was the bug written down, and it is inverted in
    // `the live grant is vetted host-side` below: those roots are now refused
    // BEFORE anything is sent, by the same function the store calls, so a
    // store that returned one of them would be describing a root that could
    // not have reached it. What is left here is what can still honestly
    // happen after a root has passed the gate.
    const cases: Array<[string, () => void]> = [
      ['the list is full', () => mockGrantAdd.mockResolvedValue({ ok: false, refusal: 'grant_cap_reached' })],
      ['the workspace has no identity', () => mockResolveWorkspaceId.mockResolvedValue(null)],
      ['the list cannot be written', () => mockGrantAdd.mockRejectedValue(new Error('EACCES'))],
    ];

    for (const [name, arrange] of cases) {
      it(`still approves the call and TELLS the user when ${name}`, async () => {
        arrange();

        manager.confirm('call-boundary', 'call-boundary', PATH_BOUNDARY_REMEMBER_FOLDER);
        await vi.waitFor(() => expect(notices()).toHaveLength(1));
        await vi.waitFor(() => expect(agent.approveTool).toHaveBeenCalled());

        // The call still proceeds under the session grant.
        expect(agent.approveTool).toHaveBeenCalledTimes(1);
        expect(agent.approveTool.mock.calls[0][1]).toEqual({ always_path: { root: ROOT, write: false } });
        expect(agent.denyTool).not.toHaveBeenCalled();

        // And the user is told, naming the folder, in the thread AND on the
        // stream - a row alone renders only after a reload, an emit alone
        // reaches only whoever is subscribed at that instant.
        expect(notices()[0]).toContain(ROOT);
        expect(mockAddMessage).toHaveBeenCalledTimes(1);
        expect((mockAddMessage.mock.calls[0][1] as { content: { content: string } }).content.content).toBe(
          notices()[0]
        );
      });
    }

    it('names the cap, and the fix, when the list is full', async () => {
      // The only refusal the user can act on. A generic "could not remember"
      // would leave them with no idea that removing an entry fixes it.
      mockGrantAdd.mockResolvedValue({ ok: false, refusal: 'grant_cap_reached' });

      manager.confirm('call-boundary', 'call-boundary', PATH_BOUNDARY_REMEMBER_FOLDER);
      await vi.waitFor(() => expect(notices()).toHaveLength(1));

      expect(notices()[0]).toBe(folderGrantNotRememberedText(ROOT, 'grant_cap_reached'));
      expect(notices()[0]).toContain('Remove one');
      // CONTROL: the cap text is genuinely distinct, so the assertion above is
      // not satisfied by whatever string the default arm happens to produce.
      expect(folderGrantNotRememberedText(ROOT, 'write_failed')).not.toContain('Remove one');
    });

    it('every refusal reason says the folder IS open for this chat', () => {
      // Whatever went wrong, the first thing the user needs is whether the call
      // they are watching succeeded. Asserted over the whole reason vocabulary
      // so a reason added later cannot quietly drop it.
      const reasons = [
        'root_of_filesystem',
        'home_directory',
        'wayland_private',
        'credential_store',
        'grant_cap_reached',
        'not_an_absolute_directory',
        'no_workspace_identity',
        'write_failed',
      ] as const;
      for (const reason of reasons) {
        const text = folderGrantNotRememberedText(ROOT, reason);
        expect(text, reason).toContain(ROOT);
        expect(text, reason).toContain('opened');
        expect(text, reason).toContain('could not remember it');
      }
    });
  });
});

/**
 * #1099 — the LIVE grant is classified host-side, before it is sent.
 *
 * The hole an external audit found: `confirm` sent `always_path` the instant
 * the user clicked, and `classifyFolderGrantRoot` was reached only through
 * `rememberFolderGrant`, which is fire-and-forget and documented not to gate
 * the approval. So the SESSION button vetted nothing at all, and the DURABLE
 * button had already sent the grant by the time the store refused it.
 *
 * CORE CANNOT COVER FOR US, which is why this must be a host check. Core's
 * `workspace_policy` refuses `/`, `$HOME` or an ancestor of it, and a list of
 * credential stores. It has never heard of Wayland's own user-data directory —
 * a host-only concept that holds `wayland-config.txt` (the base64 provider
 * config) and the Electron safeStorage material. An agent that asks to read a
 * file in there raises an ordinary-looking boundary card, and Core accepts the
 * grant.
 *
 * Every case below is driven through the REAL `vetFolderGrantRoot` against a
 * real fixture tree, and every refusal carries an accepted root in the same
 * test — a refusal-only assertion passes just as well when the whole route has
 * stopped running.
 */
describe('#1099 the live grant is vetted host-side', () => {
  let manager: WCoreManager;
  let agent: FakeAgent;

  const notices = () =>
    emitResponseStream.mock.calls
      .map((call) => call[0] as { type?: string; data?: { content?: string } })
      .filter((frame) => frame?.type === 'tips')
      .map((frame) => frame.data?.content ?? '');

  beforeEach(() => {
    vi.clearAllMocks();
    mockRootContext.mockResolvedValue(ROOT_CONTEXT);
    mockResolveWorkspaceId.mockResolvedValue('path:/test/workspace');
    mockGrantAdd.mockResolvedValue({
      ok: true,
      addition: {
        grant: { grantId: 'g1', root: ROOT, access: 'read', grantedAtMs: 1, origin: 'consent_card' },
        created: true,
        superseded: [],
      },
    });
    manager = createManager();
    agent = attachAgent(manager);
    vi.spyOn(manager as any, 'postMessagePromise').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Answer a boundary card on `root` with `value`, and wait for the route to settle. */
  async function answer(callId: string, root: string, value: string) {
    emitEvent(manager, boundaryFrame(callId, root));
    manager.confirm(callId, callId, value);
    await vi.waitFor(() => expect(agent.approveTool.mock.calls.length + agent.denyTool.mock.calls.length).toBe(1));
  }

  const refused: Array<[string, string]> = [
    ["Wayland's own user-data tree", WAYLAND_CONFIG],
    ['a credential store from Core’s list', CREDENTIAL_STORE],
    ['the home directory itself', HOME],
  ];

  for (const [name, root] of refused) {
    it(`denies the call on the SESSION button for ${name}`, async () => {
      await answer('call-refused', root, PATH_BOUNDARY_GRANT_FOLDER);

      expect(agent.approveTool).not.toHaveBeenCalled();
      expect(agent.denyTool).toHaveBeenCalledTimes(1);
      expect(agent.denyTool.mock.calls[0][0]).toBe('call-refused');
      // And the user is told which folder, so the denial is not just a tool
      // call that failed with the agent's own guess at why.
      expect(notices()).toHaveLength(1);
      expect(notices()[0]).toContain(root);

      // CONTROL, same manager and same route: an ordinary folder IS granted, so
      // the denial above is the classifier deciding and not a dead route.
      vi.clearAllMocks();
      await answer('call-ok', ROOT, PATH_BOUNDARY_GRANT_FOLDER);
      expect(grantedRoot(agent)).toBe(ROOT);
      expect(agent.denyTool).not.toHaveBeenCalled();
    });

    it(`denies the call AND writes nothing on the DURABLE button for ${name}`, async () => {
      await answer('call-refused', root, PATH_BOUNDARY_REMEMBER_FOLDER);

      expect(agent.approveTool).not.toHaveBeenCalled();
      expect(agent.denyTool).toHaveBeenCalledTimes(1);
      expect(mockGrantAdd).not.toHaveBeenCalled();

      // CONTROL: the durable button DOES write for an acceptable folder, so the
      // absence above is the refusal and not a store mock nothing ever calls.
      vi.clearAllMocks();
      await answer('call-ok', ROOT, PATH_BOUNDARY_REMEMBER_FOLDER);
      await vi.waitFor(() => expect(mockGrantAdd).toHaveBeenCalled());
      expect((mockGrantAdd.mock.calls[0][0] as { root: string }).root).toBe(ROOT);
    });
  }

  it('fails CLOSED when Wayland cannot enumerate its own storage', async () => {
    // Without the context we cannot show a root is NOT part of Wayland's own
    // config tree. `resolveActiveConfigDir` really does throw when a named
    // profile is broken, so this is a reachable state, not a hypothetical.
    mockRootContext.mockRejectedValue(new Error('ProfileIsolationError'));

    await answer('call-blind', ROOT, PATH_BOUNDARY_GRANT_FOLDER);

    expect(agent.approveTool).not.toHaveBeenCalled();
    expect(agent.denyTool).toHaveBeenCalledTimes(1);

    // CONTROL: the very same root is granted once the context resolves again.
    vi.clearAllMocks();
    mockRootContext.mockResolvedValue(ROOT_CONTEXT);
    await answer('call-seeing', ROOT, PATH_BOUNDARY_GRANT_FOLDER);
    expect(grantedRoot(agent)).toBe(ROOT);
  });

  it('refuses a root that vanished between the card and the click', async () => {
    const doomed = path.join(HOME, 'Documents', 'temporary');
    mkdirSync(doomed, { recursive: true });
    emitEvent(manager, boundaryFrame('call-gone', doomed));
    rmSync(doomed, { recursive: true, force: true });

    manager.confirm('call-gone', 'call-gone', PATH_BOUNDARY_GRANT_FOLDER);
    await vi.waitFor(() => expect(agent.denyTool).toHaveBeenCalled());

    expect(agent.approveTool).not.toHaveBeenCalled();
  });
});

/**
 * #1099 / external audit — a remote peer cannot VETO the desktop's decision.
 *
 * `confirmation.list` gives a paired WebUI the pending `callId`, and the wire
 * gate cannot deny legacy `cancel` outright: on an ordinary card a remote
 * decline is a feature, and the gate is a pure value predicate with no idea
 * which callId belongs to a boundary card. So the refusal lives here, where the
 * card IS known. It mints no authority either way — but a remote peer making
 * the security prompt in front of a local user disappear, and the call be
 * denied, is not something "the desktop owns this decision" survives.
 *
 * No local surface can hit this: the desktop renders `PathBoundaryConfirmCard`,
 * whose three buttons are this card's own values, and both remote surfaces that
 * build option lists (`ActionExecutor`, `GeminiAgentManager`) return NO options
 * for a `path_boundary`.
 */
describe('#1099 a remote cancel cannot dismiss a boundary card', () => {
  let manager: WCoreManager;
  let agent: FakeAgent;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRootContext.mockResolvedValue(ROOT_CONTEXT);
    manager = createManager();
    agent = attachAgent(manager);
    vi.spyOn(manager as any, 'postMessagePromise').mockResolvedValue(undefined);
    emitEvent(manager, boundaryFrame());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('leaves the card standing and sends nothing', async () => {
    manager.confirm('call-boundary', 'call-boundary', 'cancel');
    // Given a chance to run: the route is async on the grant side, so an
    // immediate assertion could pass before anything had happened at all.
    await Promise.resolve();

    expect(agent.denyTool, 'cancel must not deny a boundary call').not.toHaveBeenCalled();
    expect(agent.approveTool, 'cancel must not approve one either').not.toHaveBeenCalled();
    expect(emitConfirmationRemove, 'the desktop card must still be there').not.toHaveBeenCalled();

    // CONTROL, same card and same manager: the card's OWN deny value does
    // dismiss it and deny the call, so the refusal above is the guard and not a
    // card that was already gone.
    vi.clearAllMocks();
    manager.confirm('call-boundary', 'call-boundary', PATH_BOUNDARY_DENY);
    expect(agent.denyTool).toHaveBeenCalledTimes(1);
    expect(emitConfirmationRemove).toHaveBeenCalled();
  });

  it('CONTROL: cancel still denies an ORDINARY confirmation', async () => {
    // The gate is specific to a boundary card. A remote peer answering an
    // everyday tool prompt is a feature and must keep working.
    vi.clearAllMocks();
    emitEvent(manager, infoFrame());
    manager.confirm('call-info', 'call-info', 'cancel');

    expect(agent.denyTool).toHaveBeenCalledTimes(1);
    expect(agent.denyTool.mock.calls[0][0]).toBe('call-info');
  });
});

/**
 * #982 - the durable list is REPLAYED, so a folder the user already opened does
 * not stop an unattended run.
 *
 * The prompting axis and the boundary axis are different things: a grant the
 * user recorded is a decision already made, and re-asking for it is what turned
 * "persistent scoped trust" into a button that promised something nothing
 * delivered. Core's `grant_path` is still unsendable against the pinned corpus
 * (`FerroxLabs/wayland-core#314`), so the replay answers the card the engine
 * raises, with `tool_approve` + `always_path` - the same command, carrying the
 * same root, that the user's own click sends.
 *
 * IT REPLAYS, IT DOES NOT DECIDE. The root has to come back live from the
 * revalidating read AND pass `vetFolderGrantRoot`. There is no mode, no
 * setting and no engine frame that can make this hand over a folder the user
 * never recorded - which is why it does not touch `tryAutoApprove`, whose
 * refusal of every path boundary is unchanged.
 */
describe('#982 a recorded folder grant answers the card without asking again', () => {
  let manager: WCoreManager;
  let agent: FakeAgent;

  const listing = (grants: Array<{ root: string }>) => ({
    workspaceId: `path:/test/workspace`,
    grants: grants.map((g, i) => ({
      grantId: `g-${i}`,
      root: g.root,
      access: 'read',
      grantedAtMs: 1,
      origin: 'consent_card',
    })),
    withheld: [],
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockRootContext.mockResolvedValue(ROOT_CONTEXT);
    mockResolveWorkspaceId.mockResolvedValue('path:/test/workspace');
    mockGrantList.mockResolvedValue(listing([]) as never);
    manager = createManager();
    agent = attachAgent(manager);
    vi.spyOn(manager as any, 'postMessagePromise').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('grants the recorded root and clears the card the user never has to see', async () => {
    mockGrantList.mockResolvedValue(listing([{ root: ROOT }]) as never);

    emitEvent(manager, boundaryFrame('call-replay', ROOT));
    await vi.waitFor(() => expect(agent.approveTool).toHaveBeenCalled());

    expect(agent.approveTool).toHaveBeenCalledWith('call-replay', {
      always_path: { root: ROOT, write: false },
    });
    expect(agent.denyTool).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(emitConfirmationRemove).toHaveBeenCalled());
  });

  it('answers with the RECORDED folder even when the engine asked about a sub-folder', async () => {
    mockGrantList.mockResolvedValue(listing([{ root: ROOT }]) as never);
    const inside = path.join(ROOT, 'q3');
    mkdirSync(inside, { recursive: true });

    emitEvent(manager, boundaryFrame('call-inside', inside));
    await vi.waitFor(() => expect(agent.approveTool).toHaveBeenCalled());

    expect(agent.approveTool.mock.calls[0][1]).toEqual({ always_path: { root: ROOT, write: false } });
  });

  it('leaves the card standing for a folder nobody recorded', async () => {
    mockGrantList.mockResolvedValue(listing([{ root: ROOT }]) as never);
    const other = path.join(HOME, 'Documents', 'invoices');
    mkdirSync(other, { recursive: true });

    emitEvent(manager, boundaryFrame('call-other', other));
    // Give the detached replay check every chance to fire before asserting it did not.
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(agent.approveTool).not.toHaveBeenCalled();
    expect(agent.denyTool).not.toHaveBeenCalled();
    expect(emitConfirmationAdd).toHaveBeenCalledTimes(1);
  });

  it('leaves the card standing when the list holds nothing at all', async () => {
    emitEvent(manager, boundaryFrame('call-empty', ROOT));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(agent.approveTool).not.toHaveBeenCalled();
    expect(emitConfirmationAdd).toHaveBeenCalledTimes(1);
  });

  it('never replays a root the host authority gate refuses', async () => {
    // A hand-edited grants file naming Wayland's own storage must not become
    // authority just because it is on the list.
    mockGrantList.mockResolvedValue(listing([{ root: WAYLAND_CONFIG }]) as never);

    emitEvent(manager, boundaryFrame('call-private', WAYLAND_CONFIG));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(agent.approveTool).not.toHaveBeenCalled();
    expect(emitConfirmationAdd).toHaveBeenCalledTimes(1);
  });

  it('does not answer a card the user already answered', async () => {
    // The check is asynchronous, so a fast click can land first. Answering
    // again would send a second approval for a call that is already resolved.
    mockGrantList.mockResolvedValue(
      new Promise((resolve) => setTimeout(() => resolve(listing([{ root: ROOT }]) as never), 30)) as never
    );

    emitEvent(manager, boundaryFrame('call-race', ROOT));
    manager.confirm('call-race', 'call-race', PATH_BOUNDARY_DENY);
    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(agent.denyTool).toHaveBeenCalledTimes(1);
    expect(agent.approveTool).not.toHaveBeenCalled();
  });

  it('CONTROL: an ordinary confirmation is never touched by the replay', async () => {
    mockGrantList.mockResolvedValue(listing([{ root: ROOT }]) as never);

    emitEvent(manager, infoFrame('call-ordinary'));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(agent.approveTool).not.toHaveBeenCalled();
    expect(emitConfirmationAdd).toHaveBeenCalledTimes(1);
  });
});
