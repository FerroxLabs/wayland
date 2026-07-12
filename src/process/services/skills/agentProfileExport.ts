/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import yaml from 'js-yaml';
import type { AcpBackendConfig } from '@/common/types/acpTypes';
import { redactCommandSecrets } from '@/common/utils/redactCommandSecrets';

/**
 * Portable-export format for assistants (#512).
 *
 * SECURITY MODEL — credential-safe by construction:
 *  - {@link exportAssistantToSkillMd} is an ALLOWLIST: it reads ONLY the
 *    shareable fields off an assistant (name / description / avatar /
 *    presetAgentType / system prompt). It never reads `env`, `apiKeyFields`,
 *    `defaultCliPath`, `cliCommand` or `acpArgs`, and the live `authToken` lives
 *    in a separate store that is never passed here — so a secret or a home-path
 *    cannot leak, and a NEW secret field added to the model later still can't.
 *  - Defense in depth: the free-text system prompt is run through
 *    {@link redactCommandSecrets}, masking a credential a user pasted into their
 *    own prompt. `redacted` reports whether anything was masked so the UI can
 *    warn before the file is shared.
 *
 * The output is an agent-profile SKILL.md that round-trips through the existing
 * importer (`buildAssistantFromSkillMd`), which itself only reconstructs these
 * same safe fields.
 */

/** Bumped when the export envelope changes in a way importers must branch on. */
export const AGENT_PROFILE_EXPORT_VERSION = 1;

export interface AgentProfileExportInput {
  name: string;
  description?: string;
  avatar?: string;
  presetAgentType?: string;
  systemPrompt: string;
  appVersion: string;
  /** ISO timestamp; injected (not read from a clock) so this stays pure. */
  exportedAt: string;
}

export interface AgentProfileExportResult {
  content: string;
  /** True when a likely secret in the system prompt was masked on the way out. */
  redacted: boolean;
}

/**
 * Build the SKILL.md text for an agent-profile export. Pure: no IO, no clock.
 * Only the fields on {@link AgentProfileExportInput} reach the output.
 */
export function buildAgentProfileExport(input: AgentProfileExportInput): AgentProfileExportResult {
  const rawPrompt = input.systemPrompt ?? '';
  const safePrompt = redactCommandSecrets(rawPrompt);
  // Free-text `name` and `description` are user-editable too, so mask a secret
  // pasted into them, not just the prompt body.
  const safeName = redactCommandSecrets(input.name);
  const safeDescription = input.description ? redactCommandSecrets(input.description) : undefined;
  const redacted = safePrompt !== rawPrompt || safeName !== input.name || safeDescription !== input.description;

  // Import reads `name`/`description`/`type` via a line-regex frontmatter parser
  // and `avatar`/`main-agent` via a flat-line regex, so keep those at the top
  // level. `type` must be `agent-profile` to route to the assistant importer.
  const frontmatter: Record<string, unknown> = { name: safeName, type: 'agent-profile' };
  if (safeDescription) frontmatter.description = safeDescription;
  if (input.avatar) frontmatter.avatar = input.avatar;
  if (input.presetAgentType) frontmatter['main-agent'] = input.presetAgentType;
  frontmatter.metadata = {
    'wayland-export-version': AGENT_PROFILE_EXPORT_VERSION,
    'app-version': input.appVersion,
    'exported-at': input.exportedAt,
  };

  const yamlBlock = yaml.dump(frontmatter, { lineWidth: -1 }).trimEnd();
  const content = `---\n${yamlBlock}\n---\n\n${safePrompt.trimEnd()}\n`;
  return { content, redacted };
}

/**
 * Allowlist an assistant record down to its shareable fields and build the
 * export. THIS is the credential boundary — the full {@link AcpBackendConfig}
 * (with `env`, `apiKeyFields`, `defaultCliPath`, …) comes in, but only the safe
 * fields are ever read out.
 */
export function exportAssistantToSkillMd(
  assistant: AcpBackendConfig,
  systemPrompt: string,
  meta: { appVersion: string; exportedAt: string }
): AgentProfileExportResult {
  return buildAgentProfileExport({
    name: assistant.name,
    description: assistant.description,
    avatar: assistant.avatar,
    presetAgentType: assistant.presetAgentType,
    systemPrompt,
    appVersion: meta.appVersion,
    exportedAt: meta.exportedAt,
  });
}
