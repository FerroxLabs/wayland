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
  type WorkbenchSectionRegistration,
  useWorkbenchSection,
} from '@/renderer/pages/conversation/components/WorkbenchHost';

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
    expect(document.querySelector('.workbench-host__tabs')).toHaveClass('absolute');
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
      expect(screen.getByTestId('workbench-panel').querySelector('[data-section-id="projection:core"]')).toHaveAttribute(
        'data-expanded',
        'true'
      );
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
      <WorkbenchHost
        conversationId='dormant-click'
        sections={[section('core', true), section('workspace', false)]}
      >
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
      <WorkbenchHost
        conversationId='dormant-close'
        sections={[section('core', true), section('workspace', false)]}
      >
        <main>chat</main>
      </WorkbenchHost>
    );

    await screen.findByTestId('workbench-panel');
    fireEvent.click(screen.getByRole('button', { name: /workspace/i }));
    await waitFor(() =>
      expect(
        screen.getByTestId('workbench-panel').querySelector('[data-section-id="workspace"]')
      ).toHaveAttribute('data-expanded', 'true')
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close workbench' }));

    // Closing must retract the open intent - otherwise a dormant section would
    // spring back open on the next render.
    await waitFor(() => expect(screen.queryByTestId('workbench-panel')).not.toBeInTheDocument());
  });
});
