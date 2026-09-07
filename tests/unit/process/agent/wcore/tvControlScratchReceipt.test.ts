import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ provision: vi.fn(), order: [] as string[] }));
vi.mock('@process/services/mcpServices/bundledTvControl', () => ({
  provisionTvControlForWorkspacePolicy: h.provision,
}));
import { WCoreAgent } from '@process/agent/wcore';

type Harness = {
  handleEvent: (event: unknown) => void;
  writeCommand: (command: unknown) => boolean;
  lastWorkspacePolicy: unknown;
};
const agents: WCoreAgent[] = [];
function createAgent(managed = true) {
  const agent = new WCoreAgent({
    workspace: '/workspace',
    managedTempDir: managed ? '/workspace/.wayland-runtime/tmp' : undefined,
    model: {} as never,
    onStreamEvent: (event) => {
      if (event.type === 'workspace_policy') h.order.push('forward');
    },
  });
  agents.push(agent);
  const internal = agent as unknown as Harness;
  const write = vi.spyOn(internal, 'writeCommand').mockReturnValue(true);
  internal.handleEvent({ type: 'ready', session_id: 'core-session', capabilities: [] });
  return { agent, internal, write };
}
beforeEach(() => {
  h.order.length = 0;
  h.provision.mockReset().mockImplementation(() => {
    h.order.push('provision');
    return '/workspace/.wayland-runtime/tmp/core-scratch';
  });
});
afterEach(async () => {
  vi.useRealTimers();
  for (const agent of agents.splice(0)) await agent.kill();
});

describe('Core scratch receipt gates bundled collector sends', () => {
  it('waits for the current transport receipt even when a preceding transport left a policy snapshot', async () => {
    const { agent, internal, write } = createAgent();
    internal.lastWorkspacePolicy = { writable_roots: ['/old/scratch'] };
    const sending = agent.send('collect', 'first');
    await Promise.resolve();
    expect(write).not.toHaveBeenCalled();
    internal.handleEvent({
      type: 'workspace_policy',
      policy: { writable_roots: ['/workspace/.wayland-runtime/tmp/new-scratch'] },
    });
    await sending;
    expect(write).toHaveBeenCalledWith(expect.objectContaining({ msg_id: 'first' }));
  });
  it('provisions before forwarding the policy and before the first message', async () => {
    const { agent, internal, write } = createAgent();
    const sending = agent.send('collect', 'first');
    await Promise.resolve();
    expect(write).not.toHaveBeenCalled();
    internal.handleEvent({
      type: 'workspace_policy',
      policy: { writable_roots: ['/workspace', '/workspace/.wayland-runtime/tmp/core-scratch'] },
    });
    await sending;
    expect(h.order).toEqual(['provision', 'forward']);
    expect(write).toHaveBeenCalledWith(expect.objectContaining({ type: 'message', msg_id: 'first' }));
  });
  it('surfaces a preparation failure without throwing from the stream listener or sending a command', async () => {
    const { agent, internal, write } = createAgent();
    h.provision.mockImplementation(() => {
      throw new Error('ambiguous scratch roots');
    });
    expect(() => internal.handleEvent({ type: 'workspace_policy', policy: { writable_roots: [] } })).not.toThrow();
    await expect(agent.send('collect', 'first')).rejects.toThrow('TVControl 2.5.0 could not be prepared');
    expect(write).not.toHaveBeenCalled();
  });
  it('bounds a missing receipt wait and returns an actionable error', async () => {
    vi.useFakeTimers();
    const { agent, write } = createAgent();
    const assertion = expect(agent.send('collect', 'first')).rejects.toThrow(
      'Core to report its writable scratch directory'
    );
    await vi.advanceTimersByTimeAsync(60_000);
    await assertion;
    expect(write).not.toHaveBeenCalled();
  });
  it('leaves sessions without selected bundled TVControl unchanged', async () => {
    const { agent, write } = createAgent(false);
    await agent.send('hello', 'first');
    expect(h.provision).not.toHaveBeenCalled();
    expect(write).toHaveBeenCalled();
  });
});
