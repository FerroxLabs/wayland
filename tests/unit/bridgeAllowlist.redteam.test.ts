import { describe, it, expect } from 'vitest';
import { isAllowedForRemote } from '@/common/adapter/bridgeAllowlist';

/**
 * Defense-in-depth red-team coverage: fs/project providers that leak arbitrary
 * file access must NOT be reachable by a remote (paired-device WebSocket) caller.
 * Each wire key below is the exact string passed to buildProvider() in
 * ipcBridge.ts; the dispatcher receives it as `subscribe-<key>`.
 */
describe('isAllowedForRemote - fs/project arbitrary-path providers denied', () => {
  const deniedKeys: ReadonlyArray<[string, string]> = [
    ['getFileMetadata', 'get-file-metadata'],
    ['getFilesByDir', 'get-file-by-dir'],
    ['listWorkspaceFiles', 'list-workspace-files'],
    ['getImageBase64', 'get-image-base64'],
    ['createZip', 'create-zip-file'],
    ['copyFilesToWorkspace', 'copy-files-to-workspace'],
    ['project.generate-knowledge-draft', 'project.generate-knowledge-draft'],
  ];

  it.each(deniedKeys)('denies %s (subscribe-%s) for remote callers', (_provider, key) => {
    expect(isAllowedForRemote(`subscribe-${key}`)).toBe(false);
  });
});

/**
 * Channel config / authorization mutation surface must NOT be reachable by a
 * remote (paired-device WebSocket) caller. enable/disable reconfigure a
 * channel, sync-channel-settings can set WhatsApp mode='dedicated' +
 * ownerNumbers (auto-authorizing an arbitrary number), revoke/get-authorized
 * mutate and disclose authorization, rotate-webhook-token mutates the webhook
 * secret, and test-plugin makes an outbound call with caller-supplied creds.
 * Consistent with the channel.*-pairing trio.
 */
describe('isAllowedForRemote - channel config/auth providers denied', () => {
  const deniedKeys: ReadonlyArray<string> = [
    'channel.enable-plugin',
    'channel.disable-plugin',
    'channel.rotate-webhook-token',
    'channel.sync-channel-settings',
    'channel.revoke-user',
    'channel.get-authorized-users',
    'channel.test-plugin',
  ];

  it.each(deniedKeys)('denies subscribe-%s for remote callers', (key) => {
    expect(isAllowedForRemote(`subscribe-${key}`)).toBe(false);
  });

  it('still allows the read-only channel.get-plugin-status for remote callers', () => {
    expect(isAllowedForRemote('subscribe-channel.get-plugin-status')).toBe(true);
  });
});

/**
 * WebUI admin/auth surface must NOT be reachable by a remote (paired-device
 * WebSocket) caller. The webui.* bridge providers carry no in-handler remote
 * guard (unlike the gated webui-direct-* ipcMain handlers), so a paired browser
 * could otherwise mint/return admin credentials: start -> initialPassword,
 * reset-password -> broadcast a new plaintext admin password to every paired
 * client, generate/verify-qr-token -> a full admin session token, and
 * change-password/username rewrite the admin login with no current-password
 * check. Deny the mutating/secret-minting ops; keep the read-only views.
 */
describe('isAllowedForRemote - webui admin/auth providers denied', () => {
  const deniedKeys: ReadonlyArray<string> = [
    'webui.start',
    'webui.stop',
    'webui.change-password',
    'webui.change-username',
    'webui.reset-password',
    'webui.generate-qr-token',
    'webui.verify-qr-token',
    'webui.revoke-device',
  ];

  it.each(deniedKeys)('denies subscribe-%s for remote callers', (key) => {
    expect(isAllowedForRemote(`subscribe-${key}`)).toBe(false);
  });

  it.each(['webui.get-status', 'webui.list-paired-devices', 'webui.activity-log'])(
    'still allows the read-only %s for remote callers',
    (key) => {
      expect(isAllowedForRemote(`subscribe-${key}`)).toBe(true);
    }
  );
});

/**
 * Onboarding credential-write providers must NOT be reachable by a remote
 * caller: connect-pasted-key persists an attacker-supplied provider key
 * (injection / overwrite), connect-flux mints + persists a Flux credential.
 * The read-only onboarding.infer-focus stays allowed.
 */
