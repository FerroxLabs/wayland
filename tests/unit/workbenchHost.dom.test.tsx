/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="@testing-library/jest-dom/vitest" />

import React, { useEffect, useMemo } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WorkbenchHost, {
  CHAT_MIN_WIDTH,
  documentPaneDefaultWidth,
  PREVIEW_PANE_MAX,
  type WorkbenchSectionRegistration,
  useWorkbenchSection,
} from '@/renderer/pages/conversation/components/WorkbenchHost';

/**
 * jsdom performs NO layout - every box measures 0x0 - so none of these tests
 * can observe a resolved column width. They assert the concrete contract that
 * produces it instead: the width the panel is given, and the `min-width` the
 * conversation column carries.
 */
const withWindowWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width });
};

const section = (
  id: string,
  requestedOpen: boolean,
  content: React.ReactNode = <div data-testid={`${id}-content`}>{id}</div>,
  extras: Partial<WorkbenchSectionRegistration> = {}
): WorkbenchSectionRegistration => ({
  id,
  label: id,
  requestedOpen,
  available: true,
  activationKey: requestedOpen ? `${id}-open` : `${id}-closed`,
  content,
  ...extras,
});

describe('WorkbenchHost hostile presentation boundaries', () => {
  /**
   * The preview is `available: isPreviewOpen`, so dismissing it drops it out of
   * the section list the reveal effect walks. Its `priorRequests` entry then
   * never advances past the 'open' it held when the section was last seen, so
   * the next deliverable's request equals the stale prior and no reveal fires -
   * while `collapsedIds` still holds it from the manual collapse.
   *
   * Live consequence: collapsing the Preview card ONCE made every deliverable
   * after it open invisibly.
   */
  it('reopens a dismissible section that comes back, instead of stranding it collapsed', async () => {
    const Harness = () => {
      const [open, setOpen] = React.useState(true);
      const sections = useMemo(
        () => [
          section('preview', open, <div data-testid='preview-content'>preview</div>, {
            available: open,
            activationKey: 'open',
            onDismiss: () => setOpen(false),
          }),
        ],
        [open]
      );
      return (
        <WorkbenchHost conversationId='dismiss-return' sections={sections}>
          <div>chat</div>
          <button type='button' data-testid='new-deliverable' onClick={() => setOpen(true)}>
            deliver
          </button>
        </WorkbenchHost>
      );
    };

    render(<Harness />);
    expect(await screen.findByTestId('preview-content')).toBeInTheDocument();

    // The user collapses the card. onDismiss closes the preview, so the section
    // leaves the list entirely.
    fireEvent.click(screen.getByRole('button', { name: /preview/i }));
    await waitFor(() => expect(screen.queryByTestId('preview-content')).not.toBeInTheDocument());

    // A new deliverable asks for it again, with the SAME activation key - the
    // shape the live preview actually has.
    fireEvent.click(screen.getByTestId('new-deliverable'));

    expect(await screen.findByTestId('preview-content')).toBeInTheDocument();
  });

  /**
   * The other half: a section with no `onDismiss` has nowhere else to record a
   * collapse, so `collapsedIds` must still hold it. Without this, the fix above
   * would silently make every ordinary section un-collapsible.
   */
  it('still remembers a collapse on a section that has no dismissal of its own', async () => {
    render(
      <WorkbenchHost conversationId='plain-collapse' sections={[section('workspace', true)]}>
        <div>chat</div>
      </WorkbenchHost>
    );
    expect(await screen.findByTestId('workspace-content')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /workspace/i }));
    await waitFor(() => expect(screen.queryByTestId('workspace-content')).not.toBeInTheDocument());
  });

  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  it('does not permanently narrow chat when every section is dormant', () => {
    render(
      <WorkbenchHost conversationId='calm' sections={[section('workspace', false)]}>
        <main data-testid='chat'>chat</main>
      </WorkbenchHost>
    );

    expect(screen.getByTestId('chat')).toBeInTheDocument();
    expect(screen.queryByTestId('workbench-panel')).not.toBeInTheDocument();
    // The rail strip used to sit here as an `absolute` overlay so it never
    // stole width from chat. It was removed outright when the titlebar became
    // the sole workbench toggle, so the guarantee is now stronger: nothing
    // renders alongside chat at all. Pinned so the rail cannot creep back and
    // quietly start consuming layout again.
    expect(document.querySelector('.workbench-host__tabs')).toBeNull();
    expect(document.querySelector('.workbench-host__primary')).toHaveClass('flex-1');
  });

  it('discloses the active section and resizes within safe bounds', async () => {
    render(
      <WorkbenchHost conversationId='resize' sections={[section('workspace', true)]}>
        <main>chat</main>
      </WorkbenchHost>
    );

    const panel = await screen.findByTestId('workbench-panel');
    expect(panel).toHaveAttribute('data-section-id', 'workspace');
    expect(panel).toHaveStyle({ width: '340px' });

    const separator = screen.getByRole('separator', { name: 'Resize workbench' });
    fireEvent.pointerDown(separator, { button: 0, pointerType: 'mouse', clientX: 500 });
    fireEvent.pointerMove(window, { clientX: 380 });
    fireEvent.pointerUp(window);

    expect(panel).toHaveStyle({ width: '460px' });
    await waitFor(() => {
      // v2: the persisted shape changed from a single activeId to collapsed/
      // expanded sets when the panel stopped having one active section.
      expect(JSON.parse(localStorage.getItem('wayland.workbench.resize.v2') || '{}').width).toBe(460);
    });
  });

  /**
   * The documented drag range is the ONLY thing that bounds the panel. The
   * clamp in `beginResize` is pure arithmetic over the pointer delta - no
   * container width, no flex basis, no re-applied persisted width sits in that
   * path - so both ends are genuinely reachable by a drag. Pinned at the
   * boundary because the ceiling exists for one reason: 620px was a rail width,
   * and a rendered HTML deliverable is unreadable in it. A later "just cap it
   * to the container" change would put that back without failing anything else.
   */
  it('clamps a drag past either end to exactly the documented bound', async () => {
    render(
      <WorkbenchHost conversationId='bounds' sections={[section('workspace', true)]}>
        <main>chat</main>
      </WorkbenchHost>
    );

    const panel = await screen.findByTestId('workbench-panel');
    const separator = screen.getByRole('separator', { name: 'Resize workbench' });

    // Drag far LEFT (widening) well past the maximum: lands exactly on it.
    fireEvent.pointerDown(separator, { button: 0, pointerType: 'mouse', clientX: 900 });
    fireEvent.pointerMove(window, { clientX: -5000 });
    fireEvent.pointerUp(window);
    expect(panel).toHaveStyle({ width: '1200px' });

    // Drag far RIGHT (narrowing) well past the minimum: lands exactly on it.
    fireEvent.pointerDown(separator, { button: 0, pointerType: 'mouse', clientX: 100 });
    fireEvent.pointerMove(window, { clientX: 5000 });
    fireEvent.pointerUp(window);
    expect(panel).toHaveStyle({ width: '260px' });

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem('wayland.workbench.bounds.v2') || '{}').width).toBe(260);
    });
  });

  /**
   * The loader re-validates a persisted width against the SAME bounds it writes
   * them under, so a width the drag can reach has to survive a reload. This is
   * the half of the ceiling change that is easy to miss: raising MAX_WIDTH
   * without the loader agreeing would let a user drag to 1200 and then find the
   * panel silently back at the 340px default on the next mount.
   */
  it('restores a persisted width sitting exactly on the maximum', async () => {
    localStorage.setItem(
      'wayland.workbench.reload.v2',
      JSON.stringify({ collapsedIds: [], expandedIds: [], width: 1200 })
    );

    render(
      <WorkbenchHost conversationId='reload' sections={[section('workspace', true)]}>
        <main>chat</main>
      </WorkbenchHost>
    );

    expect(await screen.findByTestId('workbench-panel')).toHaveStyle({ width: '1200px' });
  });

  it('persists close and supports an explicit reopen without destroying content', async () => {
    const onDismiss = vi.fn();
    const registration = section('workspace', true, undefined, { onDismiss });
    const first = render(
      <WorkbenchHost conversationId='persist' sections={[registration]}>
        <main>chat</main>
      </WorkbenchHost>
    );
    await screen.findByTestId('workbench-panel');
    fireEvent.click(screen.getByRole('button', { name: 'Close workbench' }));
    expect(onDismiss).toHaveBeenCalledOnce();
    // Pin the PERSISTED SHAPE, not just the round-trip. This test survives the
    // v1 -> v2 change without noticing it, so without this the migration from
    // {activeId, pinnedId, closedIds} to {collapsedIds, expandedIds} would be
    // entirely untested.
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('wayland.workbench.persist.v2') || '{}');
      expect(stored.collapsedIds).toEqual(['workspace']);
      expect(stored.expandedIds).toEqual([]);
    });
    expect(screen.queryByTestId('workbench-panel')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reopen workbench' })).toBeInTheDocument();

    first.unmount();
    render(
      <WorkbenchHost conversationId='persist' sections={[registration]}>
        <main>chat</main>
      </WorkbenchHost>
    );
    expect(screen.queryByTestId('workbench-panel')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reopen workbench' }));
    expect(await screen.findByTestId('workbench-panel')).toHaveAttribute('data-section-id', 'workspace');
  });

  // The pin affordance is gone, but the guarantee it bought is not - it is now
  // structural. Pin existed because a tab row could only show ONE section, so a
  // background relevance signal could yank away whatever the user was reading.
  // A stack expands the newly relevant section and leaves every other open
  // section exactly where it was, so there is nothing left to defend against.
  // This asserts the stronger property directly: BOTH are visible afterwards.
  it('background relevance never takes away a section the user is already reading', async () => {
    const { rerender } = render(
      <WorkbenchHost
        conversationId='pin'
        sections={[
          section('workspace', true, undefined, { priority: 20 }),
          section('preview', false, undefined, { priority: 90 }),
        ]}
      >
        <main>chat</main>
      </WorkbenchHost>
    );
    const panel = await screen.findByTestId('workbench-panel');
    expect(panel.querySelector('[data-section-id="workspace"]')).toHaveAttribute('data-expanded', 'true');

    rerender(
      <WorkbenchHost
        conversationId='pin'
        sections={[
          section('workspace', true, undefined, { priority: 20 }),
          section('preview', true, undefined, { priority: 90 }),
        ]}
      >
        <main>chat</main>
      </WorkbenchHost>
    );

    await waitFor(() => {
      expect(screen.getByTestId('workbench-panel').querySelector('[data-section-id="preview"]')).toHaveAttribute(
        'data-expanded',
        'true'
      );
    });
    // The point of the test: workspace was NOT displaced to make room.
    expect(screen.getByTestId('workbench-panel').querySelector('[data-section-id="workspace"]')).toHaveAttribute(
      'data-expanded',
      'true'
    );
    // Visible, not merely mounted: collapsed sections stay in the DOM under
    // `hidden`, so presence would pass even if the user could see neither.
    expect(screen.getByTestId('workspace-content')).toBeVisible();
    expect(screen.getByTestId('preview-content')).toBeVisible();
  });

  it('uses an overlay on narrow/popout surfaces while leaving chat mounted', async () => {
    render(
      <WorkbenchHost conversationId='narrow' overlay sections={[section('preview', true)]}>
        <main data-testid='chat'>chat</main>
      </WorkbenchHost>
    );
    expect(await screen.findByTestId('workbench-panel')).toHaveAttribute('data-overlay', 'true');
    expect(screen.getByTestId('chat')).toBeInTheDocument();
    expect(document.querySelector('.workbench-host__panel--overlay')).toHaveClass('absolute');
  });

  it('accepts typed descendant registrations and never mounts one section twice', async () => {
    let mounts = 0;
    let unmounts = 0;
    const Content = () => {
      useEffect(() => {
        mounts += 1;
        return () => {
          unmounts += 1;
        };
      }, []);
      return <div data-testid='plugin-content'>plugin</div>;
    };
    const Plugin = ({ tick }: { tick: number }) => {
      const registration = useMemo(
        () => section('mission', true, <Content />, { activationKey: `mission-${tick}`, priority: 50 }),
        [tick]
      );
      useWorkbenchSection(registration);
      return null;
    };

    const { rerender } = render(
      <WorkbenchHost conversationId='plugin'>
        <main>chat</main>
        <Plugin tick={1} />
      </WorkbenchHost>
    );
    expect(await screen.findByTestId('plugin-content')).toBeInTheDocument();
    expect(screen.getAllByTestId('plugin-content')).toHaveLength(1);
    expect(mounts).toBe(1);

    rerender(
      <WorkbenchHost conversationId='plugin'>
        <main>chat</main>
        <Plugin tick={2} />
      </WorkbenchHost>
    );
    await waitFor(() => expect(screen.getAllByTestId('plugin-content')).toHaveLength(1));
    expect(mounts).toBe(1);
    expect(unmounts).toBe(0);
  });

  it('honors one explicit external selection after its descendant lane registers', async () => {
    const { rerender } = render(
      <WorkbenchHost
        conversationId='activity-selection'
        requestedSectionId='projection:core'
        requestKey='activity:core:1'
        sections={[section('workspace', true)]}
      >
        <main>chat</main>
      </WorkbenchHost>
    );
    expect(await screen.findByTestId('workbench-panel')).toHaveAttribute('data-section-id', 'workspace');

    rerender(
      <WorkbenchHost
        conversationId='activity-selection'
        requestedSectionId='projection:core'
        requestKey='activity:core:1'
        sections={[
          section('workspace', true, undefined, { priority: 100 }),
          section('projection:core', true, undefined, { priority: 10 }),
        ]}
      >
        <main>chat</main>
      </WorkbenchHost>
    );

    // The deep link EXPANDS its lane. It no longer has to displace anything to
    // be honored, so the assertion is on that lane's own disclosure state
    // rather than on which single section won the panel.
    await waitFor(() => {
      expect(
        screen.getByTestId('workbench-panel').querySelector('[data-section-id="projection:core"]')
      ).toHaveAttribute('data-expanded', 'true');
    });
    expect(screen.getByTestId('projection:core-content')).toBeInTheDocument();
  });

  it('does not open an unknown external section', async () => {
    render(
      <WorkbenchHost
        conversationId='unknown-selection'
        requestedSectionId='projection:not-real'
        requestKey='activity:unknown:1'
        sections={[section('workspace', false)]}
      >
        <main data-testid='chat'>chat</main>
      </WorkbenchHost>
    );

    expect(screen.getByTestId('chat')).toBeInTheDocument();
    expect(screen.queryByTestId('workbench-panel')).not.toBeInTheDocument();
  });

  // A section row is an explicit request to SEE that section, and it must
  // outrank the provider's requestedOpen. Workspace reports
  // `requestedOpen: false` whenever the right sider is collapsed
  // (ChatLayout: workspaceEnabled && !rightSiderCollapsed), and activating it
  // used to make panelOpen false - collapsing the ENTIRE workbench to the 36px
  // rail. Live symptom: "I click workspaces and everything flashes and nothing
  // appears." No exception was thrown, which is why it hid.
  it('opens a dormant section when the user clicks its row, instead of collapsing the panel', async () => {
    render(
      <WorkbenchHost conversationId='dormant-click' sections={[section('core', true), section('workspace', false)]}>
        <main>chat</main>
      </WorkbenchHost>
    );

    const panel = await screen.findByTestId('workbench-panel');
    expect(panel).toHaveAttribute('data-section-id', 'core');

    fireEvent.click(screen.getByRole('button', { name: /workspace/i }));

    // The panel must SURVIVE and disclose, not vanish - and in a stack it also
    // must not trade one section for the other.
    const after = await screen.findByTestId('workbench-panel');
    // toBeVisible, NOT toBeInTheDocument: a collapsed section keeps its content
    // mounted under `hidden` so re-expanding never remounts it, which means
    // presence alone would pass while the user could see nothing.
    expect(screen.getByTestId('workspace-content')).toBeVisible();
    expect(after.querySelector('[data-section-id="workspace"]')).toHaveAttribute('data-expanded', 'true');
    expect(after.querySelector('[data-section-id="core"]')).toHaveAttribute('data-expanded', 'true');
  });

  it('still lets the user close a section they opened by hand', async () => {
    render(
      <WorkbenchHost conversationId='dormant-close' sections={[section('core', true), section('workspace', false)]}>
        <main>chat</main>
      </WorkbenchHost>
    );

    await screen.findByTestId('workbench-panel');
    fireEvent.click(screen.getByRole('button', { name: /workspace/i }));
    await waitFor(() =>
      expect(screen.getByTestId('workbench-panel').querySelector('[data-section-id="workspace"]')).toHaveAttribute(
        'data-expanded',
        'true'
      )
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close workbench' }));

    // Closing must retract the open intent - otherwise a dormant section would
    // spring back open on the next render.
    await waitFor(() => expect(screen.queryByTestId('workbench-panel')).not.toBeInTheDocument());
  });
});

