/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import yaml from 'js-yaml';
import { redactCommandSecrets } from '@/common/utils/redactCommandSecrets';

/**
 * Portable-export format for workflows (#512, the fast-follow to the assistant
 * export in {@link ./agentProfileExport}).
 *
 * SECURITY MODEL — credential-safe by construction:
 *  - Unlike an assistant (reconstructed from an allowlist of config fields), a
 *    workflow *is* its on-disk SKILL.md. The credential boundary here is
 *    therefore redaction of the file content itself: every string leaf of the
 *    parsed frontmatter AND the markdown body is run through
 *    {@link redactCommandSecrets}, so a secret pasted anywhere in the workflow
 *    (a `--header 'Authorization: Bearer …'` in a command, an `api_key:` in the
 *    frontmatter, …) is masked on the way out.
 *  - Path confinement lives at the caller: the SKILL.md body is resolved through
 *    `SkillLibrary` by NAME against the trusted in-process index — the renderer
 *    never supplies an on-disk path — so this function only ever sees content
 *    the library already vouched for. It is pure (no IO, no clock).
 *  - `redacted` reports whether anything was masked so the UI can warn before the
 *    file is shared.
 *
 * The output round-trips through the existing importer: `type: workflow` routes
 * it back to the SkillLibrary import path.
 */

/** Bumped when the export envelope changes in a way importers must branch on. */
export const WORKFLOW_EXPORT_VERSION = 1;

export interface WorkflowExportInput {
  /** Raw SKILL.md content of the workflow, exactly as stored on disk. */
  body: string;
  /** Fallback name when the file's frontmatter has no usable `name`. */
  fallbackName: string;
  appVersion: string;
  /** ISO timestamp; injected (not read from a clock) so this stays pure. */
  exportedAt: string;
}

export interface WorkflowExportResult {
  content: string;
  /** True when a likely secret in the workflow was masked on the way out. */
  redacted: boolean;
}

/** Split a SKILL.md into its parsed frontmatter object + markdown body. */
function splitSkillMd(raw: string): { frontmatter: Record<string, unknown>; markdown: string } {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw);
  if (!match) return { frontmatter: {}, markdown: raw };
  try {
    // js-yaml v4 `load` uses DEFAULT_SCHEMA, which rejects code-exec tags
    // (`!!js/function`) - it is the safe loader, not the full/unsafe one.
    const parsed = yaml.load(match[1]);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { frontmatter: parsed as Record<string, unknown>, markdown: match[2] ?? '' };
    }
  } catch {
    // Malformed frontmatter: fall through and treat the whole file as markdown
    // so we still emit a redacted export rather than throwing.
  }
  return { frontmatter: {}, markdown: raw };
}

/** Recursively mask secrets in every string leaf of a parsed frontmatter tree. */
function redactTree(value: unknown, onMask: () => void): unknown {
  if (typeof value === 'string') {
    const safe = redactCommandSecrets(value);
    if (safe !== value) onMask();
    return safe;
  }
  if (Array.isArray(value)) return value.map((v) => redactTree(v, onMask));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = redactTree(v, onMask);
    }
    return out;
  }
  return value;
}

/**
 * Build the SKILL.md text for a workflow export. Pure: no IO, no clock. Every
 * frontmatter string and the markdown body are secret-masked; the export
 * provenance is stamped AFTER masking so it is never itself redacted.
 */
export function buildWorkflowExport(input: WorkflowExportInput): WorkflowExportResult {
  const raw = input.body ?? '';
  const { frontmatter, markdown } = splitSkillMd(raw);

  let redacted = false;
  const mark = () => {
    redacted = true;
  };

  const safeFrontmatter = redactTree(frontmatter, mark) as Record<string, unknown>;
  const safeMarkdown = redactCommandSecrets(markdown);
  if (safeMarkdown !== markdown) redacted = true;

  // Ensure the export re-imports as a workflow, with a usable name.
  safeFrontmatter.type = 'workflow';
  if (typeof safeFrontmatter.name !== 'string' || safeFrontmatter.name.trim() === '') {
    safeFrontmatter.name = redactCommandSecrets(input.fallbackName);
  }

  // Stamp provenance after redaction so version/timestamp survive verbatim.
  const existingMeta =
    safeFrontmatter.metadata && typeof safeFrontmatter.metadata === 'object' && !Array.isArray(safeFrontmatter.metadata)
      ? (safeFrontmatter.metadata as Record<string, unknown>)
      : {};
  safeFrontmatter.metadata = {
    ...existingMeta,
    'wayland-export-version': WORKFLOW_EXPORT_VERSION,
    'app-version': input.appVersion,
    'exported-at': input.exportedAt,
  };

  const yamlBlock = yaml.dump(safeFrontmatter, { lineWidth: -1 }).trimEnd();
  const content = `---\n${yamlBlock}\n---\n\n${safeMarkdown.trimEnd()}\n`;
  return { content, redacted };
}
