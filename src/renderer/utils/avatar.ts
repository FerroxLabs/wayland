/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * True when the resolved avatar string should render as an <img> (versus an
 * emoji/text glyph). Matches either a known image file extension or one of
 * our resource URL schemes.
 */
export const isImageAvatar = (resolved: string): boolean =>
  /\.(svg|png|jpe?g|webp|gif)$/i.test(resolved) ||
  /^(https?:|wayland-asset:\/\/|file:\/\/|data:)/i.test(resolved);
