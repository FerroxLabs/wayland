/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/** Broadcast on `window` whenever the speech-to-text config changes so that
 *  listeners (settings UI, send box autoSend) can re-read it from storage.
 *  Kept in a standalone module so lightweight consumers like the send box can
 *  import it without pulling in the heavy settings UI tree. */
export const SPEECH_TO_TEXT_CONFIG_CHANGED_EVENT = 'wayland:speech-to-text-config-changed';
