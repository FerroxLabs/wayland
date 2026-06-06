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
