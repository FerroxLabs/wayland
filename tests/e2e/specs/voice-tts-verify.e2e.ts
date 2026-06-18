/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * TEMPORARY verification spec for the Kokoro TTS work - drives the real
 * Settings > Voice UI and observes audio playback, error toasts, and the
 * Install/Installing button behaviour. Not intended for CI (requires local
 * Kokoro assets); delete after verification.
 */
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '../fixtures';
import { navigateTo } from '../helpers';

declare global {
  interface Window {
    __audioEvents?: Array<Record<string, unknown>>;
    __speechSynthCalls?: number;
  }
}

const DEV_PROFILE = path.join(process.env.HOME ?? '', 'Library/Application Support/Wayland-Dev');

// These specs drive the real local TTS engines (Kokoro + Piper) and require
// their models/uv installed in a Wayland profile - they are NOT runnable in
// CI. Skip the whole suite unless the assets exist locally (or
// WAYLAND_VOICE_E2E=1 forces it). macOS-only (system-native `say`).
const KOKORO_ASSETS_PRESENT =
  process.platform === 'darwin' &&
  (fs.existsSync(path.join(DEV_PROFILE, 'voice/kokoro/kokoro-v1.0.onnx')) ||
    process.env.WAYLAND_VOICE_E2E === '1');

