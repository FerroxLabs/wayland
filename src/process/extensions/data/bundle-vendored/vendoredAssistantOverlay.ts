/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * prompts vs kickoffs (v0.4.7.1 B-L-1):
 *   - `prompts` powers the agent-selector chip strip (one-line suggestions
 *     shown beneath the assistant card on the picker).
 *   - `kickoffs` powers the SuggestionEngine card on the new-chat empty
 *     state (one full multi-line card with text + prefill + scenario).
 *   - Both fields coexist intentionally during v0.4.7.x. Schedule a
 *     decision on the canonical surface for v0.4.8 (prompts removal vs
 *     kickoff promotion). DO NOT collapse one to the other in a hotfix -
 *     the renderer wires for both independently.
 *
 * Vendored-bundle overlay (live-smoke fix #1, 2026-05-19).
 *
 * The on-disk waylandteams bundle (loaded via the dev symlink at
 * ~/Library/Application Support/Wayland*\/wayland/extensions/) lags the
 * in-repo vendored snapshot at `./assistants.json` for the schema fields
 * added during the team-blitz (`standing`, `teammates`, `rituals`). The
 * vendored bundle README declares itself the source of truth for the
 * running app, but no install path actually wires that promise up.
 *
 * Rather than try to make the vendored directory loadable as an
 * independent extension (it would need a manifest + all 44 contextFile
 * mirrors + icons + i18n + lifecycle scripts), we apply a narrow runtime
 * overlay: for each live-loaded assistant whose id matches an entry in
 * the vendored manifest, copy ONLY the three blitz fields when they
 * are missing on the live record. This:
 *   - keeps the live bundle's icons/contextFile/i18n authoritative
 *   - respects the app-repo boundary (no edits to ~/dev/waylandteams)
 *   - is idempotent (already-populated fields win)
 *   - degrades cleanly when the vendored file is unreadable (logs +
 *     returns the input unchanged)
 *
 * Delete this overlay (and the call site in ExtensionRegistry) once the
 * symlinked bundle is bumped to include the team-blitz schema fields and
 * the v0.6.0-wayland-teams release ships per the vendored README's
 * "Sync policy" section.
 */

// Static JSON import - vite/electron-vite inlines this at build time so the
// overlay works in both `electron-vite dev` (where __dirname resolves to
// src/ paths) and packaged mode (where __dirname resolves to out/main/).
// Earlier versions used `fs.readFile(__dirname/assistants.json)` which failed
// with ENOENT because the JSON was never copied to out/main/, silently
// disabling the standing/teammates/rituals overlay in production.
import vendoredAssistantsJson from './assistants.json';

type VendoredKickoffEntry = {
  id: string;
  text: string;
  prefill: string;
  scenario: string;
  timeBucket?: string;
  requiresRitualOutput?: boolean;
  beginnerSafe?: boolean;
};

type VendoredOverlayEntry = {
  standing?: boolean;
  teammates?: string[];
  rituals?: Array<{ name: string; cadence: string }>;
  /**
   * v0.4.7 - Kickoff cards. Authored in
   * .planning/kickoff-library/v3-consolidated.yaml, spliced into this same
   * vendored assistants.json. Overlay dual-write requirement: ADD entries
   * here AND in assistants.json or the overlay silently drops them and the
   * SuggestionEngine returns `no-kickoffs-defined` at runtime.
   */
  kickoffs?: VendoredKickoffEntry[];
};

type VendoredOverlayMap = Map<string, VendoredOverlayEntry>;

let cachedOverlay: VendoredOverlayMap | null = null;
let cachedOverlayPromise: Promise<VendoredOverlayMap> | null = null;

/**
 * Load the vendored manifest. Backed by the static JSON import above -
 * deterministic, no file-read failure modes, cached after first build.
 */
async function loadOverlay(): Promise<VendoredOverlayMap> {
  if (cachedOverlay) return cachedOverlay;
  if (cachedOverlayPromise) return cachedOverlayPromise;

  cachedOverlayPromise = (async (): Promise<VendoredOverlayMap> => {
    const map: VendoredOverlayMap = new Map();
    try {
      const parsed = vendoredAssistantsJson as unknown;
      if (!Array.isArray(parsed)) {
        console.warn('[Extensions] Vendored overlay: assistants.json is not an array; overlay disabled.');
        cachedOverlay = map;
        return map;
      }
      for (const entry of parsed) {
        if (!entry || typeof entry !== 'object') continue;
        const id = (entry as { id?: unknown }).id;
        if (typeof id !== 'string' || id.length === 0) continue;
        const overlay: VendoredOverlayEntry = {};
        const standing = (entry as { standing?: unknown }).standing;
        if (typeof standing === 'boolean') overlay.standing = standing;
        const teammates = (entry as { teammates?: unknown }).teammates;
        if (Array.isArray(teammates) && teammates.every((t) => typeof t === 'string')) {
          overlay.teammates = teammates as string[];
        }
        const rituals = (entry as { rituals?: unknown }).rituals;
        if (
          Array.isArray(rituals) &&
          rituals.every(
            (r) =>
              r !== null &&
              typeof r === 'object' &&
              typeof (r as { name?: unknown }).name === 'string' &&
              typeof (r as { cadence?: unknown }).cadence === 'string'
          )
        ) {
          overlay.rituals = rituals as Array<{ name: string; cadence: string }>;
        }
        const kickoffs = (entry as { kickoffs?: unknown }).kickoffs;
        if (
          Array.isArray(kickoffs) &&
          kickoffs.every(
            (k) =>
              k !== null &&
              typeof k === 'object' &&
              typeof (k as { id?: unknown }).id === 'string' &&
              typeof (k as { text?: unknown }).text === 'string' &&
              typeof (k as { prefill?: unknown }).prefill === 'string' &&
              typeof (k as { scenario?: unknown }).scenario === 'string'
          )
        ) {
          overlay.kickoffs = kickoffs as VendoredKickoffEntry[];
        }
        map.set(id, overlay);
      }
      cachedOverlay = map;
      return map;
    } catch (error) {
      console.warn(
        '[Extensions] Vendored overlay: failed to load assistants.json; overlay disabled.',
        error instanceof Error ? error.message : error
      );
      cachedOverlay = map;
      return map;
    } finally {
      cachedOverlayPromise = null;
    }
  })();

  return cachedOverlayPromise;
}

/**
 * Apply the vendored overlay to a list of resolved assistants in place.
 *
 * For each assistant whose unprefixed id matches an overlay entry, copy
 * only the fields that are NOT already set on the live record. The
 * registry uses `ext-<id>` prefixed ids; we strip the prefix for the
 * lookup so this works regardless of which side of the prefix boundary
 * the caller passes in.
 *
 * Returns the same array reference for caller ergonomics.
 */
export async function applyVendoredOverlay(
  assistants: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  const overlay = await loadOverlay();
  if (overlay.size === 0) return assistants;

  let patched = 0;
  for (const assistant of assistants) {
    const rawId = (assistant as { id?: unknown }).id;
    if (typeof rawId !== 'string') continue;
    const lookupId = rawId.startsWith('ext-') ? rawId.slice(4) : rawId;
    const overlayEntry = overlay.get(lookupId);
    if (!overlayEntry) continue;

    let touched = false;
    if (
      overlayEntry.standing !== undefined &&
      (assistant as { standing?: unknown }).standing === undefined
    ) {
      (assistant as { standing?: boolean }).standing = overlayEntry.standing;
      touched = true;
    }
    if (
      overlayEntry.teammates !== undefined &&
      (assistant as { teammates?: unknown }).teammates === undefined
    ) {
      (assistant as { teammates?: string[] }).teammates = overlayEntry.teammates;
      touched = true;
    }
    if (
      overlayEntry.rituals !== undefined &&
      (assistant as { rituals?: unknown }).rituals === undefined
    ) {
      (assistant as { rituals?: Array<{ name: string; cadence: string }> }).rituals =
        overlayEntry.rituals;
      touched = true;
    }
    // v0.4.7.1 (G-M-4) - treat empty array as "missing" too. A partial
    // bundle bump where someone added the field at scaffolding time but
    // never wrote entries would silently disable the engine for that
    // assistant. Empty + undefined collapse to the same overlay path.
    if (overlayEntry.kickoffs !== undefined) {
      const liveKickoffs = (assistant as { kickoffs?: unknown }).kickoffs;
      const liveIsMissing =
        liveKickoffs === undefined || (Array.isArray(liveKickoffs) && liveKickoffs.length === 0);
      if (liveIsMissing) {
        (assistant as { kickoffs?: VendoredKickoffEntry[] }).kickoffs = overlayEntry.kickoffs;
        touched = true;
      }
    }
    if (touched) patched += 1;
  }

  if (patched > 0) {
    console.log(`[Extensions] Vendored overlay: patched ${patched} assistant(s) with blitz schema fields.`);
  }
  return assistants;
}

/** Test-only hook: clear cached overlay so the next call re-reads from disk. */
export function __resetVendoredOverlayCacheForTests(): void {
  cachedOverlay = null;
  cachedOverlayPromise = null;
}
