/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { deriveStep, truncateToFilename } from '../../src/common/chat/activity/activityLabels';

describe('activityLabels.truncateToFilename', () => {
  it('returns last segment, normalizing backslashes', () => {
    expect(truncateToFilename('C:\\Users\\me\\src\\config.ts')).toBe('config.ts');
    expect(truncateToFilename('/home/me/src/app/index.tsx')).toBe('index.tsx');
  });
  it('caps very long names', () => {
    const long = 'a'.repeat(60) + '.ts';
    expect(truncateToFilename(long).length).toBeLessThanOrEqual(40);
    expect(truncateToFilename(long).endsWith('…')).toBe(true);
  });
});

describe('activityLabels.deriveStep - kind-driven', () => {
  it('maps thinking -> reasoning', () => {
    expect(deriveStep({ kind: 'thinking', name: '', detail: '' })).toEqual({ label: 'Reasoning', glyph: 'reasoning' });
  });
  it('maps sub_agent -> agent name + sub_agent glyph', () => {
    expect(deriveStep({ kind: 'sub_agent', name: 'researcher', detail: '' })).toEqual({
      label: 'researcher',
      glyph: 'sub_agent',
    });
  });
  it('maps circuit with provider name', () => {
    expect(deriveStep({ kind: 'circuit', name: 'openrouter', detail: '' })).toEqual({
      label: 'Switched provider (openrouter)',
      glyph: 'circuit',
    });
  });
});

describe('activityLabels.deriveStep - tool name humanizing', () => {
  it('web search', () => {
    const r = deriveStep({ kind: 'tool', name: 'web_search', detail: 'query: world news' });
    expect(r.glyph).toBe('web');
    expect(r.label.toLowerCase()).toContain('search');
  });
  it('webfetch -> reading host', () => {
    const r = deriveStep({ kind: 'tool', name: 'WebFetch', detail: 'https://www.reuters.com/world' });
    expect(r.glyph).toBe('web');
    expect(r.label).toBe('Reading reuters.com');
  });
  it('read file -> Reading <filename>', () => {
    const r = deriveStep({ kind: 'tool', name: 'Read', detail: '/home/me/src/config.ts' });
    expect(r.glyph).toBe('file');
    expect(r.label).toBe('Reading config.ts');
  });
  it('write/edit file -> Editing <filename>', () => {
    const r = deriveStep({ kind: 'tool', name: 'str_replace_editor', detail: 'app/index.tsx' });
    expect(r.glyph).toBe('file');
    expect(r.label).toBe('Editing index.tsx');
  });
  it('grep -> Searching the codebase', () => {
    const r = deriveStep({ kind: 'tool', name: 'Grep', detail: 'pattern foo' });
    expect(r).toEqual({ label: 'Searching the codebase', glyph: 'search' });
  });
  it('bash -> Running a command', () => {
    const r = deriveStep({ kind: 'tool', name: 'exec_command', detail: 'ls -la' });
    expect(r).toEqual({ label: 'Running a command', glyph: 'command' });
  });
  it('tests -> Running tests', () => {
    const r = deriveStep({ kind: 'tool', name: 'run_tests', detail: '' });
    expect(r).toEqual({ label: 'Running tests', glyph: 'command' });
  });
  it('NEVER blank: unknown tool falls back to cleaned name', () => {
    const r = deriveStep({ kind: 'tool', name: 'some_custom_mcp_tool', detail: '' });
    expect(r.label.length).toBeGreaterThan(0);
    expect(r.label).toBe('Some custom mcp tool');
    expect(r.glyph).toBe('tool');
  });
  it('NEVER blank: empty everything still yields a label', () => {
    const r = deriveStep({ kind: 'tool', name: '', detail: '' });
    expect(r.label).toBe('Tool');
    expect(r.glyph).toBe('tool');
  });
});

// #520 command visibility: when a command-glyph tool carries the actual command,
// show it instead of the generic "Running a command" (the regression users hit).
describe('activityLabels.deriveStep - command surfacing (#520)', () => {
  it('shows the actual command for a shell tool', () => {
    const r = deriveStep({ kind: 'tool', name: 'Bash', command: 'echo WL520_LIVE_CHECK' });
    expect(r).toEqual({ label: 'Running echo WL520_LIVE_CHECK', glyph: 'command' });
  });
  it('strips a leading "Execute: " prefix (the wcore description fallback)', () => {
    const r = deriveStep({ kind: 'tool', name: 'Bash', command: 'Execute: ls -la' });
    expect(r.label).toBe('Running ls -la');
  });
  it('collapses newlines and caps a long command to one legible line', () => {
    const long = `for i in $(seq 1 100); do echo "line $i of a very long heredoc-ish command"; done`;
    const r = deriveStep({ kind: 'tool', name: 'Bash', command: long });
    expect(r.label.startsWith('Running ')).toBe(true);
    expect(r.label).not.toContain('\n');
    expect(r.label.endsWith('…')).toBe(true);
    expect(r.label.length).toBeLessThanOrEqual('Running '.length + 64);
  });
  it('falls back to the humanized label when no command is present', () => {
    const r = deriveStep({ kind: 'tool', name: 'exec_command', detail: 'ls -la' });
    expect(r).toEqual({ label: 'Running a command', glyph: 'command' });
  });
  it('does not hijack non-command glyphs (file/web keep their rich labels)', () => {
    const r = deriveStep({ kind: 'tool', name: 'Read', detail: '/src/config.ts', command: 'ignored' });
    expect(r).toEqual({ label: 'Reading config.ts', glyph: 'file' });
  });
});
