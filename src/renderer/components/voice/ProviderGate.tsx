/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@arco-design/web-react';
import { Check } from 'lucide-react';
import { providerMeta } from '@renderer/pages/settings/ModelsSettings/providerCatalog';

type ProviderGateProps = {
  /** The provider id a cloud voice option requires, e.g. 'openai' | 'deepgram'. */
  requiresProvider: string;
  /** Whether the user is currently signed in to that provider. */
  signedIn: boolean;
  /**
   * Optional sign-in trigger supplied by the parent (the EXISTING connect flow —
   * this component does not own or invent any auth path). When absent, the
   * not-signed-in state renders an inert hint with no action.
   */
  onConnect?: () => void;
};

/**
 * Dumb presentational gate for a cloud voice option. Pure: no data fetching, no
 * auth — the parent decides `signedIn` (from `useSignedInProviders`) and passes
 * the existing connect trigger.
 *
 * - Not signed in: a subtle "Sign in to {provider} to enable" line, with an
 *   optional inline Connect action.
 * - Signed in: a small check (so a previously-gated row reads as unlocked).
 */
export const ProviderGate = ({ requiresProvider, signedIn, onConnect }: ProviderGateProps) => {
  const { t } = useTranslation();
  const name = providerMeta(requiresProvider).displayName;

  if (signedIn) {
    return (
      <span className="text-secondary text-xs inline-flex items-center gap-4px" aria-hidden>
        <Check size={12} className="text-[var(--color-success-6,#00b42a)] shrink-0" />
      </span>
    );
  }

  return (
    <div className="text-secondary text-xs inline-flex items-center gap-6px">
      <span>{t('voice.signInToEnable', { provider: name, defaultValue: 'Sign in to {{provider}} to enable' })}</span>
      {onConnect ? (
        <Button type="text" size="mini" onClick={onConnect}>
          {t('voice.connect', { defaultValue: 'Connect' })}
        </Button>
      ) : null}
    </div>
  );
};

export default ProviderGate;
