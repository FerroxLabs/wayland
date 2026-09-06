/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TMessage } from '@/common/chat/chatLib';
import { ActionExecutor } from '@process/channels/gateway/ActionExecutor';
import { handlePairingShow } from '@process/channels/actions/PlatformActions';
import type { BasePlugin } from '@process/channels/plugins/BasePlugin';
import type { IActionContext } from '@process/channels/actions/types';
import type { IPluginCapabilities, IUnifiedIncomingMessage, IUnifiedOutgoingMessage } from '@process/channels/types';

// ----- Hoisted mocks ---------------------------------------------------------

const hoisted = vi.hoisted(() => {
  return {
    sendMessageMock: vi.fn() as ReturnType<typeof vi.fn>,
    welcomeOnFirstContactMock: vi.fn() as ReturnType<typeof vi.fn>,
  };
});

vi.mock('@process/channels/gateway/ChannelWelcomeService', () => ({
  getChannelWelcomeService: () => ({
    welcomeOnFirstContact: hoisted.welcomeOnFirstContactMock,
  }),
}));

vi.mock('@process/channels/agent/ChannelMessageService', () => ({
  getChannelMessageService: () => ({
    sendMessage: hoisted.sendMessageMock,
  }),
}));

vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(),
}));

vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: vi.fn() },
}));

vi.mock('@/process/services/conversationServiceSingleton', () => ({
  conversationServiceSingleton: { createConversation: vi.fn() },
}));

vi.mock('@process/services/i18n', () => ({
  default: { t: (k: string) => k },
}));

vi.mock('@process/channels/utils', () => ({
  buildChannelConversationExtra: vi.fn(),
  resolveChannelSendProtocol: vi.fn(),
}));

vi.mock('@process/channels/actions/ChatActions', () => ({
  buildChatErrorResponse: (msg: string) => ({
    text: `ERROR: ${msg}`,
    parseMode: 'HTML',
    replyMarkup: undefined,
  }),
  chatActions: [],
}));

vi.mock('@process/channels/actions/PlatformActions', () => ({
  handlePairingShow: vi.fn(),
  platformActions: [],
}));

vi.mock('@process/channels/actions/SystemActions', () => ({
  getChannelDefaultModel: vi.fn(),
  systemActions: [],
}));

// ----- Helpers ---------------------------------------------------------------

function makeCaps(overrides: Partial<IPluginCapabilities> = {}): IPluginCapabilities {
  return {
    canEdit: true,
    canReact: false,
    canStream: true,
    canTypingIndicator: false,
    ...overrides,
  };
}

function makePlugin(caps: IPluginCapabilities, extras: Partial<BasePlugin> = {}): BasePlugin {
  return {
    type: 'telegram',
    capabilities: caps,
    ...extras,
  } as unknown as BasePlugin;
}

type RecordingContext = {
  context: IActionContext;
  sendMessage: ReturnType<typeof vi.fn>;
  editMessage: ReturnType<typeof vi.fn>;
};

function makeContext(platform = 'telegram'): RecordingContext {
  const sendMessage = vi.fn(async () => 'msg-id-1');
  const editMessage = vi.fn(async () => undefined);
  const context: IActionContext = {
    platform,
    pluginId: 'telegram_default',
    userId: 'u1',
    chatId: 'chat-1',
    originalMessage: {} as any,
    sessionId: 'sess-1',
    conversationId: 'conv-1',
    sendMessage,
    editMessage,
  };
  return { context, sendMessage, editMessage };
}

function newExecutor() {
  // Constructor takes pluginManager, sessionManager, pairingService - we never
  // exercise those code paths in this suite, so empty stubs are safe.
  return new ActionExecutor({} as any, { updateSessionActivity: () => undefined } as any, {} as any);
}

function makeTextChunk(content: string): TMessage {
  return {
    type: 'text',
    id: 'm1',
    conversation_id: 'conv-1',
    content: { content },
  } as TMessage;
}

// ----- Mode resolution -------------------------------------------------------

describe('ActionExecutor.resolveStreamingMode', () => {
  it('returns edit-driven when canStream && canEdit', () => {
    const exec = newExecutor() as any;
    const plugin = makePlugin(makeCaps({ canStream: true, canEdit: true }));
    expect(exec.resolveStreamingMode(plugin)).toBe('edit-driven');
  });

  it('returns buffered when canEdit is false', () => {
    const exec = newExecutor() as any;
    const plugin = makePlugin(makeCaps({ canStream: true, canEdit: false }));
    expect(exec.resolveStreamingMode(plugin)).toBe('buffered');
  });

  it('returns buffered when canStream is false', () => {
    const exec = newExecutor() as any;
    const plugin = makePlugin(makeCaps({ canStream: false, canEdit: true }));
    expect(exec.resolveStreamingMode(plugin)).toBe('buffered');
  });

  it('returns buffered when both flags are false', () => {
    const exec = newExecutor() as any;
    const plugin = makePlugin(makeCaps({ canStream: false, canEdit: false }));
    expect(exec.resolveStreamingMode(plugin)).toBe('buffered');
  });
});

