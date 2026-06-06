/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Focus → crew map for first-run onboarding.
 *
 * The user picks 1–3 identity personas ("what do you want to get done?") and
 * we seed their launchpad bar + recommend teams/workflows that match. This is
 * pure curated data + a deterministic merge - no runtime model call. The
 * "intelligence" is the authored map, not a guess at draw time.
 *
 * IDs are the RUNTIME-namespaced ids the launchpad bar stores and resolves:
 *   - business-pack assistants/teams → `ext-<id>` (AssistantResolver.ts:73)
 *   - built-in presets               → `builtin-<id>` (initStorage.ts:514)
 *   - workflows                      → bundled-workflow slug
 * Seeding `launchpad.barOrder` with these resolves through `resolveBarEntry`.
 *
 * Labels/blurbs live in i18n (`onboarding.focus.<id>.*`); this file is pure ids.
 */

export type FocusPersonaId = 'content' | 'sales' | 'business' | 'dev' | 'finance' | 'general';

export type FocusPersona = {
  id: FocusPersonaId;
  /** lucide icon name for the chip glyph. */
  icon: string;
  /** Specialist launchpad ids, highest-priority first. Seeds the bar. */
  specialists: string[];
  /** Team launcher ids, highest-priority first. Feeds the recommended-teams strip. */
  teams: string[];
  /** Workflow slugs, highest-priority first. Feeds the recommended-workflows strip. */
  workflows: string[];
};

/** The universal autonomous-execution card - always the first launchpad seed. */
const COWORK = 'builtin-cowork';

/** Bar holds 10 max; seed 8 so the user still has room to add their own. */
export const LAUNCHPAD_SEED_CAP = 8;
const TEAMS_CAP = 3;
const WORKFLOWS_CAP = 3;

/**
 * Authored persona → crew map. Approved 2026-06-04. Each persona unions a few
 * of the six built-in categories (research · write · sell · run · office ·
 * build) into an identity a real user recognises.
 */
export const FOCUS_PERSONAS: readonly FocusPersona[] = [
  {
    id: 'content',
    icon: 'pen-line',
    specialists: ['ext-copy', 'ext-humanizer', 'ext-mira', 'ext-voiceprint', 'ext-research', 'ext-lens'],
    teams: ['ext-content-studio', 'ext-creator-studio', 'ext-editorial-newsroom'],
    workflows: [
      'wayland-blog-publish',
      'wayland-content-calendar-build',
      'wayland-headline-lab',
      'wayland-vsl-build',
    ],
  },
  {
    id: 'sales',
    icon: 'trending-up',
    specialists: ['ext-sales', 'ext-forge', 'ext-stage', 'ext-vault', 'ext-copy'],
    teams: [
      'ext-cold-outbound',
      'ext-growth-loop',
      'ext-product-launch',
      'ext-sales-pipeline',
      'ext-first-customers',
    ],
    workflows: ['wayland-outreach-build', 'wayland-full-funnel-design', 'wayland-offer-build'],
  },
  {
    id: 'business',
    icon: 'building-2',
    specialists: ['ext-patch', 'ext-helm', 'ext-beacon', 'ext-mend', 'ext-slate', 'ext-coin', 'ext-sentry'],
    teams: ['ext-founder-setup', 'ext-customer-success-org', 'ext-support-stack', 'ext-sales-org'],
    workflows: ['business-ops-weekly-review', 'wayland-hr-hire-loop', 'wayland-runway-projection'],
  },
  {
    id: 'dev',
    icon: 'wrench',
    specialists: ['ext-smith', 'ext-spark', 'ext-verdict', 'ext-probe', 'ext-research'],
    teams: ['ext-dev-shop', 'ext-saas-mvp-sprint', 'ext-validate-before-build'],
    // Bundled workflows are all business/content-shaped; this persona leans on its teams.
    workflows: [],
  },
  {
    id: 'finance',
    icon: 'landmark',
    specialists: [
      'ext-coin',
      'ext-quiet-money',
      'ext-quiet-money-position-auditor',
      'ext-quiet-money-spending-auditor',
      'ext-quiet-money-windfall-navigator',
      'ext-patch',
    ],
    teams: ['ext-quiet-money-council', 'ext-quiet-money-standing', 'ext-founder-setup'],
    workflows: [
      'wayland-cashflow-review',
      'wayland-budget-build',
      'wayland-runway-projection',
      'wayland-forecast-build',
    ],
  },
  {
    id: 'general',
    icon: 'sparkles',
    specialists: ['ext-research', 'ext-copy', 'ext-sales', 'ext-smith', 'ext-coin', 'ext-patch'],
    teams: ['ext-founder-setup', 'ext-content-studio', 'ext-product-launch'],
    workflows: ['business-ops-weekly-review', 'wayland-content-calendar-build'],
  },
] as const;

export type FocusResolution = {
  /** Seed for `launchpad.barOrder` - Cowork first, then matched specialists. */
  launchpadIds: string[];
  /** Recommended team launcher ids for the landing strip. */
  teamIds: string[];
  /** Recommended workflow slugs for the landing strip. */
  workflowIds: string[];
};

/**
 * Rank-interleave several ranked lists into one capped, de-duped list.
 * Takes each persona's #1, then each persona's #2, … so a 2–3 persona pick
 * is balanced across personas rather than front-loaded by the first one.
 */
function interleave(lists: string[][], cap: number, seed: string[] = []): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of seed) {
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  const maxLen = lists.reduce((m, l) => Math.max(m, l.length), 0);
  for (let rank = 0; rank < maxLen && out.length < cap; rank++) {
    for (const list of lists) {
      if (out.length >= cap) break;
      const id = list[rank];
      if (id && !seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
  }
  return out;
}

/**
 * Merge the selected personas into one crew: union → dedupe → rank-interleave →
 * cap. Empty selection returns just the Cowork seed for the launchpad (the
 * caller treats an empty/skip selection as "leave the default bar alone").
 */
export function resolveFocusSelection(selectedIds: FocusPersonaId[]): FocusResolution {
  const personas = selectedIds
    .map((id) => FOCUS_PERSONAS.find((p) => p.id === id))
    .filter((p): p is FocusPersona => Boolean(p));

  return {
    launchpadIds: interleave(
      personas.map((p) => p.specialists),
      LAUNCHPAD_SEED_CAP,
      [COWORK]
    ),
    teamIds: interleave(
      personas.map((p) => p.teams),
      TEAMS_CAP
    ),
    workflowIds: interleave(
      personas.map((p) => p.workflows),
      WORKFLOWS_CAP
    ),
  };
}
