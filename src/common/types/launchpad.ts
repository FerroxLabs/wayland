/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Persisted ordered list of assistant IDs that compose the user's
 * editable launchpad bar. Stored under ConfigStorage key
 * `launchpad.barOrder`. First-launch users see the default 6 (see
 * QUICK_LAUNCH_ANCHORS) until they reorder/add/remove. Once the
 * user mutates the bar - even back to the defaults - the array is
 * persisted and read on every subsequent boot.
 *
 * IDs that no longer resolve to a known assistant (e.g. uninstalled
 * extension) are silently skipped at render time; they are NOT
 * pruned from storage so an extension reinstall restores the card
 * to its prior position.
 */
export type LaunchpadBarOrder = string[];
