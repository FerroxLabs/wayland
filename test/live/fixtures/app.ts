/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Live-verification fixture: attaches Playwright to an ALREADY-RUNNING Wayland
 * dev/packaged app over CDP, so tests run against the operator's REAL connected
 * profile (ChatGPT-subscription, Grok OAuth, Ollama, etc.). We deliberately do
 * NOT use `_electron.launch()` — that starts a fresh app with an empty profile
 * and no provider auth, which cannot exercise the live-provider paths this suite
 * exists to verify.
 *
 * Cross-platform: the only OS-specific bit is the CDP URL, taken from
 * `WAYLAND_CDP_URL` (default http://127.0.0.1:9222). On the Windows box the app
 * is typically on :9340 — set `WAYLAND_CDP_URL=http://127.0.0.1:9340`. Launching
 * the app is the operator's job (see test/live/README.md); the harness only
 * connects.
 */
import { test as base, expect, type Browser, type Page } from '@playwright/test';
import { chromium } from '@playwright/test';

const CDP_URL = process.env.WAYLAND_CDP_URL ?? 'http://127.0.0.1:9222';

/** Find the main renderer page (vite dev serves localhost:5173; packaged serves a file/app URL). */
function pickRendererPage(browser: Browser): Page {
  for (const ctx of browser.contexts()) {
    const pages = ctx.pages();
    const dev = pages.find((p) => /localhost:5173|127\.0\.0\.1:5173/.test(p.url()));
    if (dev) return dev;
    const app = pages.find((p) => /#\/(guid|conversation)|index\.html|app:\/\//.test(p.url()));
    if (app) return app;
    if (pages[0]) return pages[0];
  }
  throw new Error(`No renderer page found at ${CDP_URL}. Is the app running with remote debugging on that port?`);
}

export type AppHelpers = {
  page: Page;
  /** Go to a fresh New Chat / home so each test is independent. */
  newChat: () => Promise<void>;
  /** Click an agent pill by backend key (codex, grok, wcore, gemini, claude, ...). */
  selectAgent: (backend: string) => Promise<void>;
  /** Open the composer "Default Model" picker. */
  openModelPicker: () => Promise<void>;
  /** Read the model option labels currently rendered in the open picker. */
  pickerModelLabels: () => Promise<string[]>;
  /** Pick a model whose visible label matches `re` (ACP menu or provider panel). */
  pickModel: (re: RegExp) => Promise<void>;
  /** Type into the composer and send (Enter). Returns the new conversation hash if it navigates. */
  send: (text: string) => Promise<void>;
  /** Assert the visible chat shows no error banner within `timeoutMs`. */
  expectNoError: (timeoutMs?: number) => Promise<void>;
  /** Wait until an assistant reply text is present (a non-error completion). */
  expectCompletion: (timeoutMs?: number) => Promise<void>;
};

const ERROR_RE = /403|Forbidden|bad-credentials|could not be validated|Internal error|Something went wrong|noModelConfigured|Failed to create/i;

export const test = base.extend<{ app: AppHelpers }>({
  app: async ({}, use) => {
    const browser = await chromium.connectOverCDP(CDP_URL);
    const page = pickRendererPage(browser);

    const helpers: AppHelpers = {
      page,
      newChat: async () => {
        // Prefer the explicit New Chat affordance; fall back to hash nav.
        const nc = page.getByText(/^New Chat$/).first();
        if (await nc.isVisible().catch(() => false)) await nc.click();
        else await page.evaluate(() => (location.hash = '#/guid'));
        await page.waitForFunction(() => document.querySelectorAll('[data-agent-backend]').length > 0, null, {
          timeout: 30_000,
        });
      },
      selectAgent: async (backend) => {
        const pill = page.locator(`[data-agent-backend="${backend}"]`).first();
        await pill.click();
        // let the model state settle (cache paints synchronously; fetch revalidates)
        await page.waitForTimeout(1500);
      },
      openModelPicker: async () => {
        const btn = page
          .locator('button, [role="button"]')
          .filter({ hasText: /Default Model|gpt-|grok-|claude-|gemini-|Flux/i })
          .first();
        await btn.click();
        await page.waitForTimeout(500);
      },
      pickerModelLabels: async () => {
        return page.evaluate(() => {
          const rows = [
            ...document.querySelectorAll('[role="menuitem"], .arco-menu-item, [data-model-row]'),
          ].filter((e) => (e as HTMLElement).getBoundingClientRect().width > 0);
          return rows.map((e) => (e.textContent ?? '').trim()).filter(Boolean);
        });
      },
      pickModel: async (re) => {
        const row = page
          .locator('[role="menuitem"], .arco-menu-item, [data-model-row]')
          .filter({ hasText: re })
          .first();
        await row.click();
        await page.waitForTimeout(800);
      },
      send: async (text) => {
        const ta = page.locator('textarea').first();
        await ta.click();
        await ta.fill(text);
        await ta.press('Enter');
      },
      expectNoError: async (timeoutMs = 20_000) => {
        // Poll: fail fast if an error banner appears.
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
          const txt = await page.evaluate(() => document.body.innerText);
          expect(txt, 'an error banner appeared in the chat').not.toMatch(ERROR_RE);
          await page.waitForTimeout(1000);
        }
      },
      expectCompletion: async (timeoutMs = 60_000) => {
        await page.waitForFunction(
          () => {
            const t = document.body.innerText;
            if (/403|Forbidden|could not be validated|Internal error|Something went wrong/i.test(t)) {
              throw new Error('error banner during completion: ' + t.slice(0, 300));
            }
            // a rendered assistant turn (orbit avatar + non-empty text after the user bubble)
            return document.querySelectorAll('[data-message-role="assistant"], .assistant-message').length > 0 || /Thought for/i.test(t);
          },
          null,
          { timeout: timeoutMs, polling: 1000 }
        );
      },
    };

    await use(helpers);
    // Do not close the browser: it's the operator's running app.
  },
});

export { expect };
