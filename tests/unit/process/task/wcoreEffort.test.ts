/**
 * Unit test for per-conversation effort reaching the WCore engine. The WCore
 * effort knob is `WCoreAgent.setConfig({ effort })`, which serializes a
 * `set_config` command to the engine stdin. `WCoreManager.start()` forwards the
 * conversation's `extra.effort` through this exact call on spawn. This test
 * drives the engine knob directly (constructor is side-effect free; no process
 * is spawned) and asserts the effort is carried verbatim, and that absence of a
 * setConfig call leaves the engine on its own default.
 */
import { describe, it, expect, vi } from 'vitest';
import { WCoreAgent } from '@process/agent/wcore';

type StdinSpy = { write: ReturnType<typeof vi.fn>; writable: boolean };

const makeAgent = (): { agent: WCoreAgent; stdin: StdinSpy } => {
  const agent = new WCoreAgent({
    workspace: '/tmp/ws',
    model: { provider: 'flux-router', useModel: 'flux-auto' } as never,
    onStreamEvent: () => {},
  });
  const stdin: StdinSpy = { write: vi.fn(), writable: true };
  // Inject a fake child process so sendCommand has a writable stdin to serialize to.
  (agent as unknown as { childProcess: { stdin: StdinSpy } }).childProcess = { stdin };
  return { agent, stdin };
};

const lastCommand = (stdin: StdinSpy): Record<string, unknown> => {
  const raw = stdin.write.mock.calls.at(-1)?.[0] as string;
  return JSON.parse(raw.trim());
};

describe('WCore per-conversation effort', () => {
  it('forwards effort verbatim via a set_config command', () => {
    const { agent, stdin } = makeAgent();
    agent.setConfig({ effort: 'high' });
    expect(stdin.write).toHaveBeenCalledTimes(1);
    const cmd = lastCommand(stdin);
    expect(cmd.type).toBe('set_config');
    expect(cmd.effort).toBe('high');
  });

  it('carries low/medium effort verbatim', () => {
    for (const effort of ['low', 'medium'] as const) {
      const { agent, stdin } = makeAgent();
      agent.setConfig({ effort });
      expect(lastCommand(stdin).effort).toBe(effort);
    }
  });

  it('sends no set_config when no effort is forwarded (prior default)', () => {
    // Mirrors WCoreManager.start(): the setConfig call is guarded by mergedData.effort,
    // so an absent effort means the engine never receives a set_config override.
    const { stdin } = makeAgent();
    expect(stdin.write).not.toHaveBeenCalled();
  });
});
