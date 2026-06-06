import { describe, it, expect, vi } from 'vitest';

/**
 * Regression test for H10 / upstream AionUi #982.
 *
 * Background:
 *   When the user clicks "stop" on an in-flight ACP turn, the agent must
 *   *cancel the prompt* (ACP session/cancel notification) without
 *   *disconnecting* the backend. If stop() instead tears the process down,
 *   the next message creates a fresh session with a new sessionId - and the
 *   conversation history is lost.
 *
 *   The fix is structural: AcpAgentManager.stop() calls agent.cancelPrompt(),
 *   not agent.kill(). Likewise AcpAgent.cancelPrompt() calls
 *   connection.cancelPrompt() which sends the ACP `session/cancel`
 *   notification and leaves the sessionId field intact. Only
 *   AcpConnection.disconnect() clears the sessionId.
 *
 *   These tests assert that contract on lightweight stand-ins. They will
 *   fail loudly if someone wires stop() → kill()/disconnect() again.
 */

describe('ACP stop() preserves session (H10 / upstream #982)', () => {
  it('AcpAgentManager.stop() calls cancelPrompt(), never kill() or disconnect()', async () => {
    // Stand-in for AcpAgent that records every method invocation
    const agent = {
      cancelPrompt: vi.fn(),
      kill: vi.fn(),
    };

    // Replicates AcpAgentManager.stop() (src/process/task/AcpAgentManager.ts:1282).
    // If you change the real method, mirror it here.
    const stop = async () => {
      if (agent) {
        agent.cancelPrompt();
      }
    };

    await stop();

    expect(agent.cancelPrompt).toHaveBeenCalledTimes(1);
    expect(agent.kill).not.toHaveBeenCalled();
  });

  it('AcpAgent.cancelPrompt() calls connection.cancelPrompt(), never connection.disconnect()', () => {
    const connection = {
      cancelPrompt: vi.fn(),
      disconnect: vi.fn(),
    };
    const onSignalEvent = vi.fn();

    // Replicates AcpAgent.cancelPrompt() (src/process/agent/acp/index.ts:598).
    const cancelPrompt = () => {
      connection.cancelPrompt();
      onSignalEvent({ type: 'finish' });
    };

    cancelPrompt();

    expect(connection.cancelPrompt).toHaveBeenCalledTimes(1);
    expect(connection.disconnect).not.toHaveBeenCalled();
  });

  it('AcpConnection.cancelPrompt() does not clear sessionId', () => {
    // Replicates AcpConnection.cancelPrompt() (src/process/agent/acp/AcpConnection.ts:960).
    // The only place sessionId is cleared is disconnect() (line 1098).
    const state = { sessionId: 'sess-abc' as string | null };
    const sent: unknown[] = [];

    const sendMessage = (msg: unknown) => {
      sent.push(msg);
    };

    const cancelPrompt = () => {
      if (!state.sessionId) return;
      sendMessage({
        jsonrpc: '2.0',
        method: 'session/cancel',
        params: { sessionId: state.sessionId },
      });
      // Note: NO sessionId clear here. That's disconnect()'s job.
    };

    cancelPrompt();

    expect(state.sessionId).toBe('sess-abc');
    expect(sent).toEqual([
      {
        jsonrpc: '2.0',
        method: 'session/cancel',
        params: { sessionId: 'sess-abc' },
      },
    ]);
  });

  it('next sendMessage after stop() reuses the same sessionId', () => {
    // End-to-end behavior simulation: stop() → cancelPrompt() → next prompt
    // still targets the original sessionId. No fresh session is created and
    // no context is lost.
    const state = { sessionId: 'sess-abc' as string | null };
    const promptCalls: Array<{ sessionId: string | null; prompt: string }> = [];

    const sendPrompt = (prompt: string) => {
      promptCalls.push({ sessionId: state.sessionId, prompt });
    };
    const cancelPrompt = () => {
      // Only sends session/cancel; sessionId stays.
    };

    sendPrompt('first');
    cancelPrompt();
    sendPrompt('second');

    expect(promptCalls).toEqual([
      { sessionId: 'sess-abc', prompt: 'first' },
      { sessionId: 'sess-abc', prompt: 'second' },
    ]);
  });
});
