/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  evaluateConsequentialAction,
  type ConsequentialActionPreview,
  type ExecutionSnapshot,
} from '@/common/execution';
import { Tag, Typography } from '@arco-design/web-react';
import React, { useMemo } from 'react';

export const ConsequentialPolicyPreview: React.FC<{
  snapshot: ExecutionSnapshot;
  action: ConsequentialActionPreview;
  now?: number;
}> = ({ snapshot, action, now = Date.now() }) => {
  const decision = useMemo(() => evaluateConsequentialAction(snapshot, action, now), [action, now, snapshot]);
  const scope = action.scope;

  return (
    <section
      className='rounded-8px border border-border-1 bg-bg-2 p-12px'
      aria-label='Consequential action policy preview'
      data-testid='consequential-policy-preview'
      data-policy-status={decision.status}
    >
      <div className='flex items-center justify-between gap-8px'>
        <Typography.Text bold>Action preview</Typography.Text>
        <Tag color={decision.status === 'allowed' ? 'green' : 'orange'}>
          {decision.status === 'allowed' ? 'Policy allows' : 'Needs you'}
        </Tag>
      </div>
      <dl className='mt-10px grid grid-cols-[auto_1fr] gap-x-8px gap-y-4px text-12px'>
        <dt className='text-t-secondary'>Identity</dt>
        <dd className='m-0 break-all'>{action.identity.runId}</dd>
        <dt className='text-t-secondary'>Destination</dt>
        <dd className='m-0'>{action.destination || 'Not provided'}</dd>
        <dt className='text-t-secondary'>Effect</dt>
        <dd className='m-0'>{action.effect || 'Not provided'}</dd>
        <dt className='text-t-secondary'>Scope</dt>
        <dd className='m-0'>
          {[
            scope.host,
            scope.surface,
            scope.scheduled ? 'scheduled' : 'interactive',
            scope.channel,
            scope.teamId,
            scope.browserSessionId,
          ]
            .filter(Boolean)
            .join(' · ')}
        </dd>
        <dt className='text-t-secondary'>Policy</dt>
        <dd className='m-0'>
          {snapshot.trustedPolicy.status === 'trusted'
            ? `${snapshot.trustedPolicy.posture} · ${snapshot.trustedPolicy.approvals} · ${snapshot.trustedPolicy.sandbox}`
            : 'Trusted Core policy unavailable'}
        </dd>
      </dl>
      {decision.reasons.length > 0 && (
        <ul className='m-0 mt-8px pl-18px text-12px text-t-secondary'>
          {decision.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ConsequentialPolicyPreview;
