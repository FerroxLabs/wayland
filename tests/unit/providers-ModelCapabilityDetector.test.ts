import { describe, it, expect } from 'vitest';
import { ModelCapabilityDetector } from '../../src/process/providers/catalog/ModelCapabilityDetector';
import type { ProviderModel } from '../../src/process/providers/types';

const detector = new ModelCapabilityDetector();

function stub(id: string, provider: Parameters<typeof detector['detect']>[0]['provider']): ProviderModel & { provider: typeof provider } {
  return { id, displayName: id, tier: 'everyday', capabilities: [], enabled: true, provider };
}

describe('ModelCapabilityDetector - openai', () => {
  it('gpt-4o has chat and vision', () => {
    const caps = detector.detect(stub('gpt-4o', 'openai'));
    expect(caps).toContain('chat');
    expect(caps).toContain('vision');
  });

  it('o1-mini has chat and reasoning', () => {
    const caps = detector.detect(stub('o1-mini', 'openai'));
    expect(caps).toContain('chat');
    expect(caps).toContain('reasoning');
  });

  it('dall-e-3 is image only', () => {
    const caps = detector.detect(stub('dall-e-3', 'openai'));
    expect(caps).toContain('image');
    expect(caps).not.toContain('chat');
  });

  it('whisper-1 is audio only', () => {
    const caps = detector.detect(stub('whisper-1', 'openai'));
    expect(caps).toContain('audio');
    expect(caps).not.toContain('chat');
  });

  it('text-embedding-3-small is embeddings only', () => {
    const caps = detector.detect(stub('text-embedding-3-small', 'openai'));
    expect(caps).toContain('embeddings');
  });
});

describe('ModelCapabilityDetector - anthropic', () => {
  it('claude-3-5-sonnet has chat and vision', () => {
    const caps = detector.detect(stub('claude-3-5-sonnet-20240620', 'anthropic'));
    expect(caps).toContain('chat');
    expect(caps).toContain('vision');
  });

  it('claude-4-opus has chat and vision', () => {
    const caps = detector.detect(stub('claude-4-opus', 'anthropic'));
    expect(caps).toContain('chat');
    expect(caps).toContain('vision');
  });

  it('claude-2 has chat only', () => {
    const caps = detector.detect(stub('claude-2.1', 'anthropic'));
    expect(caps).toContain('chat');
    expect(caps).not.toContain('vision');
  });
});

describe('ModelCapabilityDetector - google-gemini', () => {
  it('gemini-2.0-flash has chat and vision', () => {
    const caps = detector.detect(stub('gemini-2.0-flash', 'google-gemini'));
    expect(caps).toContain('chat');
    expect(caps).toContain('vision');
  });

  it('imagen-3 is image only', () => {
    const caps = detector.detect(stub('imagen-3.0-generate-001', 'google-gemini'));
    expect(caps).toContain('image');
  });

  it('embedding-001 is embeddings', () => {
    const caps = detector.detect(stub('embedding-001', 'google-gemini'));
    expect(caps).toContain('embeddings');
  });
});

describe('ModelCapabilityDetector - audio providers', () => {
  it('elevenlabs model is audio only', () => {
    const caps = detector.detect(stub('eleven_multilingual_v2', 'elevenlabs'));
    expect(caps).toEqual(['audio']);
  });

  it('deepgram model is audio only', () => {
    const caps = detector.detect(stub('nova-2-general', 'deepgram'));
    expect(caps).toEqual(['audio']);
  });

  it('assemblyai model is audio only', () => {
    const caps = detector.detect(stub('best', 'assemblyai'));
    expect(caps).toEqual(['audio']);
  });
});

describe('ModelCapabilityDetector - groq', () => {
  it('llama-3 returns chat', () => {
    const caps = detector.detect(stub('llama-3.3-70b-versatile', 'groq'));
    expect(caps).toContain('chat');
    expect(caps).not.toContain('audio');
  });

  it('whisper returns audio', () => {
    const caps = detector.detect(stub('whisper-large-v3', 'groq'));
    expect(caps).toContain('audio');
  });
});

describe('ModelCapabilityDetector - pre-populated capabilities passthrough', () => {
  it('returns existing capabilities without applying rules', () => {
    const model: ProviderModel & { provider: 'openai' } = {
      id: 'gpt-4o',
      displayName: 'GPT-4o',
      tier: 'flagship',
      capabilities: ['chat', 'image'], // pre-populated, unusual but valid
      enabled: true,
      provider: 'openai',
    };
    const caps = detector.detect(model);
    expect(caps).toEqual(['chat', 'image']);
  });
});

describe('ModelCapabilityDetector.detectById', () => {
  it('works without a full ProviderModel', () => {
    const caps = detector.detectById('gpt-4o', 'openai');
    expect(caps).toContain('chat');
    expect(caps).toContain('vision');
  });
});
