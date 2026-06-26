/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import BetterSqlite3 from 'better-sqlite3';
import type Database from 'better-sqlite3';
import type { AcpModelInfo } from '@/common/types/acpTypes';
import { claudeSlotForModelId } from '@process/agent/acp/utils';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

type CcSwitchPaths = {
  settingsPath: string;
  databasePath: string;
  claudeSettingsPath: string;
};

type CcSwitchSettings = {
  currentProviderClaude?: string;
};

type ClaudeProviderSettingsConfig = {
  model?: string;
  env?: Record<string, unknown>;
};

type ClaudeSettings = {
  model?: string;
};

type CcSwitchProviderRow = {
  settings_config?: string | null;
};

type CcSwitchModelPricingRow = {
  model_id?: string;
  display_name?: string | null;
};

export type ClaudeProviderEnv = Record<string, string>;

const CLAUDE_MODEL_SLOT_IDS = ['default', 'opus', 'haiku'] as const;

type ClaudeModelSlotId = (typeof CLAUDE_MODEL_SLOT_IDS)[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseJsonObject<T extends Record<string, unknown>>(content: string): T | null {
  try {
    const parsed = JSON.parse(content) as unknown;
    return isRecord(parsed) ? (parsed as T) : null;
  } catch {
    return null;
  }
}

function uniqueModelIds(modelIds: Array<string | null>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const modelId of modelIds) {
    if (!modelId || seen.has(modelId)) continue;
    seen.add(modelId);
    result.push(modelId);
  }

  return result;
}

export function getCcSwitchPaths(homeDir = os.homedir()): CcSwitchPaths {
  const baseDir = path.join(homeDir, '.cc-switch');
  return {
    settingsPath: path.join(baseDir, 'settings.json'),
    databasePath: path.join(baseDir, 'cc-switch.db'),
    claudeSettingsPath: path.join(homeDir, '.claude', 'settings.json'),
  };
}

function normalizeClaudeModelSlot(value: unknown): ClaudeModelSlotId | null {
  if (!isNonEmptyString(value)) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'sonnet') return 'default';
  return (CLAUDE_MODEL_SLOT_IDS as readonly string[]).includes(normalized) ? (normalized as ClaudeModelSlotId) : null;
}

function readClaudeSelectedModelSlot(claudeSettingsPath: string): ClaudeModelSlotId | null {
  if (!fs.existsSync(claudeSettingsPath)) return null;
  const settings = parseJsonObject<ClaudeSettings>(fs.readFileSync(claudeSettingsPath, 'utf-8'));
  return normalizeClaudeModelSlot(settings?.model);
}

export function buildClaudeModelInfoFromCcSwitchConfig(
  settingsConfig: ClaudeProviderSettingsConfig | null | undefined,
  modelLabels: ReadonlyMap<string, string> = new Map(),
  activeSlot?: string | null
): AcpModelInfo | null {
  if (!settingsConfig) return null;

  const env = isRecord(settingsConfig.env) ? settingsConfig.env : {};
  const defaultModelId =
    (isNonEmptyString(env.ANTHROPIC_DEFAULT_SONNET_MODEL) ? env.ANTHROPIC_DEFAULT_SONNET_MODEL : null) ||
    (isNonEmptyString(env.ANTHROPIC_MODEL) ? env.ANTHROPIC_MODEL : null);
  const opusModelId = isNonEmptyString(env.ANTHROPIC_DEFAULT_OPUS_MODEL) ? env.ANTHROPIC_DEFAULT_OPUS_MODEL : null;
  const haikuModelId = isNonEmptyString(env.ANTHROPIC_DEFAULT_HAIKU_MODEL) ? env.ANTHROPIC_DEFAULT_HAIKU_MODEL : null;

  const availableModels = uniqueModelIds([defaultModelId, opusModelId, haikuModelId]).flatMap((modelId) => {
    const slotId =
      modelId === defaultModelId
        ? 'default'
        : modelId === opusModelId
          ? 'opus'
          : modelId === haikuModelId
            ? 'haiku'
            : null;
    if (!slotId) return [];
    return [
      {
        id: slotId,
        label: modelLabels.get(modelId) || modelId,
      },
    ];
  });

  if (availableModels.length === 0) return null;

  const preferredSlot = normalizeClaudeModelSlot(activeSlot) ?? normalizeClaudeModelSlot(settingsConfig.model);
  const currentModelId = availableModels.find((model) => model.id === preferredSlot)?.id || availableModels[0].id;
  const currentModelLabel = availableModels.find((model) => model.id === currentModelId)?.label || currentModelId;
  return {
    currentModelId,
    currentModelLabel,
    availableModels,
    canSwitch: availableModels.length > 1,
    source: 'models',
    sourceDetail: 'cc-switch',
  };
}

