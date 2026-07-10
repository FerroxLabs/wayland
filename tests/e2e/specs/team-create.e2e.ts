/**
 * E2E Scenario 1: Create a team from the sidebar.
 *
 * Flow: sidebar inline "+ Create team" button -> Create Team modal -> fill form
 * -> create -> verify navigation.
 *
 * Selectors + reachability track the v0.6.2.1 UI (#780):
 *  - The create affordance is the bottom-of-list inline button
 *    `data-testid="sider-team-create-inline"` (TeamSiderSection.tsx). It is the
 *    ONLY mount point for TeamCreateModal, and it renders only inside
 *    SiderTeamsSection, which (a) returns null when the user has zero teams and
 *    (b) lives in an accordion that is COLLAPSED by default. So the spec seeds a
 *    team via the bridge and expands the Teams accordion before the button is
 *    reachable — otherwise every test would hang on a button that isn't in the DOM.
 *  - The modal is the custom WaylandModal (`.team-create-modal`) with a heading
 *    instead of `.arco-modal-title`; the leader select and agent options carry
 *    stable testids (`team-create-leader-select`, `team-create-agent-option-*`),
 *    and options portal to document.body (WaylandSelect getPopupContainer).
 *  - The confirm button is NO LONGER disabled on an empty form — TeamCreateModal
 *    validates on click and warns — so the spec asserts enabled + submit behavior
 *    rather than a disabled state.
 */
import { test, expect, type Page } from '../fixtures';
import { invokeBridge, TEAM_SUPPORTED_BACKENDS } from '../helpers';

/**
 * UI label patterns for each backend. Used to match the agent option in the
 * Create Team dropdown. Falls back to a case-insensitive backend name match.
 */
const BACKEND_UI_PATTERN: Record<string, RegExp> = {
  claude: /Claude Code/i,
  codex: /Codex/i,
  gemini: /Gemini/i,
};

/** Prefixes for every team this spec may create, so cleanup can find them all. */
const NAME_PREFIXES = ['E2E TeamCreate Seed', 'E2E Test Team', 'E2E Team ('];

type TeamRow = { id: string; name: string };

/** Remove every team this spec created/seeded, matched by name prefix. */
async function cleanupSpecTeams(page: Page): Promise<void> {
  const teams = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' }).catch(
    () => [] as TeamRow[]
  );
  await Promise.all(
    teams
      .filter((team) => NAME_PREFIXES.some((p) => team.name.startsWith(p)))
      .map((team) => invokeBridge(page, 'team.remove', { id: team.id }).catch(() => undefined))
  );
}

/**
 * Seed one team (so SiderTeamsSection renders) and expand the Teams accordion
 * (collapsed by default), leaving the inline create button reachable.
 */
async function primeSiderCreateAffordance(page: Page): Promise<void> {
  const seeded = await invokeBridge<{ id?: string; __bridgeError?: boolean } | null>(page, 'team.create', {
    userId: 'system_default_user',
    name: `E2E TeamCreate Seed ${Date.now()}`,
    workspace: '',
    workspaceMode: 'shared',
    agents: [
      {
        slotId: '',
        conversationId: '',
        role: 'leader',
        agentType: 'wayland-core',
        agentName: 'Leader',
        conversationType: 'acp',
        status: 'pending',
      },
    ],
  }).catch(() => null);

  // If seeding fails (e.g. no engine available), skip cleanly instead of hanging
  // 15s on a section that will never render — mirrors team-modal-lifecycle.
  if (!seeded?.id || seeded.__bridgeError) {
    test.skip(true, 'team.create seed returned no team id (no usable leader backend)');
    return;
  }

  // The Teams accordion section appears once ≥1 team exists.
  const section = page.getByTestId('sider-teams-section');
  await expect(section).toBeVisible({ timeout: 15000 });

  // Expand it if collapsed (default). The header is a role=button with
  // aria-expanded reflecting open state (SiderAccordionShell).
  const header = section.locator('[role="button"]').first();
  if ((await header.getAttribute('aria-expanded')) !== 'true') {
    await header.click();
  }

  await expect(page.getByTestId('sider-team-create-inline')).toBeVisible({ timeout: 10000 });
}

/** The inline "+ Create team" button at the bottom of the sidebar team list. */
function createButton(page: Page) {
  return page.getByTestId('sider-team-create-inline');
}

/** The Create Team modal (custom WaylandModal, class passed through to Arco). */
function createModal(page: Page) {
  return page.locator('.team-create-modal');
}

