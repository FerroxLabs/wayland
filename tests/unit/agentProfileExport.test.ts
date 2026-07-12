/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #512 — the export must be credential-safe. The allowlist in
 * exportAssistantToSkillMd is the credential boundary; these tests pin that an
 * assistant carrying secrets (env keys, apiKeyFields, cli paths, token args)
 * produces an export that contains NONE of them, and that a secret pasted into
 * the system prompt is masked.
 */

import { describe, it, expect } from 'vitest';
import {
  buildAgentProfileExport,
  exportAssistantToSkillMd,
} from '../../src/process/services/skills/agentProfileExport';
import { parseFrontmatter } from '../../src/process/task/AcpSkillManager';
import { parseFrontmatterType } from '../../src/process/services/skills/SkillImport';
import { buildAssistantFromSkillMd } from '../../src/process/services/skills/agentProfileImport';
import type { AcpBackendConfig } from '../../src/common/types/acpTypes';

const META = { appVersion: '0.11.17', exportedAt: '2026-07-12T00:00:00.000Z' };

function secretLadenAssistant(): AcpBackendConfig {
  return {
    id: 'custom-1',
    name: 'My Helper',
    description: 'Helps with things',
    avatar: '🤖',
    presetAgentType: 'claude',
    // --- everything below is a secret / PII and must NOT appear in the export ---
    env: { ANTHROPIC_API_KEY: 'sk-ant-SUPERSECRETVALUE12345', DEBUG: 'true' },
    apiKeyFields: [{ key: 'ANTHROPIC_API_KEY', label: 'Key', type: 'password', default: 'sk-DEFAULTLEAK987654' }],
    defaultCliPath: '/Users/alice/private/tools/my-cli',
    cliCommand: 'alice-private-cli',
    acpArgs: ['--token=tok-INLINE-SECRET-77777'],
    enabled: true,
  } as unknown as AcpBackendConfig;
}

describe('exportAssistantToSkillMd — credential boundary (#512)', () => {
  it('never leaks env / apiKeyFields / cli path / token args', () => {
    const { content } = exportAssistantToSkillMd(secretLadenAssistant(), 'You are a helpful assistant.', META);

    // secrets + PII home path — none may appear anywhere in the file
    expect(content).not.toContain('sk-ant-SUPERSECRETVALUE12345');
    expect(content).not.toContain('sk-DEFAULTLEAK987654');
    expect(content).not.toContain('/Users/alice');
    expect(content).not.toContain('alice-private-cli');
    expect(content).not.toContain('tok-INLINE-SECRET-77777');
    // env is not exported at all — the key name shouldn't appear either
    expect(content).not.toContain('ANTHROPIC_API_KEY');
    expect(content).not.toContain('apiKeyFields');
    expect(content).not.toContain('env');
  });

  it('keeps the shareable fields and routes as an agent-profile', () => {
    const { content } = exportAssistantToSkillMd(secretLadenAssistant(), 'You are a helpful assistant.', META);
    expect(content).toContain('type: agent-profile');
    expect(content).toContain('name: My Helper');
    expect(content).toContain('description: Helps with things');
    expect(content).toContain('main-agent: claude');
    expect(content).toContain('You are a helpful assistant.');
    expect(content).toContain('wayland-export-version: 1');
  });
});

describe('buildAgentProfileExport — system-prompt masking (#512)', () => {
  it('masks a secret pasted into the system prompt and flags it', () => {
    const res = buildAgentProfileExport({
      name: 'Leaky',
      systemPrompt: 'Always call the API with key sk-ant-LIVEKEY0001122334455 when asked.',
      ...META,
    });
    expect(res.redacted).toBe(true);
    expect(res.content).not.toContain('sk-ant-LIVEKEY0001122334455');
    expect(res.content).toContain('••••••');
  });

  it('does not flag a clean prompt', () => {
    const res = buildAgentProfileExport({ name: 'Clean', systemPrompt: 'You summarize documents.', ...META });
    expect(res.redacted).toBe(false);
    expect(res.content).toContain('You summarize documents.');
  });

  it('masks a secret in the description, not just the prompt', () => {
    const res = buildAgentProfileExport({
      name: 'Bot',
      description: 'internal note: key is sk-ant-DESCLEAK00112233445',
      systemPrompt: 'You help.',
      ...META,
    });
    expect(res.redacted).toBe(true);
    expect(res.content).not.toContain('sk-ant-DESCLEAK00112233445');
  });
});

describe('round-trips through the importer (#512)', () => {
  it('preserves a name and description containing an apostrophe', () => {
    const { content } = buildAgentProfileExport({
      name: "Sam's Assistant",
      description: "Sam's helper",
      systemPrompt: 'You help Sam.',
      ...META,
    });
    expect(parseFrontmatterType(content)).toBe('agent-profile');

    const parsed = parseFrontmatter(content);
    expect(parsed).not.toBeNull();
    expect(parsed?.name).toBe("Sam's Assistant");
    expect(parsed?.description).toBe("Sam's helper");

    const assistant = buildAssistantFromSkillMd(
      { name: parsed!.name, description: parsed?.description },
      content,
      1000
    );
    expect(assistant.name).toBe("Sam's Assistant");
    expect(assistant.description).toBe("Sam's helper");
    expect(assistant.context).toContain('You help Sam.');
  });
});
