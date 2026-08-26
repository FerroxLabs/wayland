/**
 * Regression cover for #748 - the LEGACY gemini backend (src/process/agent/gemini),
 * not the wcore backend.
 *
 * Gemini 3.x attaches a `thoughtSignature` to every `functionCall` part it emits.
 * On the next request each of those parts must carry a signature or the API
 * rejects the whole call with:
 *
 *   API error 400: Function call is missing a thought_signature in functionCall
 *   parts. ... Additional data, function call `default_api:ToolSearch`, position 33.
 *
 * The vendored @office-ai/aioncli-core ships its own filler,
 * GeminiChat.ensureActiveLoopHasThoughtSignatures, but it has two holes that the
 * reporter fell through:
 *
 *   1. it `break`s after the FIRST functionCall in a model turn, so parallel
 *      tool calls after the first stay unsigned;
 *   2. it only walks forward from the last user TEXT turn, so any model turn in
 *      earlier history stays unsigned.
 *
 * `ensureAllFunctionCallsHaveSignatures` closes both. It fills only MISSING
 * signatures - a real signature is never overwritten, and nothing Gemini never
 * signs (text parts, functionResponse parts, user turns) ever gets an invented one.
 */

import { SYNTHETIC_THOUGHT_SIGNATURE } from '@office-ai/aioncli-core';
import { describe, expect, it } from 'vitest';
import { ensureAllFunctionCallsHaveSignatures } from '@process/agent/gemini/utils';

type TestPart = {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
  thoughtSignature?: string;
};
type TestContent = { role: string; parts: TestPart[] };

const call = (name: string, thoughtSignature?: string): TestPart => ({
  functionCall: { name, args: {} },
  ...(thoughtSignature === undefined ? {} : { thoughtSignature }),
});

const response = (name: string): TestPart => ({
  functionResponse: { name, response: { ok: true } },
});

/** Every functionCall part that would go on the wire, flattened. */
const wireFunctionCalls = (contents: TestContent[]) =>
  contents.flatMap((c) =>
    (c.parts ?? [])
      .filter((p) => p.functionCall)
      .map((p) => ({
        role: c.role,
        name: p.functionCall!.name,
        thoughtSignature: p.thoughtSignature,
      }))
  );

