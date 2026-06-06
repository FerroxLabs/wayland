/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export { SlackPlugin } from './SlackPlugin';
export type { SlackTransport } from './SlackPlugin';
export * from './SlackAdapter';
export { validateSlackBlocksArray, parseSlackBlocksInput, SLACK_MAX_BLOCKS } from './blocks-input';
export { buildSlackBlocksFallbackText } from './blocks-fallback';
