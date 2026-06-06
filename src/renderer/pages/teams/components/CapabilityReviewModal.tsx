/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// W4b - CapabilityReviewModal.
//
// Per D7 #3 + #11: when the user imports a team, this modal surfaces each
// capability the import file declared as `true` and asks for an explicit
// per-row grant. The primary CTA ("Trust selected") is disabled for the
// first 5 seconds the modal is open to defeat accidental click-through.
// A secondary CTA imports the team in sandbox mode (no capabilities
// granted). When the import payload references specialists the host does
// not have, both CTAs are disabled and an Alert explains why.

import { Alert, Button, Checkbox } from '@arco-design/web-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import WaylandModal from '@renderer/components/base/WaylandModal';

export type TeamCapabilities = {
  canReadFiles: boolean;
  canWriteFiles: boolean;
  canSpawnAgents: boolean;
  canNetworkRequest: boolean;
  canCrossTeamMessage: boolean;
};

type CapabilityName = keyof TeamCapabilities;

// W4 audit HIGH-1 (2026-05-19): `canNetworkRequest` is intentionally
// EXCLUDED from the review UI. The capability has no runtime gate in v1,
// so showing a grant row would be a broken security promise. The schema
// still parses the field for forward-compat, and `acceptTeamImport`
// forces it to `by_user: false` regardless of any incoming grant value.
// A footer notice (teams.import.networkNotice) explains this to the user.
const ALL_CAPABILITIES: CapabilityName[] = [
  'canReadFiles',
  'canWriteFiles',
  'canSpawnAgents',
  'canCrossTeamMessage',
];

const COUNTDOWN_SECONDS = 5;

type Props = {
  visible: boolean;
  teamName: string;
  importSource: string;
  capabilities: TeamCapabilities;
  missingSpecialists?: string[];
  onTrustSelected: (grants: Record<CapabilityName, boolean>) => void;
  onSandboxImport: () => void;
  onCancel: () => void;
  loading?: boolean;
};

const emptyGrants = (): Record<CapabilityName, boolean> => ({
  canReadFiles: false,
  canWriteFiles: false,
  canSpawnAgents: false,
  canNetworkRequest: false,
  canCrossTeamMessage: false,
});

const CapabilityReviewModal: React.FC<Props> = ({
  visible,
  teamName,
  importSource,
  capabilities,
  missingSpecialists,
  onTrustSelected,
  onSandboxImport,
  onCancel,
  loading = false,
}) => {
  const { t } = useTranslation();
  const [grants, setGrants] = useState<Record<CapabilityName, boolean>>(() => emptyGrants());
  const [remaining, setRemaining] = useState<number>(COUNTDOWN_SECONDS);

  // Reset grants + countdown whenever the modal becomes visible so each
  // open starts from a clean opt-in state.
  useEffect(() => {
    if (!visible) return;
    setGrants(emptyGrants());
    setRemaining(COUNTDOWN_SECONDS);
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [visible]);

  const declaredCaps = useMemo<CapabilityName[]>(
    () => ALL_CAPABILITIES.filter((cap) => capabilities[cap] === true),
    [capabilities]
  );
  // W4 audit HIGH-1: surface a notice when the import requested network
  // access so the user understands why no grant row is offered.
  const showNetworkNotice = capabilities.canNetworkRequest === true;

  const missingCount = missingSpecialists?.length ?? 0;
  const hasMissing = missingCount > 0;
  const trustDisabled = remaining > 0 || loading || hasMissing;
  const sandboxDisabled = loading || hasMissing;

  const trustLabel =
    remaining > 0
      ? t('teams.import.trustSelectedCtaCountdown', {
          seconds: remaining,
          defaultValue: 'Trust selected ({{seconds}}s)',
        })
      : t('teams.import.trustSelectedCta', { defaultValue: 'Trust selected' });

  const toggleCap = (cap: CapabilityName) => (next: boolean) => {
    setGrants((prev) => ({ ...prev, [cap]: next }));
  };

  return (
    <WaylandModal
      visible={visible}
      onCancel={onCancel}
      size='medium'
      header={t('teams.import.title', { defaultValue: 'Review team capabilities' })}
      footer={
        <div className='flex justify-end gap-12px'>
          <Button
            onClick={onCancel}
            className='px-16px min-w-80px'
            style={{ borderRadius: 8 }}
            data-testid='capability-review-cancel'
          >
            {t('teams.import.cancelCta', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            onClick={() => onSandboxImport()}
            disabled={sandboxDisabled}
            className='px-16px'
            style={{ borderRadius: 8 }}
            data-testid='capability-review-sandbox'
          >
            {t('teams.import.sandboxCta', { defaultValue: 'Sandbox mode (no capabilities)' })}
          </Button>
          <Button
            type='primary'
            onClick={() => onTrustSelected(grants)}
            disabled={trustDisabled}
            loading={loading}
            className='min-w-160px'
            data-testid='capability-review-trust'
          >
            {trustLabel}
          </Button>
        </div>
      }
    >
      <div className='flex flex-col gap-16px p-24px' data-testid='capability-review-modal'>
        <p className='text-13px text-t-secondary m-0'>
          {t('teams.import.intro', {
            defaultValue:
              'This team declares the following capabilities. Grant only what you trust.',
          })}
        </p>
        {teamName && (
          <p
            className='text-13px text-t-primary font-medium m-0'
            data-testid='capability-review-team-name'
          >
            {teamName}
          </p>
        )}
        {importSource && (
          <p
            className='text-12px text-t-tertiary m-0'
            data-testid='capability-review-import-source'
          >
            {importSource}
          </p>
        )}
        {hasMissing && (
          <Alert
            type='warning'
            data-testid='capability-review-missing-specialists'
            content={t('teams.import.missingSpecialists', {
              names: missingSpecialists?.join(', ') ?? '',
              defaultValue:
                'Missing specialists: {{names}}. Install them first or use a different team.',
            })}
          />
        )}
        {showNetworkNotice && (
          <p
            className='text-12px text-t-tertiary m-0'
            data-testid='capability-review-network-notice'
          >
            {t('teams.import.networkNotice', {
              defaultValue:
                'Network access for imported teams is currently disabled. This capability cannot be granted in v1.',
            })}
          </p>
        )}
        <div className='flex flex-col gap-12px' data-testid='capability-review-rows'>
          {declaredCaps.map((cap) => (
            <div
              key={cap}
              className='flex flex-col gap-4px'
              data-testid={`capability-review-row-${cap}`}
            >
              <Checkbox
                checked={grants[cap]}
                onChange={toggleCap(cap)}
                disabled={hasMissing}
                data-testid={`capability-review-checkbox-${cap}`}
              >
                <span className='text-13px text-t-primary font-medium'>
                  {t(`teams.import.cap.${cap}`, { defaultValue: cap })}
                </span>
              </Checkbox>
              <span className='text-12px text-t-secondary pl-24px'>
                {t(`teams.import.cap.${cap}Desc`, { defaultValue: '' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </WaylandModal>
  );
};

export default CapabilityReviewModal;
