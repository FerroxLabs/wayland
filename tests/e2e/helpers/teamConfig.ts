// E2E test infrastructure - hardcoded list of backends to test in team mode.
// This is intentionally static (not dynamic from ACP init results) because
// E2E tests need a predictable set of backends to validate.
const ALL_BACKENDS = new Set(['claude', 'codex', 'gemini']);

// Support TEAM_AGENT=claude or TEAM_AGENT=claude,codex to run only specific leader types.
// Values are validated against the full list; unknown types are silently dropped.
const envLeaderTypes = process.env.TEAM_AGENT;

export const TEAM_SUPPORTED_BACKENDS: ReadonlySet<string> = envLeaderTypes
  ? new Set(
      envLeaderTypes
        .split(',')
        .map((s) => s.trim())
        .filter((t) => ALL_BACKENDS.has(t))
    )
  : ALL_BACKENDS;

/**
 * Expand the Teams accordion in the sider.
 *
 * The section is COLLAPSED by default - `useSiderAccordionState` seeds
 * `DEFAULT_STATE.teams = false`, and `SiderAccordionShell` renders its children
 * only while open (`{open && ...}`). Open state persists in localStorage under
 * `sider.accordion.state.v1`, and the fixture mints a fresh userData dir per
 * run, so every e2e worker starts collapsed and NO team row exists in the DOM
 * until this runs.
 *
 * `SiderTeamsSection` also returns null while zero teams exist, so seed a team
 * before calling this.
 *
 * Mirrors the already-passing prime in team-create.e2e.ts.
 */
export async function expandTeamsAccordion(page: import('@playwright/test').Page): Promise<void> {
  const section = page.getByTestId('sider-teams-section');
  await section.waitFor({ state: 'visible', timeout: 15_000 });

  // The header is a role=button whose aria-expanded reflects open state.
  const header = section.locator('[role="button"]').first();
  if ((await header.getAttribute('aria-expanded')) !== 'true') {
    await header.click();
  }
  await page.getByTestId('sider-teams-myteams-group').waitFor({ state: 'visible', timeout: 10_000 });
}

/**
 * Make the sider's inline "create team" affordance reachable.
 *
 * `SiderTeamsSection` renders nothing while zero teams exist, and the accordion
 * is collapsed by default, so the button is absent from the DOM on a fresh
 * profile. Seed one team, expand, and wait for the button.
 *
 * The old `.h-20px.w-20px.rd-4px` icon button was replaced by
 * `sider-team-create-inline` (TeamSiderSection.tsx:278) - that class now only
 * matches the CRON section, so the old locator silently hit the wrong control.
 *
 * @returns false when seeding failed (no usable leader backend); the caller
 *          should skip rather than hang on a section that will never render.
 */
export async function primeSiderCreateAffordance(page: import('@playwright/test').Page): Promise<boolean> {
  const { invokeBridge } = await import('./bridge');
  const seeded = await invokeBridge<{ id?: string; __bridgeError?: boolean } | null>(page, 'team.create', {
    userId: 'system_default_user',
    name: `E2E SiderPrime Seed ${Date.now()}`,
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

  if (!seeded?.id || seeded.__bridgeError) return false;

  await expandTeamsAccordion(page);
  await page.getByTestId('sider-team-create-inline').waitFor({ state: 'visible', timeout: 10_000 });
  return true;
}