test.describe('TTS voice verification', () => {
  test.skip(!KOKORO_ASSETS_PRESENT, 'local TTS assets not installed (Kokoro/Piper) - local-only verification spec');
  test.setTimeout(420_000);

  test('kokoro end-to-end: test voice, reset on provider change, error toast, install button', async ({
    electronApp,
    page,
  }) => {
    // ── Step 0: which profile is this app using, and is Kokoro installed there?
    const userData = await electronApp.evaluate(({ app }) => app.getPath('userData'));
    console.log('[verify] userData:', userData);

    const modelPath = path.join(userData, 'voice/kokoro/kokoro-v1.0.onnx');
    const voicesPath = path.join(userData, 'voice/kokoro/voices-v1.0.bin');
    const uvPath = path.join(userData, 'voice/bin/darwin-arm64/uv');
    if (!fs.existsSync(modelPath) && fs.existsSync(path.join(DEV_PROFILE, 'voice/kokoro/kokoro-v1.0.onnx'))) {
      console.log('[verify] copying Kokoro assets from Wayland-Dev profile');
      fs.mkdirSync(path.dirname(modelPath), { recursive: true });
      fs.mkdirSync(path.dirname(uvPath), { recursive: true });
      fs.copyFileSync(path.join(DEV_PROFILE, 'voice/kokoro/kokoro-v1.0.onnx'), modelPath);
      fs.copyFileSync(path.join(DEV_PROFILE, 'voice/kokoro/voices-v1.0.bin'), voicesPath);
      fs.copyFileSync(path.join(DEV_PROFILE, 'voice/bin/darwin-arm64/uv'), uvPath);
      fs.chmodSync(uvPath, 0o755);
    }
    console.log('[verify] kokoro assets present:', fs.existsSync(modelPath), fs.existsSync(voicesPath), fs.existsSync(uvPath));

    // ── Step 1: navigate to Settings > Voice and instrument audio APIs
    const goToVoice = async () => {
      try {
        await navigateTo(page, '#/settings/voice');
      } catch {
        // sider item not visible (flaky render) - navigate by hash directly
        await page.evaluate(() => window.location.assign('#/settings/voice'));
        await page.waitForFunction(() => window.location.hash.includes('/settings/voice'), undefined, {
          timeout: 10_000,
        });
      }
      await page.waitForTimeout(800);
    };
    await goToVoice();
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      window.__audioEvents = [];
      window.__speechSynthCalls = 0;
      const origPlay = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function (...args: []) {
        const el = this as HTMLMediaElement;
        window.__audioEvents?.push({ type: 'play-called', at: Date.now() });
        el.addEventListener('playing', () =>
          window.__audioEvents?.push({ type: 'playing', duration: el.duration, at: Date.now() }));
        el.addEventListener('ended', () =>
          window.__audioEvents?.push({ type: 'ended', duration: el.duration, at: Date.now() }));
        el.addEventListener('error', () => window.__audioEvents?.push({ type: 'element-error', at: Date.now() }));
        return origPlay.apply(this, args).then(
          (r) => { window.__audioEvents?.push({ type: 'play-resolved', at: Date.now() }); return r; },
          (e) => { window.__audioEvents?.push({ type: 'play-rejected', message: String(e), at: Date.now() }); throw e; },
        );
      };
      const origSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
      window.speechSynthesis.speak = (u) => {
        window.__speechSynthCalls = (window.__speechSynthCalls ?? 0) + 1;
        return origSpeak(u);
      };
    });

    // The TTS provider row: the select that sits next to the Test voice/Install button.
    const ttsRow = page.locator('div.flex.items-center.gap-8px', {
      has: page.getByRole('button', { name: /Test voice|Install/ }),
    }).first();
    const ttsSelect = ttsRow.locator('.arco-select').first();
    const ttsButton = ttsRow.locator('button').first();
    await expect(ttsSelect).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: 'tests/e2e/results/verify-1-voice-page.png' });

    const selectProvider = async (optionText: RegExp) => {
      await ttsSelect.click();
      const option = page.locator('.arco-select-option', { hasText: optionText }).first();
      await option.waitFor({ state: 'visible', timeout: 10_000 });
      await option.click();
      await page.waitForTimeout(400);
    };

    // ── Step 2: select Kokoro (installed) and run Test voice
    await selectProvider(/Kokoro/);
    await expect(ttsButton).toHaveText(/Test voice/, { timeout: 15_000 });
    await page.screenshot({ path: 'tests/e2e/results/verify-2-kokoro-selected.png' });

    await ttsButton.click();
    // synthesis can take a while cold; wait for audio events
    await page.waitForFunction(
      () => (window.__audioEvents ?? []).some((e) => e.type === 'ended' || e.type === 'play-rejected' || e.type === 'element-error'),
      undefined,
      { timeout: 180_000 },
    );
    const events1 = await page.evaluate(() => window.__audioEvents);
    console.log('[verify] kokoro audio events:', JSON.stringify(events1));
    const toasts1 = await page.locator('.arco-message').allTextContents();
    console.log('[verify] toasts after kokoro test:', JSON.stringify(toasts1));
    expect(events1?.some((e) => e.type === 'playing')).toBe(true);
    expect(events1?.some((e) => e.type === 'ended')).toBe(true);
    expect(events1?.some((e) => e.type === 'play-rejected')).toBe(false);
    // button returns to idle
    await expect(ttsButton).toBeEnabled({ timeout: 10_000 });
    await page.screenshot({ path: 'tests/e2e/results/verify-3-after-test.png' });

    // ── Step 3 (probe): provider change mid-test resets the pending test
    await page.evaluate(() => { window.__audioEvents = []; });
    await ttsButton.click(); // kicks off a fresh kokoro synthesis
    // Switch almost immediately: the warm worker answers in ~200 ms, so any
    // longer wait lets the synthesis legitimately finish and play first.
    await page.waitForTimeout(50);
    await selectProvider(/System Native/);
    // loading must clear promptly even though synthesis is still in flight
    await expect(ttsButton).toBeEnabled({ timeout: 5_000 });
    await expect(ttsButton).toHaveText(/Test voice/);
    // The warm worker can finish synthesis (~200 ms) before the dropdown
    // interaction lands, so playback MAY legitimately start - but the reset
    // must stop it: the clip (>1 s) must never play to completion ('ended'),
    // whether it was dropped pre-play (stale token) or paused mid-play.
    await page.waitForTimeout(12_000);
    const events2 = await page.evaluate(() => window.__audioEvents);
    console.log('[verify] events after mid-test provider switch:', JSON.stringify(events2));
    expect(events2?.some((e) => e.type === 'ended')).toBe(false);
    await page.screenshot({ path: 'tests/e2e/results/verify-4-after-switch-reset.png' });

    // ── Step 4 (probe): system-native test uses speechSynthesis
    await ttsButton.click();
    await page.waitForTimeout(1500);
    const synthCalls = await page.evaluate(() => window.__speechSynthCalls);
    console.log('[verify] speechSynthesis.speak calls:', synthCalls);
    expect(synthCalls).toBeGreaterThan(0);
    await page.evaluate(() => window.speechSynthesis.cancel());

    // ── Step 5 (probe): missing model no longer errors - the CHAIN falls back
    // to system-native and still speaks (chain-exhaustion error toasts are
    // covered by the voiceSynthBridge unit tests).
    fs.renameSync(modelPath, `${modelPath}.bak`);
    try {
      await selectProvider(/Kokoro/);
      // section still believes kokoro is installed (probe ran at mount)
      await expect(ttsButton).toHaveText(/Test voice/, { timeout: 10_000 });
      await page.evaluate(() => { window.__audioEvents = []; });
      await ttsButton.click();
      await page.waitForFunction(
        () => (window.__audioEvents ?? []).some((e) => e.type === 'ended'),
        undefined,
        { timeout: 30_000 },
      );
      const toastCount = await page.locator('.arco-message', { hasText: /Voice test failed/ }).count();
      expect(toastCount).toBe(0);
      console.log('[verify] missing model fell back to system-native, no error toast');
      await expect(ttsButton).toBeEnabled({ timeout: 5_000 });
      await page.screenshot({ path: 'tests/e2e/results/verify-5-chain-fallback.png' });

      // ── Step 6: uninstalled state - dropdown label + Install/Installing button
      // leave and re-enter the page so the install probe re-runs
      await page.evaluate(() => window.location.assign('#/settings/display'));
      await page.waitForTimeout(500);
      await goToVoice();
      const ttsRow2 = page.locator('div.flex.items-center.gap-8px', {
        has: page.getByRole('button', { name: /Test voice|Install/ }),
      }).first();
      const ttsButton2 = ttsRow2.locator('button').first();
      await expect(ttsButton2).toHaveText(/Install/, { timeout: 15_000 });
      const selectText = await ttsRow2.locator('.arco-select').first().textContent();
      console.log('[verify] uninstalled dropdown label:', selectText);
      expect(selectText).toContain('Download Model');
      await page.screenshot({ path: 'tests/e2e/results/verify-6-install-button.png' });

      // click Install -> button flips to Installing…, setup row shows progress
      await ttsButton2.click();
      await expect(ttsButton2).toHaveText(/Installing/, { timeout: 10_000 });
      await page.screenshot({ path: 'tests/e2e/results/verify-7-installing.png' });
      // cancel the (re)download - we already have the assets
      const cancelBtn = page.getByRole('button', { name: /Cancel/i }).first();
      await cancelBtn.click({ timeout: 10_000 });
      await expect(ttsButton2).toHaveText(/Install/, { timeout: 10_000 });
    } finally {
      if (fs.existsSync(`${modelPath}.bak`)) fs.renameSync(`${modelPath}.bak`, modelPath);
    }

    // ── Step 7: back to installed state - Test voice works again
    await page.evaluate(() => window.location.assign('#/settings/display'));
    await page.waitForTimeout(500);
    await goToVoice();
    const ttsRow3 = page.locator('div.flex.items-center.gap-8px', {
      has: page.getByRole('button', { name: /Test voice|Install/ }),
    }).first();
    const ttsButton3 = ttsRow3.locator('button').first();
    await expect(ttsButton3).toHaveText(/Test voice/, { timeout: 15_000 });
    await page.screenshot({ path: 'tests/e2e/results/verify-8-restored.png' });
  });

  test('phase 0: warm-worker latency, chain fallback, piper multilingual', async ({ electronApp, page }) => {
    const userData = await electronApp.evaluate(({ app }) => app.getPath('userData'));
    const modelPath = path.join(userData, 'voice/kokoro/kokoro-v1.0.onnx');
    const logFile = path.join(process.env.HOME ?? '', 'Library/Logs/Wayland-Dev', `${new Date().toISOString().slice(0, 10)}.log`);

    await page.evaluate(() => window.location.assign('#/settings/voice'));
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
      window.__audioEvents = [];
      const origPlay = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function (...args: []) {
        const el = this as HTMLMediaElement;
        el.addEventListener('playing', () =>
          window.__audioEvents?.push({ type: 'playing', at: Date.now() }));
        el.addEventListener('ended', () => window.__audioEvents?.push({ type: 'ended', at: Date.now() }));
        return origPlay.apply(this, args);
      };
    });

    const ttsRow = page.locator('div.flex.items-center.gap-8px', {
      has: page.getByRole('button', { name: /Test voice|Install/ }),
    }).first();
    const ttsSelect = ttsRow.locator('.arco-select').first();
    const ttsButton = ttsRow.locator('button').first();
    const selectProvider = async (optionText: RegExp) => {
      await ttsSelect.click();
      const option = page.locator('.arco-select-option', { hasText: optionText }).first();
      await option.waitFor({ state: 'visible', timeout: 10_000 });
      await option.click();
      await page.waitForTimeout(400);
    };
    const runTest = async (): Promise<{ clickAt: number; playingAt: number }> => {
      const clickAt = await page.evaluate(() => {
        window.__audioEvents = [];
        return Date.now();
      });
      await ttsButton.click();
      await page.waitForFunction(
        () => (window.__audioEvents ?? []).some((e) => e.type === 'ended'),
        undefined,
        { timeout: 120_000 },
      );
      const playingAt = await page.evaluate(
        () => (window.__audioEvents ?? []).find((e) => e.type === 'playing')?.at as number,
      );
      return { clickAt, playingAt };
    };

    // ── 1. Warm-worker latency: second kokoro synthesis must be much faster.
    await selectProvider(/Kokoro/);
    await expect(ttsButton).toHaveText(/Test voice/, { timeout: 15_000 });
    const cold = await runTest();
    const coldMs = cold.playingAt - cold.clickAt;
    const warm = await runTest();
    const warmMs = warm.playingAt - warm.clickAt;
    console.log('[verify] kokoro click→playing: cold', coldMs, 'ms, warm', warmMs, 'ms');
    // Warm synthesis is near-real-time. (Not asserting warm < cold: tests share
    // one app instance, so a prior test may have already warmed the worker,
    // making this run's "cold" call warm too - the invariant that matters is
    // that the warm path is fast.)
    expect(warmMs).toBeLessThan(700);

    // ── 2. Chain fallback: kokoro unavailable → system-native floor still speaks.
    fs.renameSync(modelPath, `${modelPath}.bak`);
    try {
      const fallback = await runTest(); // chain [kokoro, system-native]: skip → say
      expect(fallback.playingAt).toBeGreaterThan(0);
      const logTail = fs.readFileSync(logFile, 'utf8').slice(-20_000);
      expect(logTail).toContain('[voice-chain] skip');
      console.log('[verify] fallback played via system-native; chain skip logged');
    } finally {
      fs.renameSync(`${modelPath}.bak`, modelPath);
    }

    // ── 3. Piper: multilingual local engine + warm-worker latency (assets pre-installed).
    await selectProvider(/Piper/);
    await expect(ttsButton).toHaveText(/Test voice/, { timeout: 15_000 });
    const piperCold = await runTest();
    const piperColdMs = piperCold.playingAt - piperCold.clickAt;
    const piperWarm = await runTest();
    const piperWarmMs = piperWarm.playingAt - piperWarm.clickAt;
    console.log('[verify] piper click→playing: cold', piperColdMs, 'ms, warm', piperWarmMs, 'ms');
    expect(piperWarm.playingAt).toBeGreaterThan(0);
    expect(piperWarmMs).toBeLessThan(700); // warm worker → near-real-time (see kokoro note above)
    const logTail2 = fs.readFileSync(logFile, 'utf8').slice(-20_000);
    expect(logTail2).toMatch(/\[voice-chain\] ok.*piper-local/);
    await page.screenshot({ path: 'tests/e2e/results/verify-9-phase0.png' });
  });

  test('phase 1: voice settings wiring - pronunciation persist + preview through new config', async ({
    electronApp,
    page,
  }) => {
    // Verifies the Phase 1 renderer code loads without crashing the settings
    // view, and that the pronunciation field persists + previews through the
    // chain-aware speak path (useTtsConfig + PronunciationField + playAudioClip).
    // The conversation-side control + auto-read decision logic are covered by
    // the passing unit suites (SpeakRepliesControl, useAutoReadReplies,
    // useVoiceChatPrefs); driving a real assistant turn needs a configured
    // model backend not present in this profile.
    const uncaught: string[] = [];
    page.on('pageerror', (err) => uncaught.push(String(err)));

    await page.evaluate(() => window.location.assign('#/settings/voice'));
    await page.waitForFunction(() => window.location.hash.includes('/settings/voice'), undefined, { timeout: 10_000 });
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
      window.__audioEvents = [];
      const origPlay = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function (...args: []) {
        const el = this as HTMLMediaElement;
        el.addEventListener('playing', () => window.__audioEvents?.push({ type: 'playing', at: Date.now() }));
        el.addEventListener('ended', () => window.__audioEvents?.push({ type: 'ended', at: Date.now() }));
        return origPlay.apply(this, args);
      };
    });

    // Pronunciation field present (proves PronunciationField mounted in VoiceSettings).
    const pronInput = page.locator('input[aria-label="Name pronunciation"]');
    await expect(pronInput).toBeVisible({ timeout: 15_000 });

    // Type a respelling - it persists to user.spokenName via ConfigStorage.
    const userData = await electronApp.evaluate(({ app }) => app.getPath('userData'));
    const configFile = path.join(userData, 'config', 'wayland-config.txt');
    const readSpokenName = (): string | null => {
      try {
        const raw = fs.readFileSync(configFile, 'utf8');
        const json = JSON.parse(decodeURIComponent(Buffer.from(raw, 'base64').toString('utf8')));
        return json['user.spokenName'] ?? null;
      } catch {
        return null;
      }
    };
    await pronInput.fill('pronounce-test-XYZ');
    // Poll the persisted config until the write lands (ConfigStorage.set is async).
    await expect.poll(() => readSpokenName(), { timeout: 8000 }).toBe('pronounce-test-XYZ');
    console.log('[verify] persisted user.spokenName:', readSpokenName());

    // Preview synthesizes the spoken name through the chain + plays it.
    const previewBtn = page.getByRole('button', { name: /Preview/i }).first();
    await previewBtn.click();
    await page.waitForFunction(
      () => (window.__audioEvents ?? []).some((e) => e.type === 'ended'),
      undefined,
      { timeout: 60_000 },
    );
    console.log('[verify] pronunciation preview played to completion');
    await page.screenshot({ path: 'tests/e2e/results/verify-10-phase1.png' });

    expect(uncaught).toEqual([]); // no renderer crashes from Phase 1 code
  });
});
