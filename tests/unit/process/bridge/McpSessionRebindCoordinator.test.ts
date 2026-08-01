import { describe, expect, it, vi } from 'vitest';
import { McpSessionRebindCoordinator } from '@process/bridge/services/McpSessionRebindCoordinator';

describe('McpSessionRebindCoordinator', () => {
  it('coalesces concurrent mutations and kills the old runtime before one replacement', async () => {
    const order: string[] = [];
    let releaseKill!: () => void;
    const killGate = new Promise<void>((resolve) => {
      releaseKill = resolve;
    });
    const build = vi.fn(async () => {
      order.push('build');
      return { id: 'replacement' };
    });
    const coordinator = new McpSessionRebindCoordinator(() => 'generation-1');
    const request = {
      conversationId: 'chat-1',
      taskType: 'acp',
      appliedFingerprint: 'old',
      currentFingerprint: 'new',
      build,
      clearAuthority: vi.fn(async () => {
        order.push('clear');
      }),
      kill: vi.fn(async () => {
        order.push('kill');
        await killGate;
      }),
      persistAuthority: vi.fn(async () => {
        order.push('persist');
      }),
    };

    const first = coordinator.getOrRebind(request);
    const second = coordinator.getOrRebind(request);
    await vi.waitFor(() => expect(request.kill).toHaveBeenCalledOnce());
    expect(build).not.toHaveBeenCalled();
    releaseKill();

    await expect(Promise.all([first, second])).resolves.toEqual([
      { task: { id: 'replacement' }, generation: 'generation-1', rebound: true },
      { task: { id: 'replacement' }, generation: 'generation-1', rebound: true },
    ]);
    expect(build).toHaveBeenCalledOnce();
    expect(order).toEqual(['clear', 'kill', 'build', 'persist']);
  });

  it('serializes a newer definition behind the active mutation and ignores stale applied state', async () => {
    const generations = ['generation-1', 'generation-2'];
    const coordinator = new McpSessionRebindCoordinator(() => generations.shift()!);
    const kill = vi.fn(async () => {});
    const build = vi.fn(async () => ({ id: build.mock.calls.length }));
    const base = {
      conversationId: 'chat-1',
      taskType: 'gemini',
      appliedFingerprint: 'old',
      build,
      kill,
      clearAuthority: vi.fn(async () => {}),
      persistAuthority: vi.fn(async () => {}),
    };

    await coordinator.getOrRebind({ ...base, currentFingerprint: 'definition-a' });
    await coordinator.getOrRebind({ ...base, currentFingerprint: 'definition-b' });

    expect(kill).toHaveBeenCalledTimes(2);
    expect(build).toHaveBeenCalledTimes(2);
  });

  it('clears authority before a failed build and never persists a green fingerprint', async () => {
    const order: string[] = [];
    const coordinator = new McpSessionRebindCoordinator(() => 'generation-1');
    const persistAuthority = vi.fn(async () => {});

    await expect(
      coordinator.getOrRebind({
        conversationId: 'chat-1',
        taskType: 'codex',
        appliedFingerprint: 'old',
        currentFingerprint: 'new',
        clearAuthority: vi.fn(async () => {
          order.push('clear');
        }),
        kill: vi.fn(async () => {
          order.push('kill');
        }),
        build: vi.fn(async () => {
          order.push('build');
          throw new Error('spawn failed');
        }),
        persistAuthority,
      })
    ).rejects.toThrow('spawn failed');

    expect(order).toEqual(['clear', 'kill', 'build']);
    expect(persistAuthority).not.toHaveBeenCalled();
  });

  it('does not rebind an already-applied definition', async () => {
    const build = vi.fn(async () => ({ id: 'existing' }));
    const kill = vi.fn(async () => {});
    const coordinator = new McpSessionRebindCoordinator();
    await expect(
      coordinator.getOrRebind({
        conversationId: 'chat-1',
        taskType: 'wcore',
        appliedFingerprint: 'same',
        currentFingerprint: 'same',
        build,
        kill,
        clearAuthority: vi.fn(async () => {}),
        persistAuthority: vi.fn(async () => {}),
      })
    ).resolves.toEqual({ task: { id: 'existing' }, rebound: false });
    expect(kill).not.toHaveBeenCalled();
  });

  it('adopts an initial launch without killing the freshly built runtime', async () => {
    const build = vi.fn(async () => ({ id: 'initial' }));
    const kill = vi.fn(async () => {});
    const persistAuthority = vi.fn(async () => {});
    const coordinator = new McpSessionRebindCoordinator(() => 'generation-1');
    await expect(
      coordinator.getOrRebind({
        conversationId: 'chat-1',
        taskType: 'acp',
        appliedFingerprint: undefined,
        currentFingerprint: 'definition-a',
        build,
        kill,
        clearAuthority: vi.fn(async () => {}),
        persistAuthority,
      })
    ).resolves.toEqual({ task: { id: 'initial' }, generation: 'generation-1', rebound: false });
    expect(kill).not.toHaveBeenCalled();
    expect(persistAuthority).toHaveBeenCalledWith('definition-a', 'generation-1');
  });
});
