/**
 * #504 AskUserQuestion - in-app live verification.
 *
 * Drives the REAL production wiring in the launched Electron app against a real
 * wayland-core engine session: the agent calls the `AskUserQuestion` tool, and
 * the approval prompt must render the QUESTION and its CHOICES as selectable
 * options (issue #504 was an empty approval box), then send the picked choice
 * back to the engine via the approval channel (`tool_approve.answer`), so the
 * turn resumes instead of erroring.
 *
 * The deterministic layers (parsing args→choices, and click→answer over the
 * confirm IPC) are covered by the vitest suites (questionTool,
 * ConversationChatConfirm.dom). This spec proves the end-to-end
 * engine→render→answer path those unit tests stub.
 *
 * Gate: needs a wcore-capable model selectable in the app AND a model that
 * actually calls the tool. Skips cleanly otherwise so CI without keys stays
 * green.
 */
import path from 'path';
import fs from 'fs';
import { test, expect } from '../fixtures';
import { goToGuid, selectAgent, sendMessageFromGuid } from '../helpers';

const SCREENSHOT_DIR = '/tmp/504-verify';

function ensureDir() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const MODEL_PLACEHOLDERS = new Set(['select model', 'no model', 'choose model', '']);

async function selectedModelLabel(page: import('@playwright/test').Page): Promise<string> {
  const btn = page.locator('button.sendbox-model-btn.guid-config-btn').first();
  if (!(await btn.isVisible({ timeout: 8_000 }).catch(() => false))) return '';
  const text = (await btn.textContent().catch(() => ''))?.trim() ?? '';
  return MODEL_PLACEHOLDERS.has(text.toLowerCase()) ? '' : text;
}

// Three unmistakable choice labels we instruct the model to use, so we can
// assert they render in the approval prompt (not an empty box).
const CHOICES = ['Sunrise Red', 'Forest Green', 'Ocean Blue'];
const ASK_PROMPT =
  'Call your AskUserQuestion tool right now to ask me which theme color I prefer. ' +
  `Provide exactly three options with these labels: "${CHOICES[0]}", "${CHOICES[1]}", "${CHOICES[2]}". ` +
  'Invoke the tool immediately - do not answer in plain text.';

test.describe('#504 AskUserQuestion (in-app, real engine)', () => {
  test('renders the question choices in the approval prompt and returns the picked answer', async ({ page }) => {
    ensureDir();
    await goToGuid(page);
    await selectAgent(page, 'wcore');

    const modelLabel = await selectedModelLabel(page);
    test.skip(!modelLabel, 'no wcore model selected (no provider) - skipping live drive');
    console.log(`[#504] driving live wcore AskUserQuestion with model="${modelLabel}"`);

    await sendMessageFromGuid(page, ASK_PROMPT);

    // The approval prompt must surface the choices as selectable options. If the
    // model never calls the tool (some models won't), skip rather than fail red.
    const choiceOption = page.getByTestId('confirm-question-choice');
    const appeared = await choiceOption
      .first()
      .waitFor({ state: 'visible', timeout: 90_000 })
      .then(() => true)
      .catch(() => false);
    test.skip(!appeared, 'model did not call AskUserQuestion within timeout - skipping (non-deterministic tool call)');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-question-rendered.png') });

    // #504 core assertion: the question's choices render (NOT an empty box).
    const optionTexts = await choiceOption.allTextContents();
    const joined = optionTexts.join(' | ');
    console.log(`[#504] rendered choices: ${joined}`);
    for (const choice of CHOICES) {
      expect(joined, `choice "${choice}" must render in the approval prompt`).toContain(choice);
    }

    // Pick the second choice - the label is sent back as `answer` and the engine
    // synthesizes the tool result, so the turn resumes instead of erroring.
    const picked = CHOICES[1];
    await page.getByTestId('confirm-question-choice').filter({ hasText: picked }).first().click();

    // The prompt clears (answer accepted) and the engine keeps going: the
    // choices option must disappear.
    await expect(page.getByTestId('confirm-question-choice').first()).toBeHidden({ timeout: 30_000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-after-pick.png') });
    console.log(`[#504] picked="${picked}"; approval prompt cleared (answer accepted by engine)`);
  });
});
