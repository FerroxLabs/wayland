import React from 'react';
import { Button } from '@arco-design/web-react';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ErrorKind = 'network' | 'unauthorized' | 'forbidden' | 'rate-limit' | 'unknown';

type Props = {
  errorMsg: string;
  onRetry: () => void;
  onEditKey: () => void;
};

function classifyError(msg: string): ErrorKind {
  if (msg.startsWith('network')) return 'network';
  if (msg.startsWith('unauthorized')) return 'unauthorized';
  if (msg.startsWith('forbidden')) return 'forbidden';
  if (msg.startsWith('rate-limit')) return 'rate-limit';
  return 'unknown';
}

const ERROR_I18N: Record<ErrorKind, string> = {
  network: 'settings.providers.connect.errorNetwork',
  unauthorized: 'settings.providers.connect.errorUnauthorized',
  forbidden: 'settings.providers.connect.errorForbidden',
  'rate-limit': 'settings.providers.connect.errorRateLimit',
  unknown: 'settings.providers.connect.errorUnknown',
};

const ErrorState = ({ errorMsg, onRetry, onEditKey }: Props) => {
  const { t } = useTranslation();
  const kind = classifyError(errorMsg);

  return (
    <div className="flex flex-col gap-4 p-6 items-center text-center">
      <AlertCircle size={36} className="text-[var(--color-danger-6)]" />
      <div>
        <h2 className="text-base font-semibold text-[var(--color-text-1)] mb-1">
          {t('settings.providers.connect.errorTitle')}
        </h2>
        <p className="text-sm text-[var(--color-text-3)]">{t(ERROR_I18N[kind])}</p>
        {kind === 'unknown' && (
          <p className="text-xs text-[var(--color-text-4)] mt-1 font-mono break-all">{errorMsg}</p>
        )}
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        <Button onClick={onEditKey}>{t('settings.providers.connect.editKey')}</Button>
        <Button type="primary" onClick={onRetry}>
          {t('settings.providers.connect.retry')}
        </Button>
      </div>
    </div>
  );
};

export default ErrorState;
