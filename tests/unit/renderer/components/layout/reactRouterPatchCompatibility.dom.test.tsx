/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { Link, Outlet, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({ status: 'authenticated' }));
vi.mock('@/renderer/hooks/context/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('@/renderer/components/layout/AppLoader', () => ({ default: () => <div>Loading</div> }));
vi.mock('@/renderer/components/onboarding/OnboardingOverlay', () => ({ default: () => null }));
vi.mock('@/renderer/components/shell/ShellChoice/ShellChoiceOverlay', () => ({ default: () => null }));
vi.mock('@/renderer/pages/guid', () => ({ default: () => <div data-testid='home-page' /> }));
vi.mock('@/renderer/pages/login', () => ({ default: () => <div data-testid='login-page' /> }));
vi.mock('@/renderer/pages/conversation', () => ({ default: () => <RoutePayload name='conversation' /> }));
vi.mock('@/renderer/pages/team', () => ({ default: () => <RoutePayload name='team' /> }));
vi.mock('@/renderer/pages/settings/GeneralSettings', () => ({
  default: () => <div data-testid='settings-page' />,
}));

import PanelRoute from '@/renderer/components/layout/Router';

function RoutePayload({ name }: { name: string }): React.ReactElement {
  const { id } = useParams();
  const [search] = useSearchParams();
  return <div data-testid={`${name}-page`}>{JSON.stringify({ id, query: search.get('q') })}</div>;
}

let navigate: ReturnType<typeof useNavigate>;

function Layout(): React.ReactElement {
  const routerNavigate = useNavigate();
  const location = useLocation();
  React.useEffect(() => {
    navigate = routerNavigate;
  }, [routerNavigate]);
  return (
    <>
      <nav aria-label='Fixture navigation'>
        <Link to='/guid'>Home</Link>
        <Link to='/conversation/conversation-1'>Conversation</Link>
        <Link to='/team/team-1'>Team</Link>
        <Link to='/settings/general'>Settings</Link>
      </nav>
      <div data-testid='location'>{location.pathname + location.search}</div>
      <Outlet />
    </>
  );
}

async function mount(path = '/guid', page = 'home'): Promise<void> {
  window.history.replaceState(null, '', `/#${path}`);
  render(<PanelRoute layout={<Layout />} />);
  await screen.findByTestId(`${page}-page`);
}

describe('installed HashRouter compatibility through PanelRoute', () => {
  beforeEach(() => {
    auth.status = 'authenticated';
  });

  afterEach(() => {
    cleanup();
    delete document.documentElement.dataset.routerScriptExecuted;
  });

  it('keeps home, conversation, team and settings links in the current document', async () => {
    await mount();
    const documentUrl = window.location.href.split('#')[0];

    for (const [label, page, path] of [
      ['Conversation', 'conversation', '/conversation/conversation-1'],
      ['Team', 'team', '/team/team-1'],
      ['Settings', 'settings', '/settings/general'],
      ['Home', 'home', '/guid'],
    ]) {
      fireEvent.click(screen.getByRole('link', { name: label }));
      expect(await screen.findByTestId(`${page}-page`)).toBeInTheDocument();
      expect(window.location.href).toBe(`${documentUrl}#${path}`);
    }
  });

  it('decodes conversation parameters and search values on a direct deep link', async () => {
    const id = 'session/with spaces/日本語';
    const query = 'a+b & c/#?';
    await mount(`/conversation/${encodeURIComponent(id)}?q=${encodeURIComponent(query)}`, 'conversation');

    expect(screen.getByTestId('conversation-page').textContent).toBe(JSON.stringify({ id, query }));
  });

  it('pushes programmatic navigation and replaces without adding a history entry', async () => {
    await mount();
    const initialLength = window.history.length;
    act(() => {
      void navigate('/conversation/first');
    });
    await screen.findByTestId('conversation-page');
    expect(window.history.length).toBe(initialLength + 1);

    act(() => {
      void navigate('/team/replacement', { replace: true });
    });
    await screen.findByTestId('team-page');
    expect(window.history.length).toBe(initialLength + 1);
    expect(screen.getByTestId('location').textContent).toBe('/team/replacement');
  });

  it('traverses back and forward through the real hash history', async () => {
    await mount();
    fireEvent.click(screen.getByRole('link', { name: 'Conversation' }));
    await screen.findByTestId('conversation-page');
    fireEvent.click(screen.getByRole('link', { name: 'Settings' }));
    await screen.findByTestId('settings-page');

    act(() => {
      void navigate(-1);
    });
    expect(await screen.findByTestId('conversation-page')).toBeInTheDocument();
    act(() => {
      void navigate(1);
    });
    expect(await screen.findByTestId('settings-page')).toBeInTheDocument();
  });

  it('replaces unknown routes with the authenticated home route', async () => {
    await mount('/missing/route');
    expect(window.location.hash).toBe('#/guid');
  });

  it('renders a bounded long conversation ID without blanking the route', async () => {
    const id = 'x'.repeat(8192);
    await mount(`/conversation/${id}`, 'conversation');
    expect(screen.getByTestId('conversation-page').textContent).toBe(JSON.stringify({ id, query: null }));
  });

  it.each(['/conversation/private%2Fsession?q=secret', `/missing/${'x'.repeat(8192)}`])(
    'preserves the unauthenticated redirect for a deep link',
    async (path) => {
      auth.status = 'unauthenticated';
      await mount(path, 'login');
      expect(window.location.hash).toBe('#/login');
      expect(screen.queryByTestId('conversation-page')).not.toBeInTheDocument();
    }
  );

  it('redirects authenticated login visits to home', async () => {
    await mount('/login');
    expect(window.location.hash).toBe('#/guid');
  });

  it('rejects script URL navigation before changing the document or running the sentinel', async () => {
    await mount();
    const currentUrl = window.location.href;
    document.documentElement.dataset.routerScriptExecuted = 'false';

    expect(() => navigate("javascript:document.documentElement.dataset.routerScriptExecuted='true'")).toThrow(
      'External navigation is not allowed'
    );
    expect(document.documentElement.dataset.routerScriptExecuted).toBe('false');
    expect(window.location.href).toBe(currentUrl);
  });
});
