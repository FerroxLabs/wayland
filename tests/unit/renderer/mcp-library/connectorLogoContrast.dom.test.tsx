/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Connector logos have to be VISIBLE, and "visible" is a number.
 *
 * A catalog icon is rendered through `<img src="...svg">`. An SVG loaded that
 * way is its own document and cannot inherit `color`, so a glyph painted with
 * `currentColor` renders BLACK on every theme. Measured live before the fix,
 * TVControl's glyph was #000000 on the #222222 plate: 1.32:1, against a 3:1
 * floor for non-text graphics. Twenty-seven of the 108 catalog connectors were
 * in that class in at least one theme.
 *
 * These tests hold the floor for the whole catalog, not for one icon.
 */

import React from 'react';
import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  contrastRatio,
  declaredPaints,
  logoTreatment,
  relativeLuminance,
  MIN_GLYPH_CONTRAST,
  MIN_BRAND_PAIR_CONTRAST,
} from '@renderer/pages/settings/McpLibrary/connectorBrand';
import ConnectorLogo from '@renderer/pages/settings/McpLibrary/components/ConnectorLogo';
import type { CatalogEntry } from '@renderer/pages/settings/McpLibrary/types';

// The two plates and two inks the shared logo CSS falls back to, straight out of
// src/renderer/styles/themes/default-color-scheme.css.
const THEMES = [
  { name: 'light', plate: '#ffffff', ink: '#0d0d0d' },
  { name: 'dark', plate: '#222222', ink: '#f5f5f5' },
];

const entryModules = import.meta.glob<{ default: CatalogEntry } | CatalogEntry>(
  '@renderer/mcp-catalog/entries/*.json',
  { eager: true }
);
const iconSources = import.meta.glob<string>('@renderer/mcp-catalog/icons/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const entries: CatalogEntry[] = Object.values(entryModules).map((m) =>
  'default' in m ? m.default : (m as CatalogEntry)
);
const sourceByFile: Record<string, string> = {};
for (const [key, value] of Object.entries(iconSources)) sourceByFile[key.slice(key.lastIndexOf('/') + 1)] = value;

function iconSourceFor(entry: CatalogEntry): string | undefined {
  const url = entry['x-wayland'].iconUrl;
  return url ? sourceByFile[url.slice(url.lastIndexOf('/') + 1)] : undefined;
}

describe('contrast maths', () => {
  test('matches the WCAG reference points', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    // The exact pair the user reported: black glyph on the dark elevated plate.
    expect(contrastRatio('#000000', '#222222')).toBeCloseTo(1.32, 2);
    expect(relativeLuminance('#fff')).toBeCloseTo(1, 5);
    expect(contrastRatio('not-a-colour', '#fff')).toBeNull();
  });
});

describe('glyph paint classification', () => {
  test('currentColor means the glyph carries no colour of its own', () => {
    expect(declaredPaints('<svg fill="currentColor"><path d="M0 0"/></svg>')).toBeNull();
    expect(declaredPaints('<svg><path style="fill: currentColor"/></svg>')).toBeNull();
  });

  test('a bare shape with no paint at all is also colourless', () => {
    expect(declaredPaints('<svg><path d="M0 0"/></svg>')).toBeNull();
  });

  test('a rasterised logo is never treated as colourless', () => {
    // A PNG/JPEG wrapped in an SVG declares no `fill`, but all of its colour is
    // in the bitmap. Masking one would flatten a photograph to a silhouette.
    expect(declaredPaints('<svg><image href="data:image/png;base64,AAAA"/></svg>')).toEqual(['<raster>']);
  });

  test('declared colours are reported, deduped', () => {
    expect(declaredPaints('<svg><path fill="#FFF"/><path fill="#fff"/><rect fill="none"/></svg>')).toEqual(['#fff']);
  });
});

