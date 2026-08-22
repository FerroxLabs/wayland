import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolveSafeDefault, isExperimentalProvider } from '@renderer/pages/guid/hooks/useGuidModelSelection';
import type { IProvider } from '@/common/config/storage';

const REAL: IProvider[] = JSON.parse(readFileSync('/tmp/rc1-modelconfig.json', 'utf8'));
const byName = (n: string) => REAL.find((p) => p.name === n)!;
const isLocalDaemon = (p: IProvider) => /ollama|lm ?studio|local/i.test(`${p.name} ${p.platform}`);

describe('RC1 B16 — cold-start default over a partially loaded catalog', () => {
  it('CONTROL: full catalog picks a marquee model', () => {
    const out = resolveSafeDefault(REAL.filter((p) => !isLocalDaemon(p)));
    expect(out?.useModel).toBe('claude-opus-5');
  });

  it('only Ollama+Groq loaded (local excluded) -> allam-2-7b', () => {
    const partial = [byName('Ollama Local'), byName('Groq')].filter((p) => !isLocalDaemon(p));
    const out = resolveSafeDefault(partial);
    console.log('OLLAMA+GROQ ->', out?.provider.name, out?.useModel);
    expect(out?.useModel).toBe('allam-2-7b');
  });

  it('marquee providers not yet loaded except Deepseek -> deepseek-v4-flash', () => {
    const partial = [byName('Ollama Local'), byName('Groq'), byName('Deepseek')].filter((p) => !isLocalDaemon(p));
    const out = resolveSafeDefault(partial);
    console.log('…+DEEPSEEK ->', out?.provider.name, out?.useModel);
    expect(out?.useModel).toBe('deepseek-v4-flash');
  });

  it('experimental-provider guard does not exclude Groq', () => {
    expect(isExperimentalProvider(byName('Groq'))).toBe(false);
  });
});
