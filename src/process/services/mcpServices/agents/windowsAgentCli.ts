/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { existsSync, readFileSync } from 'node:fs';
import { win32 as path } from 'node:path';
import { safeExecFile } from '@process/utils/safeExec';

const NPM_AGENTS: Record<string, string> = { codex: '@openai/codex', gemini: '@google/gemini-cli' };

/** Resolve a detected npm CLI without handing its dynamic arguments to cmd.exe. */
export async function resolveWindowsNpmAgent(
  file: string,
  env: NodeJS.ProcessEnv
): Promise<{ file: string; script: string } | null> {
  const command = path
    .basename(file)
    .replace(/\.cmd$/i, '')
    .toLowerCase();
  const packageName = NPM_AGENTS[command];
  if (!packageName) return null;
  try {
    const located = await safeExecFile('where.exe', [file], { env, timeout: 5000 });
    const shim = located.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => path.isAbsolute(line) && /\.cmd$/i.test(line));
    if (!shim) return null;
    const directory = path.dirname(shim);
    const packageRoot = path.join(directory, 'node_modules', packageName);
    const pkg = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8')) as {
      name?: string;
      bin?: string | Record<string, string>;
    };
    if (pkg.name !== packageName) return null;
    const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.[command];
    if (typeof bin !== 'string' || !/\.[cm]?js$/i.test(bin)) return null;
    const script = path.resolve(packageRoot, bin);
    const relative = path.relative(packageRoot, script);
    if (relative.startsWith('..') || path.isAbsolute(relative) || !existsSync(script)) return null;
    // Match the actual npm shim target; a custom wrapper must not be silently
    // replaced with a different package entry or executed through a shell.
    const target = `"%dp0%\\${path.relative(directory, script)}"`;
    if (!readFileSync(shim, 'utf8').includes(target)) return null;
    const localNode = path.join(directory, 'node.exe');
    if (existsSync(localNode)) return { file: localNode, script };
    const nodes = await safeExecFile('where.exe', ['node.exe'], { env, timeout: 5000 });
    const node = nodes.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => path.isAbsolute(line) && /\\node\.exe$/i.test(line) && existsSync(line));
    return node ? { file: node, script } : null;
  } catch {
    // Discovery cannot turn a failed executable into a successful publication.
    return null;
  }
}
