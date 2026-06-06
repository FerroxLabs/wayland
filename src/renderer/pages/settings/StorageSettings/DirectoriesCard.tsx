import { Button } from '@arco-design/web-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, PreferenceRow, ConfirmDialog } from '@renderer/components/settings/shared';
import { storage } from '@/common/adapter/ipcBridge';
import { FolderOpen } from 'lucide-react';

type DirKind = 'workspace' | 'cache' | 'logs';
type ClearableKind = 'cache' | 'logs';

const DirectoriesCard: React.FC = () => {
  const { t } = useTranslation();
  const [clearTarget, setClearTarget] = React.useState<ClearableKind | null>(null);

  const openDir = (kind: DirKind) => {
    void storage.openDir.invoke(kind);
  };

  const clearDir = (kind: ClearableKind) => {
    void storage.clearDir.invoke(kind).then(() => setClearTarget(null));
  };

  return (
    <>
      <Card title={t('settings.storagePage.directoriesTitle')} titleIcon={FolderOpen}>
        <PreferenceRow label={t('settings.storagePage.workspace')}>
          <Button size='small' onClick={() => openDir('workspace')}>
            {t('settings.storagePage.open')}
          </Button>
        </PreferenceRow>

        <PreferenceRow label={t('settings.storagePage.cacheDir')}>
          <div className='flex gap-8px'>
            <Button size='small' onClick={() => openDir('cache')}>
              {t('settings.storagePage.open')}
            </Button>
            <Button size='small' status='danger' onClick={() => setClearTarget('cache')}>
              {t('settings.storagePage.clear')}
            </Button>
          </div>
        </PreferenceRow>

        <PreferenceRow label={t('settings.storagePage.logsDir')}>
          <div className='flex gap-8px'>
            <Button size='small' onClick={() => openDir('logs')}>
              {t('settings.storagePage.open')}
            </Button>
            <Button size='small' status='danger' onClick={() => setClearTarget('logs')}>
              {t('settings.storagePage.clear')}
            </Button>
          </div>
        </PreferenceRow>
      </Card>

      <ConfirmDialog
        open={clearTarget !== null}
        onClose={() => setClearTarget(null)}
        onConfirm={() => clearTarget && clearDir(clearTarget)}
        title={t('settings.storagePage.clearConfirmTitle')}
        body={t('settings.storagePage.clearConfirmBody')}
        confirmLabel={t('settings.storagePage.clear')}
        destructive
      />
    </>
  );
};

export default DirectoriesCard;
