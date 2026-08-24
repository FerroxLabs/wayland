/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="@testing-library/jest-dom/vitest" />

/**
 * SPEC-PREVIEW-PANE §4 Lane D - the away strip.
 *
 * These mount `WorkbenchHost` with the SAME section wiring ChatLayout uses
 * (`available: isPreviewOpen && !away`) driven by the REAL `usePreviewAway`,
 * rather than mounting ChatLayout itself. ChatLayout drags in Arco, SWR, the
 * voice session and the whole IPC bridge; the behaviour under test is the
 * lifecycle and the derivation, and both are exercised here for real.
 *
 * jsdom performs no layout, so "the chat is full width" is asserted as the
 * panel being ABSENT from the tree, and "at the previous width" as the width
 * the panel is handed - the same limitation Lane A's suite documents.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const bridge = vi.hoisted(() => {
  const listeners: Array<(payload: unknown) => void> = [];
  return {
    listeners,
    popoutInvoke: vi.fn(async () => ({ ok: true, alreadyOpen: false })),
    dockBackInvoke: vi.fn(async () => ({ ok: true, tab: { id: 'tab-brief' } })),
    emit(payload: unknown) {
      for (const listener of [...listeners]) listener(payload);
    },
  };
});

vi.mock('@/common', () => ({
  ipcBridge: {
    preview: {
      handoff: {
        on: (callback: (payload: unknown) => void) => {
          bridge.listeners.push(callback);
          return () => {
            const index = bridge.listeners.indexOf(callback);
            if (index > -1) bridge.listeners.splice(index, 1);
          };
        },
      },
      popout: { invoke: (params: unknown) => bridge.popoutInvoke(params as never) },
      dockBack: { invoke: () => bridge.dockBackInvoke() },
    },
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const template = (params?.defaultValue as string) ?? key;
      return template.replace(/\{\{(\w+)\}\}/g, (_m, name: string) => String(params?.[name] ?? ''));
    },
  }),
}));

import WorkbenchHost, {
  documentPaneDefaultWidth,
  type WorkbenchSectionRegistration,
} from '@/renderer/pages/conversation/components/WorkbenchHost';
import PreviewAwayStrip from '@/renderer/pages/conversation/components/ChatLayout/PreviewAwayStrip';
import { usePreviewAway } from '@/renderer/pages/conversation/components/ChatLayout/usePreviewAway';

const withWindowWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width });
};

const withReducedMotion = (reduce: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: reduce && query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
};

/**
 * ChatLayout's derivation, verbatim: a section that is UNAVAILABLE while the
 * preview is away, so a deliverable landing meanwhile cannot pull the rail back
 * open under the reader.
 */
const Harness: React.FC<{
  conversationId: string;
  activeTabId: string | null;
  previewOpen?: boolean;
  onDocked?: () => void;
}> = ({ conversationId, activeTabId, previewOpen = true, onDocked }) => {
  const away = usePreviewAway(activeTabId);
  const docked = previewOpen && !away.away;

  // Counts DOCK EVENTS, not renders: a false->true transition of `docked`.
  const wasDocked = useRef(docked);
  useEffect(() => {
    if (docked && !wasDocked.current) onDocked?.();
    wasDocked.current = docked;
  }, [docked, onDocked]);

  const sections = useMemo<WorkbenchSectionRegistration[]>(
    () => [
      {
        id: 'preview',
        label: 'Preview',
        priority: 70,
        available: docked,
        requestedOpen: docked,
        activationKey: docked ? 'open' : 'closed',
        fill: true,
        prefersDocumentWidth: true,
        content: <div data-testid='preview-content'>morning-brief.html</div>,
      },
    ],
    [docked]
  );

  return (
    <WorkbenchHost conversationId={conversationId} sections={sections}>
      <main data-testid='chat'>
        {away.away && (
          <PreviewAwayStrip arrivals={away.arrivals} pulseToken={away.pulseToken} onBringBack={away.bringBack} />
        )}
      </main>
    </WorkbenchHost>
  );
};

const popOut = (tabId: string) => act(() => bridge.emit({ tab: { id: tabId }, direction: 'popout' }));
const dockBackBroadcast = (tabId: string) => act(() => bridge.emit({ tab: { id: tabId }, direction: 'dock-back' }));