describe('isAllowedForRemote - onboarding credential writes denied', () => {
  it.each(['onboarding.connect-pasted-key', 'onboarding.connect-flux'])(
    'denies subscribe-%s for remote callers',
    (key) => {
      expect(isAllowedForRemote(`subscribe-${key}`)).toBe(false);
    }
  );

  it('still allows the read-only onboarding.infer-focus for remote callers', () => {
    expect(isAllowedForRemote('subscribe-onboarding.infer-focus')).toBe(true);
  });
});

/**
 * Cron write/exec surface must NOT be reachable by a remote (paired-device
 * WebSocket) caller (#495 follow-up). A cron job carries `agentConfig.mode`,
 * which the executor applies via `task.setMode()` at run time; with the bundled
 * engine now honoring a wire `set_mode` (WAYLAND_ALLOW_WIRE_FORCE), a
 * remote-authored `yolo`/`force`/`auto_edit`/`bypassPermissions` job would spawn
 * a Force/AutoEdit-mode agent with no local user action. There is no per-call
 * remote/local signal inside a buildProvider handler, so the mode cannot be
 * clamped in-handler; the write/exec surface is denied outright, mirroring
 * `wcoreConfig.setSection`. add-job/update-job set the mode; run-now fires the
 * agent; save-skill writes the job's SKILL.md verbatim (a remote caller could
 * otherwise plant arbitrary agent instructions the next fire runs with exec);
 * confirm-proposal accepts a pending proposal (creates a job) and leaks its edit
 * payload. The read-only views (+ has-skill) and remove-job stay allowed for the
 * paired UI.
 *
 * Note: this is the REMOTE gate only. A LOCALLY-configured cron job (local
 * Electron IPC renderer) never passes through `isAllowedForRemote` - the adapter
 * applies it exclusively to the WebSocket path - so local creation with any mode
 * is unaffected.
 */
describe('isAllowedForRemote - cron write/exec surface denied (#495)', () => {
  it.each(['cron.add-job', 'cron.update-job', 'cron.run-now', 'cron.save-skill', 'cron.confirm-proposal'])(
    'denies subscribe-%s for remote callers (blocks remote mode escalation / skill planting)',
    (key) => {
      expect(isAllowedForRemote(`subscribe-${key}`)).toBe(false);
    }
  );

  it.each(['cron.list-jobs', 'cron.list-jobs-by-conversation', 'cron.get-job', 'cron.has-skill', 'cron.remove-job'])(
    'still allows the read/remove provider subscribe-%s for remote callers',
    (key) => {
      expect(isAllowedForRemote(`subscribe-${key}`)).toBe(true);
    }
  );
});

/**
 * Doctor / health-check surface (issue #35, #458). `doctor.run` discloses the
 * host's full diagnostic posture (a reconnaissance aid) and `doctor.copy-text`
 * writes caller-supplied text to the host OS clipboard from MAIN (a
 * clipboard-injection primitive). Both are denied to remote WS callers.
 */
describe('isAllowedForRemote - doctor surface denied (#458)', () => {
  it.each(['doctor.run', 'doctor.copy-text'])('denies subscribe-%s for remote callers', (key) => {
    expect(isAllowedForRemote(`subscribe-${key}`)).toBe(false);
  });
});

/**
 * Memory mutation surface (#414). The memory.* namespace is intentionally open
 * to the paired WebUI for READS, but the two edit/delete providers perform a
 * real, hard, unrecoverable rewrite/delete of the user's local memory files.
 * A remote (paired-device WebSocket) caller must never reach them, else a paired
 * peer could destroy or silently rewrite the user's memories. The read-only
 * views stay allowed so the remote Archive panel still functions.
 */
describe('isAllowedForRemote - memory edit/delete denied (#414)', () => {
  it.each(['memory.update-entry', 'memory.delete-entry'])(
    'denies subscribe-%s for remote callers (blocks remote memory destruction/rewrite)',
    (key) => {
      expect(isAllowedForRemote(`subscribe-${key}`)).toBe(false);
    }
  );

  it.each(['memory.list-entries', 'memory.get-entry', 'memory.get-projects', 'memory.get-tags', 'memory.get-stats'])(
    'still allows the read-only %s for remote callers',
    (key) => {
      expect(isAllowedForRemote(`subscribe-${key}`)).toBe(true);
    }
  );
});
