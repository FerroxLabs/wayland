/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  detectConciergeProposals,
  hasConciergeProposals,
  stripConciergeProposals,
} from '@process/task/ConciergeProposeDetector';
import { CONCIERGE_RULES_MAX_CHARS } from '@/common/chat/conciergeConfig';

const block = (body: string) =>
  `Sure, here is the change:\n[CONCIERGE_PROPOSE]\n${body}\n[/CONCIERGE_PROPOSE]\nLet me know.`;

describe('detectConciergeProposals', () => {
  it('parses provider_connect (provider + label + optional base_url)', () => {
    const out = detectConciergeProposals(
      block('kind: provider_connect\nprovider: openai\nlabel: OpenAI\nbase_url: https://api.example.com')
    );
    expect(out).toEqual([
      { kind: 'provider_connect', providerId: 'openai', label: 'OpenAI', baseUrl: 'https://api.example.com' },
    ]);
  });

  it('NEVER carries a secret: an api_key/key line in a provider_connect block is ignored', () => {
    const out = detectConciergeProposals(
      block('kind: provider_connect\nprovider: openai\nlabel: OpenAI\napi_key: sk-supersecret-1234\nkey: also-secret')
    );
    expect(out).toHaveLength(1);
    expect(JSON.stringify(out[0])).not.toContain('supersecret');
    expect(JSON.stringify(out[0])).not.toContain('also-secret');
    expect(out[0]).toEqual({ kind: 'provider_connect', providerId: 'openai', label: 'OpenAI' });
  });

  it('parses file_bug_report with and without an optional summary (#464)', () => {
    const withSummary = detectConciergeProposals(block('kind: file_bug_report\nsummary: app crashes on launch'));
    expect(withSummary).toEqual([{ kind: 'file_bug_report', summary: 'app crashes on launch' }]);

    const bare = detectConciergeProposals(block('kind: file_bug_report'));
    expect(bare).toEqual([{ kind: 'file_bug_report' }]);
  });

  it('parses set_default_model and rejects an unknown engine', () => {
    const ok = detectConciergeProposals(
      block(
        'kind: set_default_model\nengine: wcore\nmodel_id: anthropic/claude-opus-4-8\nuse_model: claude-opus-4-8\nlabel: Claude Opus 4.8'
      )
    );
    expect(ok).toEqual([
      {
        kind: 'set_default_model',
        engine: 'wcore',
        modelId: 'anthropic/claude-opus-4-8',
        useModel: 'claude-opus-4-8',
        label: 'Claude Opus 4.8',
      },
    ]);
    const bad = detectConciergeProposals(
      block('kind: set_default_model\nengine: openrouter\nmodel_id: x\nuse_model: y\nlabel: z')
    );
    expect(bad).toEqual([]);
  });

  it('parses add_mcp (args space-split, env KEY=val pairs)', () => {
    const out = detectConciergeProposals(
      block(
        'kind: add_mcp\nname: filesystem\ncommand: npx\nargs: -y @modelcontextprotocol/server-filesystem /tmp\nenv: API_KEY=abc123, REGION=us-east-1'
      )
    );
    expect(out).toEqual([
      {
        kind: 'add_mcp',
        name: 'filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        env: { API_KEY: 'abc123', REGION: 'us-east-1' },
      },
    ]);
  });

  it('parses edit_assistant (multi-line rules) and rejects oversized rules', () => {
    const out = detectConciergeProposals(
      block(
        'kind: edit_assistant\nassistant: builtin-concierge\nlabel: Concierge\nrules: You are helpful.\nAlways be concise.'
      )
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ kind: 'edit_assistant', assistantId: 'builtin-concierge', label: 'Concierge' });
    expect((out[0] as { rules: string }).rules).toContain('Always be concise.');

    const huge = 'x'.repeat(CONCIERGE_RULES_MAX_CHARS + 1);
    const tooBig = detectConciergeProposals(block(`kind: edit_assistant\nassistant: a\nlabel: A\nrules: ${huge}`));
    expect(tooBig).toEqual([]);
  });

  it('rejects edit_assistant proposals with an unsafe (path-traversal) assistant id', () => {
    for (const bad of ['../../../../etc/cron.d/evil', 'a/b', '..', '.hidden', 'C:\\x', 'a\\b']) {
      expect(detectConciergeProposals(block(`kind: edit_assistant\nassistant: ${bad}\nlabel: X\nrules: hi`))).toEqual(
        []
      );
    }
    // A safe id still parses.
    expect(
      detectConciergeProposals(block('kind: edit_assistant\nassistant: builtin-concierge\nlabel: X\nrules: hi'))
    ).toHaveLength(1);
  });

  it('omits blocks with an unknown kind or missing required fields', () => {
    expect(detectConciergeProposals(block('kind: nonsense\nfoo: bar'))).toEqual([]);
    expect(detectConciergeProposals(block('kind: provider_connect\nlabel: OpenAI'))).toEqual([]); // no provider
    expect(detectConciergeProposals(block('kind: add_mcp\nname: x'))).toEqual([]); // no command
  });

  it('ignores proposal blocks inside markdown code fences', () => {
    const fenced =
      '```\n[CONCIERGE_PROPOSE]\nkind: provider_connect\nprovider: openai\nlabel: OpenAI\n[/CONCIERGE_PROPOSE]\n```';
    expect(detectConciergeProposals(fenced)).toEqual([]);
  });

  it('parses multiple blocks in one message', () => {
    const content =
      block('kind: provider_connect\nprovider: openai\nlabel: OpenAI') +
      '\n' +
      block('kind: set_default_model\nengine: gemini\nmodel_id: g\nuse_model: gemini-pro\nlabel: Gemini Pro');
    const out = detectConciergeProposals(content);
    expect(out.map((p) => p.kind)).toEqual(['provider_connect', 'set_default_model']);
  });

  it('hasConciergeProposals + stripConciergeProposals', () => {
    const content = block('kind: provider_connect\nprovider: openai\nlabel: OpenAI');
    expect(hasConciergeProposals(content)).toBe(true);
    expect(hasConciergeProposals('just text')).toBe(false);
    const stripped = stripConciergeProposals(content);
    expect(stripped).not.toContain('[CONCIERGE_PROPOSE]');
    expect(stripped).toContain('Sure, here is the change:');
    expect(stripped).toContain('Let me know.');
  });
});
