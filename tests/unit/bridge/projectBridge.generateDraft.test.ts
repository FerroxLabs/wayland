/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Regression for #221: generateKnowledgeDraft must surface the underlying
 * provider failure to the renderer as `detail`, not collapse every error into a
 * bare `failed`. The New-Project instructions wizard showed "Could not generate
 * a draft." with no cause, making real failures (bad key, 404 model, rate limit,
 * request timeout) undiagnosable from the UI. Draft generation goes through the
 * direct-HTTP `oneShotComplete` path, NOT the wayland-core engine, so the engine
 * fix in 0.12.5 (#200) does not address this.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Capture each provider handler as initProjectBridge() registers it, so we can
// invoke the real generateKnowledgeDraft closure in isolation.
const handlers: Record<string, (arg: unknown) => unknown> = {};
const makeChannel = (key: string) => ({
  provider: (fn: (arg: unknown) => unknown) => {
    handlers[key] = fn;
  },
});

vi.mock('@/common', () => ({
  ipcBridge: { project: new Proxy({}, { get: (_t, prop: string) => makeChannel(prop) }) },
}));
vi.mock('@process/services/projectServiceSingleton', () => ({ projectServiceSingleton: {} }));
vi.mock('@process/services/projectKnowledge/knowledge', () => ({
  readProjectKnowledge: vi.fn(),
  writeProjectKnowledge: vi.fn(),
  listProjectReference: vi.fn(),
  addProjectReference: vi.fn(),
  removeProjectReference: vi.fn(),
  readProjectSummaries: vi.fn(),
  writeProjectSummary: vi.fn(),
  appendProjectDecision: vi.fn(),
  readProjectIjfwMemory: vi.fn(),
}));
vi.mock('@process/services/completion/oneShot', () => ({
  hasUsableModel: vi.fn(),
  oneShotComplete: vi.fn(),
  oneShotCompleteBest: vi.fn(),
}));

import { initProjectBridge } from '../../../src/process/bridge/projectBridge';
import { oneShotCompleteBest } from '@process/services/completion/oneShot';

// The draft handler delegates to oneShotCompleteBest, which internally ranks +
// falls back across providers; the handler only maps its result/throw.
const mockComplete = vi.mocked(oneShotCompleteBest);

const draftArgs = { kind: 'context' as const, description: 'a thing' };

type DraftResult = { draft: string; error?: 'no-model' | 'failed'; detail?: string };
const runDraft = () => handlers['generateKnowledgeDraft'](draftArgs) as Promise<DraftResult>;

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of Object.keys(handlers)) delete handlers[k];
  initProjectBridge();
});

describe('generateKnowledgeDraft error surfacing (#221)', () => {
  it('returns the underlying provider error as `detail` when generation fails', async () => {
    mockComplete.mockRejectedValue(new Error('401: invalid x-api-key'));

    const res = await runDraft();

    expect(res.error).toBe('failed');
    expect(res.detail).toBe('401: invalid x-api-key');
    expect(res.draft).toBe('');
  });

  it('maps a missing usable model to `no-model` with no leaked detail', async () => {
    // oneShotCompleteBest throws 'no-usable-model' when no provider can be called.
    mockComplete.mockRejectedValue(new Error('no-usable-model'));

    const res = await runDraft();

    expect(res.error).toBe('no-model');
    expect(res.detail).toBeUndefined();
  });

  it('returns the trimmed draft and no error on success', async () => {
    mockComplete.mockResolvedValue('# Draft\nHello');

    const res = await runDraft();

    expect(res.error).toBeUndefined();
    expect(res.draft).toContain('Hello');
  });
});
