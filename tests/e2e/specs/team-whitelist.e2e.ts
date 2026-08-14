/**
 * E2E Scenario 6: Agent whitelist enforcement.
 *
 * Verifies: UI create modal dropdown only shows whitelisted agent types.
 *
 * Whitelist locations:
 * - agentSelectUtils.tsx (TEAM_SUPPORTED_BACKENDS)
 * - TeamMcpServer.ts (spawn whitelist)
 */
import { test, expect } from '../fixtures';
import { TEAM_SUPPORTED_BACKENDS, primeSiderCreateAffordance} from '../helpers';

test.describe('Team Agent Whitelist', () => {
  test('UI only shows whitelisted agents in create modal dropdown', async ({ page }) => {
    // Navigate to home to access the create modal
    await page.goto(page.url().split('#')[0] + '#/guid');

    // Close any leftover modal from previous tests before interacting with the page
    const existingModal = page.locator('.arco-modal-close-icon');
    if (await existingModal.isVisible({ timeout: 1000 }).catch(() => false)) {
      await existingModal.click({ force: true });
      await expect(page.locator('.arco-modal')).toBeHidden({ timeout: 5000 });
    }

    // The old `.h-20px.w-20px.rd-4px` icon button was replaced by
    // `sider-team-create-inline`; that class now matches only the CRON section.
    // The Teams section also needs >=1 team and an expanded accordion to render.
    const primed = await primeSiderCreateAffordance(page);
    test.skip(!primed, 'team.create seed failed (no usable leader backend)');
    await page.getByTestId('sider-team-create-inline').click();

    // Open agent dropdown
    const agentSelect = page.locator('.arco-modal .arco-select').first();
    await expect(agentSelect).toBeVisible({ timeout: 5000 });
    await agentSelect.click();
    await expect(page.locator('.arco-select-option').first()).toBeVisible({ timeout: 5000 });

    // Screenshot: dropdown options
    await page.screenshot({ path: 'tests/e2e/results/team-whitelist-01-dropdown.png' });

    // Get all visible option texts
    const options = page.locator('.arco-select-option');
    const count = await options.count();

    const optionTexts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      if (text) optionTexts.push(text.trim());
    }

    console.log('[E2E] Available agents in dropdown:', optionTexts);

    // Every whitelisted backend must appear in the dropdown
    for (const backend of TEAM_SUPPORTED_BACKENDS) {
      expect(optionTexts.some((t) => t.toLowerCase().includes(backend))).toBe(true);
    }

    // Non-whitelisted backends must not appear
    const nonWhitelisted = ['qwen', 'codebuddy'];
    for (const text of optionTexts) {
      const lower = text.toLowerCase();
      for (const blocked of nonWhitelisted) {
        expect(lower).not.toContain(blocked);
      }
    }

    // Close modal. Scope to the team-create modal specifically: Arco leaves
    // closed modals mounted (unmountOnExit defaults off), so a bare
    // `.arco-modal` can resolve to a hidden one that has no clickable close
    // icon. The dropdown is also still open over it, so dismiss that first.
    await page.keyboard.press('Escape'); // dismiss the open agent dropdown first
    const createModal = page.locator('.team-create-modal');
    // TeamCreateModal renders a CUSTOM header, so there is no
    // `.arco-modal-close-icon` - the close control is the button sitting next
    // to the title. It also sets unmountOnExit={false}, so scope to this modal.
    await createModal.locator('h3').locator('xpath=following-sibling::button[1]').click();
    await expect(createModal).toBeHidden({ timeout: 5000 });
  });
});
