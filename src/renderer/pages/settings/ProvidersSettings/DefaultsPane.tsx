import React from 'react';
import { Select } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import type { IConnectedProviderView, IDefaultModelView } from '@/common/adapter/ipcBridge';

type Scope = IDefaultModelView['scope'];

type Props = {
  providers: IConnectedProviderView[];
  defaults: IDefaultModelView[];
  onSetDefault: (scope: Scope, catalogId: string, modelId: string) => void;
};

const SCOPES: Array<{ scope: Scope; i18nKey: string }> = [
  { scope: 'chat', i18nKey: 'settings.providers.defaultChat' },
  { scope: 'coding', i18nKey: 'settings.providers.defaultCoding' },
  { scope: 'vision', i18nKey: 'settings.providers.defaultVision' },
  { scope: 'image', i18nKey: 'settings.providers.defaultImage' },
  { scope: 'audio', i18nKey: 'settings.providers.defaultAudio' },
];

const DefaultsPane = ({ providers, defaults, onSetDefault }: Props) => {
  const { t } = useTranslation();

  const defaultMap = new Map(defaults.map((d) => [d.scope, d]));

  // Flatten all enabled models across providers into select options
  const allOptions = providers.flatMap((p) =>
    p.models
      .filter((m) => m.enabled && !m.deprecated)
      .map((m) => ({
        value: `${p.id}::${m.id}`,
        label: `${p.displayName ?? p.providerId} / ${m.displayName}`,
        catalogId: p.id,
        modelId: m.id,
      }))
  );

  const handleChange = (scope: Scope, value: string) => {
    const [catalogId, ...rest] = value.split('::');
    const modelId = rest.join('::');
    onSetDefault(scope, catalogId, modelId);
  };

  if (allOptions.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--color-border-2)] bg-[var(--color-bg-2)] p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-[var(--color-text-1)]">
        {t('settings.providers.defaultsTitle')}
      </h3>
      <div className="flex flex-col gap-3">
        {SCOPES.map(({ scope, i18nKey }) => {
          const current = defaultMap.get(scope);
          const currentValue = current ? `${current.catalogId}::${current.modelId}` : undefined;
          return (
            <div key={scope} className="flex items-center gap-3">
              <label className="text-sm text-[var(--color-text-2)] w-36 flex-shrink-0">
                {t(i18nKey)}
              </label>
              <Select
                value={currentValue}
                onChange={(v) => handleChange(scope, v as string)}
                placeholder={t('settings.providers.noDefault')}
                className="flex-1"
                allowClear
              >
                {allOptions.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DefaultsPane;
