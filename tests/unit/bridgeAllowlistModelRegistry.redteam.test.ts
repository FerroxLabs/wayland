import { describe, it, expect } from 'vitest';
import { isAllowedForRemote } from '@/common/adapter/bridgeAllowlist';

/**
 * The model-registry secret/write IPC must NOT be reachable by a remote
 * (paired-device WebSocket) caller: `connect`/`rekey`/`detectKeys` mutate or
 * disclose stored credentials. A paired WebUI proving a paired browser (not the
 * local trusted user) must be rejected for all three.
 *
 * `resolveForChatStart` is NOT denied: audit C4 hardened it to return only a
 * non-secret chat-start handle (the decrypted key never crosses IPC), and the
 * remote/headless WebUI needs it to resolve a chat model - see the allowed list.
 *
 * Each wire key below is the exact string passed to buildProvider() in
 * ipcBridge.ts; the dispatcher receives it as `subscribe-<key>`.
 */
describe('isAllowedForRemote - model-registry secret/write IPC denied', () => {
  const deniedKeys: ReadonlyArray<string> = [
    'modelRegistry.connect',
    'modelRegistry.rekey',
    'modelRegistry.detectKeys',
  ];

  it.each(deniedKeys)('denies %s for remote callers', (key) => {
    expect(isAllowedForRemote(`subscribe-${key}`)).toBe(false);
  });

  // Sanity: read-only registry providers + the non-secret chat-start resolver
  // the paired WebUI legitimately needs stay allowed (denylist, not whitelist).
  const allowedKeys: ReadonlyArray<string> = [
    'modelRegistry.list',
    'modelRegistry.getCatalog',
    'modelRegistry.resolveForChatStart',
  ];

  it.each(allowedKeys)('still allows read-only %s for remote callers', (key) => {
    expect(isAllowedForRemote(`subscribe-${key}`)).toBe(true);
  });
});
