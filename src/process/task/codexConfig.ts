/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { isCodexNoSandboxMode } from '@/common/types/codex/codexModes';
import { FLUX_AUTO_MODEL, FLUX_SURFACE } from '@/common/config/flux';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { dirname, join, posix, win32 } from 'path';

export type CodexSandboxMode = 'read-only' | 'workspace-write' | 'danger-full-access';
export type SupportedCodexSandboxMode = 'workspace-write' | 'danger-full-access';

const isWindowsStylePath = (value: string): boolean => /^[a-zA-Z]:[\\/]/.test(value) || value.startsWith('\\\\');

const getCodexPathApi = (baseDirectory: string) =>
  process.platform === 'win32' || isWindowsStylePath(baseDirectory) ? win32 : posix;

export function normalizeCodexSandboxMode(sandboxMode?: CodexSandboxMode | null): SupportedCodexSandboxMode {
  return sandboxMode === 'danger-full-access' ? 'danger-full-access' : 'workspace-write';
}

export function getCodexSandboxModeForSessionMode(
  mode?: string | null,
  fallbackMode?: CodexSandboxMode | null
): SupportedCodexSandboxMode {
  if (mode) {
    return isCodexNoSandboxMode(mode) ? 'danger-full-access' : 'workspace-write';
  }

  return normalizeCodexSandboxMode(fallbackMode);
}

export function getCodexConfigPath(): string {
  const codexHome = process.env.CODEX_HOME?.trim();
  if (codexHome) {
    return getCodexPathApi(codexHome).join(codexHome, 'config.toml');
  }

  const homeDirectory = homedir();
  return getCodexPathApi(homeDirectory).join(homeDirectory, '.codex', 'config.toml');
}

export async function writeCodexSandboxMode(sandboxMode: CodexSandboxMode): Promise<void> {
  const path = getCodexConfigPath();
  let content = '';

  try {
    content = await readFile(path, 'utf8');
  } catch {
    content = '';
  }

  const newline = content.includes('\r\n') ? '\r\n' : '\n';
  const sandboxLine = `sandbox_mode = "${sandboxMode}"`;
  let nextContent: string;

  if (/^\s*sandbox_mode\s*=.*$/m.test(content)) {
    nextContent = content.replace(/^\s*sandbox_mode\s*=.*$/m, sandboxLine);
  } else {
    const sectionIndex = content.search(/^\s*\[/m);

    if (sectionIndex >= 0) {
      const prefix = content.slice(0, sectionIndex).trimEnd();
      const suffix = content.slice(sectionIndex);
      nextContent = prefix
        ? `${prefix}${newline}${sandboxLine}${newline}${newline}${suffix}`
        : `${sandboxLine}${newline}${newline}${suffix}`;
    } else if (content.trim().length > 0) {
      nextContent = `${content.trimEnd()}${newline}${sandboxLine}${newline}`;
    } else {
      nextContent = `${sandboxLine}${newline}`;
    }
  }

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, nextContent, 'utf8');
}

/**
 * Materialize a Wayland-scoped CODEX_HOME for flux-routed codex spawns and
 * return its directory path. The directory carries a self-contained
 * `config.toml` that BOTH defines the `[model_providers.flux]` provider AND
 * selects it globally (top-level `model = "flux-auto"` + `model_provider =
 * "flux"`). Pointing CODEX_HOME at this dir (only for flux-routed spawns) makes
 * codex route through Flux WITHOUT pinning the user's real `~/.codex/config.toml`
 * to flux - native model picks keep using the user's own config.
 *
 * codex reads its bearer from the `FLUX_API_KEY` env var at request time, so no
 * key is written into this file (R13-safe: the secret stays out of config).
 *
 * `userDataDir` is the app's userData path (the caller passes
 * `app.getPath('userData')`); kept as a parameter so this stays unit-testable
 * without importing electron here.
 */
export async function materializeFluxCodexHome(
  userDataDir: string,
  sandboxMode: SupportedCodexSandboxMode = 'workspace-write',
  baseURL: string = FLUX_SURFACE.responses
): Promise<string> {
  const codexHomeDir = join(userDataDir, 'flux-codex-home');
  const configPath = join(codexHomeDir, 'config.toml');
  const content = [
    '# Wayland-managed CODEX_HOME for Flux-routed codex spawns.',
    "# Selects Flux globally within this scoped home; the user's real ~/.codex",
    '# config is never modified. Regenerated on each Flux-routed spawn.',
    `model = "${FLUX_AUTO_MODEL}"`,
    'model_provider = "flux"',
    'model_context_window = 200000',
    `sandbox_mode = "${sandboxMode}"`,
    'suppress_unstable_features_warning = true',
    '',
    '[model_providers.flux]',
    'name = "Flux"',
    `base_url = "${baseURL}"`,
    'env_key = "FLUX_API_KEY"',
    'wire_api = "responses"',
    '',
  ].join('\n');

  await mkdir(codexHomeDir, { recursive: true });
  await writeFile(configPath, content, 'utf8');
  return codexHomeDir;
}