describe('the reported defect', () => {
  test('TVControl is painted with its declared brand pair, above the floor', () => {
    const treatment = logoTreatment('com.ferroxlabs/tvcontrol');
    expect(treatment.tint).toBe(true);
    expect(treatment.foreground).toBe('#2962ff');
    expect(treatment.background).toBe('#131722');
    const ratio = contrastRatio(treatment.foreground!, treatment.background!)!;
    expect(ratio).toBeGreaterThanOrEqual(MIN_GLYPH_CONTRAST);
    // Live measurement of the rendered plate after the fix was 3.58:1.
    expect(ratio).toBeCloseTo(3.65, 1);
  });

  test('a rasterised logo is handed a plate instead of being repainted', () => {
    const treatment = logoTreatment('io.tinyfish/agentql-mcp');
    expect(treatment.tint).toBe(false);
    expect(treatment.background).toBe('#ffffff');
  });

  test('a multi-colour mark is left completely alone', () => {
    const treatment = logoTreatment('io.modelcontextprotocol/server-filesystem');
    expect(treatment).toEqual({ tint: false });
  });

  test('an unknown entry id is a no-op, never a crash', () => {
    expect(logoTreatment('does.not/exist')).toEqual({ tint: false });
  });
});

/**
 * Eight catalog marks are single-colour LOGOTYPES whose brand colour is bright
 * enough to fall under 3:1 on the light theme's white plate - Canva's teal,
 * Airtable's blue, and so on. Every one of them clears the floor comfortably on
 * the dark plate (6.6:1 or better), none is invisible, and WCAG 2.2 SC 1.4.11
 * exempts logotypes outright. Overriding the plate each entry itself declares
 * would repaint eight well-known brands to fix a rule that does not apply.
 *
 * This list is a RATCHET, not a licence: a new connector that lands under the
 * floor fails this test until someone decides which side of the line it is on.
 */
const LOGOTYPE_EXEMPTIONS = [
  'ai.perplexity/perplexity-mcp',
  'com.airtable/airtable-mcp',
  'com.buildkite/buildkite-mcp',
  'com.canva/canva-mcp',
  'com.netlify/netlify-mcp',
  'com.newrelic/newrelic-mcp',
  'com.xero/xero-mcp',
  'io.coda/coda-mcp',
];

