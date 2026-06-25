/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  parseEnvText,
  mcpDetail,
  type ExistingState,
} from '../../../src/process/services/import/migration/migrationShared';
import {
  hermesProviderKeys,
  hermesConfigItems,
  buildHermesPlan,
} from '../../../src/process/services/import/migration/hermesSource';
import {
  parseOpenClawConfig,
  openclawKeysFromConfig,
  openclawKeysFromProfiles,
  openclawConfigItems,
  buildOpenClawPlan,
} from '../../../src/process/services/import/migration/openclawSource';

const emptyExisting = (): ExistingState => ({
  connectedProviderIds: new Set(),
  mcpServerNames: new Set(),
  hasDefaultModel: false,
});

describe('parseEnvText', () => {
  it('parses KEY=value, export, quotes, comments, blanks', () => {
    const env = parseEnvText(
      [
        '# comment',
        '',
        'ANTHROPIC_API_KEY=sk-ant-abc',
        'export OPENAI_API_KEY="sk-proj-xyz"',
        "GROQ_API_KEY='gsk_quoted'",
        'OPENROUTER_API_KEY=sk-or-v1-abc # inline comment',
        'BAD LINE NO EQUALS',
        '123INVALID=nope',
      ].join('\n')
    );
    expect(env.ANTHROPIC_API_KEY).toBe('sk-ant-abc');
    expect(env.OPENAI_API_KEY).toBe('sk-proj-xyz');
    expect(env.GROQ_API_KEY).toBe('gsk_quoted');
    expect(env.OPENROUTER_API_KEY).toBe('sk-or-v1-abc');
    expect(env['123INVALID']).toBeUndefined();
  });
});

describe('mcpDetail', () => {
  it('describes stdio and http servers without leaking secrets', () => {
    expect(mcpDetail({ command: 'npx', args: ['-y', '@mcp/fs', '/tmp'] })).toBe('stdio: npx -y @mcp/fs /tmp');
    expect(
      mcpDetail({ url: 'https://mcp.example.com/sse', transport: 'sse', headers: { Authorization: 'secret' } })
    ).toBe('sse: https://mcp.example.com');
    expect(mcpDetail({ url: 'https://mcp.example.com/sse' }).includes('secret')).toBe(false);
  });
});

describe('Hermes source', () => {
  it('extracts only provider keys from .env (not channel tokens)', () => {
    const keys = hermesProviderKeys({
      ANTHROPIC_API_KEY: 'sk-ant-abc',
      GOOGLE_API_KEY: 'AIzaXyz',
      SLACK_BOT_TOKEN: 'xoxb-nope',
      OPENAI_API_KEY: '', // empty -> skipped
    });
    expect(keys.map((k) => k.providerId).toSorted()).toEqual(['anthropic', 'google-gemini']);
  });

  it('extracts MCP servers + default model from config.yaml object', () => {
    const { mcp, defaultModel } = hermesConfigItems({
      model: { default: 'anthropic/claude-opus-4.6' },
      mcp_servers: {
        filesystem: { command: 'npx', args: ['-y', '@mcp/fs'] },
        remote: { url: 'https://x.example/mcp' },
      },
    });
    expect(defaultModel).toBe('anthropic/claude-opus-4.6');
    expect(mcp.map((m) => m.name).toSorted()).toEqual(['filesystem', 'remote']);
  });

  it('marks already-connected providers + existing MCP as exists, omits default-model item', () => {
    const existing: ExistingState = {
      connectedProviderIds: new Set(['anthropic']),
      mcpServerNames: new Set(['filesystem']),
      hasDefaultModel: false,
    };
    const plan = buildHermesPlan(
      {
        keys: [
          { providerId: 'anthropic', value: 'sk-ant-secret1234', sourceLabel: 'ANTHROPIC_API_KEY' },
          { providerId: 'groq', value: 'gsk_secretabcd', sourceLabel: 'GROQ_API_KEY' },
        ],
        mcp: [{ name: 'filesystem', config: { command: 'npx' } }],
        defaultModel: 'anthropic/claude-opus-4.6',
      },
      existing,
      '/home/u/.hermes',
      []
    );
    const byId = Object.fromEntries(plan.items.map((i) => [i.id, i]));
    expect(byId['provider-key:anthropic'].status).toBe('exists');
    expect(byId['provider-key:groq'].status).toBe('new');
    expect(byId['mcp-server:filesystem'].status).toBe('exists');
    // No secret leaks into the plan, and detail is redacted.
    expect(byId['provider-key:anthropic'].detail).not.toContain('secret');
    // Default-model is out of scope for v1.
    expect(plan.items.find((i) => i.kind === 'default-model')).toBeUndefined();
  });
});

