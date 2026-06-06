/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * BacklinkChip - inline [[wikilink]] chip for wiki body text.
 *
 * Renders an orange dotted-underline span. If slug is null, the concept has
 * no page yet - renders in muted color with a tooltip.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './BacklinkChip.module.css';

export type BacklinkChipProps = {
  name: string;
  slug?: string | null;
  onClick?: (slug: string) => void;
};

export function BacklinkChip({ name, slug, onClick }: BacklinkChipProps): React.ReactElement {
  const { t } = useTranslation('memory');
  const isOrphan = slug == null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isOrphan && slug && onClick) {
      onClick(slug);
    }
  };

  return (
    <span
      className={isOrphan ? styles.chipOrphan : styles.chip}
      onClick={handleClick}
      title={isOrphan ? t('wiki.orphan.noPageYet', 'No page yet') : name}
      data-testid='backlink-chip'
      data-slug={slug ?? undefined}
      role={isOrphan ? undefined : 'link'}
      tabIndex={isOrphan ? undefined : 0}
      onKeyDown={
        isOrphan
          ? undefined
          : (e) => {
              if ((e.key === 'Enter' || e.key === ' ') && slug && onClick) {
                e.preventDefault();
                onClick(slug);
              }
            }
      }
    >
      {name}
    </span>
  );
}
