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
import { ConfigStorage } from '@/common/config/storage';
import { ErrorBoundary } from '@/renderer/components/ErrorBoundary';
import {
  CockpitRolloutBlockedError,
  SHELL_EXPERIENCE_CHANGED_EVENT,
  writeShellExperience,
} from '@/renderer/hooks/ui/useShellExperience';

const originalElectronAPI = window.electronAPI;

afterEach(() => {
  window.electronAPI = originalElectronAPI;
});

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

type CanonicalJourneyState = {
  conversation: {
    id: string;
    projectId: string;
    messages: ReadonlyArray<{ id: string; role: string; content: string; correlationId: string }>;
    run: { id: string; status: 'idle' | 'streaming' | 'waiting-approval'; correlationId: string };
    approval: { id: string; status: 'none' | 'waiting' };
    workspace: { path: string; open: boolean; unknownFutureField: { retained: true } };
  };
  project: { id: string; name: string; unknownCorrelationEnvelope: { traceId: string } };
};

function canonicalJourneyState(
  status: CanonicalJourneyState['conversation']['run']['status'],
  workspaceOpen = false
): CanonicalJourneyState {
  return {
    conversation: {
      id: 'conversation-m3-proof',
      projectId: 'project-m3-proof',
      messages: [
        {
          id: 'message-m3-proof',
          role: 'user',
          content: 'Preserve this canonical message.',
          correlationId: 'correlation-message-m3-proof',
        },
      ],
      run: {
        id: 'run-m3-proof',
        status,
        correlationId: 'correlation-run-m3-proof',
      },
      approval: {
        id: 'approval-m3-proof',
        status: status === 'waiting-approval' ? 'waiting' : 'none',
      },
      workspace: {
        path: '/tmp/wayland-m3-workspace',
        open: workspaceOpen,
        unknownFutureField: { retained: true },
      },
    },
    project: {
      id: 'project-m3-proof',
      name: 'M3 continuity project',
      unknownCorrelationEnvelope: { traceId: 'trace-m3-proof' },
    },
  };
}

function journeyRoot(shell: 'classic' | 'cockpit', state: CanonicalJourneyState): React.FC {
  return function JourneyRoot() {
    return (
      <main
        data-shell-experience={shell}
        data-testid={`${shell}-journey-root`}
        data-conversation-id={state.conversation.id}
        data-project-id={state.project.id}
        data-message-count={state.conversation.messages.length}
        data-run-id={state.conversation.run.id}
        data-run-status={state.conversation.run.status}
        data-approval-status={state.conversation.approval.status}
        data-workspace-open={String(state.conversation.workspace.open)}
        data-trace-id={state.project.unknownCorrelationEnvelope.traceId}
      />
    );
  };
}