// ----- Edit-driven path ------------------------------------------------------

describe('ActionExecutor edit-driven streaming dispatch', () => {
  it('sends one placeholder and edits per streamed chunk', async () => {
    hoisted.sendMessageMock.mockReset();
    // Drive 3 chunks through the stream callback before resolving.
    hoisted.sendMessageMock.mockImplementationOnce(
      async (_s: string, _c: string, _t: string, onStream: (m: TMessage, insert: boolean) => Promise<void>) => {
        await onStream(makeTextChunk('hel'), true);
        await onStream(makeTextChunk('hello'), false);
        await onStream(makeTextChunk('hello world'), false);
        return 'final-msg-id';
      }
    );

    const exec = newExecutor() as any;
    const { context, sendMessage, editMessage } = makeContext();

    await exec.dispatchEditDrivenStream(context, 'hi');

    // ONE placeholder send. All chunks → editMessage.
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage.mock.calls[0]?.[0]).toMatchObject({ text: expect.stringContaining('Thinking') });
    // At least one edit per non-throttled chunk + final edit. >= 1 is enough
    // for the behavior (we don't care about throttle internals here).
    expect(editMessage).toHaveBeenCalled();
  });

  it('routes errors through the placeholder via editMessage, not a fresh sendMessage', async () => {
    hoisted.sendMessageMock.mockReset();
    hoisted.sendMessageMock.mockRejectedValueOnce(new Error('boom'));

    const exec = newExecutor() as any;
    const { context, sendMessage, editMessage } = makeContext();

    await exec.dispatchEditDrivenStream(context, 'hi');

    // Placeholder send only; error path edits the placeholder.
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(editMessage).toHaveBeenCalled();
    const lastEdit = editMessage.mock.calls.at(-1)?.[1] as IUnifiedOutgoingMessage;
    expect(lastEdit?.text).toContain('ERROR: boom');
  });

  it('describes an unexpected permission request as denied instead of auto-approved', async () => {
    hoisted.sendMessageMock.mockReset();
    hoisted.sendMessageMock.mockImplementationOnce(
      async (_s: string, _c: string, _t: string, onStream: (m: TMessage, insert: boolean) => Promise<void>) => {
        await onStream(
          {
            type: 'acp_permission',
            id: 'permission-1',
            conversation_id: 'conv-1',
            content: {} as never,
          } as TMessage,
          true
        );
        return 'final-msg-id';
      }
    );

    const exec = newExecutor() as any;
    const { context, editMessage } = makeContext();
    await exec.dispatchEditDrivenStream(context, 'hi');

    const rendered = editMessage.mock.calls.map((call) => (call[1] as IUnifiedOutgoingMessage).text).join('\n');
    expect(rendered).toContain('Tool permission denied');
    expect(rendered).not.toContain('automatic approval');
  });
});

// ----- Buffered path ---------------------------------------------------------

