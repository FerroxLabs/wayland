/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Preview panel related constants
 */

/**
 * Snapshot save debounce time (milliseconds)
 */
export const SNAPSHOT_DEBOUNCE_TIME = 1000;

/**
 * Scroll sync debounce time (milliseconds)
 */
export const SCROLL_SYNC_DEBOUNCE = 100;

/**
 * Tab overflow detection threshold (pixels)
 */
export const TAB_OVERFLOW_THRESHOLD = 2;

/**
 * Left/right gradient indicator width (pixels)
 */
export const TAB_FADE_INDICATOR_WIDTH = 32;

/**
 * Toolbar height (pixels)
 */
export const TOOLBAR_HEIGHT = 40;

/**
 * Default split panel ratio (percentage)
 */
export const DEFAULT_SPLIT_RATIO = 50;

/**
 * Minimum split panel width (percentage)
 */
export const MIN_SPLIT_WIDTH = 20;

/**
 * Maximum split panel width (percentage)
 */
export const MAX_SPLIT_WIDTH = 80;

/**
 * Threshold for enabling large-text preview truncation (characters)
 */
export const LARGE_TEXT_PREVIEW_THRESHOLD = 120_000;

/**
 * Maximum characters kept for truncated large-text previews
 */
export const LARGE_TEXT_PREVIEW_MAX_LENGTH = 40_000;

/**
 * Threshold for switching CodeViewer to lightweight rendering
 */
export const LARGE_TEXT_VIEWER_THRESHOLD = 30_000;

/**
 * Maximum rendered characters in CodeViewer for large text
 */
export const LARGE_TEXT_VIEWER_RENDER_LIMIT = 20_000;

/**
 * File types with built-in open buttons
 */
export const FILE_TYPES_WITH_BUILTIN_OPEN = ['word', 'ppt', 'pdf', 'excel'] as const;

/**
 * Editable content types
 */
export const EDITABLE_CONTENT_TYPES = ['markdown', 'html', 'code'] as const;
