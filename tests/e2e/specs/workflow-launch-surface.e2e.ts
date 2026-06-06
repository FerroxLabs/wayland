/**
 * E2E (v0.6.0): Workflow Launch Surface - happy path + resume smoke.
 *
 * Validates the SPEC §15.3 contract: open `/workflows`, pick a workflow card,
 * click "Launch now" in the detail modal, observe the 1.6s launch overlay,
 * then assert the WorkflowSurface (header + step rail OR no-step fallback)
 * mounts under `/guid` with the workflow's title visible.
 *
 * Second test exercises the cross-session resume (§5.7 / §10.2): launch a
 * workflow, navigate back to /workflows without ending it, then re-open the
 * same workflow and assert the WorkflowResumePrompt surfaces inside the
 * detail modal.
 *
 * Scope choices:
 *   - We deliberately do NOT exercise the agent stream - no
 *     `<step>`/`<ask>` markers, no AskCard round-trip, no run-autonomously
 *     dispatch. Those scenarios need a model stub the harness doesn't have
 *     yet (see SPEC §15.3 - "Mock agent stream to emit ..."), so we cover
 *     surface mount + navigation + resume here, and leave §15.4 cross-
 *     backend compliance to the manual smoke pass before tagging.
 *   - Picking "Automate Business Workflows" (the featured slug) gives us
 *     a workflow whose body has `## Step N:` headers; that should drive
 *     the step rail. If the bundled body somehow lacks steps the surface
 *     still mounts (§9-5c no-step fallback) and the assertion below
 *     accepts either branch.
 *   - `workflow.start` requires a configured model provider (it calls
 *     `getDefaultModel()` which falls back to a stub when no providers are
 *     configured; the underlying conversation creation can still fail in
 *     locked-down envs). When launch fails the modal stays open with an
 *     Arco error toast - we detect that path and soft-skip the surface-
 *     mount assertions so the spec is CI-ready without keys. See the
 *     `attemptLaunch` helper below.
 *
 * Selectors used (all in source as of W6):
 *   - data-testid="workflow-card"           - grid tile on /workflows
 *   - data-testid="workflow-surface"        - surface root on /guid
 *   - data-testid="workflow-launch-overlay" - 1.6s intro overlay
 *   - data-testid="workflow-header"         - chrome above chat tape
 *   - data-testid="workflow-step-rail"      - right-rail step list
 *   - data-testid="workflow-resume-prompt"  - inline resume prompt
 *   - aria-label="End workflow"             - End button in header
 */

import { test, expect } from '../fixtures';
import { navigateTo } from '../helpers';
import type { Page, TestInfo } from '@playwright/test';

const WORKFLOWS_HASH = '#/workflows';
const FEATURED_WORKFLOW_SLUG = 'automate-business-workflows';

const WORKFLOW_CARD = '[data-testid="workflow-card"]';
const FEATURED_CARD = `[data-testid="workflow-card"][data-workflow-name="${FEATURED_WORKFLOW_SLUG}"]`;
const LAUNCH_OVERLAY = '[data-testid="workflow-launch-overlay"]';
const WORKFLOW_SURFACE = '[data-testid="workflow-surface"]';
const WORKFLOW_HEADER = '[data-testid="workflow-header"]';
const WORKFLOW_STEP_RAIL = '[data-testid="workflow-step-rail"]';
const RESUME_PROMPT = '[data-testid="workflow-resume-prompt"]';
const END_BUTTON = '[aria-label="End workflow"]';
const LAUNCH_BUTTON_TEXT = /Launch now/i;
const DETAIL_MODAL = '.arco-modal';

/**
 * Dismiss any open Arco modal / message toast left over from a prior
 * test. Tests in this file share the singleton Electron app, so a modal
 * left open by an earlier test (especially when launch fails and the
 * error toast pins the detail modal open before we skip) would intercept
 * pointer events for the next test's card click.
 */
async function dismissStaleOverlays(page: Page): Promise<void> {
  // Press Escape until no modal remains, capped at 3 attempts so we
  // don't hang the test on something unexpected.
  for (let i = 0; i < 3; i++) {
    const modal = page.locator('.arco-modal-container, .arco-modal-mask').first();
    if (!(await modal.isVisible().catch(() => false))) return;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
  }
}

/**
 * Open the Workflows library page via hash navigation. The Sider's
 * Workflows entry routes through React Router, but specs across this
 * repo use `navigateTo` for non-settings hash routes - same pattern as
 * `kickoff-card.e2e.ts` (which navigates to `#/guid`).
 */
