/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';

import type { TMessage } from '@/common/chat/chatLib';
import { ActionExecutor } from '@process/channels/gateway/ActionExecutor';
import type { BasePlugin } from '@process/channels/plugins/BasePlugin';
import type { IActionContext } from '@process/channels/actions/types';
import type { IPluginCapabilities, IUnifiedOutgoingMessage } from '@process/channels/types';

// ----- Hoisted mocks ---------------------------------------------------------

const hoisted = vi.hoisted(() => {
  return {
    sendMessageMock: vi.fn() as ReturnType<typeof vi.fn>,
  };
});

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
