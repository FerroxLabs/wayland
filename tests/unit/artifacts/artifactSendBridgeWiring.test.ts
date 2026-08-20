/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * "Send to...", the WIRING - the half that `artifactSend.test.ts` cannot reach.
 *
 * That file proves the decision layer against an INJECTED `confirmSend` and an
 * INJECTED `deliver`. Both are honest tests of the logic and both stay green if
 * the two functions `artifactBridge` actually supplies are gutted, because a
 * fake was substituted for each of them at the seam. Two specific gutting are
 * the reason this file exists, and each has a case below that goes red for it:
 *
 *  - `confirmArtifactSend` returning `true` without raising a dialog. The
 *    consent logic would still be perfect and the human gate would be gone -
 *    a renderer message would put a file on a wire with nobody asked. Every
 *    case here drives the REAL `requireConfirmation`, so the assertion is that
 *    a native `dialog.showMessageBox` was raised, that its first line names the
 *    file and the recipient, and that Cancel actually stops the send.
 *
 *  - `deliverArtifact` losing the line that attaches the bytes. The connector
 *    would report success and the recipient would get an empty message - the
 *    shipped-class bug the SMTP path in this change was written to fix. So the
 *    payload handed to the live plugin is inspected for the attachment itself.
 *
 * Nothing between the provider and the filesystem is faked: the real ledger,
 * the real digest verifier and the real `requireConfirmation` all run. Only the
 * two true edges of the process - Electron's dialog and the connector's socket
 * - are recorders.
 */

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Handler = (payload: unknown) => Promise<unknown>;

const h = vi.hoisted(() => {
  const handlers = new Map<string, Handler>();
  const provider = (key: string) => ({
    provider: (fn: Handler) => {
      handlers.set(key, fn);
    },
    invoke: () => Promise.resolve(undefined),
    emit: () => undefined,
    on: () => () => undefined,
  });
  return { handlers, provider };
});

vi.mock('@/common', () => ({
  ipcBridge: {
    artifacts: {
      list: h.provider('artifacts.list'),
      open: h.provider('artifacts.open'),
      reveal: h.provider('artifacts.reveal'),
      saveCopy: h.provider('artifacts.save-copy'),
      series: h.provider('artifacts.series'),
      openTarget: h.provider('artifacts.open-target'),
      sendTargets: h.provider('artifacts.send-targets'),
      sendTo: h.provider('artifacts.send-to'),
    },
  },
}));

/** The two real process edges, and the data path the ledger is read from. */
const env = vi.hoisted(() => ({
  dataPath: '',
  showMessageBox: vi.fn(async () => ({ response: 1, checkboxChecked: false })),
  sendMessage: vi.fn(async () => undefined),
  runningPlugin: null as unknown,
}));

vi.mock('electron', () => ({
  dialog: {
    showMessageBox: env.showMessageBox,
    showSaveDialog: vi.fn(async () => ({ canceled: true, filePath: undefined })),
  },
  // No window: `requireConfirmation` takes its parentless branch, which is the
  // one a background send actually hits.
  BrowserWindow: { getFocusedWindow: () => null, getAllWindows: () => [] },
}));

vi.mock('@process/utils', () => ({ getDataPath: () => env.dataPath }));

// Irrelevant to sending and both drag Electron shell APIs in with them.
vi.mock('@process/bridge/pathConfinement', () => ({ confinePath: vi.fn(async (target: string) => target) }));
vi.mock('@process/bridge/shellBridge', () => ({
  openPathReporting: vi.fn(async () => ({ ok: true })),
  revealPathReporting: vi.fn(async () => ({ ok: true })),
}));

vi.mock('@process/channels/core/ChannelManager', () => ({
  getChannelManager: () => ({ getRunningPlugin: () => env.runningPlugin }),
}));

import { registerArtifacts, type ArtifactRecord } from '@process/services/artifacts/artifactLedger';
import { initArtifactBridge } from '@process/bridge/artifactBridge';
import type { IChannelPluginConfig, IChannelUser } from '@process/channels/types';

const PLUGIN = {
  id: 'plugin-email-1',
  type: 'email-imap',
  name: 'Email (me@example.com)',
  enabled: true,
  status: 'running',
  createdAt: 0,
  updatedAt: 0,
} as IChannelPluginConfig;

const USER = {
  id: 'u1',
  platformUserId: 'team@example.com',
  platformType: 'email-imap',
  displayName: 'The Team',
  authorizedAt: 0,
} as IChannelUser;

const channelRepo = {
  getChannelPlugins: async () => [PLUGIN],
  getChannelUsers: async () => [USER],
} as never;

initArtifactBridge(channelRepo);

const CONTENTS = '<h1>Morning Brief</h1>';

let root: string;
let workspace: string;
let record: ArtifactRecord;

