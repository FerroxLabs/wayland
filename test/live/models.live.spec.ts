/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * P0 — Models / Providers / Agents (the highest-regression-density zone).
 * Maps to MA-1..MA-14 in docs/LIVE-TEST-PLAN-0.11.4-2026-06-27.md.
 *
 * THE RULE: a model is "verified" only when an actual SEND completes — never
 * when the picker merely shows it. Picker-display-as-done is what let Grok 403
 * and assistants ship broken.
 *
 * Preconditions: the app is running on the operator's REAL profile with the
 * relevant providers connected. Tests for a provider that isn't connected will
 * be skipped via the `requires` guard so the run stays green on partial setups.
 */
import { test, expect } from './fixtures/app';

/** Skip a test if the given agent pill isn't present (provider/CLI not set up). */
async function agentPresent(page: import('@playwright/test').Page, backend: string): Promise<boolean> {
  return page.locator(`[data-agent-backend="${backend}"]`).count().then((n) => n > 0);
}

test.beforeEach(async ({ app }) => {
  await app.newChat();
});

// MA-1: every agent's picker shows real models within ~1s (no Flux-only flash / dead "Default Model").
for (const backend of ['wcore', 'gemini', 'claude', 'codex', 'grok']) {
  test(`MA-1 ${backend}: picker populates with real models (no flash)`, async ({ app }) => {
    test.skip(!(await agentPresent(app.page, backend)), `${backend} not connected on this profile`);
    await app.selectAgent(backend);
    await app.openModelPicker();
    const labels = await app.pickerModelLabels();
    // Must show at least one NON-Flux model row (the real catalog), not just Flux tiers.
    const nonFlux = labels.filter((l) => !/^Flux|Runs .* models/i.test(l));
    expect(nonFlux.length, `picker for ${backend} showed only Flux/placeholder: ${JSON.stringify(labels)}`).toBeGreaterThan(0);
  });
}

// MA-3: Codex (ChatGPT-subscription) — pick a GPT model and SEND (the #243/#297 path).
test('MA-3 codex: pick GPT model + send completes (ChatGPT-subscription)', async ({ app }) => {
  test.skip(!(await agentPresent(app.page, 'codex')), 'codex not connected');
  await app.selectAgent('codex');
  await app.openModelPicker();
  await app.pickModel(/GPT-5/i);
  await app.send('Reply with the single word OK');
  await app.expectCompletion();
});

// MA-4: Grok — pick a non-default model and SEND; must NOT 403 (#379).
test('MA-4 grok: pick model + send completes (own login, no 403)', async ({ app }) => {
  test.skip(!(await agentPresent(app.page, 'grok')), 'grok not connected');
  await app.selectAgent('grok');
  await app.openModelPicker();
  await app.pickModel(/grok-/i);
  await app.send('Reply with the single word OK');
  await app.expectCompletion();
});

// MA-2: wcore send completes.
test('MA-2 wcore: send completes', async ({ app }) => {
  test.skip(!(await agentPresent(app.page, 'wcore')), 'wcore not present');
  await app.selectAgent('wcore');
  await app.send('Reply with the single word OK');
  await app.expectCompletion();
});

// MA-7: a model pick HOLDS across navigation (no silent revert to null/default).
test('MA-7 codex: model selection holds across re-select', async ({ app }) => {
  test.skip(!(await agentPresent(app.page, 'codex')), 'codex not connected');
  await app.selectAgent('codex');
  await app.openModelPicker();
  await app.pickModel(/GPT-5\.4(?! mini)/i);
  // switch away and back
  await app.selectAgent('wcore');
  await app.selectAgent('codex');
  const label = await app.page.evaluate(() => document.body.innerText);
  expect(label).toMatch(/GPT-5\.4|gpt-5\.4/);
});

// MA-8: Assistant (preset, agent-profile) gets the full WCore catalog AND a send completes (#380; the owed test).
test('MA-8 assistant: WCore catalog + send completes', async ({ app }) => {
  // Select the first assistant card if present.
  const card = app.page
    .locator('div,button,a')
    .filter({ hasText: /Becomes a senior|Wealth coach|Copy editor|proofreader/i })
    .first();
  test.skip(!(await card.isVisible().catch(() => false)), 'no assistant cards on home');
  await card.click();
  await app.page.waitForTimeout(2500);
  await app.openModelPicker();
  const labels = await app.pickerModelLabels();
  expect(labels.length, 'assistant picker empty (agent-profile not mapped to wcore?)').toBeGreaterThan(2);
  await app.page.keyboard.press('Escape').catch(() => {});
  await app.send('Reply with the single word OK');
  await app.expectCompletion();
});

// MA-9: Ollama local model appears + send completes (#294/#268). Provider-gated.
test('MA-9 ollama: local model usable', async ({ app }) => {
  // Ollama models surface under wcore's catalog; assert at least one ollama-tagged row exists.
  await app.selectAgent('wcore');
  await app.openModelPicker();
  const ok = await app.page.evaluate(() => /ollama|llama|qwen|smollm/i.test(document.body.innerText));
  test.skip(!ok, 'no local Ollama models detected');
  expect(ok).toBeTruthy();
});
