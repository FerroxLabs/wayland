/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #512 workflow export — the credential boundary is redaction of the workflow's
 * own SKILL.md (a workflow, unlike an assistant, has no separate credential
 * store; it *is* its file). These tests pin: secrets masked in BOTH the body and
 * the frontmatter, the `redacted` flag, provenance stamping, type/name coercion,
 * and that a clean workflow round-trips unmasked.
 */

import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { buildWorkflowExport, WORKFLOW_EXPORT_VERSION } from '../../src/process/services/skills/workflowExport';

const META = { appVersion: '9.9.9', exportedAt: '2026-07-12T00:00:00.000Z' };

/** Parse the frontmatter block of an exported SKILL.md. */
function frontmatterOf(content: string): Record<string, unknown> {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(content);
  if (!m) throw new Error('no frontmatter');
  return yaml.load(m[1]) as Record<string, unknown>;
}

describe('buildWorkflowExport (#512)', () => {
  it('masks a secret embedded in the markdown body and sets redacted', () => {
    const body = [
      '---',
      'name: Deploy',
      'type: workflow',
      '---',
      '',
      'Run: curl -H "Authorization: Bearer sk-abcdef0123456789abcdef" https://api',
    ].join('\n');

    const { content, redacted } = buildWorkflowExport({ body, fallbackName: 'Deploy', ...META });

    expect(redacted).toBe(true);
    expect(content).not.toContain('sk-abcdef0123456789abcdef');
    expect(content).toContain('••••••');
  });

  it('masks a secret embedded in a frontmatter field, not just the body', () => {
    const body = [
      '---',
      'name: Sync',
      'type: workflow',
      'api_key: ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      '---',
      '',
      'Body with no secret.',
    ].join('\n');

    const { content, redacted } = buildWorkflowExport({ body, fallbackName: 'Sync', ...META });

    expect(redacted).toBe(true);
    expect(content).not.toContain('ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
    const fm = frontmatterOf(content);
    expect(String(fm.api_key)).toContain('••••••');
  });

  it('leaves a clean workflow unmasked and preserves its frontmatter + body', () => {
    const body = [
      '---',
      'name: Clean',
      'type: workflow',
      'description: A tidy flow',
      '---',
      '',
      '# Steps',
      'Do a thing.',
    ].join('\n');

    const { content, redacted } = buildWorkflowExport({ body, fallbackName: 'Clean', ...META });

    expect(redacted).toBe(false);
    const fm = frontmatterOf(content);
    expect(fm.name).toBe('Clean');
    expect(fm.description).toBe('A tidy flow');
    expect(content).toContain('# Steps');
    expect(content).toContain('Do a thing.');
  });

  it('stamps versioned provenance after redaction (never itself masked)', () => {
    const body = ['---', 'name: P', 'type: workflow', '---', '', 'x'].join('\n');
    const { content } = buildWorkflowExport({ body, fallbackName: 'P', ...META });
    const fm = frontmatterOf(content);
    const meta = fm.metadata as Record<string, unknown>;
    expect(meta['wayland-export-version']).toBe(WORKFLOW_EXPORT_VERSION);
    expect(meta['app-version']).toBe('9.9.9');
    expect(meta['exported-at']).toBe('2026-07-12T00:00:00.000Z');
  });

  it('forces type: workflow and falls back to the given name when frontmatter has none', () => {
    const body = ['---', 'type: skill', '---', '', 'no name here'].join('\n');
    const { content } = buildWorkflowExport({ body, fallbackName: 'Fallback Name', ...META });
    const fm = frontmatterOf(content);
    expect(fm.type).toBe('workflow');
    expect(fm.name).toBe('Fallback Name');
  });

  it('exports a redacted body even when the frontmatter is malformed (no throw)', () => {
    // A ':' inside an unquoted value makes this invalid YAML; we must still
    // emit a redacted export rather than throwing on the way out.
    const body = ['---', 'name: broken: : :', 'type: workflow', '---', '', 'token=AKIAIOSFODNN7EXAMPLE1'].join('\n');
    const run = () => buildWorkflowExport({ body, fallbackName: 'Broken', ...META });
    expect(run).not.toThrow();
    const { content, redacted } = run();
    expect(redacted).toBe(true);
    expect(content).not.toContain('AKIAIOSFODNN7EXAMPLE1');
    expect(frontmatterOf(content).type).toBe('workflow');
  });
});