beforeEach(async () => {
  vi.clearAllMocks();
  // realpath, because the ledger records the realpath-collapsed workspace and
  // macOS collapses /var to /private/var.
  root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'artifact-send-wiring-')));
  env.dataPath = root;
  env.runningPlugin = { sendMessage: env.sendMessage };
  env.showMessageBox.mockResolvedValue({ response: 1, checkboxChecked: false });

  workspace = path.join(root, 'workspace');
  await fs.mkdir(workspace, { recursive: true });
  await fs.writeFile(path.join(workspace, 'brief.html'), CONTENTS);
  const result = await registerArtifacts({
    ledgerPath: path.join(root, 'artifact-ledger.jsonl'),
    workspace,
    runDir: workspace,
    taskId: 'morning-brief',
    runId: 'r1',
    declaredBy: 'market-open-report',
    declarations: [{ path: 'brief.html', title: 'Morning Brief' }],
  });
  expect(result.rejected).toEqual([]);
  record = result.registered[0];
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

const send = () =>
  h.handlers.get('artifacts.send-to')!({
    artifactId: record.artifactId,
    targetId: 'plugin-email-1',
    destinationId: 'team@example.com',
  });

describe('the send provider is wired to a real human gate', () => {
  it('registered a send-to provider at all (control)', () => {
    // A missing key would make every case below vacuous.
    expect(h.handlers.get('artifacts.send-to')).toBeTypeOf('function');
  });

  it('raises a native confirmation naming the file and the recipient', async () => {
    await send();

    // NOT "was consent checked" - "was a human actually asked". A gate that
    // answers itself is the mutation this assertion exists to kill.
    expect(env.showMessageBox).toHaveBeenCalledTimes(1);
    const options = env.showMessageBox.mock.calls[0][0] as {
      message: string;
      detail: string;
      buttons: string[];
      defaultId: number;
      cancelId: number;
    };
    // The two facts that decide the answer, in the first line.
    expect(options.message).toContain('brief.html');
    expect(options.message).toContain('The Team');
    expect(options.detail).toContain('leave this computer');
    // Cancel is the default and the escape key, because the dangerous answer
    // must never be the one a stray Return produces.
    expect(options.buttons).toEqual(['Send', 'Cancel']);
    expect(options.defaultId).toBe(1);
    expect(options.cancelId).toBe(1);
  });

  it('declining the dialog sends nothing at all', async () => {
    env.showMessageBox.mockResolvedValue({ response: 1, checkboxChecked: false });

    const result = await send();

    // The connector was never reached. This is the assertion that a
    // self-answering gate cannot satisfy.
    expect(env.sendMessage).not.toHaveBeenCalled();
    // Declining is not a failure and not a send, so no `sentTo` and no toast.
    expect(result).toEqual({ ok: true });
  });

  it('does not ask, and does not send, when the request names an unconfigured connector', async () => {
    // Refused before the human is bothered: an id the live registry does not
    // contain is not a question worth putting in front of anybody.
    const result = await h.handlers.get('artifacts.send-to')!({
      artifactId: record.artifactId,
      targetId: 'plugin-telegram-9',
      destinationId: 'team@example.com',
    });

    expect(result).toEqual({ ok: false, errorCode: 'unknown_target' });
    expect(env.showMessageBox).not.toHaveBeenCalled();
    expect(env.sendMessage).not.toHaveBeenCalled();
  });
});

describe('the delivered message actually carries the file', () => {
  beforeEach(() => {
    env.showMessageBox.mockResolvedValue({ response: 0, checkboxChecked: false });
  });

  it('attaches the verified bytes to the connector payload', async () => {
    const result = await send();

    expect(result).toEqual({ ok: true, sentTo: 'The Team' });
    expect(env.sendMessage).toHaveBeenCalledTimes(1);
    const [destinationId, payload] = env.sendMessage.mock.calls[0] as unknown as [
      string,
      { type: string; hostAttachments?: { filename: string; contentBase64: string }[] },
    ];

    expect(destinationId).toBe('team@example.com');
    expect(payload.type).toBe('file');
    // The bug this kills is a cheerful "sent" with an empty message: a payload
    // that names a file in its text and carries no bytes.
    expect(payload.hostAttachments).toEqual([
      { filename: 'brief.html', contentBase64: Buffer.from(CONTENTS).toString('base64') },
    ]);
  });

  it('never attaches via mediaActions, which an agent can already produce', async () => {
    await send();

    const payload = env.sendMessage.mock.calls[0][1] as unknown as Record<string, unknown>;
    // `mediaActions` is what an agent's own [WAYLAND_CHANNEL_SEND] block emits.
    // Carrying the host's bytes on it would hand the agent a mail-shaped
    // exfiltration primitive as a side effect of building a human one.
    expect(payload.mediaActions).toBeUndefined();
  });

  it('reports the connector refusing, and never a bare success', async () => {
    env.sendMessage.mockRejectedValueOnce(new Error('SMTP 535 authentication failed'));

    expect(await send()).toEqual({
      ok: false,
      errorCode: 'send_failed',
      message: 'SMTP 535 authentication failed',
    });
  });
});
