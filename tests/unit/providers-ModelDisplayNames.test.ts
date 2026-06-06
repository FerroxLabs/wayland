import { describe, it, expect } from 'vitest';
import { ModelDisplayNames } from '../../src/process/providers/catalog/ModelDisplayNames';

const dn = new ModelDisplayNames();

describe('ModelDisplayNames.humanise - spec round-trips', () => {
  it('claude-3-5-sonnet-20240620 → "Claude 3.5 Sonnet"', () => {
    expect(dn.humanise('claude-3-5-sonnet-20240620', 'anthropic')).toBe('Claude 3.5 Sonnet');
  });

  it('gpt-4o-2024-08-06 → "GPT 4o"', () => {
    expect(dn.humanise('gpt-4o-2024-08-06', 'openai')).toBe('GPT 4o');
  });

  it('gemini-1.5-pro-002 → "Gemini 1.5 Pro"', () => {
    expect(dn.humanise('gemini-1.5-pro-002', 'google-gemini')).toBe('Gemini 1.5 Pro');
  });

  it('models/gemini-2.0-flash-exp → "Gemini 2.0 Flash Exp"', () => {
    expect(dn.humanise('models/gemini-2.0-flash-exp', 'google-gemini')).toBe('Gemini 2.0 Flash Exp');
  });

  it('o3-mini → "o3 Mini"', () => {
    expect(dn.humanise('o3-mini', 'openai')).toBe('o3 Mini');
  });

  it('claude-opus-4-7 → "Claude Opus 4.7"', () => {
    expect(dn.humanise('claude-opus-4-7', 'anthropic')).toBe('Claude Opus 4.7');
  });
});

describe('ModelDisplayNames.humanise - date suffix stripping', () => {
  it('strips YYYYMMDD suffix', () => {
    expect(dn.humanise('claude-3-opus-20240229', 'anthropic')).toBe('Claude 3 Opus');
  });

  it('strips YYYY-MM-DD suffix', () => {
    expect(dn.humanise('gpt-4-2024-04-09', 'openai')).toBe('GPT 4');
  });
});

describe('ModelDisplayNames.humanise - version suffix stripping', () => {
  it('strips -001 Vertex suffix', () => {
    expect(dn.humanise('gemini-1.5-pro-001', 'google-gemini')).toBe('Gemini 1.5 Pro');
  });

  it('strips -v1 suffix', () => {
    expect(dn.humanise('some-model-v1', 'openai-compatible')).toBe('Some Model');
  });

  it('strips -v2.0 suffix', () => {
    expect(dn.humanise('some-model-v2.0', 'openai-compatible')).toBe('Some Model');
  });
});

describe('ModelDisplayNames.humanise - vendor prefix stripping', () => {
  it('strips anthropic. prefix', () => {
    expect(dn.humanise('anthropic.claude-3-opus', 'aws-bedrock')).toBe('Claude 3 Opus');
  });

  it('strips meta. prefix', () => {
    expect(dn.humanise('meta.llama3-70b-instruct', 'aws-bedrock')).toBe('Llama3 70b Instruct');
  });

  it('strips models/ prefix', () => {
    expect(dn.humanise('models/gemini-pro', 'google-gemini')).toBe('Gemini Pro');
  });
});

describe('ModelDisplayNames.humanise - glossary capitalisation', () => {
  it('capitalises GPT correctly', () => {
    expect(dn.humanise('gpt-4', 'openai')).toBe('GPT 4');
  });

  it('capitalises Claude correctly', () => {
    const result = dn.humanise('claude-instant-1', 'anthropic');
    expect(result).toContain('Claude');
  });

  it('capitalises Gemini correctly', () => {
    const result = dn.humanise('gemini-pro', 'google-gemini');
    expect(result).toContain('Gemini');
  });

  it('capitalises DeepSeek correctly', () => {
    const result = dn.humanise('deepseek-chat', 'deepseek');
    expect(result).toContain('DeepSeek');
  });
});

describe('ModelDisplayNames.humanise - version dot normalisation', () => {
  it('normalises claude-3-5 → 3.5 in display', () => {
    const result = dn.humanise('claude-3-5-sonnet-20240620', 'anthropic');
    expect(result).toContain('3.5');
  });

  it('normalises gemini-1-5 → 1.5 in display', () => {
    // gemini-1.5 already has dots; test with a hyphenated variant
    const result = dn.humanise('gemini-1-5-pro', 'google-gemini');
    expect(result).toContain('1.5');
  });
});
