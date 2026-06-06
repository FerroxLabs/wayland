/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/** Flux Router brand orange. The canonical mark colour (route line + nodes). */
const FLUX_ORANGE = '#ff6b35';

type FluxRouterMarkProps = {
  /** Square edge length in px. */
  size?: number;
  /**
   * Stroke colour. Defaults to the brand orange so the mark reads correctly on
   * a dark tile. Pass `'currentColor'` to inherit the surrounding text colour.
   */
  color?: string;
  /** Optional class for layout (the SVG itself carries no colour classes). */
  className?: string;
};

/**
 * The canonical Flux Router brand mark - an orange route line connecting two
 * nodes. Renders the mark inline (no asset pipeline) so it works in every
 * surface that previously showed the `Fx` monogram tile.
 *
 * Pair with `FluxRouterTile` (or a `#141414` rounded-square wrapper) when the
 * mark needs the contained, hero treatment matching `flux-contained.svg`.
 */
const FluxRouterMark: React.FC<FluxRouterMarkProps> = ({ size = 18, color = FLUX_ORANGE, className }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
    className={className}
    aria-hidden='true'
  >
    <circle cx='6' cy='19' r='3' />
    <path d='M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15' />
    <circle cx='18' cy='5' r='3' />
  </svg>
);

type FluxRouterTileProps = {
  /** Outer tile edge length in px. The mark renders at ~60% of this. */
  size?: number;
  /** Optional class for the tile wrapper. */
  className?: string;
};

/**
 * The Flux Router mark on a `#141414` rounded-square tile - the contained
 * treatment that replaces the purple `Fx` monogram in provider avatars.
 * Mirrors `flux-contained.svg` (18px corner radius scaled to the tile).
 */
export const FluxRouterTile: React.FC<FluxRouterTileProps> = ({ size = 40, className }) => (
  <span
    className={className}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      borderRadius: Math.round(size * 0.45),
      background: '#141414',
    }}
    aria-hidden='true'
  >
    <FluxRouterMark size={Math.round(size * 0.55)} />
  </span>
);

export default FluxRouterMark;
