import { describe, it, expect } from 'vitest';
import { ProviderDetector } from '../../src/process/providers/detection/ProviderDetector';

const detector = new ProviderDetector();

describe('ProviderDetector.detect - unique prefix matches', () => {
  it('detects anthropic from sk-ant- prefix', () => {
    const r = detector.detect('sk-ant-api03-abc123');
    expect(r.kind).toBe('unique');
    if (r.kind === 'unique') {
      expect(r.provider).toBe('anthropic');
      expect(r.confidence).toBe('high');
    }
  });

  it('detects openrouter from sk-or- prefix', () => {
    const r = detector.detect('sk-or-v1-xyz789');
    expect(r.kind).toBe('unique');
    if (r.kind === 'unique') expect(r.provider).toBe('openrouter');
  });

  it('detects openai from sk-proj- prefix', () => {
    const r = detector.detect('sk-proj-AbCdEfGhIjKl');
    expect(r.kind).toBe('unique');
    if (r.kind === 'unique') expect(r.provider).toBe('openai');
  });

  it('detects google-gemini from AIza prefix', () => {
    const r = detector.detect('AIzaSyAbcdef1234567890');
    expect(r.kind).toBe('unique');
    if (r.kind === 'unique') expect(r.provider).toBe('google-gemini');
  });

  it('detects groq from gsk_ prefix', () => {
    const r = detector.detect('gsk_abc123def456');
    expect(r.kind).toBe('unique');
    if (r.kind === 'unique') expect(r.provider).toBe('groq');
  });

  it('detects xai from xai- prefix', () => {
    const r = detector.detect('xai-somekey12345');
    expect(r.kind).toBe('unique');
    if (r.kind === 'unique') expect(r.provider).toBe('xai');
  });

  it('detects huggingface from hf_ prefix', () => {
    const r = detector.detect('hf_abcdefghijklmn');
    expect(r.kind).toBe('unique');
    if (r.kind === 'unique') expect(r.provider).toBe('huggingface');
  });

  it('detects perplexity from pplx- prefix', () => {
    const r = detector.detect('pplx-abc123xyz');
    expect(r.kind).toBe('unique');
    if (r.kind === 'unique') expect(r.provider).toBe('perplexity');
  });

  it('detects replicate from r8_ prefix', () => {
    const r = detector.detect('r8_abcdef1234567890');
    expect(r.kind).toBe('unique');
    if (r.kind === 'unique') expect(r.provider).toBe('replicate');
  });

  it('detects together from tgp_ prefix', () => {
    const r = detector.detect('tgp_abcdef1234567890');
    expect(r.kind).toBe('unique');
    if (r.kind === 'unique') expect(r.provider).toBe('together');
  });

  it('detects together from tgp_v1_ prefix', () => {
    const r = detector.detect('tgp_v1_abcdef1234567890');
    expect(r.kind).toBe('unique');
    if (r.kind === 'unique') expect(r.provider).toBe('together');
  });

  it('detects fireworks from fw_ prefix', () => {
    const r = detector.detect('fw_abcdef1234567890');
    expect(r.kind).toBe('unique');
    if (r.kind === 'unique') expect(r.provider).toBe('fireworks');
  });

  it('detects cerebras from csk- prefix', () => {
    const r = detector.detect('csk-abcdef1234567890');
    expect(r.kind).toBe('unique');
    if (r.kind === 'unique') expect(r.provider).toBe('cerebras');
  });

  it('detects nvidia from nvapi- prefix', () => {
    const r = detector.detect('nvapi-abcdef1234567890');
    expect(r.kind).toBe('unique');
    if (r.kind === 'unique') expect(r.provider).toBe('nvidia');
  });

  it('detects anyscale from esecret_ prefix', () => {
    const r = detector.detect('esecret_abcdef1234567890');
    expect(r.kind).toBe('unique');
    if (r.kind === 'unique') expect(r.provider).toBe('anyscale');
  });

  it('detects github-models from a GitHub PAT (ghp_ / github_pat_)', () => {
    const classic = detector.detect('ghp_abcdef1234567890');
    expect(classic.kind).toBe('unique');
    if (classic.kind === 'unique') expect(classic.provider).toBe('github-models');
    const fine = detector.detect('github_pat_11ABCDEF0_abcdef');
    expect(fine.kind).toBe('unique');
    if (fine.kind === 'unique') expect(fine.provider).toBe('github-models');
  });

  it('does NOT prefix-detect deepgram/assemblyai/elevenlabs (those keys are prefix-less; rules removed)', () => {
    // `dg_`, `aai_`, and `xi-api-` were never real key prefixes; they no longer
    // false-match. These providers stay connectable via Browse (#224 audit).
    expect(detector.detect('dg_abcdef1234567890').kind).toBe('unknown');
    expect(detector.detect('aai_abcdef1234567890').kind).toBe('unknown');
    expect(detector.detect('xi-api-abcdef1234567890').kind).toBe('unknown');
  });
});

