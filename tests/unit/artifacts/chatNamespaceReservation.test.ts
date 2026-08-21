/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * T1. `artifacts/` IS ALREADY OCCUPIED, AND CHAT IS THE SECOND WRITER.
 *
 * `<workspace>/artifacts/` is the cron SERIES ROOT. It holds `.latest.json`,
 * `.aliases.json`, `.runs.jsonl` and `.staging/`, and series membership is
 * decided by PATH SHAPE ALONE - `artifacts/<series>/<date>/<run>/<file>` is a
 * series deliverable because it has five segments starting with `artifacts`,
 * not because anything recorded that it is one.
 *
 * So a chat writing `artifacts/a/b/c/report.md` does two things nobody asked
 * for. It fabricates a phantom Series row in the UI for a "series" called `a`.
 * And - the one that loses data - if any scheduled task ever publishes into a
 * series of that name, `retireStaleAliases` walks the previous alias manifest
 * and `fs.rm`s every entry the newest run did not reproduce. The user's chat
 * report is sitting at one of those names.
 *
 * The fix is a namespace reserved in BOTH directions, and both halves are
 * asserted here:
 *
 *  - READ: the two classifiers that decide "is this a series?" refuse to read
 *    one out of `artifacts/chat/...`, however many segments deep it is.
 *  - WRITE: no task can ever create a series called `chat`, so the deleting
 *    code path can never be pointed at the namespace in the first place.
 *
 * Every assertion is paired with a control in the same test - a real series
 * record, produced by a real `beginTaskRun`/`commitTaskRun` - so a guard that
 * simply refused everything would fail the control half.
 *
 * THE CHAT PATH IS NEVER SPELLED OUT BY THIS TEST. It is read back from
 * `buildEngineSpawnEnv`, the production resolver the engine spawn actually
 * uses, so a resolver that stopped producing it would fail here rather than be
 * papered over by a fixture that agreed with the old shape.
 */

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildEngineSpawnEnv } from '@process/agent/wcore/envBuilder';
import { listArtifactSummaries } from '@process/services/artifacts/artifactActions';
import { CHAT_NAMESPACE, readArtifactLedger, registerArtifacts } from '@process/services/artifacts/artifactLedger';
import { buildArtifactSeriesView } from '@process/services/artifacts/artifactSeriesView';
import { beginTaskRun, commitTaskRun, InvalidSeriesNameError, seriesDirFor } from '@process/services/artifacts/taskRun';
import { sanitizeSeriesName } from '@process/services/cron/durableTaskWorkspace';

const CONVERSATION = 'conv-sean-asked-for-a-summary';
const CONTROL_SERIES = 'market';

let root = '';
let workspace = '';
let ledgerPath = '';

/** The chat output directory as the PRODUCTION spawn resolver decides it. */
function chatOutputDir(conversationId: string): string {
  const env = buildEngineSpawnEnv({ providerEnv: {}, workspace, conversationId });
  return env.WAYLAND_OUTPUT_DIR;
}

/** Write a file where the resolver said, then register it through the real ledger. */
async function registerChatFile(conversationId: string, relative: string, body: string) {
  const runDir = chatOutputDir(conversationId);
  const target = path.join(runDir, ...relative.split('/'));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, body, 'utf8');
  return registerArtifacts({
    ledgerPath,
    workspace,
    runDir,
    taskId: `chat:${conversationId}`,
    runId: conversationId,
    declaredBy: 'Chat',
    declarations: [{ path: relative }],
  });
}

/** The control: one real scheduled run, published into a real series. */
async function publishControlRun(relative: string, body: string) {
  const handle = await beginTaskRun({ workspace, taskId: 'cron_control', series: CONTROL_SERIES });
  const target = path.join(handle.stagingDir, ...relative.split('/'));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, body, 'utf8');
  return commitTaskRun(handle, { ledgerPath, declaredBy: 'Control Task' });
}

const effects = { readLedger: () => readArtifactLedger(ledgerPath) };

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-chatns-'));
  workspace = path.join(root, 'workspace');
  await fs.mkdir(workspace, { recursive: true });
  ledgerPath = path.join(root, 'artifact-ledger.jsonl');
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

