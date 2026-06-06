/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * RelatedConcepts - pill chip row of related concept names.
 * Each chip is surface-2 bg + 1px border + 20px radius + orange text + dotted underline.
 */

import React from 'react';
import styles from './RelatedConcepts.module.css';

export type RelatedConceptsProps = {
  concepts: string[];
  onNavigate?: (name: string) => void;
};

export function RelatedConcepts({ concepts, onNavigate }: RelatedConceptsProps): React.ReactElement {
  return (
    <div className={styles.row} data-testid='related-concepts'>
      {concepts.map((name) => (
        <span
          key={name}
          className={styles.chip}
          onClick={() => onNavigate?.(name)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigate?.(name);
            }
          }}
          role='link'
          tabIndex={0}
          data-testid='related-chip'
        >
          {name}
        </span>
      ))}
    </div>
  );
}
