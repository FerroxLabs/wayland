/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildAuthArgs,
  buildCloneArgs,
  cloneRepo,
  deriveRepoName,
  isValidGitUrl,
  scrubSecrets,
  type CloneParams,
} from '@process/services/gitClone';

const { execFileMock } = vi.hoisted(() => ({
  execFileMock: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  execFile: execFileMock,
}));

type ExecFileCallback = (error: Error | null, stdout: string, stderr: string) => void;
type CapturedExecFileOptions = {
  env?: NodeJS.ProcessEnv;
  maxBuffer?: number;
  shell?: boolean;
  timeout?: number;
  windowsHide?: boolean;
};

beforeEach(() => {
  execFileMock.mockReset();
  execFileMock.mockImplementation(
    (_file: string, _args: readonly string[], _options: object, callback: ExecFileCallback) => {
      callback(null, '', '');
    }
  );
});

async function captureCloneError(params: CloneParams): Promise<Error> {
  try {
    await cloneRepo(params);
  } catch (error) {
    if (error instanceof Error) return error;
    throw error;
  }
  throw new Error('Expected cloneRepo to reject');
}

function rejectExecFile(error: Error): void {
  execFileMock.mockImplementation(
    (_file: string, _args: readonly string[], _options: object, callback: ExecFileCallback) => {
      callback(error, '', '');
    }
  );
}

describe('gitClone — URL validation', () => {
  it('accepts https / http / ssh / git and scp-like remotes', () => {
    expect(isValidGitUrl('https://github.com/owner/repo.git')).toBe(true);
    expect(isValidGitUrl('http://host/owner/repo')).toBe(true);
    expect(isValidGitUrl('ssh://git@host/owner/repo.git')).toBe(true);
    expect(isValidGitUrl('git://host/owner/repo.git')).toBe(true);
    expect(isValidGitUrl('git@github.com:owner/repo.git')).toBe(true);
  });

  it('rejects empty, option-injection, and local/file paths', () => {
    expect(isValidGitUrl('')).toBe(false);
    expect(isValidGitUrl('   ')).toBe(false);
    expect(isValidGitUrl('--upload-pack=evil')).toBe(false);
    expect(isValidGitUrl('file:///etc/passwd')).toBe(false);
    expect(isValidGitUrl('/tmp/local/repo')).toBe(false);
  });
});

describe('gitClone — repo-name derivation', () => {
  it('strips .git and keeps a filesystem-safe name', () => {
    expect(deriveRepoName('https://github.com/owner/My.Repo.git')).toBe('My.Repo');
    expect(deriveRepoName('git@github.com:owner/repo.git')).toBe('repo');
    expect(deriveRepoName('https://x.com/a/b/')).toBe('b');
    expect(deriveRepoName('git@host:soloRepo.git')).toBe('soloRepo');
  });

  it('falls back to "repo" only when nothing usable remains', () => {
    expect(deriveRepoName('')).toBe('repo');
    expect(deriveRepoName('   ')).toBe('repo');
    // A path-less URL has no repo segment; deriving the host is an acceptable,
    // filesystem-safe non-empty name (not the "repo" fallback).
    expect(deriveRepoName('https://host/')).toBe('host');
  });
});

describe('gitClone — auth arg construction', () => {
  it('none/undefined disables credential prompts and sets a non-interactive env', () => {
    const { args, env } = buildAuthArgs(undefined);
    expect(args).toContain('credential.helper=');
    expect(env.GIT_TERMINAL_PROMPT).toBe('0');
    expect(env.GCM_INTERACTIVE).toBe('never');
    expect(buildAuthArgs({ kind: 'none' }).args).toContain('credential.helper=');
  });

  it('token defaults the username and injects a command-scoped Basic header', () => {
    const { args } = buildAuthArgs({ kind: 'token', token: 'secret-tok' });
    const expected = Buffer.from('x-access-token:secret-tok').toString('base64');
    expect(args).toContain('credential.helper=');
    expect(args).toContain(`http.extraHeader=Authorization: Basic ${expected}`);
  });

  it('token honors a custom username', () => {
    const { args } = buildAuthArgs({ kind: 'token', username: 'alice', token: 'tok' });
    const expected = Buffer.from('alice:tok').toString('base64');
    expect(args).toContain(`http.extraHeader=Authorization: Basic ${expected}`);
  });

  it('ssh with a key path sets a non-interactive fixed GIT_SSH_COMMAND', () => {
    const privateKeyPath = '/home/u/.ssh/id_ed25519';
    const { args, env } = buildAuthArgs({ kind: 'ssh', privateKeyPath });
    expect(args).toContain('credential.helper=');
    expect(env.WAYLAND_GIT_SSH_PRIVATE_KEY_PATH).toBe(privateKeyPath);
    expect(env.GIT_SSH_COMMAND).toContain('-i "$WAYLAND_GIT_SSH_PRIVATE_KEY_PATH"');
    expect(env.GIT_SSH_COMMAND).not.toContain(privateKeyPath);
    expect(env.GIT_SSH_COMMAND).toContain('IdentitiesOnly=yes');
    expect(env.GIT_SSH_COMMAND).toContain('BatchMode=yes');
  });

  it.each(['/tmp/key$(touch-pwned)', '/tmp/key`touch-pwned`', '/tmp/key"quoted"', '/tmp/key with spaces'])(
    'keeps a shell-significant SSH key path only in the dedicated environment variable: %s',
    (privateKeyPath) => {
      const { env } = buildAuthArgs({ kind: 'ssh', privateKeyPath });

      expect(env.WAYLAND_GIT_SSH_PRIVATE_KEY_PATH).toBe(privateKeyPath);
      expect(env.GIT_SSH_COMMAND).toContain('-i "$WAYLAND_GIT_SSH_PRIVATE_KEY_PATH"');
      expect(env.GIT_SSH_COMMAND).not.toContain(privateKeyPath);
    }
  );

  it('ssh without a key path uses the agent without interactive prompts', () => {
    const { env } = buildAuthArgs({ kind: 'ssh' });
    expect(env.GIT_SSH_COMMAND).toContain('BatchMode=yes');
    expect(env.GIT_SSH_COMMAND).not.toContain('-i');
  });
});

