/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { uuid } from '@/common/utils';

/**
 * A user-defined slash command. Persisted via ConfigStorage under the
 * `slash.customCommands` key (same mechanism as `css.themes` /
 * `acp.customAgents`, so it survives restart). v1 is a structured prompt
 * template only - NO natural-language-to-recipe compilation, NO skill/MCP
 * binding. The `template` body is the extension point for later phases.
 */
export interface UserSlashCommand {
  /** Stable unique identifier. */
  id: string;
  /** The `/token` the user types, without the leading slash. Slug-like, unique. */
  name: string;
  /** Human-readable description shown in the slash menu. */
  description: string;
  /**
   * The prompt body inserted into the composer when the command is selected.
   * Supports `{arg}` and `{{arg}}` placeholders, substituted from `args` when
   * provided positionally, otherwise left in place for the user to fill.
   */
  template: string;
  /** Optional ordered argument names referenced by the template placeholders. */
  args?: string[];
  /** Creation timestamp (epoch ms). */
  createdAt: number;
  /** Last-updated timestamp (epoch ms). */
  updatedAt: number;
}

/** Editable fields when creating or updating a command. */
export type UserSlashCommandInput = {
  name: string;
  description: string;
  template: string;
  args?: string[];
};

/** Slug-like command name: letters, digits, hyphen, underscore; must start with a letter. */
const NAME_RE = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

/** Maximum command name length. */
export const MAX_COMMAND_NAME_LENGTH = 32;

/** Reserved names that collide with built-in slash commands. */
export const RESERVED_COMMAND_NAMES: ReadonlySet<string> = new Set(['btw', 'open', 'copy', 'export']);

/** Validation result for a command name. */
export type NameValidationResult = { valid: true } | { valid: false; reason: NameValidationError };

/** Distinct, translatable reasons a name can be rejected. */
export type NameValidationError = 'empty' | 'tooLong' | 'invalidChars' | 'reserved' | 'duplicate';

/**
 * Validate a command name against the slug rules and uniqueness within the
 * existing set. Pure - no I/O. `excludeId` lets an edit keep its own name.
 */
export function validateCommandName(
  rawName: string,
  existing: readonly UserSlashCommand[],
  excludeId?: string
): NameValidationResult {
  const name = rawName.trim();
  if (!name) {
    return { valid: false, reason: 'empty' };
  }
  if (name.length > MAX_COMMAND_NAME_LENGTH) {
    return { valid: false, reason: 'tooLong' };
  }
  if (!NAME_RE.test(name)) {
    return { valid: false, reason: 'invalidChars' };
  }
  const lower = name.toLowerCase();
  if (RESERVED_COMMAND_NAMES.has(lower)) {
    return { valid: false, reason: 'reserved' };
  }
  const clash = existing.some((command) => command.id !== excludeId && command.name.toLowerCase() === lower);
  if (clash) {
    return { valid: false, reason: 'duplicate' };
  }
  return { valid: true };
}

/**
 * Extract placeholder names from a template, in first-appearance order,
 * deduplicated. Matches both `{arg}` and `{{arg}}` forms. Used to suggest the
 * arg list when the user has not specified one explicitly.
 */
export function extractTemplatePlaceholders(template: string): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  // {{ name }} or { name } - inner token is a slug-like identifier.
  const re = /\{\{?\s*([a-zA-Z][a-zA-Z0-9_-]*)\s*\}?\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(template)) !== null) {
    const token = match[1];
    if (!seen.has(token)) {
      seen.add(token);
      ordered.push(token);
    }
  }
  return ordered;
}

/**
 * Expand a template into composer text. Named placeholders (`{arg}` /
 * `{{arg}}`) are replaced from `values` keyed by placeholder name; any
 * placeholder without a provided value is left untouched so the user can fill
 * it in the composer (the v1 UX). Returns the template verbatim when no values
 * are supplied.
 */
export function expandTemplate(template: string, values: Record<string, string> = {}): string {
  if (Object.keys(values).length === 0) {
    return template;
  }
  return template.replace(/\{\{?\s*([a-zA-Z][a-zA-Z0-9_-]*)\s*\}?\}/g, (whole, token: string) => {
    const replacement = values[token];
    return replacement === undefined ? whole : replacement;
  });
}

/** Normalize and clamp user input into a clean, persistable shape. */
function normalizeInput(input: UserSlashCommandInput): UserSlashCommandInput {
  const args = (input.args ?? []).map((arg) => arg.trim()).filter((arg) => arg.length > 0);
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    template: input.template,
    args: args.length > 0 ? args : undefined,
  };
}

/**
 * Create a new command, appended to `existing`. Throws if the name is invalid
 * or the template is empty - the caller (settings UI) validates first and
 * surfaces a friendly message, this is the last-line guard.
 */
export function createCommand(existing: readonly UserSlashCommand[], input: UserSlashCommandInput): UserSlashCommand[] {
  const normalized = normalizeInput(input);
  const nameCheck = validateCommandName(normalized.name, existing);
  if (nameCheck.valid === false) {
    throw new Error(`Invalid command name: ${nameCheck.reason}`);
  }
  if (!normalized.template.trim()) {
    throw new Error('Template cannot be empty');
  }
  const now = Date.now();
  const command: UserSlashCommand = {
    id: uuid(),
    name: normalized.name,
    description: normalized.description,
    template: normalized.template,
    args: normalized.args,
    createdAt: now,
    updatedAt: now,
  };
  return [...existing, command];
}

/**
 * Update an existing command by id. Returns a new array; unknown ids are a
 * no-op. Throws on invalid name / empty template, same as createCommand.
 */
export function updateCommand(
  existing: readonly UserSlashCommand[],
  id: string,
  input: UserSlashCommandInput
): UserSlashCommand[] {
  const target = existing.find((command) => command.id === id);
  if (!target) {
    return [...existing];
  }
  const normalized = normalizeInput(input);
  const nameCheck = validateCommandName(normalized.name, existing, id);
  if (nameCheck.valid === false) {
    throw new Error(`Invalid command name: ${nameCheck.reason}`);
  }
  if (!normalized.template.trim()) {
    throw new Error('Template cannot be empty');
  }
  return existing.map((command) =>
    command.id === id
      ? {
          ...command,
          name: normalized.name,
          description: normalized.description,
          template: normalized.template,
          args: normalized.args,
          updatedAt: Date.now(),
        }
      : command
  );
}

/** Remove a command by id. Returns a new array; unknown ids are a no-op. */
export function deleteCommand(existing: readonly UserSlashCommand[], id: string): UserSlashCommand[] {
  return existing.filter((command) => command.id !== id);
}
