import { describe, it, expect } from 'vitest';
import { classifyScenario } from '@/common/types/onboarding';

const base = {
  fluxConnected: false,
  fluxDesktop: { running: false },
  envKeys: [] as string[],
  clis: [] as string[],
  claudePro: false,
  ollama: { running: false, models: [] as string[] },
  agents: [] as { id: string; kind: string; name: string }[],
  name: '',
} as Parameters<typeof classifyScenario>[0];

describe('classifyScenario', () => {
  it('reaches the fully-wired state on fluxConnected ALONE (no desktop app)', () => {
    expect(classifyScenario({ ...base, fluxConnected: true })).toBe('D');
  });
  it('still cold-starts when nothing is detected', () => {
    expect(classifyScenario(base)).toBe('B');
  });
});
