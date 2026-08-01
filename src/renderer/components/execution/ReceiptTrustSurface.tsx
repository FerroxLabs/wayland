/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ExecutionOutcomeTrust, TrustedArtifactReceipt } from '@/common/execution';
import { Tag, Typography } from '@arco-design/web-react';
import React from 'react';

const TRUST_RANK = {
  unvalidated: 0,
  'domain-valid': 1,
  'integrity-checked': 2,
  verified: 3,
  'receipt-stale': 3,
  'source-dependency-stale': 3,
} as const;

export const ReceiptTrustSurface: React.FC<{
  trust: ExecutionOutcomeTrust;
  receipt?: TrustedArtifactReceipt;
  compact?: boolean;
}> = ({ trust, receipt, compact = false }) => {
  const stale = trust.status === 'receipt-stale' || trust.status === 'source-dependency-stale';
  const rank = TRUST_RANK[trust.status];

  return (
    <section
      className='rounded-8px border border-border-1 bg-bg-2 p-12px'
      aria-label='Outcome trust receipt'
      data-testid='receipt-trust-surface'
      data-trust-status={trust.status}
    >
      <div className='flex items-center gap-8px'>
        <Typography.Text bold>{compact ? 'Receipt' : 'Outcome receipt'}</Typography.Text>
        <Tag color={stale ? 'red' : trust.status === 'verified' ? 'green' : 'gray'}>{trust.status}</Tag>
      </div>
      {!compact && (
        <div className='mt-10px flex flex-wrap gap-6px' aria-label='Receipt validation stages'>
          <Tag color={rank >= 1 ? 'blue' : 'gray'}>Domain valid</Tag>
          <Tag color={rank >= 2 ? 'blue' : 'gray'}>Integrity checked</Tag>
          <Tag color={rank >= 3 && !stale ? 'green' : 'gray'}>Verified</Tag>
          {trust.status === 'receipt-stale' && <Tag color='red'>Receipt stale</Tag>}
          {trust.status === 'source-dependency-stale' && <Tag color='red'>Source dependency stale</Tag>}
        </div>
      )}
      {!compact && receipt && (
        <dl className='mt-10px grid grid-cols-[auto_1fr] gap-x-8px gap-y-4px text-12px'>
          <dt className='text-t-secondary'>Origin</dt>
          <dd className='m-0'>{receipt.origin}</dd>
          <dt className='text-t-secondary'>Contract</dt>
          <dd className='m-0'>{receipt.contractVersion}</dd>
          <dt className='text-t-secondary'>Artifact</dt>
          <dd className='m-0 break-all'>{receipt.artifactDigest}</dd>
          <dt className='text-t-secondary'>Gate closure</dt>
          <dd className='m-0 break-all'>{receipt.gateClosureDigest}</dd>
        </dl>
      )}
      {trust.reason && <p className='m-0 mt-8px text-12px text-t-secondary'>{trust.reason}</p>}
    </section>
  );
};

export default ReceiptTrustSurface;