describe('gitClone — clone argv safety', () => {
  it('keeps hostile URL and Windows destination operands as the exact final argv tail', () => {
    const maliciousUrl = 'https://github.com/example/repo$(touch${IFS}injected).git';
    const windowsDestination = 'C:\\Work & Data\\skill';

    const { args } = buildCloneArgs({ url: maliciousUrl, destDir: windowsDestination });

    expect(args.slice(-3)).toEqual(['--', maliciousUrl, windowsDestination]);
  });

  it('denies local and external-helper protocols before the clone subcommand', () => {
    const { args } = buildCloneArgs({ url: 'https://h/r.git', destDir: '/d' });
    const cloneIndex = args.indexOf('clone');

    expect(args.slice(0, cloneIndex)).toEqual([
      '-c',
      'credential.helper=',
      '-c',
      'protocol.file.allow=never',
      '-c',
      'protocol.ext.allow=never',
    ]);
  });

  it('includes a depth flag only when requested', () => {
    expect(buildCloneArgs({ url: 'https://h/r.git', destDir: '/d' }).args).not.toContain('--depth');
    expect(buildCloneArgs({ url: 'https://h/r.git', destDir: '/d', depth: 1 }).args).toContain('--depth');
  });
});

describe('gitClone — clone process policy', () => {
  it.each([
    ['line feed', '/tmp/key\nnext'],
    ['carriage return', '/tmp/key\rnext'],
    ['NUL', '/tmp/key\0next'],
  ])('rejects an SSH key path containing %s before executing git', async (_label, privateKeyPath) => {
    await expect(
      cloneRepo({
        url: 'https://github.com/example/repo.git',
        destDir: '/tmp/repo',
        auth: { kind: 'ssh', privateKeyPath },
      })
    ).rejects.toThrow('SSH private key path contains prohibited control characters');
    expect(execFileMock).not.toHaveBeenCalled();
  });

  it('runs git with discrete argv, an explicitly disabled shell, and noninteractive options', async () => {
    const maliciousUrl = 'https://github.com/example/repo$(touch${IFS}injected).git';
    const windowsDestination = 'C:\\Work & Data\\skill';

    await cloneRepo({ url: maliciousUrl, destDir: windowsDestination, depth: 1 });

    const [file, argv, options] = execFileMock.mock.calls[0] as [string, string[], CapturedExecFileOptions];
    expect({
      file,
      shell: options.shell,
      windowsHide: options.windowsHide,
      timeout: options.timeout,
      maxBuffer: options.maxBuffer,
      noninteractiveEnv: {
        GIT_TERMINAL_PROMPT: options.env?.GIT_TERMINAL_PROMPT,
        GCM_INTERACTIVE: options.env?.GCM_INTERACTIVE,
      },
    }).toEqual({
      file: 'git',
      shell: false,
      windowsHide: true,
      timeout: 10 * 60 * 1000,
      maxBuffer: 32 * 1024 * 1024,
      noninteractiveEnv: {
        GIT_TERMINAL_PROMPT: '0',
        GCM_INTERACTIVE: 'never',
      },
    });
    expect(argv.slice(-3)).toEqual(['--', maliciousUrl, windowsDestination]);
  });

  it.each(['--upload-pack=evil', '/tmp/local/repo', 'file:///etc/passwd'])(
    'rejects unsupported input %s before spawning git',
    async (url) => {
      await expect(cloneRepo({ url, destDir: '/tmp/dest' })).rejects.toThrow('Invalid or unsupported git URL.');
      expect(execFileMock).not.toHaveBeenCalled();
    }
  );
});

