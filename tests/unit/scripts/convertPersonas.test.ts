/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
// @ts-expect-error - .mjs script has no type declarations
import { convertAgentProfiles, convertTeamAssistants } from '../../../scripts/convert-team-bundle.mjs';

describe('convertTeamAssistants', () => {
  let outDir: string;

  beforeEach(() => {
    outDir = mkdtempSync(join(tmpdir(), 'wayland-team-assistants-'));
  });

  afterEach(() => {
    rmSync(outDir, { recursive: true, force: true });
  });

  const sampleAssistants = [
    {
      id: 'research-analyst',
      name: 'Research Analyst',
      description: 'Deep research and synthesis.',
      avatar: '🔬',
      presetAgentType: 'claude',
      contextFile: 'assistants/research-analyst.md',
      enabledSkills: ['research', 'synthesis'],
      prompts: ['Summarize this topic', 'Find key insights'],
      category: 'research',
      kind: 'specialist',
    },
    {
      id: 'code-reviewer',
      name: 'Code Reviewer',
      description: 'Reviews code for quality and security.',
      presetAgentType: 'claude',
      category: 'engineering',
      kind: 'reviewer',
    },
    {
      id: 'writing-coach',
      name: 'Writing Coach',
      description: 'Helps craft clear, compelling writing.',
      avatar: '✍️',
      presetAgentType: 'gemini',
      prompts: ['Review my draft', 'Improve this paragraph'],
      category: 'content',
    },
  ];

  it('writes assistants.staged.json with 3 AcpBackendConfig-shaped entries', () => {
    const result = convertTeamAssistants(sampleAssistants, outDir);

    expect(result.count).toBe(3);
    expect(existsSync(join(outDir, 'assistants.staged.json'))).toBe(true);

    const written = JSON.parse(readFileSync(join(outDir, 'assistants.staged.json'), 'utf8'));
    expect(written).toHaveLength(3);
  });

  it('sets isPreset: true on every entry', () => {
    convertTeamAssistants(sampleAssistants, outDir);
    const written = JSON.parse(readFileSync(join(outDir, 'assistants.staged.json'), 'utf8'));
    for (const entry of written) {
      expect(entry.isPreset).toBe(true);
    }
  });

  it('maps kind to _kind', () => {
    convertTeamAssistants(sampleAssistants, outDir);
    const written = JSON.parse(readFileSync(join(outDir, 'assistants.staged.json'), 'utf8'));

    const analyst = written.find((e: { id: string }) => e.id === 'research-analyst');
    expect(analyst._kind).toBe('specialist');

    const reviewer = written.find((e: { id: string }) => e.id === 'code-reviewer');
    expect(reviewer._kind).toBe('reviewer');
  });

  it('does not set _kind when kind is absent', () => {
    convertTeamAssistants(sampleAssistants, outDir);
    const written = JSON.parse(readFileSync(join(outDir, 'assistants.staged.json'), 'utf8'));
    const coach = written.find((e: { id: string }) => e.id === 'writing-coach');
    expect(Object.prototype.hasOwnProperty.call(coach, '_kind')).toBe(false);
  });

  it('preserves id, name, description, avatar, presetAgentType, contextFile, enabledSkills, prompts, category', () => {
    convertTeamAssistants(sampleAssistants, outDir);
    const written = JSON.parse(readFileSync(join(outDir, 'assistants.staged.json'), 'utf8'));
    const analyst = written.find((e: { id: string }) => e.id === 'research-analyst');

    expect(analyst.id).toBe('research-analyst');
    expect(analyst.name).toBe('Research Analyst');
    expect(analyst.description).toBe('Deep research and synthesis.');
    expect(analyst.avatar).toBe('🔬');
    expect(analyst.presetAgentType).toBe('claude');
    expect(analyst.contextFile).toBe('assistants/research-analyst.md');
    expect(analyst.enabledSkills).toEqual(['research', 'synthesis']);
    expect(analyst.prompts).toEqual(['Summarize this topic', 'Find key insights']);
    expect(analyst.category).toBe('research');
  });

  it('is idempotent - re-running produces identical output', () => {
    convertTeamAssistants(sampleAssistants, outDir);
    const first = readFileSync(join(outDir, 'assistants.staged.json'), 'utf8');

    convertTeamAssistants(sampleAssistants, outDir);
    const second = readFileSync(join(outDir, 'assistants.staged.json'), 'utf8');

    expect(second).toBe(first);
  });
});

describe('convertAgentProfiles', () => {
  let outDir: string;

  beforeEach(() => {
    outDir = mkdtempSync(join(tmpdir(), 'wayland-agent-profiles-'));
  });

  afterEach(() => {
    rmSync(outDir, { recursive: true, force: true });
  });

  const sampleProfiles = [
    {
      name: 'Senior Engineer',
      description: 'An experienced software engineer.',
      metadata: { model: 'claude-opus-4-5', tools: ['bash', 'read'] },
      body: 'You are a senior software engineer with 10+ years of experience. Focus on clean, maintainable code.',
    },
    {
      name: 'Product Manager Pro',
      description: 'Strategic product leadership assistant.',
      metadata: { model: 'gemini-pro' },
      body: 'You are a seasoned product manager. Prioritize user value and business outcomes.',
    },
  ];

  it('writes agent-profiles.staged.json with 2 entries', () => {
    const result = convertAgentProfiles(sampleProfiles, outDir);

    expect(result.count).toBe(2);
    expect(existsSync(join(outDir, 'agent-profiles.staged.json'))).toBe(true);

    const written = JSON.parse(readFileSync(join(outDir, 'agent-profiles.staged.json'), 'utf8'));
    expect(written).toHaveLength(2);
  });

  it('sets prompts.system to the body content', () => {
    convertAgentProfiles(sampleProfiles, outDir);
    const written = JSON.parse(readFileSync(join(outDir, 'agent-profiles.staged.json'), 'utf8'));

    expect(written[0].prompts.system).toBe(sampleProfiles[0].body);
    expect(written[1].prompts.system).toBe(sampleProfiles[1].body);
  });

  it('sets models to metadata.model', () => {
    convertAgentProfiles(sampleProfiles, outDir);
    const written = JSON.parse(readFileSync(join(outDir, 'agent-profiles.staged.json'), 'utf8'));

    expect(written[0].models).toBe('claude-opus-4-5');
    expect(written[1].models).toBe('gemini-pro');
  });

  it('generates kebab-case id from name', () => {
    convertAgentProfiles(sampleProfiles, outDir);
    const written = JSON.parse(readFileSync(join(outDir, 'agent-profiles.staged.json'), 'utf8'));

    expect(written[0].id).toBe('senior-engineer');
    expect(written[1].id).toBe('product-manager-pro');
  });

  it('sets isPreset: true, presetAgentType: agent-profile, category: agent-profile', () => {
    convertAgentProfiles(sampleProfiles, outDir);
    const written = JSON.parse(readFileSync(join(outDir, 'agent-profiles.staged.json'), 'utf8'));

    for (const entry of written) {
      expect(entry.isPreset).toBe(true);
      expect(entry.presetAgentType).toBe('agent-profile');
      expect(entry.category).toBe('agent-profile');
    }
  });

  it('is idempotent - re-running produces identical output', () => {
    convertAgentProfiles(sampleProfiles, outDir);
    const first = readFileSync(join(outDir, 'agent-profiles.staged.json'), 'utf8');

    convertAgentProfiles(sampleProfiles, outDir);
    const second = readFileSync(join(outDir, 'agent-profiles.staged.json'), 'utf8');

    expect(second).toBe(first);
  });
});