describe('preview pane default width and the conversation floor', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    cleanup();
    withWindowWidth(1024);
  });

  /**
   * The numbers are read from the flagship deliverable's own media queries: it
   * reaches its full layout (4-up market grid AND a two-column trade panel) at
   * 900, and above 1180 its container caps so extra width is only margin. The
   * formula spends whatever the window has left after the nav rail and the
   * chat floor, up to that 900.
   */
  it('resolves the documented default width for the windows that matter', () => {
    expect(documentPaneDefaultWidth(1440)).toBe(712);
    expect(documentPaneDefaultWidth(1920)).toBe(PREVIEW_PANE_MAX);
    // A window too small to give the pane anything still cannot produce a
    // sub-minimum pane; it takes the floor and the chat overflows instead.
    expect(documentPaneDefaultWidth(900)).toBe(260);
  });

  /**
   * MEASURED WIDTH BEATS THE GUESSED RAIL.
   *
   * `NAV_RAIL_WIDTH` describes furniture outside this component, and live it
   * was wrong: the rail resolved to 281px, not 168. Asking for more room than
   * exists does not fail loudly - the layout pins the chat to its `min-width`
   * floor and the pane silently opens narrower than the number this function
   * returned. Measured in the running app on a 1209px window: host 928, pane
   * 344, chat exactly 560, while the window-only formula claimed 481.
   *
   * Given the host's real width there is nothing left to guess.
   */
  it('spends the host width it was given rather than guessing past the nav rail', () => {
    // The live case: a 1209px window whose host really has 928.
    expect(documentPaneDefaultWidth(1209, 928)).toBe(368);
    // The guess would have over-asked by the width of the rail it got wrong.
    expect(documentPaneDefaultWidth(1209)).toBe(481);
    // A host wide enough still stops at the documented cap.
    expect(documentPaneDefaultWidth(1920, 1639)).toBe(PREVIEW_PANE_MAX);
    // Unmeasured (first paint, and jsdom always) falls back to the window path.
    expect(documentPaneDefaultWidth(1440, 0)).toBe(712);
  });

  it('opens a document section at 712 on a 1440 laptop, not at the 340px rail default', async () => {
    withWindowWidth(1440);
    render(
      <WorkbenchHost
        conversationId='doc-1440'
        sections={[section('preview', true, undefined, { prefersDocumentWidth: true })]}
      >
        <main>chat</main>
      </WorkbenchHost>
    );

    await waitFor(() => expect(screen.getByTestId('workbench-panel')).toHaveStyle({ width: '712px' }));
  });

  it('caps the default at 900 on a 1920 display, where the document stops growing', async () => {
    withWindowWidth(1920);
    render(
      <WorkbenchHost
        conversationId='doc-1920'
        sections={[section('preview', true, undefined, { prefersDocumentWidth: true })]}
      >
        <main>chat</main>
      </WorkbenchHost>
    );

    await waitFor(() => expect(screen.getByTestId('workbench-panel')).toHaveStyle({ width: '900px' }));
  });

  /** A rail of controls is not a document and must keep the rail default. */
  it('leaves a section that is not a document at the rail default', async () => {
    withWindowWidth(1920);
    render(
      <WorkbenchHost conversationId='doc-none' sections={[section('workspace', true)]}>
        <main>chat</main>
      </WorkbenchHost>
    );

    expect(await screen.findByTestId('workbench-panel')).toHaveStyle({ width: '340px' });
  });

  /**
   * The floor is the prerequisite for raising the pane at all. The primary
   * column is `flex-1`, i.e. `flex-basis: 0` with `min-width: 0`, so every
   * pixel of shrink came out of the conversation and it could resolve to zero
   * beside a wide pane.
   */
  it('gives the conversation column a real 560px floor while a pane is docked', async () => {
    withWindowWidth(1440);
    render(
      <WorkbenchHost
        conversationId='floor'
        sections={[section('preview', true, undefined, { prefersDocumentWidth: true })]}
      >
        <main>chat</main>
      </WorkbenchHost>
    );

    await screen.findByTestId('workbench-panel');
    expect(CHAT_MIN_WIDTH).toBe(560);
    expect(document.querySelector('.workbench-host__primary')).toHaveStyle({ minWidth: '560px' });
    // The other half: the pane has to be ABLE to give the width back. A flex
    // item's automatic minimum is its content, so without an explicit 0 the
    // floor would only overflow the container.
    expect(screen.getByTestId('workbench-panel')).toHaveStyle({ minWidth: '0px' });
  });

  it('does not floor the conversation when the panel overlays it or is closed', async () => {
    withWindowWidth(1440);
    const overlayed = render(
      <WorkbenchHost
        conversationId='floor-overlay'
        overlay
        sections={[section('preview', true, undefined, { prefersDocumentWidth: true })]}
      >
        <main>chat</main>
      </WorkbenchHost>
    );
    await screen.findByTestId('workbench-panel');
    expect(document.querySelector('.workbench-host__primary')).not.toHaveStyle({ minWidth: '560px' });
    overlayed.unmount();

    render(
      <WorkbenchHost conversationId='floor-closed' sections={[section('preview', false)]}>
        <main>chat</main>
      </WorkbenchHost>
    );
    expect(screen.queryByTestId('workbench-panel')).not.toBeInTheDocument();
    expect(document.querySelector('.workbench-host__primary')).not.toHaveStyle({ minWidth: '560px' });
  });

  /**
   * The default is a DEFAULT. A width the user dragged outranks it, persists
   * per conversation, and survives a remount into a window whose default would
   * be something else entirely.
   */
  it('lets a dragged width beat the document default and round-trip at the 900 bound', async () => {
    withWindowWidth(1440);
    const registration = section('preview', true, undefined, { prefersDocumentWidth: true });
    const first = render(
      <WorkbenchHost conversationId='dragged' sections={[registration]}>
        <main>chat</main>
      </WorkbenchHost>
    );

    const panel = await screen.findByTestId('workbench-panel');
    await waitFor(() => expect(panel).toHaveStyle({ width: '712px' }));

    const separator = screen.getByRole('separator', { name: 'Resize workbench' });
    fireEvent.pointerDown(separator, { button: 0, pointerType: 'mouse', clientX: 500 });
    fireEvent.pointerMove(window, { clientX: 312 });
    fireEvent.pointerUp(window);
    expect(panel).toHaveStyle({ width: '900px' });

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('wayland.workbench.dragged.v2') || '{}');
      expect(stored.width).toBe(900);
      expect(stored.widthSetByUser).toBe(true);
    });

    first.unmount();
    // A DIFFERENT window, whose own default would be 472. The user's choice
    // still wins - this is the half that a naive "always apply the formula"
    // implementation silently loses.
    withWindowWidth(1200);
    render(
      <WorkbenchHost conversationId='dragged' sections={[registration]}>
        <main>chat</main>
      </WorkbenchHost>
    );
    await waitFor(() => expect(screen.getByTestId('workbench-panel')).toHaveStyle({ width: '900px' }));
  });

  /**
   * Every mount used to write the width back, so a stored 340 says nothing
   * about intent and must not be mistaken for a choice - otherwise no document
   * section could ever apply a default to an existing conversation.
   */
  it('does not mistake the rail default written by a previous mount for a user choice', async () => {
    localStorage.setItem(
      'wayland.workbench.legacy.v2',
      JSON.stringify({ collapsedIds: [], expandedIds: [], width: 340 })
    );
    withWindowWidth(1440);
    render(
      <WorkbenchHost
        conversationId='legacy'
        sections={[section('preview', true, undefined, { prefersDocumentWidth: true })]}
      >
        <main>chat</main>
      </WorkbenchHost>
    );
    await waitFor(() => expect(screen.getByTestId('workbench-panel')).toHaveStyle({ width: '712px' }));
  });

  /**
   * The pop-out control lives in the section header, beside the file name, so a
   * collapsed card still offers it. It must sit OUTSIDE the disclosure button:
   * nested buttons are invalid, and a click would otherwise toggle the section
   * underneath the control.
   */
  it('renders header actions beside the disclosure row without nesting them inside it', async () => {
    const onPopOut = vi.fn();
    render(
      <WorkbenchHost
        conversationId='header-actions'
        sections={[
          section('preview', true, undefined, {
            label: 'Preview · morning-brief.html',
            headerActions: (
              <button type='button' aria-label='Open in a new window' onClick={onPopOut}>
                pop
              </button>
            ),
          }),
        ]}
      >
        <main>chat</main>
      </WorkbenchHost>
    );

    await screen.findByTestId('workbench-panel');
    expect(screen.getByRole('button', { name: 'Preview · morning-brief.html' })).toBeInTheDocument();

    const popOut = screen.getByRole('button', { name: 'Open in a new window' });
    expect(popOut.closest('button[aria-expanded]')).toBeNull();

    fireEvent.click(popOut);
    expect(onPopOut).toHaveBeenCalledOnce();
    // The click did not also collapse the section it sits on.
    expect(screen.getByTestId('workbench-panel').querySelector('[data-section-id="preview"]')).toHaveAttribute(
      'data-expanded',
      'true'
    );
  });
});
