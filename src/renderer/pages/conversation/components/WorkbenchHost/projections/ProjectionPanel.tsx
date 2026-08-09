/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ExecutionOutcomeTrust, ExecutionSnapshot, TrustedArtifactReceipt } from '@/common/execution';
import ConsequentialPolicyPreview from '@/renderer/components/execution/ConsequentialPolicyPreview';
import ReceiptTrustSurface from '@/renderer/components/execution/ReceiptTrustSurface';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import type { WorkbenchProjection } from './model';

const trustedArtifactReceipt = (snapshot: ExecutionSnapshot, receiptId: string) =>
  snapshot.receipts.find(
    (receipt): receipt is TrustedArtifactReceipt =>
      receipt.id === receiptId &&
      receipt.kind === 'artifact' &&
      receipt.authority === 'core' &&
      'origin' in receipt &&
      receipt.origin === 'core/anvil'
  );

const failClosedTrust = (
  snapshot: ExecutionSnapshot,
  trust: ExecutionOutcomeTrust
): Readonly<{ trust: ExecutionOutcomeTrust; receipt?: TrustedArtifactReceipt }> => {
  const receipt = trustedArtifactReceipt(snapshot, trust.receiptId);
  if (receipt && receipt.artifactDigest === trust.artifactDigest) return { trust, receipt };
  return {
    trust: {
      ...trust,
      status: 'unvalidated',
      reason: receipt
        ? 'Receipt artifact digest does not match outcome evidence.'
        : 'Trusted Core receipt unavailable.',
    },
  };
};

const ProjectionPanel: React.FC<{ projection: WorkbenchProjection; snapshot: ExecutionSnapshot }> = ({
  projection,
  snapshot,
}) => {
  const [activeFacetId, setActiveFacetId] = useState(projection.facets[0]?.id);
  useEffect(() => {
    if (!projection.facets.some((item) => item.id === activeFacetId)) setActiveFacetId(projection.facets[0]?.id);
  }, [activeFacetId, projection.facets]);
  const activeFacet = projection.facets.find((item) => item.id === activeFacetId) ?? projection.facets[0];
  const trusts = useMemo(
    () => (activeFacet?.id === 'receipts' || activeFacet?.id === 'receipt' ? snapshot.outcomeTrust : []),
    [activeFacet?.id, snapshot.outcomeTrust]
  );

  return (
    <section className='flex flex-col min-h-0 h-full' data-testid={`projection-${projection.id}`}>
      <nav
        className='shrink-0 flex flex-wrap gap-4px p-8px border-b border-1'
        aria-label={`${projection.label} views`}
      >
        {projection.facets.map((item) => (
          <button
            key={item.id}
            type='button'
            className={classNames(
              'px-8px py-4px rounded-6px border-0 cursor-pointer text-12px',
              item.id === activeFacet?.id ? 'bg-fill-3 text-t-primary font-600' : 'bg-transparent text-t-secondary'
            )}
            aria-pressed={item.id === activeFacet?.id}
            onClick={() => setActiveFacetId(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className='flex-1 min-h-0 overflow-auto p-10px'>
        {projection.action && activeFacet?.id !== 'receipt' && (
          <ConsequentialPolicyPreview snapshot={snapshot} action={projection.action} />
        )}
        {trusts.length > 0 && (
          <div className='flex flex-col gap-8px'>
            {trusts.map((trust) => {
              const resolved = failClosedTrust(snapshot, trust);
              return (
                <ReceiptTrustSurface
                  key={`${trust.receiptId}:${trust.outcomeId ?? ''}`}
                  trust={resolved.trust}
                  receipt={resolved.receipt}
                />
              );
            })}
          </div>
        )}
        {trusts.length === 0 && activeFacet && (
          <ul className='m-0 p-0 list-none flex flex-col gap-8px'>
            {activeFacet.evidence.map((item) => (
              <li key={item.id} className='rounded-8px border border-1 bg-fill-1 p-10px'>
                <div className='font-600 break-words'>{item.label}</div>
                {item.detail && <div className='mt-4px text-12px text-t-secondary break-words'>{item.detail}</div>}
                {item.uri && <div className='mt-4px text-12px text-t-secondary break-all'>{item.uri}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default ProjectionPanel;
