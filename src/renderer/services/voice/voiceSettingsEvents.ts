/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Voice settings change notifications.
 *
 * Lifted out of `ToolsModalContent` so a conversation surface can react to a
 * settings change without importing the settings modal - and therefore the MCP
 * hooks, the model registry, and the image-generation panel - into its own
 * bundle. `ToolsModalContent` re-exports this name, so existing importers are
 * unchanged.
 */
export const TTS_CONFIG_CHANGED_EVENT = 'wayland:tts-config-changed';
