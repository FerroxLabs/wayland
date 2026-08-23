/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import classNames from 'classnames';
import { logoTreatment } from '../connectorBrand';
import styles from './ConnectorLogo.module.css';

type Props = {
  /** Catalog entry id (`com.ferroxlabs/tvcontrol`), used to resolve its brand. */
  entryId: string;
  /** Bundler-resolved icon URL. */
  iconUrl?: string;
  /** Connector title - its first letter is the fallback when there is no icon. */
  title: string;
  /** Plate sizing/radius/border, supplied by the surface using the logo. */
  className?: string;
};

// The catalog only ever yields a bundler asset URL or an inline data: URI.
// Anything else must not reach `url()` or an <img>.
const SAFE_ICON = /^(?:data:image\/svg\+xml[,;]|blob:|\/|\.{0,2}\/|https?:\/\/localhost|wayland-asset:)/i;

function safeIconUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return SAFE_ICON.test(url) ? url : undefined;
}

/**
 * A connector logo that is actually visible.
 *
 * `<img src="...svg">` renders the SVG as an isolated document, so a glyph
 * painted with `currentColor` (or with no paint at all) comes out black on
 * every theme - 1.32:1 against the dark plate. Such a glyph is painted here
 * instead, through a CSS mask tinted with the entry's declared brand colour.
 * A glyph that carries its own single colour is never repainted; when that
 * colour cannot survive the token plate it is given a plate it can be seen
 * against. Multi-colour marks are left exactly as they are.
 */
export const ConnectorLogo: React.FC<Props> = ({ entryId, iconUrl, title, className }) => {
  const [broken, setBroken] = useState(false);
  const url = safeIconUrl(iconUrl);
  const treatment = logoTreatment(entryId);

  const plateStyle: React.CSSProperties = {};
  if (treatment.background) plateStyle.background = treatment.background;

  if (!url || broken) {
    return (
      <span className={classNames(styles.plate, className)} style={plateStyle}>
        <span className={styles.letter}>{(title.charAt(0) || '?').toUpperCase()}</span>
      </span>
    );
  }

  if (treatment.tint) {
    const glyphStyle = {
      '--connector-glyph-mask': `url("${url}")`,
      ...(treatment.foreground ? { '--connector-glyph-ink': treatment.foreground } : {}),
    } as React.CSSProperties;
    return (
      <span className={classNames(styles.plate, className)} style={plateStyle} role='img' aria-label=''>
        <span className={styles.tinted} style={glyphStyle} />
      </span>
    );
  }

  return (
    <span className={classNames(styles.plate, className)} style={plateStyle}>
      <img className={styles.glyph} src={url} alt='' onError={() => setBroken(true)} />
    </span>
  );
};

export default ConnectorLogo;
