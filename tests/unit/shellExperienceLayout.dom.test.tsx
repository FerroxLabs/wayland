/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/renderer/components/layout/Layout', async () => {
  const ReactModule = await import('react');
  const MockLayout: React.FC<{
    shellExperience: string;
    sider: React.ReactNode;
  }> = ({ shellExperience, sider }) => {
    const [routeState, setRouteState] = ReactModule.useState(0);
    return (
      <main data-shell-experience={shellExperience}>
        <button type='button' onClick={() => setRouteState((current) => current + 1)}>
          Route state {routeState}
        </button>
        {sider}
      </main>
    );
  };
  return { default: MockLayout };
});

vi.mock('@/renderer/components/layout/Sider', () => ({
  default: () => <nav data-testid='classic-sider'>Classic sider</nav>,
}));

import ShellExperienceLayout, { type CockpitSiderLoader } from '@/renderer/components/layout/ShellExperience';

const throwingCockpitLoader =
  (message: string): CockpitSiderLoader =>
  async () => ({
    default: () => {
      throw new Error(message);
    },
  });

const missingCockpitLoader: CockpitSiderLoader = () => Promise.reject(new Error('cockpit chunk missing'));

describe('shell experience isolation', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('starts Classic without evaluating the Cockpit module', () => {
    const loadCockpit = vi.fn<CockpitSiderLoader>();

    render(<ShellExperienceLayout shell='classic' loadCockpitSider={loadCockpit} />);

    expect(screen.getByTestId('classic-sider')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('data-shell-experience', 'classic');
    expect(loadCockpit).not.toHaveBeenCalled();
  });

  it('recovers to a functional Classic shell when the Cockpit module cannot load', async () => {
    const persist = vi.fn().mockResolvedValue(undefined);

    render(
      <ShellExperienceLayout shell='cockpit' loadCockpitSider={missingCockpitLoader} persistShellExperience={persist} />
    );

    await waitFor(() => expect(screen.getByRole('main')).toHaveAttribute('data-shell-experience', 'classic'));
    expect(screen.getByTestId('classic-sider')).toBeInTheDocument();
    expect(screen.getByTestId('shell-recovery-fallback')).toHaveAttribute('data-persistence-state', 'saved');
    expect(persist).toHaveBeenCalledWith('classic');
  });

  it('contains a Cockpit render failure without remounting routed Classic content', async () => {
    const persist = vi.fn().mockResolvedValue(undefined);
    const CockpitWithCrashControl: React.FC = () => {
      const [crashed, setCrashed] = React.useState(false);
      if (crashed) throw new Error('cockpit render failed');
      return (
        <button type='button' onClick={() => setCrashed(true)}>
          Crash cockpit
        </button>
      );
    };
    const loadCockpit: CockpitSiderLoader = async () => ({ default: CockpitWithCrashControl });

    render(<ShellExperienceLayout shell='cockpit' loadCockpitSider={loadCockpit} persistShellExperience={persist} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Route state 0' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Crash cockpit' }));

    await waitFor(() => expect(screen.getByRole('main')).toHaveAttribute('data-shell-experience', 'classic'));
    expect(screen.getByRole('button', { name: 'Route state 1' })).toBeInTheDocument();
    expect(screen.getByTestId('classic-sider')).toBeInTheDocument();
  });

  it('keeps Classic operable and offers retry when preference persistence fails', async () => {
    const persist = vi.fn().mockRejectedValueOnce(new Error('storage unavailable')).mockResolvedValueOnce(undefined);

    render(
      <ShellExperienceLayout
        shell='cockpit'
        loadCockpitSider={throwingCockpitLoader('cockpit failed')}
        persistShellExperience={persist}
      />
    );

    await waitFor(() =>
      expect(screen.getByTestId('shell-recovery-fallback')).toHaveAttribute('data-persistence-state', 'failed')
    );
    expect(screen.getByRole('main')).toHaveAttribute('data-shell-experience', 'classic');
    expect(screen.getByRole('alert')).toHaveTextContent('common.saveFailed');

    fireEvent.click(screen.getByTestId('shell-recovery-retry'));

    await waitFor(() =>
      expect(screen.getByTestId('shell-recovery-fallback')).toHaveAttribute('data-persistence-state', 'saved')
    );
    expect(persist).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByTestId('shell-recovery-close'));
    expect(screen.queryByTestId('shell-recovery-fallback')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('data-shell-experience', 'classic');
  });
});