function readCcSwitchSettings(settingsPath: string): CcSwitchSettings | null {
  if (!fs.existsSync(settingsPath)) return null;
  return parseJsonObject<CcSwitchSettings>(fs.readFileSync(settingsPath, 'utf-8'));
}

function normalizeProviderEnv(env: unknown): ClaudeProviderEnv {
  if (!isRecord(env)) return {};

  return Object.fromEntries(
    Object.entries(env).flatMap(([key, value]) => (isNonEmptyString(value) ? [[key, value]] : []))
  );
}

function readModelLabels(db: Database.Database): Map<string, string> {
  const rows = db.prepare('SELECT model_id, display_name FROM model_pricing').all() as CcSwitchModelPricingRow[];
  const labels = new Map<string, string>();

  for (const row of rows) {
    if (!isNonEmptyString(row.model_id)) continue;
    labels.set(row.model_id, isNonEmptyString(row.display_name) ? row.display_name : row.model_id);
  }

  return labels;
}

export function readClaudeModelInfoFromCcSwitch(paths?: Partial<CcSwitchPaths>): AcpModelInfo | null {
  const resolvedPaths = {
    ...getCcSwitchPaths(),
    ...paths,
  };
  const settings = readCcSwitchSettings(resolvedPaths.settingsPath);
  const currentProviderId = settings?.currentProviderClaude;

  if (!isNonEmptyString(currentProviderId) || !fs.existsSync(resolvedPaths.databasePath)) {
    return null;
  }

  let db: Database.Database | null = null;
  try {
    db = new BetterSqlite3(resolvedPaths.databasePath, { readonly: true, fileMustExist: true });
    const provider = db.prepare('SELECT settings_config FROM providers WHERE id = ? LIMIT 1').get(currentProviderId) as
      | CcSwitchProviderRow
      | undefined;

    if (!isNonEmptyString(provider?.settings_config)) {
      return null;
    }

    const settingsConfig = parseJsonObject<ClaudeProviderSettingsConfig>(provider.settings_config);
    return buildClaudeModelInfoFromCcSwitchConfig(
      settingsConfig,
      readModelLabels(db),
      readClaudeSelectedModelSlot(resolvedPaths.claudeSettingsPath)
    );
  } catch {
    return null;
  } finally {
    db?.close();
  }
}

/** Friendly labels for the native Claude model slots (no cc-switch DB to read). */
const CLAUDE_SLOT_LABELS: Record<ClaudeModelSlotId, string> = {
  opus: 'Opus',
  default: 'Sonnet',
  haiku: 'Haiku',
};

/** Native slot order for the picker (Opus first - the product default). */
const CLAUDE_NATIVE_SLOT_ORDER: readonly ClaudeModelSlotId[] = ['opus', 'default', 'haiku'];

/**
 * Build Claude model info from a plain `~/.claude/settings.json` (Claude Code CLI
 * set up WITHOUT cc-switch). This is the fallback for `readClaudeModelInfoFromCcSwitch`
 * (which returns null with no cc-switch DB): a native Claude login still surfaces its
 * switchable slots (Opus / Sonnet / Haiku) in the picker eagerly, before the first
 * message, with the current slot taken from settings.model (e.g. "opus[1m]" -> opus).
 * Returns null when the Claude Code CLI isn't set up.
 */
