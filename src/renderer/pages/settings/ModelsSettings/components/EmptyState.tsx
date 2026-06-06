import React from 'react';
import { Layers } from 'lucide-react';
import { Trans } from 'react-i18next';
import styles from '../ModelsSettings.module.css';

/**
 * First-run / empty note for the Models page. Shown when there are no
 * connected providers and no detected keys - the connect panel above is the
 * whole page (spec §4.2). Nudges "Continue with Google" as the fastest start.
 */
const EmptyState: React.FC = () => (
  <div className={styles.emptyState}>
    <div className={styles.emptyNote}>
      <Layers size={26} aria-hidden='true' />
      <div className={styles.emptyText}>
        <Trans i18nKey='settings.modelsPage.empty.note'>
          No providers connected yet. Connect one above - the fastest start is <b>Continue with Google</b>.
        </Trans>
      </div>
    </div>
  </div>
);

export default EmptyState;
