/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';

const handleAtCommand = vi.hoisted(() => vi.fn());
vi.mock('../../../../src/process/agent/gemini/cli/atCommandProcessor', () => ({ handleAtCommand }));

import { GeminiAgent } from '../../../../src/process/agent/gemini';

describe('restricted channel Gemini input', () => {
  it('passes @ paths as literal text without reading local files', async () => {
    const agent = Object.create(GeminiAgent.prototype) as GeminiAgent;
    const submitQuery = vi.fn(() => 'request');
    (agent as unknown as { bootstrap: Promise<void> }).bootstrap = Promise.resolve();
    (agent as unknown as { executionPolicy: string }).executionPolicy = 'channel-conversational';
    (agent as unknown as { authType: string }).authType = 'api_key';
    (agent as unknown as { historyPrefix: null }).historyPrefix = null;
    (agent as unknown as { historyUsedOnce: boolean }).historyUsedOnce = false;
    (agent as unknown as { skillsIndexPrependedOnce: boolean }).skillsIndexPrependedOnce = true;
    (agent as unknown as { submitQuery: typeof submitQuery }).submitQuery = submitQuery;

    await agent.send('Summarize @/etc/passwd', 'channel-turn');

    expect(handleAtCommand).not.toHaveBeenCalled();
    expect(submitQuery).toHaveBeenCalledWith('Summarize @/etc/passwd', 'channel-turn', expect.any(AbortController));
  });
});