describe('T1 - chat output lives in a namespace reserved against series', () => {
  it('resolves a chat spawn to artifacts/chat/<conversationId>, not the series root', () => {
    const resolved = chatOutputDir(CONVERSATION);

    expect(resolved).toBe(path.join(workspace, 'artifacts', CHAT_NAMESPACE, CONVERSATION));
    // The control from the same resolver: without a conversation nothing has
    // changed, so this is not "any path at all".
    expect(buildEngineSpawnEnv({ providerEnv: {}, workspace }).WAYLAND_OUTPUT_DIR).toBe(
      path.join(workspace, 'artifacts')
    );
  });

  it('keeps a run staging directory winning over the chat namespace', () => {
    const staging = path.join(workspace, 'artifacts', CONTROL_SERIES, '.staging', 'r1');
    const env = buildEngineSpawnEnv({ providerEnv: {}, workspace, conversationId: CONVERSATION, outputDir: staging });

    expect(env.WAYLAND_OUTPUT_DIR).toBe(staging);
  });

  it('stays inside the workspace when the conversation id is not a usable path segment', () => {
    for (const hostile of ['../../../etc', 'a/b', '..', '.hidden', '   ', 'x'.repeat(200)]) {
      const resolved = chatOutputDir(hostile);
      const relative = path.relative(workspace, resolved);

      expect(relative.startsWith('..')).toBe(false);
      expect(path.isAbsolute(relative)).toBe(false);
      // The namespace ROOT, not the series root: an unusable id must not be a
      // way back into series classification.
      expect(resolved).toBe(path.join(workspace, 'artifacts', CHAT_NAMESPACE));
    }
    // An EMPTY id is not a hostile id, it is the absence of a conversation, and
    // that case keeps its pre-T1 destination.
    expect(chatOutputDir('')).toBe(path.join(workspace, 'artifacts'));
  });

  it('gives a deep chat deliverable no series alias, while a real run still gets one', async () => {
    // Five segments starting with `artifacts` - the exact shape that classifies
    // as a series deliverable.
    const chat = await registerChatFile(CONVERSATION, 'sub/report.md', '# summary\n');
    const control = await publishControlRun('brief.md', '# brief\n');

    expect(chat.registered).toHaveLength(1);
    expect(chat.registered[0].relativePath.split('/')).toHaveLength(5);
    expect(control.published).toBe(true);

    const summaries = await listArtifactSummaries(effects);
    const chatSummary = summaries.find((s) => s.artifactId === chat.registered[0].artifactId);
    const controlSummary = summaries.find(
      (s) => control.published && s.artifactId === control.registered[0].artifactId
    );

    expect(chatSummary?.aliasPaths).toBeUndefined();
    // The control proves aliasing still happens - the guard is not "no aliases".
    expect(controlSummary?.aliasPaths).toBeDefined();
  });

  it('gives a chat deliverable no run history, while a real run still has one', async () => {
    const chat = await registerChatFile(CONVERSATION, 'sub/report.md', '# summary\n');
    const control = await publishControlRun('brief.md', '# brief\n');
    if (!control.published) throw new Error('control run did not publish');

    expect(await buildArtifactSeriesView(chat.registered[0].artifactId, effects)).toBeNull();
    expect(await buildArtifactSeriesView(control.registered[0].artifactId, effects)).not.toBeNull();
  });

  it('refuses to address a series directory called chat, in any casing', () => {
    // The control first: a normal series name still resolves.
    expect(seriesDirFor(workspace, CONTROL_SERIES)).toBe(path.join(workspace, 'artifacts', CONTROL_SERIES));

    for (const name of ['chat', 'Chat', 'CHAT']) {
      expect(() => seriesDirFor(workspace, name)).toThrow(InvalidSeriesNameError);
    }
  });

  it('refuses to open a run in the chat namespace, so nothing can retire a chat file', async () => {
    const chat = await registerChatFile(CONVERSATION, 'sub/report.md', '# summary\n');
    const file = path.resolve(workspace, chat.registered[0].relativePath);

    await expect(beginTaskRun({ workspace, taskId: 't', series: CHAT_NAMESPACE })).rejects.toThrow(
      InvalidSeriesNameError
    );
    // The control: a real series still opens.
    await expect(beginTaskRun({ workspace, taskId: 't', series: CONTROL_SERIES })).resolves.toBeTruthy();

    await expect(fs.readFile(file, 'utf8')).resolves.toContain('summary');
  });

  it('never sanitises a job name down to the reserved chat namespace', () => {
    expect(sanitizeSeriesName('chat')).toBeNull();
    expect(sanitizeSeriesName('Chat')).toBeNull();
    expect(sanitizeSeriesName('/chat/')).toBeNull();
    // The control: a normal declared series still survives sanitisation.
    expect(sanitizeSeriesName(CONTROL_SERIES)).toBe(CONTROL_SERIES);
  });
});