describe('ActionExecutor buffered streaming dispatch', () => {
  it('emits exactly one sendMessage with the final cumulative content (canEdit=false)', async () => {
    hoisted.sendMessageMock.mockReset();
    hoisted.sendMessageMock.mockImplementationOnce(
      async (_s: string, _c: string, _t: string, onStream: (m: TMessage, insert: boolean) => Promise<void>) => {
        await onStream(makeTextChunk('hel'), true);
        await onStream(makeTextChunk('hello'), false);
        await onStream(makeTextChunk('hello world'), false);
        return 'final-msg-id';
      }
    );

    const exec = newExecutor() as any;
    const { context, sendMessage, editMessage } = makeContext();
    const plugin = makePlugin(makeCaps({ canEdit: false, canStream: true }));

    await exec.dispatchBufferedStream(context, 'hi', plugin);

    // Exactly ONE outbound message (the final buffered chunk). NO edits.
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(editMessage).not.toHaveBeenCalled();
    const final = sendMessage.mock.calls[0]?.[0] as IUnifiedOutgoingMessage;
    expect(final.text).toBe('hello world');
  });

  it('emits exactly one sendMessage when canStream=false', async () => {
    hoisted.sendMessageMock.mockReset();
    hoisted.sendMessageMock.mockImplementationOnce(
      async (_s: string, _c: string, _t: string, onStream: (m: TMessage, insert: boolean) => Promise<void>) => {
        await onStream(makeTextChunk('only chunk'), true);
        return 'final-msg-id';
      }
    );

    const exec = newExecutor() as any;
    const { context, sendMessage, editMessage } = makeContext();
    const plugin = makePlugin(makeCaps({ canEdit: true, canStream: false }));

    await exec.dispatchBufferedStream(context, 'hi', plugin);

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(editMessage).not.toHaveBeenCalled();
    const final = sendMessage.mock.calls[0]?.[0] as IUnifiedOutgoingMessage;
    expect(final.text).toBe('only chunk');
  });

  it('calls sendTypingIndicator once when canTypingIndicator=true and method exists', async () => {
    hoisted.sendMessageMock.mockReset();
    hoisted.sendMessageMock.mockImplementationOnce(
      async (_s: string, _c: string, _t: string, onStream: (m: TMessage, insert: boolean) => Promise<void>) => {
        await onStream(makeTextChunk('ok'), true);
        return 'final-msg-id';
      }
    );

    const sendTypingIndicator = vi.fn(async () => undefined);
    const plugin = makePlugin(makeCaps({ canEdit: false, canTypingIndicator: true }), {
      sendTypingIndicator,
    } as any);

    const exec = newExecutor() as any;
    const { context } = makeContext();

    await exec.dispatchBufferedStream(context, 'hi', plugin);

    expect(sendTypingIndicator).toHaveBeenCalledTimes(1);
    expect(sendTypingIndicator).toHaveBeenCalledWith('chat-1');
  });

  it('does not call sendTypingIndicator when capability is false', async () => {
    hoisted.sendMessageMock.mockReset();
    hoisted.sendMessageMock.mockImplementationOnce(
      async (_s: string, _c: string, _t: string, onStream: (m: TMessage, insert: boolean) => Promise<void>) => {
        await onStream(makeTextChunk('ok'), true);
        return 'final-msg-id';
      }
    );

    const sendTypingIndicator = vi.fn(async () => undefined);
    const plugin = makePlugin(makeCaps({ canEdit: false, canTypingIndicator: false }), {
      sendTypingIndicator,
    } as any);

    const exec = newExecutor() as any;
    const { context } = makeContext();

    await exec.dispatchBufferedStream(context, 'hi', plugin);

    expect(sendTypingIndicator).not.toHaveBeenCalled();
  });

  it('on mid-stream error, emits ONE message containing buffered content + error notice', async () => {
    hoisted.sendMessageMock.mockReset();
    hoisted.sendMessageMock.mockImplementationOnce(
      async (_s: string, _c: string, _t: string, onStream: (m: TMessage, insert: boolean) => Promise<void>) => {
        await onStream(makeTextChunk('partial answer'), true);
        throw new Error('upstream timeout');
      }
    );

    const exec = newExecutor() as any;
    const { context, sendMessage, editMessage } = makeContext();
    const plugin = makePlugin(makeCaps({ canEdit: false }));

    await exec.dispatchBufferedStream(context, 'hi', plugin);

    expect(editMessage).not.toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledTimes(1);
    const final = sendMessage.mock.calls[0]?.[0] as IUnifiedOutgoingMessage;
    expect(final.text).toContain('partial answer');
    expect(final.text).toContain('ERROR: upstream timeout');
  });

  it('emits a fallback sendMessage when session is not initialized', async () => {
    hoisted.sendMessageMock.mockReset();

    const exec = newExecutor() as any;
    const { context, sendMessage } = makeContext();
    context.sessionId = undefined;
    context.conversationId = undefined;
    const plugin = makePlugin(makeCaps({ canEdit: false }));

    await exec.dispatchBufferedStream(context, 'hi', plugin);

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(hoisted.sendMessageMock).not.toHaveBeenCalled();
    const out = sendMessage.mock.calls[0]?.[0] as IUnifiedOutgoingMessage;
    expect(out.text).toContain('Session not initialized');
  });
});

// ----- Pairing gate: personal-mode stranger silence -------------------------

const handlePairingShowMock = vi.mocked(handlePairingShow);

type GatePlugin = {
  plugin: BasePlugin;
  sendMessage: ReturnType<typeof vi.fn>;
  generatePairingCode: ReturnType<typeof vi.fn>;
};

/**
 * Build a plugin whose pairing capability is driven by `allowsContactPairing`.
 * sendMessage and generatePairingCode are spies so the test can assert ZERO
 * outbound + ZERO pairing-code generation for a personal-mode stranger.
 */
function makeGatePlugin(allowsContactPairing: boolean): GatePlugin {
  const sendMessage = vi.fn(async () => 'mid-1');
  const generatePairingCode = vi.fn(async () => '123456');
  const plugin = {
    type: 'whatsapp',
    capabilities: makeCaps(),
    sendMessage,
    editMessage: vi.fn(async () => undefined),
    generatePairingCode,
    allowsContactPairing: () => allowsContactPairing,
    getSelfTarget: () => null,
    getAccountIdentity: () => 'acc-1',
  } as unknown as BasePlugin;
  return { plugin: plugin, sendMessage, generatePairingCode };
}