describe('the whole catalog clears the non-text contrast floor on BOTH themes', () => {
  test('every connector', () => {
    expect(entries.length).toBeGreaterThanOrEqual(100);
    const failures: string[] = [];
    const exempt = new Set<string>();
    let tinted = 0;
    let replated = 0;

    for (const entry of entries) {
      const source = iconSourceFor(entry);
      if (!source) continue;
      const treatment = logoTreatment(entry.name);
      const paints = declaredPaints(source);

      for (const theme of THEMES) {
        const plate = treatment.background ?? theme.plate;

        if (treatment.tint) {
          // The renderer paints this glyph itself - either with the declared
          // brand ink or, when that pair is untrustworthy, with the theme ink.
          // There is no logotype defence here: we chose the colour.
          const ink = treatment.foreground ?? theme.ink;
          const ratio = contrastRatio(ink, plate);
          if (ratio === null || ratio < MIN_GLYPH_CONTRAST)
            failures.push(`${entry.name} [${theme.name}] tinted ${ink} on ${plate} = ${ratio}`);
          continue;
        }

        // Not tinted: the glyph keeps its own colour. Only single-colour marks
        // can be checked arithmetically; raster and multi-colour marks were
        // verified by live pixel measurement instead (see the lane report).
        if (paints && paints.length === 1 && paints[0] !== '<raster>') {
          const ratio = contrastRatio(paints[0], plate);
          if (ratio === null) continue;
          if (ratio < MIN_GLYPH_CONTRAST) {
            if (LOGOTYPE_EXEMPTIONS.includes(entry.name)) exempt.add(entry.name);
            else failures.push(`${entry.name} [${theme.name}] glyph ${paints[0]} on ${plate} = ${ratio.toFixed(2)}`);
          }
        }
      }

      if (treatment.tint) tinted += 1;
      else if (treatment.background) replated += 1;
    }

    expect(failures).toEqual([]);
    // The exemption list must stay exactly as large as its justification: an
    // entry that stops needing it has to come off the list.
    expect([...exempt].toSorted()).toEqual(LOGOTYPE_EXEMPTIONS.toSorted());
    // Guards against the fix quietly becoming a no-op. These are the connectors
    // that were invisible in at least one theme and are now handled.
    expect(tinted).toBe(7);
    expect(replated).toBeGreaterThanOrEqual(20);
  });

  test('every exempt logotype is still perfectly readable on the other theme', () => {
    // The exemption is "not a contrast failure", not "invisible and ignored".
    for (const id of LOGOTYPE_EXEMPTIONS) {
      const entry = entries.find((e) => e.name === id);
      expect(entry, id).toBeDefined();
      const paints = declaredPaints(iconSourceFor(entry!)!)!;
      expect(paints.length, id).toBe(1);
      const best = Math.max(...THEMES.map((t) => contrastRatio(paints[0], t.plate)!));
      expect(best, `${id} is unreadable on BOTH themes`).toBeGreaterThanOrEqual(MIN_GLYPH_CONTRAST);
    }
  });

  test('a pair that clears 3:1 on paper but not once drawn is still refused', () => {
    // Tavily declares #0EA5A4 on #ffffff: 3.03 arithmetically, so a bare 3:1
    // gate would honour it - and the rendered 20px glyph then measured 2.97.
    // This is the test that holds MIN_BRAND_PAIR_CONTRAST above the bare floor.
    const ratio = contrastRatio('#0EA5A4', '#ffffff')!;
    expect(ratio).toBeGreaterThan(MIN_GLYPH_CONTRAST);
    expect(ratio).toBeLessThan(MIN_BRAND_PAIR_CONTRAST);
    const treatment = logoTreatment('com.tavily/tavily-mcp');
    expect(treatment.tint).toBe(true);
    expect(treatment.foreground).toBeUndefined();
  });

  test('a declared brand pair too close to the floor is refused in favour of the theme ink', () => {
    // fal.ai declares #0099FF on #ffffff, which computes to exactly 3.00 and
    // measured 2.97 once antialiased at 20px. It must NOT be honoured.
    expect(contrastRatio('#0099FF', '#ffffff')!).toBeLessThan(MIN_BRAND_PAIR_CONTRAST);
    const treatment = logoTreatment('ai.fal/fal-mcp');
    expect(treatment.tint).toBe(true);
    expect(treatment.foreground).toBeUndefined();
    expect(treatment.background).toBeUndefined();
    for (const theme of THEMES) expect(contrastRatio(theme.ink, theme.plate)!).toBeGreaterThan(MIN_GLYPH_CONTRAST);
  });
});

describe('ConnectorLogo render', () => {
  test('a colourless glyph is painted through a mask, not shipped as an <img>', () => {
    const { container } = render(
      <ConnectorLogo entryId='com.ferroxlabs/tvcontrol' iconUrl='/icons/tvcontrol.svg' title='TVControl' />
    );
    expect(container.querySelector('img')).toBeNull();
    const plate = container.firstElementChild as HTMLElement;
    expect(plate.style.background).toBeTruthy();
    const glyph = plate.firstElementChild as HTMLElement;
    expect(glyph.style.getPropertyValue('--connector-glyph-mask')).toBe('url("/icons/tvcontrol.svg")');
    expect(glyph.style.getPropertyValue('--connector-glyph-ink')).toBe('#2962ff');
  });

  test('a multi-colour mark still renders as an <img> so its colours survive', () => {
    const { container } = render(
      <ConnectorLogo
        entryId='io.modelcontextprotocol/server-filesystem'
        iconUrl='/icons/filesystem.svg'
        title='Filesystem'
      />
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('src')).toBe('/icons/filesystem.svg');
  });

  test('a non-catalog URL scheme never reaches the DOM', () => {
    const { container } = render(
      // eslint-disable-next-line no-script-url
      <ConnectorLogo entryId='com.ferroxlabs/tvcontrol' iconUrl='javascript:alert(1)' title='TVControl' />
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.innerHTML).not.toContain('javascript:');
    expect(container.textContent).toBe('T');
  });

  test('no icon at all falls back to the connector initial', () => {
    const { container } = render(<ConnectorLogo entryId='does.not/exist' iconUrl={undefined} title='zeta' />);
    expect(container.textContent).toBe('Z');
  });
});
