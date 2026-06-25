// @vitest-environment jsdom

/**
 * #47 - the two orthogonal responsive signals that `isMobile` used to conflate.
 * isNarrow keys purely on width; isTouch on coarse-pointer/hover; isMobile is the
 * preserved legacy composite (width-only on electron, width-or-small-touch on web).
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

const electron = { value: false };
vi.mock('@renderer/utils/platform', () => ({
  isElectronDesktop: () => electron.value,
}));

import { computeResponsive } from '@renderer/hooks/ui/useResponsive';

function setEnv(opts: { width: number; touch: boolean; electron: boolean }) {
  electron.value = opts.electron;
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: opts.width });
  Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: opts.touch ? 5 : 0 });
  window.matchMedia = ((q: string) => ({
    matches: opts.touch && (q.includes('hover: none') || q.includes('pointer: coarse')),
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent() {
      return false;
    },
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('computeResponsive (#47)', () => {
  it('wide non-touch desktop: nothing flips', () => {
    setEnv({ width: 1200, touch: false, electron: true });
    expect(computeResponsive()).toEqual({ isNarrow: false, isTouch: false, isMobile: false });
  });

  it('narrow electron window is narrow + mobile (width only)', () => {
    setEnv({ width: 500, touch: false, electron: true });
    expect(computeResponsive()).toEqual({ isNarrow: true, isTouch: false, isMobile: true });
  });

  it('wide touch laptop (web): isTouch but NOT narrow and NOT mobile', () => {
    setEnv({ width: 1300, touch: true, electron: false });
    expect(computeResponsive()).toEqual({ isNarrow: false, isTouch: true, isMobile: false });
  });

  it('small touch screen (web): isTouch + isMobile, but not narrow', () => {
    setEnv({ width: 900, touch: true, electron: false });
    expect(computeResponsive()).toEqual({ isNarrow: false, isTouch: true, isMobile: true });
  });

  it('narrow web viewport: narrow + mobile regardless of touch', () => {
    setEnv({ width: 600, touch: false, electron: false });
    expect(computeResponsive()).toEqual({ isNarrow: true, isTouch: false, isMobile: true });
  });

  it('touch on a wide electron window does NOT make it mobile (width-only there)', () => {
    setEnv({ width: 1400, touch: true, electron: true });
    expect(computeResponsive()).toEqual({ isNarrow: false, isTouch: true, isMobile: false });
  });
});
