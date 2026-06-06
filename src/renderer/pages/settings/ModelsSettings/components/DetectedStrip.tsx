import React from 'react';
import { Button } from '@arco-design/web-react';
import { Wand2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { IModelRegistryDetectedKey } from '@/common/adapter/ipcBridge';
import { providerMeta } from '../providerCatalog';
import styles from '../ModelsSettings.module.css';

type Props = {
  detectedKey: IModelRegistryDetectedKey;
  /** Connect the detected key (resolved main-side; the renderer never sees it). */
  onUse: (detectedKey: IModelRegistryDetectedKey) => void;
  /** Dismiss this detected key. */
  onIgnore: (detectedKey: IModelRegistryDetectedKey) => void;
  /** True while the detected key is connecting. */
  busy?: boolean;
};

/**
 * Auto-discovery consent strip. Shown only when `detectKeys()` returns a key
 * already on the machine. Spec §4.4 - a detected key is never used silently;
 * the user explicitly chooses Use or Ignore.
 */
const DetectedStrip: React.FC<Props> = ({ detectedKey, onUse, onIgnore, busy }) => {
  const { t } = useTranslation();
  const meta = providerMeta(detectedKey.providerId);

  return (
    <div className={styles.detected}>
      <div className={styles.detectedIcon}>
        <Wand2 size={15} aria-hidden='true' />
      </div>
      <div className={styles.detectedText}>
        {t('settings.modelsPage.detected.found', { provider: meta.displayName })}
      </div>
      <div className={styles.detectedActions}>
        <Button type='primary' size='small' loading={busy} onClick={() => onUse(detectedKey)}>
          {t('settings.modelsPage.detected.use')}
        </Button>
        <Button size='small' disabled={busy} onClick={() => onIgnore(detectedKey)}>
          {t('settings.modelsPage.detected.ignore')}
        </Button>
      </div>
    </div>
  );
};

export default DetectedStrip;