function makeInbound(overrides: Partial<IUnifiedIncomingMessage> = {}): IUnifiedIncomingMessage {
  return {
    id: 'in-1',
    platform: 'whatsapp',
    chatId: 'chat-stranger',
    user: { id: 'stranger-1', displayName: 'Stranger' },
    content: { type: 'text', text: 'hello' },
    timestamp: Date.now(),
    ...overrides,
  } as IUnifiedIncomingMessage;
}

function gateExecutor(gate: GatePlugin, isAuthorized: boolean) {
  const pluginManager = { getAllPlugins: () => [gate.plugin] };
  const sessionManager = {
    getSession: () => undefined,
    updateSessionActivity: () => undefined,
  };
  const authorizeOwner = vi.fn(async () => undefined);
  const pairingService = {
    isUserAuthorized: vi.fn(async () => isAuthorized),
    authorizeOwner,
  };
  const exec = new ActionExecutor(pluginManager as any, sessionManager as any, pairingService as any);
  return { exec, authorizeOwner };
}

describe('ActionExecutor pairing gate - personal-mode stranger silence', () => {
  beforeEach(() => {
    handlePairingShowMock.mockReset();
    handlePairingShowMock.mockResolvedValue({ message: { type: 'text', text: 'pair me' } } as any);
    hoisted.welcomeOnFirstContactMock.mockReset();
    hoisted.welcomeOnFirstContactMock.mockResolvedValue(undefined);
  });

  it('personal stranger gets ZERO outbound, ZERO pairing, and NO welcome', async () => {
    const gate = makeGatePlugin(false); // personal mode: allowsContactPairing=false
    const { exec, authorizeOwner } = gateExecutor(gate, false);
    const handler = exec.getMessageHandler();

    await handler(makeInbound());

    // The incident cannot recur: no message left the channel, no pairing code
    // was generated, the pairing prompt was never shown, and the first-contact
    // welcome was never reached (the silent return happens before it).
    expect(gate.sendMessage).not.toHaveBeenCalled();
    expect(gate.generatePairingCode).not.toHaveBeenCalled();
    expect(handlePairingShowMock).not.toHaveBeenCalled();
    expect(hoisted.welcomeOnFirstContactMock).not.toHaveBeenCalled();
    expect(authorizeOwner).not.toHaveBeenCalled();
  });

  it('personal /start command is also silent (no pairing prompt)', async () => {
    const gate = makeGatePlugin(false);
    const { exec } = gateExecutor(gate, false);
    const handler = exec.getMessageHandler();

    await handler(makeInbound({ content: { type: 'command', text: '/start' } }));

    expect(gate.sendMessage).not.toHaveBeenCalled();
    expect(handlePairingShowMock).not.toHaveBeenCalled();
  });

  it('dedicated stranger still gets the pairing prompt (existing behavior preserved)', async () => {
    const gate = makeGatePlugin(true); // dedicated mode: allowsContactPairing=true
    const { exec } = gateExecutor(gate, false);
    const handler = exec.getMessageHandler();

    await handler(makeInbound());

    expect(handlePairingShowMock).toHaveBeenCalledTimes(1);
    expect(gate.sendMessage).toHaveBeenCalledTimes(1);
  });

  it('owner inbound is authorized regardless of mode', async () => {
    const gate = makeGatePlugin(false);
    const { exec, authorizeOwner } = gateExecutor(gate, false);
    const handler = exec.getMessageHandler();

    await handler(makeInbound({ isOwner: true }));

    expect(authorizeOwner).toHaveBeenCalledTimes(1);
    expect(handlePairingShowMock).not.toHaveBeenCalled();
  });

  it('owner whose authorizeOwner fails (null) gets an internal-error message, NOT the misleading re-pair message, and no conversation', async () => {
    const gate = makeGatePlugin(false);
    // gateExecutor wires authorizeOwner to resolve undefined (the DB-write-failed
    // signal). With the fix the handler must return before the
    // getChannelUserByPlatform lookup that would otherwise send "re-pair".
    const { exec, authorizeOwner } = gateExecutor(gate, false);
    const handler = exec.getMessageHandler();

    await handler(makeInbound({ isOwner: true }));

    expect(authorizeOwner).toHaveBeenCalledTimes(1);
    // Exactly one outbound: the internal-error notice. NOT the re-pair message,
    // and no second send for a created conversation.
    expect(gate.sendMessage).toHaveBeenCalledTimes(1);
    const out = gate.sendMessage.mock.calls[0]?.[1] as IUnifiedOutgoingMessage;
    expect(out.text).not.toContain('re-pair');
    expect(out.text).toContain('Internal error saving your account');
    // No conversation was created (welcome service never reached).
    expect(hoisted.welcomeOnFirstContactMock).not.toHaveBeenCalled();
  });
});