describe('gitClone — secret scrubbing', () => {
  it('redacts Basic auth headers and inline userinfo', () => {
    expect(scrubSecrets('fatal: Authorization: Basic YWxpY2U6dG9r denied')).toBe(
      'fatal: Authorization: Basic *** denied'
    );
    expect(scrubSecrets('remote https://alice:ghp_xxx@github.com/o/r.git failed')).toBe(
      'remote https://***:***@github.com/o/r.git failed'
    );
  });

  it.each([
    {
      name: 'SSH username and password',
      raw: 'remote ssh://alice:ssh_secret@host/o/r.git?token=ssh_query#ssh_fragment failed',
      expected: 'remote ssh://***:***@host/o/r.git?*** failed',
    },
    {
      name: 'colon-less SSH userinfo',
      raw: 'remote ssh://ssh_token@host/o/r.git#ssh_fragment failed',
      expected: 'remote ssh://***@host/o/r.git#*** failed',
    },
    {
      name: 'Git username and password',
      raw: 'remote git://alice:git_secret@host/o/r.git?token=git_query#git_fragment failed',
      expected: 'remote git://***:***@host/o/r.git?*** failed',
    },
    {
      name: 'colon-less Git userinfo',
      raw: 'remote git://git_token@host/o/r.git#git_fragment failed',
      expected: 'remote git://***@host/o/r.git#*** failed',
    },
  ])('redacts $name directly', ({ raw, expected }) => {
    expect(scrubSecrets(raw)).toBe(expected);
  });

  it.each([
    {
      name: 'Basic credentials',
      raw: 'fatal: Authorization: Basic YWxpY2U6c2VjcmV0 denied',
      secret: 'YWxpY2U6c2VjcmV0',
    },
    {
      name: 'URL userinfo',
      raw: 'fatal: remote https://alice:ghp_secret@example.com/o/r.git failed',
      secret: 'alice:ghp_secret',
    },
    {
      name: 'SSH username and password',
      raw: 'fatal: remote ssh://alice:ssh_outer_secret@host/o/r.git failed',
      secret: 'alice:ssh_outer_secret',
    },
    {
      name: 'colon-less SSH userinfo',
      raw: 'fatal: remote ssh://ssh_outer_token@host/o/r.git failed',
      secret: 'ssh_outer_token',
    },
    {
      name: 'Git username and password',
      raw: 'fatal: remote git://alice:git_outer_secret@host/o/r.git failed',
      secret: 'alice:git_outer_secret',
    },
    {
      name: 'colon-less Git userinfo',
      raw: 'fatal: remote git://git_outer_token@host/o/r.git failed',
      secret: 'git_outer_token',
    },
    {
      name: 'colon-less HTTPS userinfo',
      raw: 'fatal: remote https://ghp_userinfo_secret@example.com/o/r.git failed',
      secret: 'ghp_userinfo_secret',
    },
    {
      name: 'HTTPS query strings',
      raw: 'fatal: remote https://example.com/o/r.git?token=ghp_query_secret&mode=1 failed',
      secret: 'token=ghp_query_secret&mode=1',
    },
    {
      name: 'HTTPS fragments',
      raw: 'fatal: remote https://example.com/o/r.git#token=ghp_fragment_secret failed',
      secret: 'token=ghp_fragment_secret',
    },
  ])('removes $name from the thrown message and safe cause', async ({ raw, secret }) => {
    rejectExecFile(Object.assign(new Error(raw), { stderr: raw }));

    const error = await captureCloneError({ url: 'https://example.com/o/r.git', destDir: '/tmp/dest' });

    expect(error.message).not.toContain(secret);
    expect((error.cause as Error).message).not.toContain(secret);
  });

  it('uses a bounded generic detail when stderr is empty', async () => {
    const rawUrl = 'https://ghp_message_secret@example.com/o/r.git?token=query_secret#fragment_secret';
    const rawDestination = 'C:\\Sensitive & Data\\skill';
    const rawCommand = `Command failed: git clone -- ${rawUrl} "${rawDestination}"`;
    rejectExecFile(Object.assign(new Error(rawCommand), { stderr: '' }));

    const error = await captureCloneError({ url: 'https://example.com/o/r.git', destDir: '/tmp/dest' });

    expect({ message: error.message, cause: (error.cause as Error).message }).toEqual({
      message: 'git clone failed: git command failed',
      cause: 'git command failed',
    });
  });

  it('preserves useful stderr after removing its URL secrets', async () => {
    const stderr = 'fatal: remote https://ghp_stderr_secret@example.com/o/r.git?token=query_secret failed';
    rejectExecFile(Object.assign(new Error('raw command fallback'), { stderr }));

    const error = await captureCloneError({ url: 'https://example.com/o/r.git', destDir: '/tmp/dest' });

    expect({ message: error.message, cause: (error.cause as Error).message }).toEqual({
      message: 'git clone failed: fatal: remote https://***@example.com/o/r.git?*** failed',
      cause: 'fatal: remote https://***@example.com/o/r.git?*** failed',
    });
  });

  it('normalizes timeouts without exposing the raw command', async () => {
    const rawCommand = 'git clone -- https://alice:secret@example.com/o/r.git?token=secret /tmp/dest';
    rejectExecFile(Object.assign(new Error(rawCommand), { killed: true, stderr: rawCommand }));

    const error = await captureCloneError({ url: 'https://example.com/o/r.git', destDir: '/tmp/dest' });

    expect(error.message).toBe('git clone failed: git command timed out after 10 minutes');
    expect((error.cause as Error).message).toBe('git command timed out after 10 minutes');
  });
});