describe('preview away strip', () => {
  beforeEach(() => {
    bridge.listeners.length = 0;
    bridge.popoutInvoke.mockClear();
    bridge.dockBackInvoke.mockClear();
    localStorage.clear();
    withWindowWidth(1440);
    withReducedMotion(false);
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * Decision 3. Silently re-docking would yank the layout out from under
   * someone mid-read - the same class of bug as `b563b39fc`, pointed the other
   * way. The count is the whole acknowledgement.
   */
  it('leaves the rail closed and the count at 1 when a second deliverable arrives while popped', async () => {
    const { rerender } = render(<Harness conversationId='away-count' activeTabId='tab-brief' />);
    expect(await screen.findByTestId('workbench-panel')).toBeInTheDocument();

    popOut('tab-brief');

    // The pane is gone and a marker stands where it was.
    await waitFor(() => expect(screen.queryByTestId('workbench-panel')).not.toBeInTheDocument());
    expect(screen.getByTestId('preview-away-strip')).toHaveTextContent('Preview is in its own window');
    // The deliverable that LEFT is not an arrival.
    expect(screen.queryByTestId('preview-away-count')).not.toBeInTheDocument();

    // A second deliverable lands while the preview is away.
    rerender(<Harness conversationId='away-count' activeTabId='tab-second' />);

    await waitFor(() => expect(screen.getByTestId('preview-away-count')).toHaveTextContent('1'));
    expect(screen.queryByTestId('workbench-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('preview-away-strip')).toBeInTheDocument();
  });

  /**
   * THE HOOK MUST ACTUALLY BUMP THE TOKEN.
   *
   * The motion cases below drive `PreviewAwayStrip` with props directly, so they
   * prove the COMPONENT reacts to a token change - and stay green even if
   * `usePreviewAway` never bumps one. Freezing `setPulseToken` in the hook left
   * the whole suite passing, which means the badge could stop pulsing on arrival
   * and nothing would notice. This is the case that closes that gap: the real
   * hook, through the real strip, on a real arrival.
   */
  it('pulses the badge from the hook itself, not only from a prop', async () => {
    const { rerender } = render(<Harness conversationId='away-pulse' activeTabId='tab-brief' />);
    expect(await screen.findByTestId('workbench-panel')).toBeInTheDocument();

    popOut('tab-brief');
    await waitFor(() => expect(screen.getByTestId('preview-away-strip')).toBeInTheDocument());

    rerender(<Harness conversationId='away-pulse' activeTabId='tab-second' />);

    const count = await screen.findByTestId('preview-away-count');
    await waitFor(() => expect(count).toHaveAttribute('data-pulsing', 'true'));
  });

  /**
   * Lane B made the popped window's `closed` handler the SINGLE place a
   * dock-back is announced, so the OS red button and this control are one code
   * path. `preview.dockBack` closes the window and returns the tab but does not
   * emit. Acting on both would dock twice.
   */
  it('docks exactly once per gesture: the call closes, the broadcast docks', async () => {
    const onDocked = vi.fn();
    render(<Harness conversationId='away-once' activeTabId='tab-brief' onDocked={onDocked} />);
    await screen.findByTestId('workbench-panel');

    popOut('tab-brief');
    await waitFor(() => expect(screen.queryByTestId('workbench-panel')).not.toBeInTheDocument());
    onDocked.mockClear();

    fireEvent.click(screen.getByTestId('preview-away-bring-back'));

    // The call was made - and its RETURNED tab changed nothing on its own.
    expect(bridge.dockBackInvoke).toHaveBeenCalledTimes(1);
    await Promise.resolve();
    expect(screen.queryByTestId('workbench-panel')).not.toBeInTheDocument();
    expect(onDocked).not.toHaveBeenCalled();

    // Closing the window is what docks, and it docks once.
    dockBackBroadcast('tab-brief');
    await waitFor(() => expect(screen.getByTestId('workbench-panel')).toBeInTheDocument());
    expect(onDocked).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('preview-away-strip')).not.toBeInTheDocument();
  });

  /** Bring it back restores the pane at the width it had before it left. */
  it('restores an undragged pane at its document default width', async () => {
    render(<Harness conversationId='away-restore-default' activeTabId='tab-brief' />);
    const before = await screen.findByTestId('workbench-panel');
    // 1440 - 168 nav rail - 560 chat floor = 712.
    expect(before).toHaveStyle({ width: `${documentPaneDefaultWidth(1440)}px` });

    popOut('tab-brief');
    await waitFor(() => expect(screen.queryByTestId('workbench-panel')).not.toBeInTheDocument());

    fireEvent.click(screen.getByTestId('preview-away-bring-back'));
    dockBackBroadcast('tab-brief');

    const after = await screen.findByTestId('workbench-panel');
    expect(after).toHaveStyle({ width: '712px' });
  });

  /**
   * Lane A's `widthSetByUser`: a restored pane must not be mistaken for a user
   * choice, and a REAL prior drag has to survive the round trip. Without that
   * flag the document default would fire again on the way back and quietly
   * throw the drag away.
   */
  it('restores a dragged pane at the dragged width, not the default', async () => {
    render(<Harness conversationId='away-restore-drag' activeTabId='tab-brief' />);
    const panel = await screen.findByTestId('workbench-panel');

    const separator = screen.getByRole('separator', { name: 'Resize workbench' });
    fireEvent.pointerDown(separator, { button: 0, pointerType: 'mouse', clientX: 800 });
    fireEvent.pointerMove(window, { clientX: 700 });
    fireEvent.pointerUp(window);
    expect(panel).toHaveStyle({ width: '812px' });

    popOut('tab-brief');
    await waitFor(() => expect(screen.queryByTestId('workbench-panel')).not.toBeInTheDocument());

    fireEvent.click(screen.getByTestId('preview-away-bring-back'));
    dockBackBroadcast('tab-brief');

    const after = await screen.findByTestId('workbench-panel');
    expect(after).toHaveStyle({ width: '812px' });
  });

  /** The pop-out control hands the whole tab to the transport, not to storage. */
  it('sends the active tab across the wire when the pane is popped out', async () => {
    const Popper: React.FC = () => {
      const away = usePreviewAway('tab-brief');
      return (
        <button type='button' data-testid='pop' onClick={() => away.popOut({ id: 'tab-brief' } as never)}>
          pop
        </button>
      );
    };
    render(<Popper />);
    fireEvent.click(screen.getByTestId('pop'));
    expect(bridge.popoutInvoke).toHaveBeenCalledWith({ tab: { id: 'tab-brief' } });
  });
});

describe('preview away strip: motion', () => {
  afterEach(() => cleanup());

  it('pulses the count once when a deliverable arrives', async () => {
    withReducedMotion(false);
    const { rerender } = render(<PreviewAwayStrip arrivals={0} pulseToken={0} onBringBack={() => {}} />);
    rerender(<PreviewAwayStrip arrivals={1} pulseToken={1} onBringBack={() => {}} />);

    const count = await screen.findByTestId('preview-away-count');
    expect(count).toHaveAttribute('data-pulsing', 'true');
    expect(count).toHaveClass('preview-away__count--pulse');
  });

  /**
   * The preference is to remove MOTION, not to remove state. The count has to
   * stay perceivable, which is also why the strip is a `role="status"`.
   */
  it('suppresses the pulse under prefers-reduced-motion while the count stays visible', async () => {
    withReducedMotion(true);
    const { rerender } = render(<PreviewAwayStrip arrivals={0} pulseToken={0} onBringBack={() => {}} />);
    rerender(<PreviewAwayStrip arrivals={1} pulseToken={1} onBringBack={() => {}} />);

    const count = await screen.findByTestId('preview-away-count');
    expect(count).toHaveAttribute('data-pulsing', 'false');
    expect(count).not.toHaveClass('preview-away__count--pulse');
    expect(count).toHaveTextContent('1');
    expect(screen.getByTestId('preview-away-strip')).toHaveAttribute('role', 'status');
  });

  /**
   * WHY IT IS A TOKEN AND NOT A BOOLEAN.
   *
   * The pulse is one-shot: it clears itself after PULSE_MS. A boolean `pulse`
   * flag would already be `true` when the SECOND deliverable lands, so the
   * effect would not re-run and the badge would sit there silently - the second
   * arrival would never announce itself. A token changes on every arrival, so
   * the effect re-runs and the animation restarts. That is the behaviour here.
   */
  it('pulses AGAIN on the next arrival, which a boolean flag could not do', async () => {
    withReducedMotion(false);
    vi.useFakeTimers();
    try {
      const { rerender } = render(<PreviewAwayStrip arrivals={1} pulseToken={1} onBringBack={() => {}} />);
      expect(screen.getByTestId('preview-away-count')).toHaveAttribute('data-pulsing', 'true');

      // Let the one-shot expire, exactly as it does on screen.
      act(() => {
        vi.advanceTimersByTime(700);
      });
      expect(screen.getByTestId('preview-away-count')).toHaveAttribute('data-pulsing', 'false');

      // A new arrival bumps the token: the pulse must start over.
      rerender(<PreviewAwayStrip arrivals={2} pulseToken={2} onBringBack={() => {}} />);
      expect(screen.getByTestId('preview-away-count')).toHaveAttribute('data-pulsing', 'true');
      expect(screen.getByTestId('preview-away-count')).toHaveTextContent('2');
    } finally {
      vi.useRealTimers();
    }
  });
});
