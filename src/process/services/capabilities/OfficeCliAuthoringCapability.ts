/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { execFile } from 'node:child_process';
import { getEnhancedEnv } from '@process/utils/shellEnv';

export type OfficeCliAuthoringState = 'ready' | 'incompatible' | 'missing' | 'unverified';
export type OfficeCliExecutionMode = 'local-binary' | 'hosted-credits' | 'unknown';

export type OfficeCliAuthoringCapability = {
  state: OfficeCliAuthoringState;
  version?: string;
  executionMode: OfficeCliExecutionMode;
  missingCommands: string[];
  reason: string;
};

export type OfficeCliCommandResult = { stdout: string; stderr: string };
export type OfficeCliCommandRunner = (args: string[]) => Promise<OfficeCliCommandResult>;

export const OFFICECLI_PINNED_AUTHORING_VERSION = '1.0.136' as const;
export const REQUIRED_OFFICECLI_AUTHORING_COMMANDS = [
  'create',
  'open',
  'close',
  'add',
  'set',
  'query',
  'validate',
  'view',
] as const;
const PROBE_TIMEOUT_MS = 2_000;
const PROBE_MAX_BUFFER = 256 * 1024;
const CACHE_TTL_MS = 5 * 60 * 1_000;

type CacheEntry = { expiresAt: number; promise: Promise<OfficeCliAuthoringCapability> };
let cache: CacheEntry | null = null;

function parseVersion(output: string): string | undefined {
  return output.match(/(?:^|\s)v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\b/i)?.[1];
}

function hasCommand(help: string, command: string): boolean {
  // Match a command row, not prose such as "View or change runtime settings".
  // The low-level CLI may render either `create ...` or
  // `officecli xlsx create ...` in format-specific help.
  return new RegExp(`^\\s*(?:officecli\\s+(?:docx|xlsx|pptx)\\s+)?${command}(?=\\s|$|[|,:])`, 'im').test(help);
}

/**
 * Classify the native, low-level Office authoring contract advertised by the
 * bundled Office skills. This intentionally says nothing about `officecli
 * watch`, which powers document preview and is a separate capability.
 */
export function classifyOfficeCliAuthoringContract(
  versionOutput: string,
  helpOutput: string
): OfficeCliAuthoringCapability {
  const version = parseVersion(versionOutput);
  const combined = `${versionOutput}\n${helpOutput}`;
  const missingCommands = REQUIRED_OFFICECLI_AUTHORING_COMMANDS.filter((command) => !hasCommand(helpOutput, command));
  const hostedCredits = /\b(credits?|login|set-key|whoami)\b/i.test(combined);
  const executionMode: OfficeCliExecutionMode = hostedCredits ? 'hosted-credits' : 'unknown';

  if (!version) {
    return {
      state: 'unverified',
      executionMode,
      missingCommands,
      reason: 'The officecli version could not be verified.',
    };
  }

  if (version === OFFICECLI_PINNED_AUTHORING_VERSION && missingCommands.length === 0) {
    return {
      state: 'ready',
      version,
      executionMode: 'local-binary',
      missingCommands: [],
      reason: 'The native low-level Office authoring contract is available.',
    };
  }

  return {
    state: 'incompatible',
    version,
    executionMode,
    missingCommands,
    reason:
      Number(version.split('.')[0]) < 1
        ? 'The installed officecli exposes the hosted-generation contract, not the native 1.x authoring API.'
        : version !== OFFICECLI_PINNED_AUTHORING_VERSION
          ? `The installed officecli does not match the pinned native ${OFFICECLI_PINNED_AUTHORING_VERSION} authoring contract.`
          : 'The installed officecli does not expose every command required by the native authoring skills.',
  };
}

function defaultRunner(args: string[]): Promise<OfficeCliCommandResult> {
  return new Promise((resolve, reject) => {
    execFile(
      'officecli',
      args,
      {
        env: getEnhancedEnv(),
        timeout: PROBE_TIMEOUT_MS,
        maxBuffer: PROBE_MAX_BUFFER,
        windowsHide: true,
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({ stdout: String(stdout ?? ''), stderr: String(stderr ?? '') });
      }
    );
  });
}

function isMissingExecutable(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT');
}

async function runProbe(runner: OfficeCliCommandRunner): Promise<OfficeCliAuthoringCapability> {
  try {
    const version = await runner(['--version']);
    // The required verbs are top-level commands. `help xlsx` intentionally
    // lists schema elements only, so probing it would false-negative a healthy
    // native v1 runtime.
    const help = await runner(['--help']);
    return classifyOfficeCliAuthoringContract(`${version.stdout}\n${version.stderr}`, `${help.stdout}\n${help.stderr}`);
  } catch (error) {
    if (isMissingExecutable(error)) {
      return {
        state: 'missing',
        executionMode: 'unknown',
        missingCommands: [...REQUIRED_OFFICECLI_AUTHORING_COMMANDS],
        reason: 'officecli was not found in the enhanced application PATH.',
      };
    }
    return {
      state: 'unverified',
      executionMode: 'unknown',
      missingCommands: [...REQUIRED_OFFICECLI_AUTHORING_COMMANDS],
      reason: 'The officecli authoring contract probe did not complete.',
    };
  }
}

/**
 * Probe the installed authoring contract. The default runtime probe is bounded,
 * cached, and never throws. Supplying a runner bypasses the shared cache so
 * tests and diagnostics cannot poison production capability state.
 */
export function probeOfficeCliAuthoringCapability(
  runner: OfficeCliCommandRunner = defaultRunner
): Promise<OfficeCliAuthoringCapability> {
  if (runner !== defaultRunner) return runProbe(runner);

  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.promise;

  const promise = runProbe(runner);
  cache = { expiresAt: now + CACHE_TTL_MS, promise };
  return promise;
}

export function invalidateOfficeCliAuthoringCapabilityCache(): void {
  cache = null;
}
