/**
 * The honesty floor: the one rule that must reach EVERY assistant on every
 * backend, and the Concierge copy that induced the failure it exists for.
 *
 * Origin: a user asked Wayland to remember something. The Concierge prompt
 * described a Memory feature, no memory-write tool was registered on that
 * profile, and the model answered "Saved to memory." having called nothing.
 * A claimed action with no tool call behind it.
 *
 * These assertions are deliberately about the SHIPPED strings rather than
 * behaviour: a prompt rule cannot be unit-tested for effect, only for presence.
 * The live check that it changes anything belongs in the packaged smoke.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockBridge, mockCapability } = vi.hoisted(() => ({ mockBridge: vi.fn(), mockCapability: vi.fn() }));
vi.mock('@process/services/constitution/constitutionFsService', () => ({
  getConstitutionFsService: () => ({
    capability: mockCapability,
    readWithOverlay: () => {
      const value = mockBridge() as { constitution: string; overlay: string | null };
      return {
        constitution: value.constitution
          ? { status: 'present', content: value.constitution, revision: 'rev:mock' }
          : { status: 'absent', revision: 'rev:mock-absent' },
        overlay: value.overlay
          ? { status: 'present', content: value.overlay, revision: 'rev:mock-overlay' }
          : undefined,
      };
    },
  }),
}));
vi.mock('@process/services/constitution/constitutionReclaimNotice', () => ({
  emitConstitutionReclaimNotice: vi.fn(),
}));
vi.mock('@process/services/constitution/constitutionUnsupportedNotice', () => ({
  emitConstitutionUnsupportedNotice: vi.fn(),
}));

import { composePrompt, HONESTY_FLOOR } from '@process/services/constitution/composePrompt';

const CONCIERGE_DIR = path.resolve(process.cwd(), 'src/process/resources/assistant/concierge');
const read = (name: string) => readFileSync(path.join(CONCIERGE_DIR, name), 'utf8');

describe('honesty floor reaches every composed prompt', () => {
  beforeEach(() => {
    mockBridge.mockReset();
    mockCapability.mockReset();
    mockCapability.mockReturnValue({ supported: true });
  });

  it('states both halves of the rule: do not invent facts, do not claim untaken actions', () => {
    expect(HONESTY_FLOOR).toMatch(/Never invent the user's own facts/);
    expect(HONESTY_FLOOR).toMatch(/Never claim an action you did not take in this turn/);
    // The specific verbs the observed failure used. "saved" and "remember" are
    // the two that produced the bug; losing them would leave the rule intact in
    // spirit and useless in practice.
    expect(HONESTY_FLOOR).toMatch(/saved/);
    expect(HONESTY_FLOOR).toMatch(/remember/);
  });

  it('is composed FIRST, so it survives a platform with no Constitution authority', () => {
    // This is the case that matters most: on an unsupported platform every
    // other segment is empty, and before this change the composed prompt was
    // the empty string - no rules at all.
    mockCapability.mockReturnValue({ supported: false, reason: 'unsupported platform' });
    const composed = composePrompt({ basePrompt: 'BACKEND' });
    expect(composed.text.startsWith(HONESTY_FLOOR)).toBe(true);

    // CONTROL: prove the assertion discriminates rather than passing on any
    // string. A prompt that merely CONTAINS the floor somewhere is not the same
    // claim as one that leads with it.
    expect(`BACKEND\n\n---\n\n${HONESTY_FLOOR}`.startsWith(HONESTY_FLOOR)).toBe(false);
  });

  it('is present for every assistant, with and without an overlay', () => {
    mockBridge.mockReturnValue({ constitution: '# C', overlay: null });
    expect(composePrompt().text).toContain(HONESTY_FLOOR);
    mockBridge.mockReturnValue({ constitution: '# C', overlay: '# Overlay' });
    expect(composePrompt({ assistantId: 'anything' }).text).toContain(HONESTY_FLOOR);
  });
});

describe('Concierge no longer promises cross-chat memory', () => {
  it('has dropped the sentence that induced the false save claim', () => {
    // The exact shipped wording that was in the prompt when the model said
    // "Saved to memory." with zero tool calls.
    for (const file of ['concierge.md', 'concierge.zh-CN.md']) {
      expect(read(file)).not.toMatch(/remembers about the user between chats/i);
    }
  });

  it('tells the assistant not to claim a save it did not perform', () => {
    expect(read('concierge.md')).toMatch(
      /Never tell the user you\s+saved, stored, or will remember something unless a tool call in THIS turn/i
    );
  });

  it('asserts NO hard-coded on/off state for engine memory', () => {
    // Core defaults memory ON (`MemoryConfig::default` - F-091) and gates the
    // write tools on `memory.enabled || observability.skills_lifecycle`, which
    // Desktop cannot read. Any static claim about the state shipped to every
    // profile is therefore false for some of them - including the reassuring
    // direction. State-neutral wording is the only wording that is always true.
    for (const file of ['concierge.md', 'concierge.zh-CN.md']) {
      const text = read(file);
      expect(text).not.toMatch(/memory is (currently )?(on|off)\b/i);
      expect(text).not.toMatch(/OFF unless/i);
      expect(text).not.toMatch(/nothing is being saved/i);
    }
  });
});
