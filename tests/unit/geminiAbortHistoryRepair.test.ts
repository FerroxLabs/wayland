import { describe, it, expect } from 'vitest';
import type { Content } from '@google/genai';

/**
 * Regression test for H10 / upstream AionUi #982.
 *
 * Background:
 *   aioncli-core's GeminiChat.sendMessageStream pushes the user turn into
 *   history BEFORE the model stream starts, and only pushes the model turn
 *   after the stream successfully consolidates. If the user aborts mid-stream
 *   (or the stream throws), history is left ending on a user turn. The next
 *   sendMessage then fails with a 400: the Gemini API requires history to
 *   alternate strictly user/model/user/model.
 *
 * GeminiAgent.repairAbortedHistory() (private) fixes this by appending a
 * synthetic "[aborted]" model turn iff the last entry is a user turn. The
 * test below verifies that logic directly against a stub geminiClient,
 * matching the contract repairAbortedHistory expects.
 */

interface StubGeminiClient {
  initialized: boolean;
  history: Content[];
  isInitialized(): boolean;
  getHistory(): Content[];
  addHistory(content: Content): Promise<void>;
}

function makeStubClient(initial: Content[], initialized = true): StubGeminiClient {
  const stub: StubGeminiClient = {
    initialized,
    history: [...initial],
    isInitialized() {
      return this.initialized;
    },
    getHistory() {
      return this.history;
    },
    async addHistory(content: Content) {
      this.history.push(content);
    },
  };
  return stub;
}

/**
 * Replicates the body of GeminiAgent.repairAbortedHistory(). Kept as a local
 * function so the test does not need to construct a fully-initialized
 * GeminiAgent (which would require workspace, OAuth, Config, etc.). The two
 * implementations must stay in sync - if you change the agent helper, update
 * this test helper to match.
 */
function repairAbortedHistory(geminiClient: StubGeminiClient): void {
  try {
    if (!geminiClient || !geminiClient.isInitialized()) return;
    const history = geminiClient.getHistory();
    if (history.length === 0) return;
    const last = history[history.length - 1];
    if (last?.role !== 'user') return;
    void geminiClient.addHistory({
      role: 'model',
      parts: [{ text: '[aborted]' }],
    });
  } catch {
    // Best-effort: never throw out of repair logic.
  }
}

describe('GeminiAgent abort history repair (H10 / upstream #982)', () => {
  it('appends a synthetic model turn when history ends with a user turn', () => {
    const client = makeStubClient([{ role: 'user', parts: [{ text: 'hello' }] }]);

    repairAbortedHistory(client);

    expect(client.history).toHaveLength(2);
    expect(client.history[1]).toEqual({
      role: 'model',
      parts: [{ text: '[aborted]' }],
    });
  });

  it('next sendMessage would see valid user/model alternation after repair', () => {
    // Simulate the failing sequence:
    //   1. user sends "first message"
    //   2. sendMessageStream pushes user turn (geminiChat.js:248)
    //   3. user aborts before model turn is pushed (geminiChat.js:783)
    //   4. repairAbortedHistory runs in .catch
    //   5. user sends "second message" -- must not 400
    const client = makeStubClient([{ role: 'user', parts: [{ text: 'first message' }] }]);
    repairAbortedHistory(client);

    // Simulate next sendMessageStream pushing the next user turn.
    client.history.push({ role: 'user', parts: [{ text: 'second message' }] });

    // Verify strict alternation user -> model -> user.
    expect(client.history.map((c) => c.role)).toEqual(['user', 'model', 'user']);
  });

  it('is a no-op when history already ends with a model turn', () => {
    const client = makeStubClient([
      { role: 'user', parts: [{ text: 'hello' }] },
      { role: 'model', parts: [{ text: 'hi there' }] },
    ]);

    repairAbortedHistory(client);

    expect(client.history).toHaveLength(2);
    expect(client.history[1].role).toBe('model');
  });

  it('is idempotent when called twice after the same abort', () => {
    const client = makeStubClient([{ role: 'user', parts: [{ text: 'hello' }] }]);

    repairAbortedHistory(client);
    repairAbortedHistory(client);

    // Second call must NOT add another model turn.
    expect(client.history).toHaveLength(2);
    expect(client.history[1].parts).toEqual([{ text: '[aborted]' }]);
  });

  it('is a no-op when client is not initialized', () => {
    const client = makeStubClient([{ role: 'user', parts: [{ text: 'hello' }] }], false);

    repairAbortedHistory(client);

    expect(client.history).toHaveLength(1);
  });

  it('is a no-op when history is empty', () => {
    const client = makeStubClient([]);

    repairAbortedHistory(client);

    expect(client.history).toHaveLength(0);
  });

  it('swallows errors from getHistory/addHistory (best-effort contract)', () => {
    const throwingClient: StubGeminiClient = {
      initialized: true,
      history: [],
      isInitialized() {
        return true;
      },
      getHistory() {
        throw new Error('history read failed');
      },
      async addHistory() {
        // not reached
      },
    };

    // Must not throw.
    expect(() => repairAbortedHistory(throwingClient)).not.toThrow();
  });
});