export function readClaudeModelInfoFromSettings(homeDir = os.homedir()): AcpModelInfo | null {
  const { claudeSettingsPath } = getCcSwitchPaths(homeDir);
  if (!fs.existsSync(claudeSettingsPath)) return null;
  let settings: ClaudeSettings | null;
  try {
    settings = parseJsonObject<ClaudeSettings>(fs.readFileSync(claudeSettingsPath, 'utf-8'));
  } catch {
    return null; // permissions / TOCTOU race — honor the documented "not set up" null contract
  }
  const currentModelId = claudeSlotForModelId(settings?.model) ?? 'opus';
  const availableModels = CLAUDE_NATIVE_SLOT_ORDER.map((id) => ({ id, label: CLAUDE_SLOT_LABELS[id] }));
  const currentModelLabel =
    availableModels.find((m) => m.id === currentModelId)?.label ?? CLAUDE_SLOT_LABELS.opus;
  return {
    currentModelId,
    currentModelLabel,
    availableModels,
    canSwitch: true,
    source: 'models',
    sourceDetail: 'claude-slots',
  };
}

/**
 * The native Claude default model SLOT for a brand-new Claude Code chat, or null
 * when there is no native Claude login to default to (so the caller keeps its
 * Flux/other default). A native login is present when cc-switch holds a Claude
 * provider config OR the user has a `~/.claude/settings.json` (the Claude Code
 * CLI is set up). Honors the user's configured slot (e.g. settings.model
 * `"opus[1m]"` -> `"opus"`), falling back to the cc-switch current slot, then
 * Opus (the "Claude Opus 4.8" product default — a real slot id so
 * `ANTHROPIC_MODEL=opus` is set at spawn instead of the CLI's own Sonnet
 * fallback).
 *
 * Used so a Claude Code chat defaults to the subscription (native, e.g. Opus 4.8)
 * instead of flux-auto when "Route all agents through Flux" is globally on. A
 * native Claude login must not be silently routed through Flux: defaulting to a
 * native slot id makes `resolveFluxRouting`'s explicit-native-pick rule keep the
 * chat native, with no flux<->native respawn (which is what crashed the in-chat
 * model switch).
 */
export function getClaudeNativeDefaultModelId(homeDir = os.homedir()): string | null {
  const paths = getCcSwitchPaths(homeDir);
  const ccSwitchInfo = readClaudeModelInfoFromCcSwitch(paths);
  const hasClaudeSettings = fs.existsSync(paths.claudeSettingsPath);
  if (!ccSwitchInfo && !hasClaudeSettings) return null;

  const settings = hasClaudeSettings
    ? parseJsonObject<ClaudeSettings>(fs.readFileSync(paths.claudeSettingsPath, 'utf-8'))
    : null;
  return claudeSlotForModelId(settings?.model) ?? ccSwitchInfo?.currentModelId ?? 'opus';
}

export function readClaudeProviderEnvFromCcSwitch(paths?: Partial<CcSwitchPaths>): ClaudeProviderEnv {
  const resolvedPaths = {
    ...getCcSwitchPaths(),
    ...paths,
  };
  const settings = readCcSwitchSettings(resolvedPaths.settingsPath);
  const currentProviderId = settings?.currentProviderClaude;

  if (!isNonEmptyString(currentProviderId) || !fs.existsSync(resolvedPaths.databasePath)) {
    return {};
  }

  let db: Database.Database | null = null;
  try {
    db = new BetterSqlite3(resolvedPaths.databasePath, { readonly: true, fileMustExist: true });
    const provider = db.prepare('SELECT settings_config FROM providers WHERE id = ? LIMIT 1').get(currentProviderId) as
      | CcSwitchProviderRow
      | undefined;

    if (!isNonEmptyString(provider?.settings_config)) {
      return {};
    }

    const settingsConfig = parseJsonObject<ClaudeProviderSettingsConfig>(provider.settings_config);
    return normalizeProviderEnv(settingsConfig?.env);
  } catch {
    return {};
  } finally {
    db?.close();
  }
}
