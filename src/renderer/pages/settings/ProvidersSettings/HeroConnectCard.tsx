import React, { useState } from 'react';
import { Button, Input } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import ConnectModal from './ConnectModal/ConnectModal';

type Props = {
  onConnected: () => void;
};

const HeroConnectCard = ({ onConnected }: Props) => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [quickKey, setQuickKey] = useState('');

  const openWithKey = () => setModalVisible(true);

  return (
    <>
      <div className='rounded-12px border border-[var(--bg-3)] bg-[var(--bg-2)] p-20px flex flex-col gap-12px'>
        <h3 className='text-14px font-semibold text-[var(--text-primary)] m-0'>
          {t('settings.providers.heroTitle')}
        </h3>
        <div className='flex gap-8px'>
          <Input.Password
            value={quickKey}
            onChange={setQuickKey}
            placeholder={t('settings.providers.heroPlaceholder')}
            className='flex-1'
            onPressEnter={openWithKey}
          />
          <Button type='primary' disabled={!quickKey.trim()} onClick={openWithKey}>
            {t('settings.providers.detectButton')}
          </Button>
        </div>
        <Button
          type='text'
          size='mini'
          className='self-start !px-0 !text-12px !text-[var(--brand)]'
          onClick={() => setModalVisible(true)}
        >
          {t('settings.providers.browseButton')}
        </Button>
      </div>

      <ConnectModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setQuickKey('');
        }}
        onConnected={() => {
          setModalVisible(false);
          setQuickKey('');
          onConnected();
        }}
      />
    </>
  );
};

export default HeroConnectCard;