describe('ProviderDetector.detect - multi-field providers', () => {
  it('detects aws-bedrock from AKIA prefix', () => {
    const r = detector.detect('AKIAIOSFODNN7EXAMPLE');
    expect(r.kind).toBe('multi-field');
    if (r.kind === 'multi-field') {
      expect(r.provider).toBe('aws-bedrock');
      expect(r.requiredFields).toContain('region');
      expect(r.requiredFields).toContain('secret_key');
    }
  });

  it('detects aws-bedrock from ASIA prefix', () => {
    const r = detector.detect('ASIAIOSFODNN7EXAMPLE');
    expect(r.kind).toBe('multi-field');
    if (r.kind === 'multi-field') expect(r.provider).toBe('aws-bedrock');
  });
});

describe('ProviderDetector.detect - structural providers', () => {
  it('detects minimax from valid JWT structure', () => {
    // eyJ = base64url({ "alg": "HS256", "typ": "JWT" })
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: '123' })).toString('base64url');
    const jwt = `${header}.${payload}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
    const r = detector.detect(jwt);
    expect(r.kind).toBe('structural');
    if (r.kind === 'structural') {
      expect(r.provider).toBe('minimax');
      expect(r.confidence).toBe('medium');
    }
  });

  it('detects zhipu-glm from dot-split pattern', () => {
    const r = detector.detect('abcdefghij.klmnopqrstu');
    expect(r.kind).toBe('structural');
    if (r.kind === 'structural') expect(r.provider).toBe('zhipu-glm');
  });

  it('does not detect zhipu-glm from short dot-split', () => {
    const r = detector.detect('abc.def');
    // Too short - should be unknown or ambiguous, not zhipu
    expect(r.kind).not.toBe('structural');
  });
});

describe('ProviderDetector.detect - bare sk- ambiguous case', () => {
  it('returns ambiguous-sk for bare sk- keys', () => {
    const r = detector.detect('sk-someRandomKey1234567890');
    expect(r.kind).toBe('ambiguous-sk');
    if (r.kind === 'ambiguous-sk') {
      expect(r.candidates).toContain('openai');
      expect(r.candidates).toContain('deepseek');
    }
  });

  it('does NOT treat sk-ant- as bare sk-', () => {
    const r = detector.detect('sk-ant-api03-abc');
    expect(r.kind).toBe('unique');
    if (r.kind === 'unique') expect(r.provider).toBe('anthropic');
  });
});

describe('ProviderDetector.detect - edge cases', () => {
  it('returns unknown for empty string', () => {
    expect(detector.detect('')).toEqual({ kind: 'unknown' });
  });

  it('returns unknown for whitespace-only string', () => {
    expect(detector.detect('   ')).toEqual({ kind: 'unknown' });
  });

  it('returns unknown for unrecognised key format', () => {
    const r = detector.detect('totally-random-key-format-xyz');
    expect(r.kind).toBe('unknown');
  });

  it('trims leading/trailing whitespace before matching', () => {
    const r = detector.detect('  sk-ant-api03-abc  ');
    expect(r.kind).toBe('unique');
    if (r.kind === 'unique') expect(r.provider).toBe('anthropic');
  });
});
