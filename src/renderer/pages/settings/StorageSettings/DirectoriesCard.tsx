import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Message } from '@arco-design/web-react';
import { Card, PreferenceRow, ConfirmDialog } from '@renderer/components/settings/shared';
import { storage } from '@/common/adapter/ipcBridge';
import { FolderOpen } from 'lucide-react';
import { isElectronDesktop } from '@renderer/utils/platform';
import { clearStorageDirHttp, fetchStorageDirs } from '@renderer/services/StorageService';

type DirKind = 'workspace' | 'cache' | 'logs';
type ClearableKind = 'cache' | 'logs';

const DirectoriesCard: React.FC = () => {
  const { t } = useTranslation();
  const [clearTarget, setClearTarget] = React.useState<ClearableKind | null>(null);
  const isDesktop = isElectronDesktop();

  // Desktop opens the OS file manager; browser has no host file manager, so it
  // copies the server-side path to the clipboard instead (#83).
  const openDir = async (kind: DirKind) => {
    if (isDesktop) {
      void storage.openDir.invoke(kind);
      return;
    }
    try {
      const dirs = await fetchStorageDirs();
      await navigator.clipboard.writeText(dirs[kind]);
      Message.success(t('settings.storagePage.pathCopied'));
    } catch {
      Message.error(t('settings.storagePage.pathCopyFailed'));
    }
  };

  const clearDir = async (kind: ClearableKind) => {
    try {
      if (isDesktop) {
        await storage.clearDir.invoke(kind);
      } else {
        await clearStorageDirHttp(kind);
      }
      Message.success(t('settings.storagePage.cleared'));
    } catch {
      Message.error(t('settings.storagePage.clearFailed'));
    } finally {
      setClearTarget(null);
    }
  };

  const openLabel = isDesktop ? t('settings.storagePage.open') : t('settings.storagePage.copyPath');

  return (
    <>
      <Card title={t('settings.storagePage.directoriesTitle')} titleIcon={FolderOpen}>
        <PreferenceRow label={t('settings.storagePage.workspace')}>
          <Button size='small' onClick={() => void openDir('workspace')}>
            {openLabel}
          </Button>
        </PreferenceRow>

        <PreferenceRow label={t('settings.storagePage.cacheDir')}>
          <div className='flex gap-8px'>
            <Button size='small' onClick={() => void openDir('cache')}>
              {openLabel}
            </Button>
            <Button size='small' status='danger' onClick={() => setClearTarget('cache')}>
              {t('settings.storagePage.clear')}
            </Button>
          </div>
        </PreferenceRow>

        <PreferenceRow label={t('settings.storagePage.logsDir')}>
          <div className='flex gap-8px'>
            <Button size='small' onClick={() => void openDir('logs')}>
              {openLabel}
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
