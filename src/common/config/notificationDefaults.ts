/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Default quiet-hours window (local wall-clock, `HH:MM`).
 *
 * Shared by the Notifications settings page (what the user SEES) and the
 * task-completion notifier (what actually APPLIES). Quiet hours has no on/off
 * toggle — the times themselves are the control — so this window is in effect
 * out of the box, before the user ever opens settings. Keeping the constant in
 * one place stops the display default and the effective default from drifting
 * apart (#579 follow-up: they had, so a fresh install rang at 3am).
 */
export const DEFAULT_QUIET_HOURS = { start: '22:00', end: '07:00' } as const;
