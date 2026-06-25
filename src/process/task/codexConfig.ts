/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { isCodexNoSandboxMode } from '@/common/types/codex/codexModes';
import { FLUX_AUTO_MODEL, FLUX_MODEL_DISPLAY, FLUX_MODEL_IDS, FLUX_SURFACE } from '@/common/config/flux';
import { parse as parseToml, stringify as stringifyToml } from 'smol-toml';
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
/**
 * Read the user's real codex `[mcp_servers]` table so a Flux-routed spawn keeps
 * the user's MCP tools (#56: the scoped CODEX_HOME otherwise has none, so codex
 * loses every MCP server when routed through Flux). We copy the table verbatim
 * from the user's own config.toml - codex itself wrote it via `codex mcp add`,
 * so the format is correct by construction; we never hand-author codex TOML.
 * Returns {} on any failure (missing file / parse error) so Flux routing still
 * works - MCP injection is best-effort, never a hard dependency.
 */
async function readUserCodexMcpServers(userConfigPath: string): Promise<Record<string, unknown>> {
  try {
    const raw = await readFile(userConfigPath, 'utf8');
    const parsed = parseToml(raw) as { mcp_servers?: Record<string, unknown> };
    const servers = parsed.mcp_servers;
    if (servers && typeof servers === 'object' && Object.keys(servers).length > 0) {
      return servers;
    }
  } catch {
    // no user config / unreadable / invalid TOML - degrade to no MCP.
  }
  return {};
}

const FLUX_CONTEXT_WINDOW = 200000;
const FLUX_AUTO_COMPACT_TOKEN_LIMIT = 180000;

/**
 * Build the codex model catalog for the flux model ids (#68). Codex 0.135 warns
 * "Model metadata for `<slug>` not found. Defaulting to fallback metadata..."
 * whenever the active model has no catalog entry (it matches by
 * `model.starts_with(slug)`; `model_context_window` alone does NOT register a
 * slug, so the fallback path still fires). Pointing `model_catalog_json` at this
 * file - one entry per flux id - makes the match succeed and the warning vanish.
 *
 * Schema is the `ModelsResponse { models: Vec<ModelInfo> }` shape from
 * codex-rs/protocol/src/openai_models.rs @ rust-v0.135.0 (verified against
 * `codex doctor` - "config.toml parse ok", model recognized). Catalog REPLACES
 * the bundled models.json, which is fine: the scoped home only ever runs flux.
 */
function buildFluxModelCatalogJson(): string {
  const reasoningLevels = [
    { effort: 'low', description: 'Fast responses with lighter reasoning' },
    { effort: 'medium', description: 'Balances speed and reasoning depth' },
    { effort: 'high', description: 'Greater reasoning depth for complex problems' },
  ];
  const models = FLUX_MODEL_IDS.map((slug, i): Record<string, unknown> => ({
    slug,
    display_name: FLUX_MODEL_DISPLAY[slug],
    description: 'Flux Router routed model - the right model for each task.',
    supported_reasoning_levels: reasoningLevels,
    default_reasoning_level: slug === 'flux-fast' ? 'low' : slug === 'flux-reasoning' ? 'high' : 'medium',
    shell_type: 'shell_command',
    visibility: 'list',
    supported_in_api: true,
    priority: i,
    availability_nux: null,
    upgrade: null,
    base_instructions:
      'You are Codex, a coding agent. Collaborate with the user to complete their task in the current workspace.',
    supports_reasoning_summaries: false,
    support_verbosity: false,
    default_verbosity: null,
    apply_patch_tool_type: 'freeform',
    web_search_tool_type: 'text',
    truncation_policy: { mode: 'tokens', limit: FLUX_CONTEXT_WINDOW },
    supports_parallel_tool_calls: true,
    supports_image_detail_original: false,
    context_window: FLUX_CONTEXT_WINDOW,
    max_context_window: FLUX_CONTEXT_WINDOW,
    auto_compact_token_limit: FLUX_AUTO_COMPACT_TOKEN_LIMIT,
    experimental_supported_tools: [],
    input_modalities: ['text'],
    supports_search_tool: false,
  }));
  return JSON.stringify({ models }, null, 2);
}

export async function materializeFluxCodexHome(
  userDataDir: string,
  sandboxMode: SupportedCodexSandboxMode = 'workspace-write',
  baseURL: string = FLUX_SURFACE.responses,
  userConfigPath: string = getCodexConfigPath(),
  /** Per-conversation reasoning effort. When set, written as `model_reasoning_effort`. */
  effort?: 'low' | 'medium' | 'high'
): Promise<string> {
  const codexHomeDir = join(userDataDir, 'flux-codex-home');
  const configPath = join(codexHomeDir, 'config.toml');
  const catalogPath = join(codexHomeDir, 'flux-model-catalog.json');
  let content = [
    '# Wayland-managed CODEX_HOME for Flux-routed codex spawns.',
    "# Selects Flux globally within this scoped home; the user's real ~/.codex",
    '# config is never modified. Regenerated on each Flux-routed spawn.',
    `model = "${FLUX_AUTO_MODEL}"`,
    'model_provider = "flux"',
    `model_context_window = ${FLUX_CONTEXT_WINDOW}`,
    // #68: register the flux models so codex stops warning "Model metadata not
    // found" and defaulting to fallback metadata for flux-auto.
    `model_auto_compact_token_limit = ${FLUX_AUTO_COMPACT_TOKEN_LIMIT}`,
    `model_catalog_json = ${JSON.stringify(catalogPath)}`,
    // Per-conversation reasoning effort (omitted => codex applies the model's
    // default_reasoning_level from the catalog above).
    ...(effort ? [`model_reasoning_effort = "${effort}"`] : []),
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

  // #56: carry the user's MCP servers into the scoped home so flux-routed codex
  // keeps its tools. Appended (the flux block above is byte-identical to before),
  // library-serialized from the user's own table - so Flux routing cannot regress.
  const mcpServers = await readUserCodexMcpServers(userConfigPath);
  if (Object.keys(mcpServers).length > 0) {
    content += `${stringifyToml({ mcp_servers: mcpServers })}\n`;
  }

  await mkdir(codexHomeDir, { recursive: true });
  await writeFile(catalogPath, buildFluxModelCatalogJson(), 'utf8');
  await writeFile(configPath, content, 'utf8');
  return codexHomeDir;
}
