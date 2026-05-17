import React, { useState } from 'react';
import { Button, Input } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';

type Props = {
  onDetect: (key: string) => void;
  onBrowse: () => void;
};

const EntryState = ({ onDetect, onBrowse }: Props) => {
  const { t } = useTranslation();
  const [key, setKey] = useState('');

  return (
    <div className="flex flex-col gap-4 p-6">
      <h2 className="text-base font-semibold text-[var(--color-text-1)]">
        {t('settings.providers.connect.entryTitle')}
      </h2>
      <Input.Password
        autoFocus
        value={key}
        onChange={setKey}
        placeholder={t('settings.providers.connect.placeholder')}
        className="w-full"
      />
      <div className="flex flex-col gap-2">
        <Button
          type="primary"
          long
          disabled={!key.trim()}
          onClick={() => onDetect(key.trim())}
        >
          {t('settings.providers.connect.detectButton')}
        </Button>
        <Button long onClick={onBrowse}>
          {t('settings.providers.connect.browseButton')}
        </Button>
      </div>
    </div>
  );
};

export default EntryState;
