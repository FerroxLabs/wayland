/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const translations: Record<string, string> = {
  'common.close': 'Cerrar',
  'common.shellRecovery.preview': 'Vista previa de Cockpit',
  'common.shellRecovery.title': 'Cockpit no pudo abrirse de forma segura.',
  'common.shellRecovery.sessionBody': 'Classic está activo durante esta sesión. Tus datos y tu ruta no se han movido.',
  'common.shellRecovery.useClassicDefault': 'Usar Classic de forma predeterminada',
  'common.shellRecovery.savingDefault': 'Guardando Classic como predeterminado…',
  'common.shellRecovery.savedDefault': 'Classic se usará de forma predeterminada.',
  'common.shellRecovery.saveFailed':
    'Classic sigue activo durante esta sesión, pero no se pudo guardar como predeterminado.',
  'common.shellRecovery.retrySave': 'Reintentar guardado',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => translations[key] ?? key }),
}));

vi.mock('electron-log/renderer', () => ({
  default: { error: vi.fn() },
}));

vi.mock('@/renderer/components/layout/Layout', () => ({
  default: ({ shellExperience, sider }: { shellExperience: string; sider: React.ReactNode }) => (
    <main data-shell-experience={shellExperience}>
      {sider}
      <div data-testid='canonical-route'>Canonical route</div>
    </main>
  ),
}));

vi.mock('@/renderer/components/layout/Sider', () => ({
  default: () => <nav data-testid='classic-sider'>Classic sider</nav>,
}));

vi.mock('@/renderer/components/layout/CockpitSider', () => ({
  default: () => <nav data-testid='cockpit-sider'>Cockpit sider</nav>,
}));

import ShellExperienceLayout, {
  type ClassicShellRootLoader,
  type CockpitShellRootLoader,
} from '@/renderer/components/layout/ShellExperience';
import { SHELL_EXPERIENCE_CHANGED_EVENT } from '@/renderer/hooks/ui/useShellExperience';

const missingCockpitLoader: CockpitShellRootLoader = () => Promise.reject(new Error('cockpit chunk missing'));

const throwingCockpitLoader =
  (message: string): CockpitShellRootLoader =>
  async () => ({
    default: () => {
      throw new Error(message);
    },
  });

async function expectClassicRecovery(): Promise<void> {
  await waitFor(() => expect(screen.getByRole('main')).toHaveAttribute('data-shell-experience', 'classic'));
  expect(screen.getByTestId('classic-sider')).toBeInTheDocument();
  expect(screen.getByTestId('canonical-route')).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.getByTestId('shell-recovery-fallback')).toHaveAttribute('data-persistence-state', 'idle')
  );
}

describe('shell experience composition-root isolation', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('boots Classic without invoking or evaluating the Cockpit loader', async () => {
    const loadClassicRoot = vi.fn<ClassicShellRootLoader>(async () => ({
      default: () => <main data-shell-experience='classic'>Independent Classic root</main>,
    }));
    const loadCockpitRoot = vi.fn<CockpitShellRootLoader>();

    render(
      <ShellExperienceLayout shell='classic' loadClassicRoot={loadClassicRoot} loadCockpitRoot={loadCockpitRoot} />
    );

    expect(await screen.findByText('Independent Classic root')).toBeInTheDocument();
    expect(loadClassicRoot).toHaveBeenCalledTimes(1);
    expect(loadCockpitRoot).not.toHaveBeenCalled();
  });

  it('boots Cockpit without invoking the independent Classic loader when Cockpit is healthy', async () => {
    const loadClassicRoot = vi.fn<ClassicShellRootLoader>();
    const loadCockpitRoot = vi.fn<CockpitShellRootLoader>(async () => ({
      default: () => <main data-shell-experience='cockpit'>Independent Cockpit root</main>,
    }));

    render(
      <ShellExperienceLayout shell='cockpit' loadClassicRoot={loadClassicRoot} loadCockpitRoot={loadCockpitRoot} />
    );

    expect(await screen.findByText('Independent Cockpit root')).toBeInTheDocument();
    expect(loadCockpitRoot).toHaveBeenCalledTimes(1);
    expect(loadClassicRoot).not.toHaveBeenCalled();
  });

  it('falls through to the independent Classic root when the Cockpit module import fails', async () => {
    render(<ShellExperienceLayout shell='cockpit' loadCockpitRoot={missingCockpitLoader} />);

    await expectClassicRecovery();
  });

  it('falls through to the independent Classic root when the Cockpit root render fails', async () => {
    render(<ShellExperienceLayout shell='cockpit' loadCockpitRoot={throwingCockpitLoader('root render failed')} />);

    await expectClassicRecovery();
  });

  it('falls through to the independent Classic root when an injected route render fails', async () => {
    render(
      <ShellExperienceLayout
        shell='cockpit'
        cockpitRootProps={{
          faultInjection: {
            renderRoute: () => {
              throw new Error('route render failed');
            },
          },
        }}
      />
    );

    await expectClassicRecovery();
  });

  it('falls through to the independent Classic root when injected state initialization fails', async () => {
    render(
      <ShellExperienceLayout
        shell='cockpit'
        cockpitRootProps={{
          faultInjection: {
            initializeState: () => {
              throw new Error('state initialization failed');
            },
          },
        }}
      />
    );

    await expectClassicRecovery();
  });

  it('persists Classic only by explicit localized action and reports save failure honestly', async () => {
    const persist = vi.fn().mockRejectedValueOnce(new Error('storage unavailable')).mockResolvedValueOnce(undefined);
    const sessionActivations: unknown[] = [];
    const captureSessionActivation = (event: Event) => {
      sessionActivations.push((event as CustomEvent<unknown>).detail);
    };
    window.addEventListener(SHELL_EXPERIENCE_CHANGED_EVENT, captureSessionActivation);

    render(
      <ShellExperienceLayout shell='cockpit' loadCockpitRoot={missingCockpitLoader} persistShellExperience={persist} />
    );

    await expectClassicRecovery();
    expect(sessionActivations).toEqual(['classic']);
    expect(persist).not.toHaveBeenCalled();
    expect(screen.getByText('Cockpit no pudo abrirse de forma segura.')).toBeInTheDocument();
    expect(
      screen.getByText('Classic está activo durante esta sesión. Tus datos y tu ruta no se han movido.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Usar Classic de forma predeterminada' }));

    await waitFor(() =>
      expect(screen.getByTestId('shell-recovery-fallback')).toHaveAttribute('data-persistence-state', 'failed')
    );
    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledWith('classic');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Classic sigue activo durante esta sesión, pero no se pudo guardar como predeterminado.'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar guardado' }));

    await waitFor(() =>
      expect(screen.getByTestId('shell-recovery-fallback')).toHaveAttribute('data-persistence-state', 'saved')
    );
    expect(persist).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('status')).toHaveTextContent('Classic se usará de forma predeterminada.');
    window.removeEventListener(SHELL_EXPERIENCE_CHANGED_EVENT, captureSessionActivation);
  });
});
