/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import {
  GoogleChatPubSubSubscriber,
  isValidSubscriptionPath,
  pubsubMessageToEvent,
} from '@process/channels/plugins/tier3/google-chat/GoogleChatPubSub';
import { googleChatEventToUnified } from '@process/channels/plugins/tier3/google-chat/GoogleChatAdapter';
import type { IUnifiedIncomingMessage } from '@process/channels/types';

const PLUGIN_ID = 'google-chat_default';

// ── Realistic envelope fixtures ─────────────────────────────────────────────

/** Format A: Google Workspace Add-ons wrapper (chat.messagePayload). */
function workspaceAddonsEnvelope(): unknown {
  return {
    chat: {
      messagePayload: {
        space: { name: 'spaces/AAABBBCCC', displayName: 'General', type: 'ROOM' },
        message: {
          name: 'spaces/AAABBBCCC/messages/MSG001',
          text: 'Hello bot via pubsub',
          sender: {
            name: 'users/12345',
            displayName: 'Alice',
            email: 'alice@example.com',
            type: 'HUMAN',
          },
        },
      },
    },
  };
}

/** Format B: native Chat API event (same shape the webhook verifier emits). */
function nativeChatApiEnvelope(): unknown {
  return {
    type: 'MESSAGE',
    eventTime: '2026-05-18T12:30:00Z',
    space: { name: 'spaces/AAABBBCCC', displayName: 'General' },
    user: { name: 'users/12345', displayName: 'Alice', email: 'alice@example.com' },
    message: {
      name: 'spaces/AAABBBCCC/messages/MSG002',
      text: 'Hello bot native',
    },
  };
}

function pubsubData(envelope: unknown): Buffer {
  return Buffer.from(JSON.stringify(envelope), 'utf-8');
}

// ── isValidSubscriptionPath ─────────────────────────────────────────────────

describe('isValidSubscriptionPath', () => {
  it('accepts a well-formed subscription path', () => {
    expect(isValidSubscriptionPath('projects/my-project/subscriptions/wayland-sub')).toBe(true);
  });

  it('rejects a topic path', () => {
    expect(isValidSubscriptionPath('projects/my-project/topics/wayland-topic')).toBe(false);
  });

  it('rejects a bare subscription id', () => {
    expect(isValidSubscriptionPath('wayland-sub')).toBe(false);
  });

  it('rejects a path with extra segments', () => {
    expect(isValidSubscriptionPath('projects/p/subscriptions/s/extra')).toBe(false);
  });
});

// ── pubsubMessageToEvent (pure parse) ───────────────────────────────────────

describe('pubsubMessageToEvent', () => {
  it('parses a Workspace Add-ons MESSAGE envelope into a usable event', () => {
    const event = pubsubMessageToEvent(pubsubData(workspaceAddonsEnvelope()));
    expect(event).not.toBeNull();
    expect(event!.type).toBe('MESSAGE');
    expect(event!.space?.name).toBe('spaces/AAABBBCCC');
    expect(event!.message?.text).toBe('Hello bot via pubsub');
  });

  it('parses a native Chat API MESSAGE envelope', () => {
    const event = pubsubMessageToEvent(pubsubData(nativeChatApiEnvelope()));
    expect(event).not.toBeNull();
    expect(event!.space?.name).toBe('spaces/AAABBBCCC');
    expect(event!.message?.text).toBe('Hello bot native');
  });

  it('accepts a string payload as well as a Buffer', () => {
    const event = pubsubMessageToEvent(JSON.stringify(nativeChatApiEnvelope()));
    expect(event).not.toBeNull();
    expect(event!.message?.name).toBe('spaces/AAABBBCCC/messages/MSG002');
  });

  it('end-to-end: pubsub message -> unified message yields the correct fields', () => {
    const event = pubsubMessageToEvent(pubsubData(workspaceAddonsEnvelope()));
    const unified = googleChatEventToUnified(event!, PLUGIN_ID);
    expect(unified).not.toBeNull();
    expect(unified!.platform).toBe('google-chat');
    expect(unified!.chatId).toBe('spaces/AAABBBCCC');
    expect(unified!.id).toBe('spaces/AAABBBCCC/messages/MSG001');
    expect(unified!.content.text).toBe('Hello bot via pubsub');
    expect(unified!.user.id).toBe('users/12345');
    expect(unified!.user.displayName).toBe('Alice');
  });

  it('drops a Workspace Add-ons envelope that carries no messagePayload (membership/card)', () => {
    const membership = {
      chat: { membershipPayload: { space: { name: 'spaces/X' }, membership: {} } },
    };
    expect(pubsubMessageToEvent(pubsubData(membership))).toBeNull();
  });

  it('drops a native non-MESSAGE event (ADDED_TO_SPACE)', () => {
    const added = { type: 'ADDED_TO_SPACE', space: { name: 'spaces/X' } };
    expect(pubsubMessageToEvent(pubsubData(added))).toBeNull();
  });

  it('drops a native non-MESSAGE event (REMOVED_FROM_SPACE)', () => {
    const removed = { type: 'REMOVED_FROM_SPACE', space: { name: 'spaces/X' } };
    expect(pubsubMessageToEvent(pubsubData(removed))).toBeNull();
  });

  it('drops a native MESSAGE event that has no message object', () => {
    const noMessage = { type: 'MESSAGE', space: { name: 'spaces/X' } };
    expect(pubsubMessageToEvent(pubsubData(noMessage))).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    expect(pubsubMessageToEvent(Buffer.from('{not json', 'utf-8'))).toBeNull();
  });

  it('returns null for a non-object JSON body', () => {
    expect(pubsubMessageToEvent(Buffer.from('42', 'utf-8'))).toBeNull();
  });
});

