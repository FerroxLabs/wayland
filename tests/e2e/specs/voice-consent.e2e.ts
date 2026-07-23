/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * E2E: hosted-voice consent gate (B-01 / VOC-03).
 *
 * The Voice settings page (`#/settings/voice`) offers hosted TTS/STT providers
 * (OpenAI, Deepgram, Flux) that send audio/text off the device. Selecting one
 * must surface a disclosure the user has to accept BEFORE the selection sticks,
 * and the acknowledgment must persist. This spec drives that flow against the
 * packaged renderer:
 *
 *   1. Switching TTS to a hosted provider opens the disclosure (fail-closed:
 *      the provider does NOT change until the user accepts).
 *   2. Cancelling leaves the provider on the local default — the hosted route
 *      never activates without consent.
 *   3. Accepting switches the provider AND persists consent: after a remount
 *      the provider stays hosted with no lingering "review consent" prompt,
 *      which only hides when `tools.voiceHostedConsent` was actually written.
 *
 * The consent modal + affordance test hooks live in ToolsModalContent /
 * useHostedVoiceConsent (voice-consent-accept/cancel, tts-consent-pending).
 */
import { test, expect } from '../fixtures';
import { navigateTo, waitForSettle } from '../helpers';
import type { Page } from '@playwright/test';

const TTS_SELECT = '[data-testid="tts-provider-select"]';
const CONSENT_MODAL = '.hosted-voice-consent-modal';
const CONSENT_ACCEPT = '[data-testid="voice-consent-accept"]';
const CONSENT_CANCEL = '[data-testid="voice-consent-cancel"]';
const TTS_CONSENT_PENDING = '[data-testid="tts-consent-pending"]';

/** The label text shown in a select's closed value box. */
async function selectedText(page: Page, selectSelector: string): Promise<string> {
  return (await page.locator(`${selectSelector} .arco-select-view-value`).first().textContent())?.trim() ?? '';
}

/** Open the TTS provider select and click the option whose text matches. */
async function openTtsAndPick(page: Page, optionText: string): Promise<void> {
  await page.locator(TTS_SELECT).click();
  const option = page.locator('.arco-select-option', { hasText: optionText });
  await option.first().waitFor({ state: 'visible', timeout: 5_000 });
  await option.first().click();
}

test.describe('hosted-voice consent gate (B-01 / VOC-03)', () => {
  test('cancelling the hosted-voice disclosure fails closed — provider does not switch', async ({ page }) => {
    await navigateTo(page, '#/settings/voice');
    await waitForSettle(page, 4000);

    // The TTS provider select renders; its default is the local provider.
    await expect(page.locator(TTS_SELECT)).toBeVisible();
    const initial = await selectedText(page, TTS_SELECT);
    expect(initial.toLowerCase()).not.toContain('openai');

    // Switching to a hosted provider must open the disclosure — the selection
    // does not commit yet.
    await openTtsAndPick(page, 'OpenAI Speech');
    await expect(page.locator(CONSENT_MODAL)).toBeVisible();

    // The disclosure is honest about what leaves the device and where.
    const modalText = (await page.locator(CONSENT_MODAL).textContent())?.toLowerCase() ?? '';
    expect(modalText).toContain('off your device');
    expect(modalText).toContain('openai');
    expect(modalText).toContain('api.openai.com');

    // Decline: the hosted route must NOT activate.
    await page.locator(CONSENT_CANCEL).click();
    await expect(page.locator(CONSENT_MODAL)).toBeHidden();

    // Fail-closed: the provider is still the local default, not OpenAI.
    const afterCancel = await selectedText(page, TTS_SELECT);
    expect(afterCancel).toBe(initial);
    expect(afterCancel.toLowerCase()).not.toContain('openai');
  });

  test('accepting the disclosure switches the provider and persists across a remount', async ({ page }) => {
    await navigateTo(page, '#/settings/voice');
    await waitForSettle(page, 4000);

    await openTtsAndPick(page, 'OpenAI Speech');
    await expect(page.locator(CONSENT_MODAL)).toBeVisible();

    // Accept the disclosure.
    await page.locator(CONSENT_ACCEPT).click();
    await expect(page.locator(CONSENT_MODAL)).toBeHidden();

    // Provider now committed to the hosted choice, and the "review consent"
    // affordance is gone (consent recorded for this provider).
    await expect
      .poll(async () => (await selectedText(page, TTS_SELECT)).toLowerCase(), { timeout: 5_000 })
      .toContain('openai');
    await expect(page.locator(TTS_CONSENT_PENDING)).toHaveCount(0);

    // Remount the page (navigate away and back) to prove persistence: the
    // provider reloads as OpenAI AND stays consented. If consent had NOT been
    // written to config, needsConsent(openai) would be true on reload and the
    // tts-consent-pending affordance WOULD render — so its absence is the proof.
    await navigateTo(page, '#/settings/models');
    await waitForSettle(page, 2000);
    await navigateTo(page, '#/settings/voice');
    await waitForSettle(page, 4000);

    await expect(page.locator(TTS_SELECT)).toBeVisible();
    expect((await selectedText(page, TTS_SELECT)).toLowerCase()).toContain('openai');
    await expect(page.locator(TTS_CONSENT_PENDING)).toHaveCount(0);
  });
});
