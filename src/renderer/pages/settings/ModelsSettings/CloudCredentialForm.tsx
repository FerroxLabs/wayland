import React, { useCallback, useMemo, useState } from 'react';
import { Button, Input } from '@arco-design/web-react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { IModelRegistryConnectResult } from '@/common/adapter/ipcBridge';
import type { ConnectError, ProviderId } from '@process/providers/types';
import { providerMeta } from './providerCatalog';
import styles from './CloudCredentialForm.module.css';

/**
 * The exact credential field names each cloud provider's connect requires.
 * These MUST mirror `CLOUD_REQUIRED_FIELDS` in `modelRegistryIpc.ts` - the
 * main-process connect rejects a `{ fields }` payload that is missing any of
 * them with a `unrecognized` error.
 */
const CLOUD_FIELDS = {
  'aws-bedrock': ['accessKeyId', 'secretAccessKey', 'region'],
  vertex: ['projectId', 'region', 'serviceAccountJson'],
  azure: ['endpoint', 'apiKey'],
} as const satisfies Record<string, readonly string[]>;

/** A cloud provider id this form can collect credentials for. */
export type CloudProviderId = keyof typeof CLOUD_FIELDS;

/** True if `id` is a cloud provider handled by `CloudCredentialForm`. */
export function isCloudFormProvider(id: ProviderId): id is CloudProviderId {
  return id in CLOUD_FIELDS;
}

/** How a single field is rendered. */
type FieldKind = 'text' | 'password' | 'textarea';

/** Which fields are sensitive / multi-line - everything else is plain text. */
const FIELD_KIND: Record<string, FieldKind> = {
  secretAccessKey: 'password',
  apiKey: 'password',
  serviceAccountJson: 'textarea',
};

type Props = {
  /** The cloud provider to collect credentials for. */
  providerId: CloudProviderId;
  /**
   * Submit handler. `connect` (first connect) and `rekey` (cloud re-key, 2B)
   * share the identical `{ fields }` shape - the caller decides which IPC
   * method runs, keeping this form decoupled from Browse and from Manage.
   */
  onSubmit: (providerId: CloudProviderId, fields: Record<string, string>) => Promise<IModelRegistryConnectResult>;
  /**
   * `connect` - first-time connect (default). `rekey` - replacing the
   * credentials of an already-connected cloud provider (2B). Only changes the
   * submit-button label and the subtitle copy; the field set is identical.
   */
  mode?: 'connect' | 'rekey';
};

/** Map a `ConnectError` code to its inline-error i18n key suffix. */
const ERROR_KEY: Record<ConnectError, string> = {
  unauthorized: 'errorUnauthorized',
  'no-credit': 'errorNoCredit',
  offline: 'errorOffline',
  unrecognized: 'errorUnrecognized',
  'no-models': 'errorNoModels',
  unknown: 'errorUnknown',
};

/**
 * Multi-field credential form for a cloud provider (spec §3.7).
 *
 * Cloud providers - AWS Bedrock, Google Vertex, Azure OpenAI - connect with
 * several fields rather than a single API key. This form renders exactly the
 * fields `CLOUD_REQUIRED_FIELDS` requires for the provider, then submits them
 * as `connect({ creds: { fields } })`. Sensitive fields use a password input;
 * the Vertex service-account key is a textarea (paste the JSON).
 *
 * It is intentionally provider-agnostic and submit-agnostic: BrowseModal passes
 * a `connect` handler, the Manage page (2B) can pass a `rekey` handler - both
 * take the same `{ fields }` payload.
 */
const CloudCredentialForm: React.FC<Props> = ({ providerId, onSubmit, mode = 'connect' }) => {
  const { t } = useTranslation();
  const meta = providerMeta(providerId);
  const fieldNames = CLOUD_FIELDS[providerId];

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fieldNames.map((name) => [name, '']))
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  // Every required field must carry a non-empty value - this mirrors the
  // main-process presence check, so the user is not sent an `unrecognized`
  // error for a field they could see was blank.
  const complete = useMemo(() => fieldNames.every((name) => values[name]?.trim()), [fieldNames, values]);

  const setField = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrorKey(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!complete || submitting) return;
    // Trim every value - a stray newline on a region or project id would
    // otherwise be persisted verbatim.
    const fields = Object.fromEntries(fieldNames.map((name) => [name, values[name].trim()]));
    setSubmitting(true);
    setErrorKey(null);
    try {
      const res = await onSubmit(providerId, fields);
      if (!res.ok) {
        setErrorKey(ERROR_KEY[res.error ?? 'unknown']);
      }
    } catch {
      setErrorKey(ERROR_KEY.unknown);
    } finally {
      setSubmitting(false);
    }
  }, [complete, submitting, fieldNames, values, onSubmit, providerId]);

  const renderField = (name: string) => {
    const kind = FIELD_KIND[name] ?? 'text';
    const label = t(`settings.modelsPage.cloud.fields.${name}.label`);
    const placeholder = t(`settings.modelsPage.cloud.fields.${name}.placeholder`);
    const common = {
      value: values[name],
      placeholder,
      'aria-label': label,
      disabled: submitting,
    };

    return (
      <div className={styles.field} key={name}>
        <label className={styles.fieldLabel} htmlFor={`cloud-field-${name}`}>
          {label}
        </label>
        {kind === 'password' ? (
          <Input.Password id={`cloud-field-${name}`} {...common} onChange={(v) => setField(name, v)} />
        ) : kind === 'textarea' ? (
          <Input.TextArea
            id={`cloud-field-${name}`}
            {...common}
            autoSize={{ minRows: 4, maxRows: 9 }}
            onChange={(v) => setField(name, v)}
          />
        ) : (
          <Input id={`cloud-field-${name}`} {...common} onChange={(v) => setField(name, v)} />
        )}
      </div>
    );
  };

  const errorText = errorKey ? t(`settings.modelsPage.cloud.${errorKey}`, { provider: meta.displayName }) : null;

  return (
    <div className={styles.form}>
      <div className={styles.subtitle}>{t(`settings.modelsPage.cloud.subtitle.${providerId}`)}</div>

      {fieldNames.map(renderField)}

      {errorText && (
        <div className={styles.error} role='alert'>
          <AlertTriangle size={14} aria-hidden='true' />
          <span>{errorText}</span>
        </div>
      )}

      <Button
        type='primary'
        long
        loading={submitting}
        disabled={!complete}
        onClick={() => void handleSubmit()}
        className={styles.submit}
      >
        {t(mode === 'rekey' ? 'settings.modelsPage.cloud.submitRekey' : 'settings.modelsPage.cloud.submitConnect')}
      </Button>
    </div>
  );
};

export default CloudCredentialForm;
