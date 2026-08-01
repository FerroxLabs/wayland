/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ExecutionSnapshot } from '@/common/execution';
import React, { useMemo } from 'react';
import { useWorkbenchSection, type WorkbenchSectionRegistration } from '..';
import { deriveWorkbenchProjections, type WorkbenchProjection } from './model';
import ProjectionPanel from './ProjectionPanel';

const ProjectionRegistration: React.FC<{
  projection: WorkbenchProjection;
  snapshot: ExecutionSnapshot;
}> = ({ projection, snapshot }) => {
  const registration = useMemo<WorkbenchSectionRegistration>(
    () => ({
      id: `projection:${projection.id}`,
      label: projection.label,
      priority: projection.priority,
      available: true,
      requestedOpen: true,
      activationKey: `${snapshot.identity.runId}:${projection.id}:${projection.facets
        .map((item) => `${item.id}:${item.evidence.map((evidence) => evidence.id).join(',')}`)
        .join('|')}`,
      testId: `workbench-projection-${projection.id}`,
      content: <ProjectionPanel projection={projection} snapshot={snapshot} />,
    }),
    [projection, snapshot]
  );
  useWorkbenchSection(registration);
  return null;
};

const ExecutionWorkbenchProjections: React.FC<{ snapshot: ExecutionSnapshot }> = ({ snapshot }) => {
  const projections = useMemo(() => deriveWorkbenchProjections(snapshot), [snapshot]);
  return (
    <>
      {projections.map((projection) => (
        <ProjectionRegistration key={projection.id} projection={projection} snapshot={snapshot} />
      ))}
    </>
  );
};

export { deriveWorkbenchProjections } from './model';
export default ExecutionWorkbenchProjections;
