/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ShellExperience } from '@/common/shellExperience';
import { ErrorBoundary } from '@renderer/components/ErrorBoundary';
import { activateShellExperienceForSession, writeShellExperience } from '@renderer/hooks/ui/useShellExperience';
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Layout from '../Layout';
import ShellRecoveryFallback, { type ShellRecoveryPersistenceState } from './ShellRecoveryFallback';
import Sider from '../Sider';

type SiderComponent = React.ComponentType;
export type CockpitSiderLoader = () => Promise<{ default: SiderComponent }>;

type RecoveryState = {
  error: Error;
  persistenceState: ShellRecoveryPersistenceState;
};

type ShellExperienceLayoutProps = {
  shell: ShellExperience;
  loadCockpitSider?: CockpitSiderLoader;
  persistShellExperience?: (shell: ShellExperience) => Promise<void>;
};

const defaultCockpitSiderLoader: CockpitSiderLoader = () => import('../CockpitSider');

const FailedCockpitSider: React.FC<{ error: Error; onFailure: (error: Error) => void }> = ({ error, onFailure }) => {
  const reported = useRef(false);

  React.useEffect(() => {
    if (reported.current) return;
    reported.current = true;
    onFailure(error);
  }, [error, onFailure]);

  return <Sider />;
};

/**
 * Keeps the proven Classic shell outside Cockpit's module and render failure domain.
 * The routed outlet remains mounted while only the sider implementation changes.
 */
const ShellExperienceLayout: React.FC<ShellExperienceLayoutProps> = ({
  shell,
  loadCockpitSider = defaultCockpitSiderLoader,
  persistShellExperience = writeShellExperience,
}) => {
  const [runtimeClassic, setRuntimeClassic] = useState(false);
  const [recovery, setRecovery] = useState<RecoveryState | null>(null);
  const previousShell = useRef(shell);
  const LazyCockpitSider = useMemo(() => React.lazy(loadCockpitSider), [loadCockpitSider]);

  useEffect(() => {
    // A later, explicit Classic -> Cockpit selection is a fresh opt-in. It is
    // the only transition that clears a prior session-only recovery override.
    if (previousShell.current === 'classic' && shell === 'cockpit') {
      setRuntimeClassic(false);
      setRecovery(null);
    }
    previousShell.current = shell;
  }, [shell]);

  const persistClassic = useCallback(
    (error: Error) => {
      setRecovery({ error, persistenceState: 'saving' });
      void persistShellExperience('classic').then(
        () => setRecovery((current) => (current ? { ...current, persistenceState: 'saved' } : current)),
        () => setRecovery((current) => (current ? { ...current, persistenceState: 'failed' } : current))
      );
    },
    [persistShellExperience]
  );

  const recoverToClassic = useCallback(
    (error: Error) => {
      // Runtime recovery and durable preference are deliberately separate. A
      // storage failure must never strand the user in the broken experience.
      setRuntimeClassic(true);
      activateShellExperienceForSession('classic');
      persistClassic(error);
    },
    [persistClassic]
  );

  const effectiveShell: ShellExperience = runtimeClassic ? 'classic' : shell;
  const sider =
    effectiveShell === 'cockpit' ? (
      <ErrorBoundary
        fallback={(error) => <FailedCockpitSider error={error} onFailure={recoverToClassic} />}
        resetKeys={[loadCockpitSider]}
      >
        <Suspense fallback={<Sider />}>
          <LazyCockpitSider />
        </Suspense>
      </ErrorBoundary>
    ) : (
      <Sider />
    );

  return (
    <>
      <Layout shellExperience={effectiveShell} sider={sider} />
      {recovery && (
        <ShellRecoveryFallback
          error={recovery.error}
          persistenceState={recovery.persistenceState}
          onRetry={() => persistClassic(recovery.error)}
          onClose={() => setRecovery(null)}
        />
      )}
    </>
  );
};

export default ShellExperienceLayout;