function SharedCanonicalServiceFailure(): never {
  throw new Error('canonical conversation service unavailable');
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

  it.each([
    ['idle', false],
    ['streaming', false],
    ['waiting-approval', false],
    ['idle', true],
  ] as const)(
    'keeps one canonical conversation intact across Classic, Cockpit, and restart while %s (workspace open: %s)',
    async (status, workspaceOpen) => {
      const canonical = canonicalJourneyState(status, workspaceOpen);
      const exactBefore = JSON.stringify(canonical);
      const loadClassicRoot = vi.fn<ClassicShellRootLoader>(async () => ({
        default: journeyRoot('classic', canonical),
      }));
      const loadCockpitRoot = vi.fn<CockpitShellRootLoader>(async () => ({
        default: journeyRoot('cockpit', canonical),
      }));

      const firstLaunch = render(
        <ShellExperienceLayout shell='classic' loadClassicRoot={loadClassicRoot} loadCockpitRoot={loadCockpitRoot} />
      );
      const classic = await screen.findByTestId('classic-journey-root');
      expect(classic).toHaveAttribute('data-conversation-id', 'conversation-m3-proof');
      expect(classic).toHaveAttribute('data-run-status', status);
      expect(classic).toHaveAttribute('data-workspace-open', String(workspaceOpen));

      firstLaunch.rerender(
        <ShellExperienceLayout shell='cockpit' loadClassicRoot={loadClassicRoot} loadCockpitRoot={loadCockpitRoot} />
      );
      const cockpit = await screen.findByTestId('cockpit-journey-root');
      expect(cockpit).toHaveAttribute('data-conversation-id', classic.getAttribute('data-conversation-id'));
      expect(cockpit).toHaveAttribute('data-project-id', classic.getAttribute('data-project-id'));
      expect(cockpit).toHaveAttribute('data-message-count', classic.getAttribute('data-message-count'));
      expect(cockpit).toHaveAttribute('data-run-id', classic.getAttribute('data-run-id'));
      expect(cockpit).toHaveAttribute('data-approval-status', classic.getAttribute('data-approval-status'));
      expect(cockpit).toHaveAttribute('data-trace-id', 'trace-m3-proof');

      // A Desktop restart remounts presentation roots while canonical services
      // remain authoritative. Reuse the same copied state and prove that the
      // shell never rewrites or duplicates its records.
      firstLaunch.unmount();
      const restarted = render(
        <ShellExperienceLayout shell='cockpit' loadClassicRoot={loadClassicRoot} loadCockpitRoot={loadCockpitRoot} />
      );
      const afterRestart = await screen.findByTestId('cockpit-journey-root');
      expect(afterRestart).toHaveAttribute('data-conversation-id', 'conversation-m3-proof');
      expect(afterRestart).toHaveAttribute('data-message-count', '1');
      expect(JSON.stringify(canonical)).toBe(exactBefore);
      restarted.unmount();
    }
  );

  it('writes only ui.shell and leaves copied canonical, correlation, and unknown fields byte-equivalent', async () => {
    const copiedState = canonicalJourneyState('waiting-approval', true);
    const exactBefore = JSON.stringify(copiedState);
    const storageSet = vi.spyOn(ConfigStorage, 'set').mockResolvedValue(undefined);
    const events: unknown[] = [];
    const capture = (event: Event) => events.push((event as CustomEvent<unknown>).detail);
    window.addEventListener(SHELL_EXPERIENCE_CHANGED_EVENT, capture);
    window.electronAPI = {
      emit: vi.fn(),
      on: vi.fn(),
      cockpitRolloutStatus: vi.fn(async () => ({
        eligible: true,
        stage: 'internal-dogfood',
        source: 'development',
        reason: 'development-build',
      })),
    };

    await writeShellExperience('cockpit');

    expect(storageSet).toHaveBeenCalledTimes(1);
    expect(storageSet).toHaveBeenCalledWith('ui.shell', 'cockpit');
    expect(events).toEqual(['cockpit']);
    expect(JSON.stringify(copiedState)).toBe(exactBefore);
    expect(copiedState.conversation.messages).toHaveLength(1);
    expect(copiedState.conversation.run.correlationId).toBe('correlation-run-m3-proof');
    expect(copiedState.conversation.workspace.unknownFutureField).toEqual({ retained: true });

    window.removeEventListener(SHELL_EXPERIENCE_CHANGED_EVENT, capture);
    storageSet.mockRestore();
  });

  it('fails closed before persisting Cockpit when Desktop rollout authority is unavailable', async () => {
    const storageSet = vi.spyOn(ConfigStorage, 'set').mockResolvedValue(undefined);
    window.electronAPI = {
      emit: vi.fn(),
      on: vi.fn(),
      cockpitRolloutStatus: vi.fn(async () => ({
        eligible: false,
        stage: null,
        source: 'none',
        reason: 'authority-missing',
      })),
    };

    await expect(writeShellExperience('cockpit')).rejects.toBeInstanceOf(CockpitRolloutBlockedError);
    expect(storageSet).not.toHaveBeenCalled();

    storageSet.mockRestore();
  });

  it('activates Classic for the session even when preference persistence fails', async () => {
    const storageSet = vi.spyOn(ConfigStorage, 'set').mockRejectedValue(new Error('profile is read-only'));
    const events: unknown[] = [];
    const capture = (event: Event) => events.push((event as CustomEvent<unknown>).detail);
    window.addEventListener(SHELL_EXPERIENCE_CHANGED_EVENT, capture);
    window.electronAPI = {
      emit: vi.fn(),
      on: vi.fn(),
    };

    await expect(writeShellExperience('classic')).rejects.toThrow('profile is read-only');
    expect(events).toEqual(['classic']);
    expect(storageSet).toHaveBeenCalledWith('ui.shell', 'classic');

    window.removeEventListener(SHELL_EXPERIENCE_CHANGED_EVENT, capture);
    storageSet.mockRestore();
  });

  it('escalates a shared canonical-service failure to the outer recovery boundary without claiming shell recovery', async () => {
    const loadClassicRoot = vi.fn<ClassicShellRootLoader>();
    const loadCockpitRoot = vi.fn<CockpitShellRootLoader>();

    render(
      <ErrorBoundary fallback={(error) => <div data-testid='root-recovery'>{error.message}</div>}>
        <SharedCanonicalServiceFailure />
        <ShellExperienceLayout shell='cockpit' loadClassicRoot={loadClassicRoot} loadCockpitRoot={loadCockpitRoot} />
      </ErrorBoundary>
    );

    expect(await screen.findByTestId('root-recovery')).toHaveTextContent('canonical conversation service unavailable');
    expect(screen.queryByTestId('shell-recovery-fallback')).not.toBeInTheDocument();
    expect(loadClassicRoot).not.toHaveBeenCalled();
    expect(loadCockpitRoot).not.toHaveBeenCalled();
  });
});