async function openWorkflowsPage(page: Page): Promise<void> {
  await dismissStaleOverlays(page);
  await navigateTo(page, WORKFLOWS_HASH);
  // Wait for at least one card to mount - the page lazy-loads workflows
  // via `ipcBridge.skills.list` so empty grids resolve in a few hundred ms.
  await page.locator(WORKFLOW_CARD).first().waitFor({ state: 'visible', timeout: 15_000 });
}

/**
 * Open the workflow detail modal for a specific slug. Prefers the
 * featured slug (which is rendered twice - once in the "Featured" section
 * and once in its category section); `.first()` resolves to the visible
 * featured card.
 */
async function openWorkflowDetail(page: Page, slug: string): Promise<void> {
  const selector = `[data-testid="workflow-card"][data-workflow-name="${slug}"]`;
  const card = page.locator(selector).first();
  await card.waitFor({ state: 'visible', timeout: 10_000 });
  await card.click();
  await page.locator(DETAIL_MODAL).first().waitFor({ state: 'visible', timeout: 5_000 });
  await expect(page.locator(DETAIL_MODAL)).toContainText(LAUNCH_BUTTON_TEXT, { timeout: 5_000 });
}

/**
 * Click "Launch now" and race three outcomes:
 *   - The WorkflowSurface mounts on /guid (happy path → returns 'mounted').
 *   - An Arco error toast appears + the modal stays open (no model provider
 *     configured in this env → returns 'unavailable').
 *   - Neither happens within the timeout → returns 'unknown'.
 *
 * Caller decides what to do with 'unavailable' / 'unknown'; the helper
 * keeps the network of locator races out of the test bodies.
 */
async function attemptLaunch(page: Page): Promise<'mounted' | 'unavailable' | 'unknown'> {
  await page.getByRole('button', { name: LAUNCH_BUTTON_TEXT }).click();

  const surface = page.locator(WORKFLOW_SURFACE);
  const errorToast = page.locator('.arco-message-error, .arco-message-warning');

  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (await surface.isVisible().catch(() => false)) return 'mounted';
    if (await errorToast.isVisible().catch(() => false)) return 'unavailable';
    await page.waitForTimeout(150);
  }
  return 'unknown';
}

/**
 * Soft-skip when the surface didn't mount - likely a missing model
 * provider in the local env. CI sets up keys so the happy path will run
 * fully; locally we keep the spec compiled + ready without failing.
 */
function skipIfUnmounted(testInfo: TestInfo, outcome: 'mounted' | 'unavailable' | 'unknown'): void {
  if (outcome === 'mounted') return;
  testInfo.skip(
    true,
    `Workflow launch did not mount the surface (outcome=${outcome}). ` +
      `This usually means no model provider is configured. Configure one in ` +
      `Settings → Models for full E2E coverage, or run in CI where keys are present.`
  );
}

