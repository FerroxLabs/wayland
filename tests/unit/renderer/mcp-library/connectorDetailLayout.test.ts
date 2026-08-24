/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The connector detail page was losing its whole right-hand edge.
 *
 * Measured live on the shipped layout: the settings pane is 920px wide inside a
 * 1209px window and clips with `overflow-x: hidden`; the page laid out at
 * 1165px, so 245px went over the edge. The action card and the entire
 * Connection / Published-to / Links rail ended 205px past the pane - which is
 * why the status pill read "Server r..." and transport read "Loc...".
 *
 * Two independent causes, both asserted here because either one on its own
 * re-breaks the page:
 *
 *  1. `.page` is a child of a COLUMN flex container, so its automatic minimum
 *     size is its min-content width - 1165px, set by the 300px action card and
 *     the 280px rail. That beat `max-width: 1120px` outright.
 *  2. The stacking breakpoint was a viewport `@media` query. The pane is ~290px
 *     narrower than the window, so at a 1209px window the query saw 1209 while
 *     the page actually had 840. It fired far too late - and at an 820px window,
 *     where it DID fire, the page still overflowed by 326px.
 *
 * jsdom does no layout, so this guards the stylesheet. The numbers above came
 * from driving the real app over CDP.
 */

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const CSS = readFileSync(
  join(__dirname, '../../../../src/renderer/pages/settings/McpLibrary/DetailPage.module.css'),
  'utf8'
);

function rule(selector: string): string {
  const at = CSS.indexOf(`${selector} {`);
  if (at < 0) throw new Error(`no rule for ${selector}`);
  return CSS.slice(at, CSS.indexOf('}', at));
}

describe('the connector page cannot outgrow the settings pane', () => {
  test('.page is allowed to shrink below its min-content width', () => {
    expect(rule('.page')).toMatch(/min-width:\s*0\s*;/);
  });

  test('.page states its width, so containment cannot collapse it to its padding', () => {
    // `margin: 0 auto` opts the flex item out of cross-axis stretch. Without an
    // explicit width the container-type below shrank the page to 80px - its own
    // horizontal padding - and every child then overflowed it.
    const page = rule('.page');
    expect(page).toMatch(/width:\s*100%\s*;/);
    expect(page).toMatch(/box-sizing:\s*border-box\s*;/);
  });

  test('the stacking breakpoint measures the PAGE, not the window', () => {
    const page = rule('.page');
    expect(page).toMatch(/container-type:\s*inline-size\s*;/);
    expect(page).toMatch(/container-name:\s*connector-page\s*;/);
    expect(CSS).toMatch(/@container\s+connector-page\s*\(max-width:\s*\d+px\)/);
    // A viewport media query here is the exact bug: it reads a box 290px wider
    // than the one being laid out.
    expect(CSS).not.toMatch(/@media\s*\(max-width/);
  });

  test('the stacking threshold leaves room for the two fixed columns', () => {
    const match = CSS.match(/@container\s+connector-page\s*\(max-width:\s*(\d+)px\)/);
    expect(match).not.toBeNull();
    const threshold = Number(match![1]);
    const sideWidth = Number(rule('.colSide').match(/width:\s*(\d+)px/)![1]);
    const actionWidth = Number(rule('.action').match(/width:\s*(\d+)px/)![1]);
    const gap = Number(rule('.cols').match(/gap:\s*(\d+)px/)![1]);
    // Below the threshold we stack, so above it both columns must actually fit
    // with a usable main column left over.
    expect(threshold).toBeGreaterThanOrEqual(sideWidth + gap + 300);
    expect(threshold).toBeGreaterThanOrEqual(actionWidth);
  });

  test('the main column states its width so a rigid child scrolls instead of pushing', () => {
    // `.cols` aligns to flex-start, so once stacked this column is not stretched
    // and sizes to its content. The setup guide embeds markdown in a shadow root
    // whose <pre> blocks report a 699px min-content; that dragged the column,
    // and the whole page, past the pane.
    const colMain = rule('.colMain');
    expect(colMain).toMatch(/min-width:\s*0\s*;/);
    expect(colMain).toMatch(/width:\s*100%\s*;/);
  });

  test('the tab row wraps rather than pushing the page out', () => {
    // Four fixed-gap tabs measured 18px past the pane at a 600px window, and a
    // longer locale makes that worse.
    expect(rule('.tabs')).toMatch(/flex-wrap:\s*wrap\s*;/);
  });
});
