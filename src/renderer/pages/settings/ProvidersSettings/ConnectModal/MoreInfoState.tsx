import React, { useState } from 'react';
import { Button, Input, Form } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import type { ProviderId } from '@process/providers/types';

type Props = {
  providerId: ProviderId;
  apiKey: string;
  onSubmit: (fields: Record<string, string>) => void;
  onBack: () => void;
};

type FieldDef = {
  name: string;
  i18nKey: string;
  type?: 'text' | 'password' | 'file';
};

const MULTI_FIELD_DEFS: Partial<Record<ProviderId, FieldDef[]>> = {
  'aws-bedrock': [
    { name: 'region', i18nKey: 'settings.providers.connect.fieldRegion' },
    { name: 'access_key_id', i18nKey: 'settings.providers.connect.fieldAccessKeyId' },
    { name: 'secret_key', i18nKey: 'settings.providers.connect.fieldSecretKey', type: 'password' },
  ],
  vertex: [
    { name: 'project_id', i18nKey: 'settings.providers.connect.fieldProjectId' },
    { name: 'region', i18nKey: 'settings.providers.connect.fieldRegion' },
    { name: 'service_account_json', i18nKey: 'settings.providers.connect.fieldServiceAccount', type: 'file' },
  ],
  openai: [
    { name: 'endpoint', i18nKey: 'settings.providers.connect.fieldEndpoint' },
    { name: 'deployment', i18nKey: 'settings.providers.connect.fieldDeployment' },
    { name: 'api_version', i18nKey: 'settings.providers.connect.fieldApiVersion' },
  ],
};

const MoreInfoState = ({ providerId, apiKey, onSubmit, onBack }: Props) => {
  const { t } = useTranslation();
  const fields = MULTI_FIELD_DEFS[providerId] ?? [];
  const [values, setValues] = useState<Record<string, string>>({});

  const allFilled = fields.every((f) => f.type === 'file' || (values[f.name] ?? '').trim());

  const handleFileChange = (name: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setValues((prev) => ({ ...prev, [name]: (ev.target?.result as string) ?? '' }));
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    onSubmit({ api_key: apiKey, ...values });
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <h2 className="text-base font-semibold text-[var(--color-text-1)]">
        {t('settings.providers.connect.moreInfoTitle')}
      </h2>
      <Form layout="vertical" style={{ gap: 12 }}>
        {fields.map((field) => (
          <Form.Item key={field.name} label={t(field.i18nKey)}>
            {field.type === 'file' ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--color-text-3)] flex-1 truncate">
                  {values[field.name] ? t('settings.providers.connect.fieldServiceAccount') : ''}
                </span>
                <Button
                  size="small"
                  onClick={() => document.getElementById(`file-${field.name}`)?.click()}
                >
                  {t('settings.providers.connect.browseServiceAccount')}
                </Button>
                <input
                  id={`file-${field.name}`}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => handleFileChange(field.name, e)}
                />
              </div>
            ) : field.type === 'password' ? (
              <Input.Password
                value={values[field.name] ?? ''}
                onChange={(v) => setValues((prev) => ({ ...prev, [field.name]: v }))}
              />
            ) : (
              <Input
                value={values[field.name] ?? ''}
                onChange={(v) => setValues((prev) => ({ ...prev, [field.name]: v }))}
              />
            )}
          </Form.Item>
        ))}
      </Form>
      <div className="flex gap-2 justify-end">
        <Button onClick={onBack}>{t('settings.providers.connect.cancel')}</Button>
        <Button type="primary" disabled={!allFilled} onClick={handleSubmit}>
          {t('settings.providers.connect.detectButton')}
        </Button>
      </div>
    </div>
  );
};

export default MoreInfoState;
