/**
 * Unit tests for composePrompt - the single composer that joins
 * Constitution + Specialist Overlay + backend basePrompt into the
 * system-slot string injected by every backend.
 *
 * Bridge module is fully mocked; no real fs, no real ~/.wayland/.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@process/bridge/constitutionBridge', () => ({
  readConstitutionWithOverlay: vi.fn(),
}));

import { readConstitutionWithOverlay } from '@process/bridge/constitutionBridge';
import { composePrompt } from '@process/services/constitution/composePrompt';

const mockBridge = vi.mocked(readConstitutionWithOverlay);

const SEP = '\n\n---\n\n';

describe('composePrompt', () => {
  beforeEach(() => {
    mockBridge.mockReset();
  });

  it('returns constitution-only text when no assistantId and no basePrompt', () => {
    const constitution = '# Wayland Constitution\n\nBe direct.';
    mockBridge.mockReturnValue({ constitution, overlay: null });

    const result = composePrompt();

    expect(result.text).toBe(constitution);
    expect(result.hadOverlay).toBe(false);
    expect(result.approxTokens).toBe(Math.ceil(constitution.length / 4));
    expect(result.anthropicCacheControl).toEqual({ type: 'ephemeral' });
    expect(mockBridge).toHaveBeenCalledWith(undefined);
  });

  it('returns constitution-only text when assistantId is set but overlay file is missing', () => {
    const constitution = 'CONSTITUTION_BODY';
    mockBridge.mockReturnValue({ constitution, overlay: null });

    const result = composePrompt({ assistantId: 'builtin-word-creator' });

    expect(result.text).toBe(constitution);
    expect(result.hadOverlay).toBe(false);
    expect(result.approxTokens).toBe(Math.ceil(constitution.length / 4));
    expect(mockBridge).toHaveBeenCalledWith('builtin-word-creator');
  });

  it('joins constitution + overlay with separator when an overlay exists', () => {
    const constitution = 'CONSTITUTION_BODY';
    const overlay = 'OVERLAY_BODY';
    mockBridge.mockReturnValue({ constitution, overlay });

    const result = composePrompt({ assistantId: 'spark' });

    expect(result.text).toBe(`${constitution}${SEP}${overlay}`);
    expect(result.hadOverlay).toBe(true);
    expect(result.approxTokens).toBe(Math.ceil(result.text.length / 4));
  });

  it('joins constitution + overlay + basePrompt in exact order', () => {
    const constitution = 'C';
    const overlay = 'O';
    const basePrompt = 'BASE';
    mockBridge.mockReturnValue({ constitution, overlay });

    const result = composePrompt({ assistantId: 'copy', basePrompt });

    expect(result.text).toBe(`${constitution}${SEP}${overlay}${SEP}${basePrompt}`);
    expect(result.hadOverlay).toBe(true);
    // approxTokens always derived from final composed text
    expect(result.approxTokens).toBe(Math.ceil(result.text.length / 4));
  });

  it('returns basePrompt-only when constitution is missing', () => {
    const basePrompt = 'just a base prompt';
    mockBridge.mockReturnValue({ constitution: '', overlay: null });

    const result = composePrompt({ basePrompt });

    expect(result.text).toBe(basePrompt);
    expect(result.approxTokens).toBe(Math.ceil(basePrompt.length / 4));
    expect(result.hadOverlay).toBe(false);
  });

  it('always returns anthropicCacheControl of { type: "ephemeral" }', () => {
    // Case A: constitution-only
    mockBridge.mockReturnValueOnce({ constitution: 'X', overlay: null });
    const a = composePrompt();
    expect(a.anthropicCacheControl).toEqual({ type: 'ephemeral' });

    // Case B: constitution + overlay + base
    mockBridge.mockReturnValueOnce({ constitution: 'X', overlay: 'Y' });
    const b = composePrompt({ assistantId: 'foo', basePrompt: 'Z' });
    expect(b.anthropicCacheControl).toEqual({ type: 'ephemeral' });
  });

  it('approxTokens equals Math.ceil(text.length / 4) across compositions', () => {
    const cases: Array<{
      constitution: string;
      overlay: string | null;
      basePrompt?: string;
      assistantId?: string;
    }> = [
      { constitution: 'short', overlay: null },
      { constitution: 'a'.repeat(101), overlay: null },
      { constitution: 'a'.repeat(33), overlay: 'b'.repeat(17), assistantId: 'foo' },
      { constitution: 'C', overlay: 'O', basePrompt: 'BASE', assistantId: 'foo' },
      { constitution: '', overlay: null, basePrompt: 'x'.repeat(7) },
    ];

    for (const c of cases) {
      mockBridge.mockReturnValueOnce({ constitution: c.constitution, overlay: c.overlay });
      const result = composePrompt({ assistantId: c.assistantId, basePrompt: c.basePrompt });

      const parts = [c.constitution, c.overlay ?? '', c.basePrompt ?? ''].filter(
        (p) => p && p.length > 0
      );
      const expectedText = parts.join(SEP);
      const expectedTokens = Math.ceil(expectedText.length / 4);

      expect(result.text).toBe(expectedText);
      expect(result.approxTokens).toBe(expectedTokens);
    }
  });

  it('does not propagate bridge errors; falls back to basePrompt with safe defaults', () => {
    // Silence the expected console.error noise for this assertion.
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockBridge.mockImplementation(() => {
      throw new Error('disk on fire');
    });

    // basePrompt='' case → text === ''
    const empty = composePrompt({ basePrompt: '' });
    expect(empty.text).toBe('');
    expect(empty.approxTokens).toBe(0);
    expect(empty.hadOverlay).toBe(false);
    expect(empty.anthropicCacheControl).toEqual({ type: 'ephemeral' });

    // basePrompt populated → text === basePrompt
    const withBase = composePrompt({ basePrompt: 'FALLBACK' });
    expect(withBase.text).toBe('FALLBACK');
    expect(withBase.approxTokens).toBe(Math.ceil('FALLBACK'.length / 4));
    expect(withBase.hadOverlay).toBe(false);
    expect(withBase.anthropicCacheControl).toEqual({ type: 'ephemeral' });

    errSpy.mockRestore();
  });
});