test.describe('Team Create', () => {
  test.beforeEach(async ({ page }) => {
    await cleanupSpecTeams(page);
    await primeSiderCreateAffordance(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupSpecTeams(page);
  });

  test('sidebar shows inline create-team button', async ({ page }) => {
    await page.screenshot({ path: 'tests/e2e/results/team-01-initial.png' });
    await expect(createButton(page)).toBeVisible();
  });

  test('clicking create opens the team modal', async ({ page }) => {
    await createButton(page).click();

    // Screenshot: modal open
    await page.screenshot({ path: 'tests/e2e/results/team-02-modal.png' });

    // Modal is visible with a "Create Team" heading
    const modal = createModal(page);
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.getByRole('heading', { name: /Create Team|创建团队/ })).toBeVisible();

    // Team name input exists
    const nameInput = modal.locator('input').first();
    await expect(nameInput).toBeVisible();

    // Team leader select exists
    await expect(page.getByTestId('team-create-leader-select')).toBeVisible();

    // Confirm button exists and is ENABLED (validation happens on click now, so
    // it is not disabled on an empty form — see TeamCreateModal.handleCreate).
    const confirmBtn = modal.getByRole('button', { name: /Create Team|创建团队/ });
    await expect(confirmBtn).toBeVisible();
    await expect(confirmBtn).toBeEnabled();

    // Close the modal (Arco WaylandModal closes on Escape).
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 5000 });
  });

  test('can fill form and create team', async ({ page }) => {
    await createButton(page).click();

    const modal = createModal(page);
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Fill team name
    await modal.locator('input').first().fill('E2E Test Team');

    // Open leader select and wait for options (rendered in an Arco portal)
    await page.getByTestId('team-create-leader-select').click();
    const firstOption = page.locator('.arco-select-option').first();
    await firstOption.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    // Screenshot: dropdown options
    await page.screenshot({ path: 'tests/e2e/results/team-03-agent-dropdown.png' });

    const hasOption = await firstOption.isVisible().catch(() => false);

    if (hasOption) {
      await firstOption.click();

      const confirmBtn = modal.getByRole('button', { name: /Create Team|创建团队/ });
      await expect(confirmBtn).toBeEnabled({ timeout: 5000 });

      // Screenshot: form filled
      await page.screenshot({ path: 'tests/e2e/results/team-04-filled.png' });

      // Click Create and wait for navigation
      await confirmBtn.click();
      await page.waitForURL(/\/team\//, { timeout: 15000 });

      // Screenshot: after creation
      await page.screenshot({ path: 'tests/e2e/results/team-05-created.png' });

      // Verify team name appears in sidebar
      await expect(page.locator('text=E2E Test Team').first()).toBeVisible({ timeout: 10000 });
    } else {
      // No supported agents installed - screenshot and skip
      await page.screenshot({ path: 'tests/e2e/results/team-03-no-agents.png' });
      console.log('[E2E] No supported agents available for team creation');
      test.skip();
    }
  });
});

/**
 * Helper: open the Create Team modal, fill a team name, select the agent whose
 * option text matches `agentTextPattern`, click Create, and verify the team
 * was created. Skips gracefully if the agent is not installed.
 */
async function createTeamWithAgent(
  page: Page,
  teamName: string,
  agentTextPattern: RegExp,
  screenshotPrefix: string
): Promise<void> {
  await createButton(page).click();

  const modal = createModal(page);
  await expect(modal).toBeVisible({ timeout: 5000 });

  // Fill team name
  await modal.locator('input').first().fill(teamName);

  // Open leader select and wait for options
  await page.getByTestId('team-create-leader-select').click();
  await page
    .locator('.arco-select-option')
    .first()
    .waitFor({ state: 'visible', timeout: 5000 })
    .catch(() => {});

  await page.screenshot({ path: `tests/e2e/results/${screenshotPrefix}-dropdown.png` });

  // Find the option matching the agent text pattern
  const matchingOption = page.locator('.arco-select-option').filter({ hasText: agentTextPattern }).first();
  const optionVisible = await matchingOption.isVisible().catch(() => false);

  if (!optionVisible) {
    // Agent not installed - close dropdown then modal, skip test
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 5000 });
    console.log(`[E2E] Agent matching ${agentTextPattern} not found - skipping`);
    test.skip();
    return;
  }

  await matchingOption.click();

  // Confirm button is enabled (validation is on-click, not a disabled state)
  const confirmBtn = modal.getByRole('button', { name: /Create Team|创建团队/ });
  await expect(confirmBtn).toBeEnabled({ timeout: 5000 });

  await page.screenshot({ path: `tests/e2e/results/${screenshotPrefix}-filled.png` });

  // Submit and wait for navigation
  await confirmBtn.click();
  await page.waitForURL(/\/team\//, { timeout: 15000 });

  await page.screenshot({ path: `tests/e2e/results/${screenshotPrefix}-created.png` });

  // Verify team name appears in sidebar
  await expect(page.locator(`text=${teamName}`).first()).toBeVisible({ timeout: 10000 });
}

test.describe('Team Create - whitelisted leader types', () => {
  test.beforeEach(async ({ page }) => {
    await cleanupSpecTeams(page);
    await primeSiderCreateAffordance(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupSpecTeams(page);
  });

  for (const backend of TEAM_SUPPORTED_BACKENDS) {
    const pattern = BACKEND_UI_PATTERN[backend] ?? new RegExp(backend, 'i');
    test(`create E2E Team (${backend})`, async ({ page }) => {
      await createTeamWithAgent(page, `E2E Team (${backend})`, pattern, `team-${backend}`);
    });
  }
});