// ── Subscriber message handling (ack / drop / forward) ──────────────────────
//
// Mock the heavy @google-cloud/pubsub SDK so we can drive the subscriber's
// `message` handler directly and assert ack() behaviour without a real
// streaming pull.

const { mockSubscriptionOn, mockSubscriptionClose, mockPubSubClose, capturedHandlers } = vi.hoisted(() => {
  const capturedHandlers: Record<string, (...args: unknown[]) => void> = {};
  return {
    capturedHandlers,
    mockSubscriptionClose: vi.fn().mockResolvedValue(undefined),
    mockPubSubClose: vi.fn().mockResolvedValue(undefined),
    mockSubscriptionOn: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      capturedHandlers[event] = handler;
    }),
  };
});

vi.mock('@google-cloud/pubsub', () => {
  const subscription = {
    on: mockSubscriptionOn,
    removeAllListeners: vi.fn(),
    close: mockSubscriptionClose,
  };
  return {
    PubSub: vi.fn(function () {
      return {
        subscription: vi.fn(() => subscription),
        close: mockPubSubClose,
      };
    }),
  };
});

const SA_CREDS = {
  client_email: 'bot@my-project.iam.gserviceaccount.com',
  private_key: '-----BEGIN RSA PRIVATE KEY-----\nFAKE\n-----END RSA PRIVATE KEY-----\n',
  project_id: 'my-project',
};

function makeFakeMessage(envelope: unknown): {
  ack: ReturnType<typeof vi.fn>;
  nack: ReturnType<typeof vi.fn>;
  data: Buffer;
  attributes: Record<string, string>;
} {
  return {
    ack: vi.fn(),
    nack: vi.fn(),
    data: pubsubData(envelope),
    attributes: {},
  };
}

async function startSubscriber(
  onMessage: (m: IUnifiedIncomingMessage) => Promise<void>
): Promise<GoogleChatPubSubSubscriber> {
  const subscriber = new GoogleChatPubSubSubscriber({
    subscriptionName: 'projects/my-project/subscriptions/wayland-sub',
    credentials: SA_CREDS,
    pluginInstanceId: PLUGIN_ID,
    onMessage,
  });
  await subscriber.start();
  return subscriber;
}

describe('GoogleChatPubSubSubscriber message handling', () => {
  it('throws on an invalid subscription path before opening any stream', async () => {
    const subscriber = new GoogleChatPubSubSubscriber({
      subscriptionName: 'not-a-path',
      credentials: SA_CREDS,
      pluginInstanceId: PLUGIN_ID,
      onMessage: vi.fn(),
    });
    await expect(subscriber.start()).rejects.toThrow(/projects\/<project>\/subscriptions/);
  });

  it('forwards a MESSAGE event to onMessage and acks it', async () => {
    const onMessage = vi.fn<(m: IUnifiedIncomingMessage) => Promise<void>>().mockResolvedValue();
    await startSubscriber(onMessage);

    const message = makeFakeMessage(workspaceAddonsEnvelope());
    await capturedHandlers.message(message);

    expect(onMessage).toHaveBeenCalledTimes(1);
    const forwarded = onMessage.mock.calls[0][0];
    expect(forwarded.chatId).toBe('spaces/AAABBBCCC');
    expect(forwarded.content.text).toBe('Hello bot via pubsub');
    expect(message.ack).toHaveBeenCalledTimes(1);
    expect(message.nack).not.toHaveBeenCalled();
  });

  it('acks and drops a non-MESSAGE event without calling onMessage', async () => {
    const onMessage = vi.fn<(m: IUnifiedIncomingMessage) => Promise<void>>().mockResolvedValue();
    await startSubscriber(onMessage);

    const message = makeFakeMessage({ type: 'ADDED_TO_SPACE', space: { name: 'spaces/X' } });
    await capturedHandlers.message(message);

    expect(onMessage).not.toHaveBeenCalled();
    expect(message.ack).toHaveBeenCalledTimes(1);
  });

  it('acks and drops a malformed payload without calling onMessage', async () => {
    const onMessage = vi.fn<(m: IUnifiedIncomingMessage) => Promise<void>>().mockResolvedValue();
    await startSubscriber(onMessage);

    const message = { ack: vi.fn(), nack: vi.fn(), data: Buffer.from('{bad', 'utf-8'), attributes: {} };
    await capturedHandlers.message(message);

    expect(onMessage).not.toHaveBeenCalled();
    expect(message.ack).toHaveBeenCalledTimes(1);
  });

  it('still acks when the handler throws (no redelivery storm)', async () => {
    const onMessage = vi
      .fn<(m: IUnifiedIncomingMessage) => Promise<void>>()
      .mockRejectedValue(new Error('downstream boom'));
    await startSubscriber(onMessage);

    const message = makeFakeMessage(nativeChatApiEnvelope());
    await capturedHandlers.message(message);

    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(message.ack).toHaveBeenCalledTimes(1);
  });

  it('closes the subscription and client on stop', async () => {
    mockSubscriptionClose.mockClear();
    mockPubSubClose.mockClear();
    const subscriber = await startSubscriber(vi.fn());
    await subscriber.stop();
    expect(mockSubscriptionClose).toHaveBeenCalledTimes(1);
    expect(mockPubSubClose).toHaveBeenCalledTimes(1);
  });
});
