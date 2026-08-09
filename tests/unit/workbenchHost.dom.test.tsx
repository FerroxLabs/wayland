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
      expect(JSON.parse(localStorage.getItem('wayland.workbench.resize.v1') || '{}').width).toBe(460);
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

  it('a pinned section resists unrelated relevance activation', async () => {
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
    expect(await screen.findByTestId('workbench-panel')).toHaveAttribute('data-section-id', 'workspace');
    fireEvent.click(screen.getByRole('button', { name: 'Pin workbench section' }));

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
    expect(screen.getByTestId('workbench-panel')).toHaveAttribute('data-section-id', 'workspace');
    expect(screen.getByRole('button', { name: 'Unpin workbench section' })).toHaveAttribute('aria-pressed', 'true');
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
    fireEvent.click(screen.getByRole('button', { name: 'Pin workbench section' }));

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

    await waitFor(() => {
      expect(screen.getByTestId('workbench-panel')).toHaveAttribute('data-section-id', 'projection:core');
    });
    expect(screen.getByRole('button', { name: 'Pin workbench section' })).toHaveAttribute('aria-pressed', 'false');
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

    // The panel must SURVIVE and navigate, not vanish.
    const after = await screen.findByTestId('workbench-panel');
    expect(after).toHaveAttribute('data-section-id', 'workspace');
    expect(screen.getByTestId('workspace-content')).toBeInTheDocument();
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
      expect(screen.getByTestId('workbench-panel')).toHaveAttribute('data-section-id', 'workspace')
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close workbench' }));

    // Closing must retract the open intent - otherwise a dormant section would
    // spring back open on the next render.
    await waitFor(() => expect(screen.queryByTestId('workbench-panel')).not.toBeInTheDocument());
  });
});