describe('OpenClaw source', () => {
  it('parses JSONC config with comments + trailing commas', () => {
    const cfg = parseOpenClawConfig('{ // comment\n  "models": { "providers": { "anthropic": {} } },\n}');
    expect(cfg).not.toBeNull();
  });

  it('extracts inline provider keys, resolving ${ENV} templates', () => {
    const cfg = {
      models: {
        providers: {
          anthropic: { apiKey: 'sk-ant-literal' },
          openai: { apiKey: '${OPENAI_API_KEY}' },
          google: { apiKey: 'AIzaInline' },
          unknownprov: { apiKey: 'whatever' },
        },
      },
    };
    const keys = openclawKeysFromConfig(cfg, { OPENAI_API_KEY: 'sk-proj-resolved' });
    const map = Object.fromEntries(keys.map((k) => [k.providerId, k.value]));
    expect(map['anthropic']).toBe('sk-ant-literal');
    expect(map['openai']).toBe('sk-proj-resolved');
    expect(map['google-gemini']).toBe('AIzaInline');
    expect(map['unknownprov']).toBeUndefined(); // unmapped provider name skipped
  });

  it('does not migrate an unresolved env template', () => {
    const keys = openclawKeysFromConfig({ models: { providers: { anthropic: { apiKey: '${MISSING_VAR}' } } } }, {});
    expect(keys).toHaveLength(0);
  });

  it('extracts api_key profiles from the auth_profile_store blob', () => {
    const blob = JSON.stringify({
      version: 1,
      profiles: {
        'anthropic:default': { type: 'api_key', provider: 'anthropic', key: 'sk-ant-fromsqlite' },
        'openai:default': { type: 'oauth', provider: 'openai', access: 'tok', refresh: 'r', expires: 1 },
        'groq:default': { type: 'api_key', provider: 'groq', key: 'gsk_fromsqlite' },
      },
    });
    const keys = openclawKeysFromProfiles(blob);
    expect(keys.map((k) => k.providerId).toSorted()).toEqual(['anthropic', 'groq']); // oauth skipped
  });

  it('reads mcp servers + default model (string or {primary})', () => {
    expect(
      openclawConfigItems({
        agents: { defaults: { model: 'claude-opus' } },
        mcp: { servers: { fs: { command: 'x' } } },
      })
    ).toEqual({ mcp: [{ name: 'fs', config: { command: 'x' } }], defaultModel: 'claude-opus' });
    expect(openclawConfigItems({ agents: { defaults: { model: { primary: 'gpt-5' } } } }).defaultModel).toBe('gpt-5');
  });

  it('builds a plan that dedupes keys by provider (config wins over profiles)', () => {
    const plan = buildOpenClawPlan(
      {
        keys: [
          { providerId: 'anthropic', value: 'sk-ant-config', sourceLabel: 'config' },
          { providerId: 'anthropic', value: 'sk-ant-sqlite', sourceLabel: 'sqlite' },
        ],
        mcp: [],
        defaultModel: null,
      },
      emptyExisting(),
      '/home/u/.openclaw',
      []
    );
    const keyItems = plan.items.filter((i) => i.kind === 'provider-key');
    expect(keyItems).toHaveLength(1);
    expect(keyItems[0].detail).toContain('sk-ant'); // first (config) wins
  });
});