describe('ensureAllFunctionCallsHaveSignatures (#748)', () => {
  it('signs step 2 first functionCall that lost its signature - the reported shape', () => {
    // A multi-step function-call round trip. Step 1 came back signed; step 2's
    // first functionCall lost its signature on the way back into history.
    const history: TestContent[] = [
      { role: 'user', parts: [{ text: 'look at this image' }] },
      { role: 'model', parts: [call('default_api:ToolSearch', 'sig-step-1')] },
      { role: 'user', parts: [response('default_api:ToolSearch')] },
      { role: 'model', parts: [call('default_api:ToolSearch')] }, // step 2, signature lost
      { role: 'user', parts: [response('default_api:ToolSearch')] },
    ];

    const wire = ensureAllFunctionCallsHaveSignatures(history as never) as unknown as TestContent[];

    expect(wireFunctionCalls(wire)).toEqual([
      { role: 'model', name: 'default_api:ToolSearch', thoughtSignature: 'sig-step-1' },
      { role: 'model', name: 'default_api:ToolSearch', thoughtSignature: SYNTHETIC_THOUGHT_SIGNATURE },
    ]);
    // Nothing on the wire may still be missing a signature.
    expect(wireFunctionCalls(wire).filter((c) => !c.thoughtSignature)).toEqual([]);
  });

  it('signs EVERY parallel functionCall in a model turn, not just the first', () => {
    const history: TestContent[] = [
      { role: 'user', parts: [{ text: 'look at this image' }] },
      {
        role: 'model',
        parts: [call('default_api:ToolSearch'), call('default_api:ToolSearch'), call('default_api:ReadFile')],
      },
    ];

    const wire = ensureAllFunctionCallsHaveSignatures(history as never) as unknown as TestContent[];

    expect(wire[1].parts.map((p) => p.thoughtSignature)).toEqual([
      SYNTHETIC_THOUGHT_SIGNATURE,
      SYNTHETIC_THOUGHT_SIGNATURE,
      SYNTHETIC_THOUGHT_SIGNATURE,
    ]);
  });

  it('signs model turns that sit BEFORE the last user text turn', () => {
    const history: TestContent[] = [
      { role: 'user', parts: [{ text: 'turn 1' }] },
      { role: 'model', parts: [call('default_api:ToolSearch')] }, // before the active loop
      { role: 'user', parts: [response('default_api:ToolSearch')] },
      { role: 'user', parts: [{ text: 'turn 2' }] },
      { role: 'model', parts: [call('default_api:ReadFile')] },
    ];

    const wire = ensureAllFunctionCallsHaveSignatures(history as never) as unknown as TestContent[];

    expect(wireFunctionCalls(wire).filter((c) => !c.thoughtSignature)).toEqual([]);
  });

  it('never overwrites a real signature', () => {
    const history: TestContent[] = [
      { role: 'user', parts: [{ text: 'go' }] },
      { role: 'model', parts: [call('default_api:ToolSearch', 'real-signature-from-gemini')] },
    ];

    const wire = ensureAllFunctionCallsHaveSignatures(history as never) as unknown as TestContent[];

    expect(wire[1].parts[0].thoughtSignature).toBe('real-signature-from-gemini');
  });

  it('never invents a signature for parts Gemini does not sign', () => {
    const history: TestContent[] = [
      { role: 'user', parts: [{ text: 'go' }] },
      { role: 'model', parts: [{ text: 'thinking out loud' }] },
      { role: 'user', parts: [response('default_api:ToolSearch')] },
    ];

    const wire = ensureAllFunctionCallsHaveSignatures(history as never) as unknown as TestContent[];

    for (const content of wire) {
      for (const part of content.parts) {
        expect(part.thoughtSignature).toBeUndefined();
      }
    }
  });

  it('does not sign a functionCall sitting on a user turn', () => {
    // Defensive: only role === 'model' parts carry model thought signatures.
    const history: TestContent[] = [{ role: 'user', parts: [call('default_api:ToolSearch')] }];

    const wire = ensureAllFunctionCallsHaveSignatures(history as never) as unknown as TestContent[];

    expect(wire[0].parts[0].thoughtSignature).toBeUndefined();
  });

  it('returns the SAME array when there is nothing to repair', () => {
    // The caller uses referential identity to skip a needless setHistory().
    const history: TestContent[] = [
      { role: 'user', parts: [{ text: 'go' }] },
      { role: 'model', parts: [call('default_api:ToolSearch', 'sig')] },
    ];

    expect(ensureAllFunctionCallsHaveSignatures(history as never)).toBe(history);
  });

  it('does not mutate the input history', () => {
    const history: TestContent[] = [
      { role: 'user', parts: [{ text: 'go' }] },
      { role: 'model', parts: [call('default_api:ToolSearch')] },
    ];

    ensureAllFunctionCallsHaveSignatures(history as never);

    expect(history[1].parts[0].thoughtSignature).toBeUndefined();
  });

  it('tolerates malformed history without throwing', () => {
    const history = [
      { role: 'model' }, // no parts
      { role: 'model', parts: null },
      null,
      { role: 'model', parts: [null, call('default_api:ToolSearch')] },
    ];

    const wire = ensureAllFunctionCallsHaveSignatures(history as never) as unknown as TestContent[];

    expect(wire[3].parts[1].thoughtSignature).toBe(SYNTHETIC_THOUGHT_SIGNATURE);
  });
});

describe('vendored aioncli-core filler leaves #748 unsigned (characterization)', () => {
  it('proves the upstream gap this fix exists to close', async () => {
    const { GeminiChat } = await import('@office-ai/aioncli-core/dist/src/core/geminiChat.js');
    const upstream = (
      GeminiChat.prototype as unknown as {
        ensureActiveLoopHasThoughtSignatures: (c: TestContent[]) => TestContent[];
      }
    ).ensureActiveLoopHasThoughtSignatures;

    const history: TestContent[] = [
      { role: 'user', parts: [{ text: 'turn 1' }] },
      { role: 'model', parts: [call('default_api:ToolSearch')] }, // before the active loop
      { role: 'user', parts: [response('default_api:ToolSearch')] },
      { role: 'user', parts: [{ text: 'turn 2' }] },
      {
        role: 'model',
        parts: [call('default_api:ToolSearch'), call('default_api:ToolSearch')], // parallel
      },
    ];

    const upstreamWire = upstream.call({} as never, history);

    // Upstream leaves two functionCall parts unsigned: the pre-loop one and the
    // second parallel one. Those are exactly the 400s in #748.
    expect(wireFunctionCalls(upstreamWire).filter((c) => !c.thoughtSignature)).toHaveLength(2);

    // Ours leaves none.
    const ourWire = ensureAllFunctionCallsHaveSignatures(history as never) as unknown as TestContent[];
    expect(wireFunctionCalls(ourWire).filter((c) => !c.thoughtSignature)).toHaveLength(0);
  });
});
