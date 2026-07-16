/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ShellExperience } from '@/common/shellExperience';
import { ErrorBoundary } from '@renderer/components/ErrorBoundary';
import { activateShellExperienceForSession, writeShellExperience } from '@renderer/hooks/ui/useShellExperience';
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CockpitShellRootProps } from './CockpitShellRoot';
import ShellRecoveryFallback, { type ShellRecoveryPersistenceState } from './ShellRecoveryFallback';

type ShellRootModule<Props> = { default: React.ComponentType<Props> };

export type ClassicShellRootLoader = () => Promise<ShellRootModule<Record<string, never>>>;
export type CockpitShellRootLoader = () => Promise<ShellRootModule<CockpitShellRootProps>>;

type RecoveryState = {
  error: Error;
  persistenceState: ShellRecoveryPersistenceState;
};

type ShellExperienceLayoutProps = {
  shell: ShellExperience;
  loadClassicRoot?: ClassicShellRootLoader;
  loadCockpitRoot?: CockpitShellRootLoader;
  cockpitRootProps?: CockpitShellRootProps;
  persistShellExperience?: (shell: ShellExperience) => Promise<void>;
};

const defaultClassicRootLoader: ClassicShellRootLoader = () => import('./ClassicShellRoot');
const defaultCockpitRootLoader: CockpitShellRootLoader = () => import('./CockpitShellRoot');

const FailedCockpitRoot: React.FC<{
  error: Error;
  onFailure: (error: Error) => void;
  ClassicRoot: React.LazyExoticComponent<React.ComponentType<Record<string, never>>>;
}> = ({ error, onFailure, ClassicRoot }) => {
  const reported = useRef(false);

  useEffect(() => {
    if (reported.current) return;
    reported.current = true;
    onFailure(error);
  }, [error, onFailure]);

  // Classic is loaded independently from the failed Cockpit graph. This is
  // also the first recovery frame, before the session preference event lands.
  return (
    <Suspense fallback={null}>
      <ClassicRoot />
    </Suspense>
  );
};

/**
 * Chooses between independently loaded shell composition roots. Canonical
 * routes and domain state remain owned by the router and stores above this
 * boundary; neither root copies user data.
 */
const ShellExperienceLayout: React.FC<ShellExperienceLayoutProps> = ({
  shell,
  loadClassicRoot = defaultClassicRootLoader,
  loadCockpitRoot = defaultCockpitRootLoader,
  cockpitRootProps,
  persistShellExperience = writeShellExperience,
}) => {
  const [runtimeClassic, setRuntimeClassic] = useState(false);
  const [recovery, setRecovery] = useState<RecoveryState | null>(null);
  const previousShell = useRef(shell);
  const LazyClassicRoot = useMemo(() => React.lazy(loadClassicRoot), [loadClassicRoot]);
  const LazyCockpitRoot = useMemo(() => React.lazy(loadCockpitRoot), [loadCockpitRoot]);

  useEffect(() => {
    // A later explicit Classic -> Cockpit selection is a fresh opt-in and the
    // only transition that clears a prior session-only recovery override.
    if (previousShell.current === 'classic' && shell === 'cockpit') {
      setRuntimeClassic(false);
      setRecovery(null);
    }
    previousShell.current = shell;
  }, [shell]);

  const recoverToClassic = useCallback((error: Error) => {
    setRuntimeClassic(true);
    setRecovery({ error, persistenceState: 'idle' });
    activateShellExperienceForSession('classic');
  }, []);

  const saveClassicAsDefault = useCallback(() => {
    setRecovery((current) => (current ? { ...current, persistenceState: 'saving' } : current));
    void persistShellExperience('classic').then(
      () => setRecovery((current) => (current ? { ...current, persistenceState: 'saved' } : current)),
      () => setRecovery((current) => (current ? { ...current, persistenceState: 'failed' } : current))
    );
  }, [persistShellExperience]);

  const effectiveShell: ShellExperience = runtimeClassic ? 'classic' : shell;

  return (
    <>
      {effectiveShell === 'classic' ? (
        <Suspense fallback={null}>
          <LazyClassicRoot />
        </Suspense>
      ) : (
        <ErrorBoundary
          fallback={(error) => (
            <FailedCockpitRoot error={error} onFailure={recoverToClassic} ClassicRoot={LazyClassicRoot} />
          )}
          resetKeys={[loadCockpitRoot, cockpitRootProps]}
        >
          <Suspense fallback={null}>
            <LazyCockpitRoot {...cockpitRootProps} />
          </Suspense>
        </ErrorBoundary>
      )}
      {recovery && (
        <ShellRecoveryFallback
          error={recovery.error}
          persistenceState={recovery.persistenceState}
          onSaveDefault={saveClassicAsDefault}
          onClose={() => setRecovery(null)}
        />
      )}
    </>
  );
};

export default ShellExperienceLayout;
