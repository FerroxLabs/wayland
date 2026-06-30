/**
 * #455 - every project has a PERSISTENT workspace (no temp-dir default).
 *
 * Exercises the real running app through the IPC bridge (no agent turn needed):
 *   1. project.create -> the project gets a real, user-visible workspace dir on
 *      disk (default ~/Documents/Wayland/<name>), NOT a throwaway `*-temp-*` dir.
 *   2. create-conversation in that project -> the conversation resolves to the
 *      project's persistent workspace (scope 3: no drift to a temp dir).
 *
 * The agent-writes-a-file acceptance (file lands in the dir + renders in Files)
 * needs a live wcore turn and is covered by the in-app manual verify; this spec
 * pins the deterministic, turn-free guarantees so a regression can't slip past CI.
 */
import { existsSync, rmSync } from 'fs';
import path from 'path';
import { test, expect } from '../fixtures';
import { invokeBridge } from '../helpers';

type Project = { id: string; name: string; workspace?: string };
type Conversation = { id: string; extra?: { workspace?: string; projectId?: string } };

const TEMP_WS = /-temp-\d+$/i;

test.describe('Project: persistent workspace (#455)', () => {
  test('project.create allocates a real, non-temp workspace dir on disk', async ({ page }) => {
    const name = `E2E Persistent WS ${Date.now()}`;
    const project = await invokeBridge<Project>(page, 'project.create', { name }, 20_000);

    expect(project?.id, 'project was created').toBeTruthy();
    expect(project.workspace, 'project has a workspace path').toBeTruthy();
    const ws = project.workspace!;

    // Real + discoverable: under a Wayland folder, not a throwaway temp dir.
    expect(TEMP_WS.test(ws), `workspace must not be a temp dir: ${ws}`).toBe(false);
    expect(ws.includes(`${path.sep}Wayland${path.sep}`), `workspace under Wayland/: ${ws}`).toBe(true);
    // The dir exists on disk (this is the bug the issue fixes - it used to be a
    // hidden temp dir the user never saw).
    expect(existsSync(ws), `workspace dir exists on disk: ${ws}`).toBe(true);

    // Cleanup: remove the project and its dir so the run is repeatable.
    await invokeBridge(page, 'project.remove', { id: project.id }, 10_000).catch(() => {});
    try {
      rmSync(ws, { recursive: true, force: true });
    } catch {
      /* best-effort */
    }
  });

  test('a project chat resolves to the project workspace, not a temp dir', async ({ page }) => {
    const name = `E2E Project Chat WS ${Date.now()}`;
    const project = await invokeBridge<Project>(page, 'project.create', { name }, 20_000);
    expect(project.workspace).toBeTruthy();
    const ws = project.workspace!;

    const conv = await invokeBridge<Conversation>(
      page,
      'create-conversation',
      {
        type: 'wcore',
        model: {
          id: 'e2e-455',
          platform: 'openai',
          name: 'E2E 455',
          baseUrl: 'https://api.example.com',
          apiKey: 'sk-e2e',
          useModel: 'gpt-4o-mini',
        },
        extra: { projectId: project.id },
      },
      20_000
    );

    // Scope 3: the chat is pinned to the project's persistent workspace.
    expect(conv?.extra?.workspace, 'chat workspace').toBe(ws);
    expect(TEMP_WS.test(conv?.extra?.workspace ?? ''), 'chat workspace is not a temp dir').toBe(false);

    await invokeBridge(page, 'project.remove', { id: project.id }, 10_000).catch(() => {});
    try {
      rmSync(ws, { recursive: true, force: true });
    } catch {
      /* best-effort */
    }
  });
});