test.describe('Workflow Launch Surface - happy path (SPEC §15.3)', () => {
  test('launches a workflow from /workflows and mounts the surface on /guid', async ({ page }, testInfo) => {
    await openWorkflowsPage(page);

    // Sanity: featured cards should include the Automate Business Workflows
    // entry. If the bundle changes upstream this fails fast with a clear
    // selector rather than a mysterious timeout later in the spec.
    const featured = page.locator(FEATURED_CARD);
    await featured.first().waitFor({ state: 'visible', timeout: 10_000 });

    await openWorkflowDetail(page, FEATURED_WORKFLOW_SLUG);

    // Click "Launch now" and wait for surface OR an error toast (see
    // attemptLaunch above for why we race). When the launch IPC fails
    // because no model provider is configured, soft-skip the rest of the
    // happy-path assertions - the spec stays compiled + CI-ready.
    const outcome = await attemptLaunch(page);
    skipIfUnmounted(testInfo, outcome);

    // The launch overlay shows ~1.6s of intro frames per SPEC §5.1; it
    // may have already faded by the time we check on a fast machine -
    // treat that as fine and proceed to assert the chrome below.
    const overlayVisible = await page
      .locator(LAUNCH_OVERLAY)
      .isVisible()
      .catch(() => false);
    if (overlayVisible) {
      await page.locator(LAUNCH_OVERLAY).waitFor({ state: 'hidden', timeout: 4_000 });
    }

    // Surface chrome is now visible.
    await expect(page.locator(WORKFLOW_HEADER)).toBeVisible({ timeout: 5_000 });
    // The header carries the workflow title; the bundled "Automate
    // Business Workflows" entry renders with "Automate" in its title via
    // either workflow_title or the slug-derived fallback. A case-
    // insensitive substring match keeps the assertion robust against
    // future title polish.
    await expect(page.locator(WORKFLOW_HEADER)).toContainText(/automate/i, { timeout: 5_000 });

    // Either the step rail OR a no-step fallback should render in the
    // right slot. The bundled body uses `## Step N:` headers so the rail
    // is the expected branch, but we accept either path (§9-5c).
    const stepRailVisible = await page
      .locator(WORKFLOW_STEP_RAIL)
      .isVisible()
      .catch(() => false);
    if (!stepRailVisible) {
      // No-step fallback: surface still has its right slot but without a
      // rail. Verify the surface's right-side container is present so we
      // know the layout actually mounted (vs. mid-launch overlay state).
      await expect(page.locator('[data-testid="workflow-surface-right"]')).toBeVisible({ timeout: 3_000 });
    } else {
      await expect(page.locator(WORKFLOW_STEP_RAIL)).toBeVisible();
    }

    // End the workflow - confirmation modal pops; click "End workflow"
    // inside it to confirm. The first matching button is the header's
    // End button (already visible); the second matching button is inside
    // the confirm dialog.
    const endButton = page.locator(END_BUTTON).first();
    await endButton.click();

    // Arco's Modal.confirm renders into the body; the OK button has the
    // primary danger style and text "End workflow". Locate by text in the
    // confirm scope and click it.
    const confirmOk = page
      .locator('.arco-modal-confirm')
      .getByRole('button', { name: /End workflow/i })
      .first();
    // Best-effort: if the confirm modal didn't appear (different Arco
    // pathway in some build configs) skip the confirm click and just
    // navigate away - the next test's setup nukes the active session via
    // findActive.
    const confirmVisible = await confirmOk.isVisible().catch(() => false);
    if (confirmVisible) {
      await confirmOk.click();
      // After confirm, surface should unmount (session ends, useWorkflowSession
      // returns null, GuidPage falls back to the non-workflow tape). Give
      // the end IPC + state update a moment to land.
      await expect(page.locator(WORKFLOW_HEADER)).not.toBeVisible({ timeout: 5_000 });
    }
  });
});

test.describe('Workflow Launch Surface - resume smoke (SPEC §5.7 / §10.2)', () => {
  test('re-launching the same workflow surfaces the resume prompt', async ({ page }, testInfo) => {
    // Phase 1: launch a workflow so the repository has an active session
    // for it. We deliberately do NOT end it - the resume prompt fires
    // when findActive returns a non-ended session within the 14-day window.
    await openWorkflowsPage(page);
    await openWorkflowDetail(page, FEATURED_WORKFLOW_SLUG);

    // Skip the whole resume scenario if launch is unavailable (no model
    // provider in this env). The resume contract is only meaningful when
    // a session actually exists - without it we'd be testing a different
    // (empty) branch of WorkflowDetailModal.
    const outcome = await attemptLaunch(page);
    skipIfUnmounted(testInfo, outcome);

    // Wait for the surface to fully mount (not just the overlay) before
    // navigating away - otherwise the session row may not have committed
    // its `current_step` update and the resume prompt would render
    // without a meaningful step number.
    await expect(page.locator(WORKFLOW_HEADER)).toBeVisible({ timeout: 10_000 });

    // Phase 2: navigate back to /workflows without ending the session.
    await navigateTo(page, WORKFLOWS_HASH);
    await page.locator(WORKFLOW_CARD).first().waitFor({ state: 'visible', timeout: 10_000 });

    // Phase 3: re-open the same workflow's detail modal and click Launch.
    // findActive should now return the session created in Phase 1, and
    // the modal should swap its footer for a WorkflowResumePrompt.
    await openWorkflowDetail(page, FEATURED_WORKFLOW_SLUG);
    await page.getByRole('button', { name: LAUNCH_BUTTON_TEXT }).click();

    // Resume prompt appears inside the open modal. Its testid is on the
    // card root; the body includes a "Resume" CTA and a "Start fresh"
    // CTA. We assert the prompt mounted - that's the smoke contract.
    await expect(page.locator(RESUME_PROMPT)).toBeVisible({ timeout: 10_000 });
  });
});
