/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Wave 5 Search tab. Conversational query surface that calls the IJFW `think`
 * verb (synthesizes across all of memory) and renders the answer plus
 * citation badges. Citation click is a Wave 6 stub.
 *
 * The result panel is a separate child component so the `useIjfwBrain` hook
 * only mounts once the user has submitted a query -- mounting it at the
 * SearchTab level would fire an IPC call on first paint with an empty query.
 */

import React, { useState } from 'react';
import { Input, Message } from '@arco-design/web-react';
import { Link as LinkIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useIjfwBrain } from '../hooks/useIjfwBrain';
import MCPVerbCard from '../components/MCPVerbCard';
import styles from './SearchTab.module.css';

type ThinkCitation = {
  source: string;
  snippet: string;
};

type ThinkResponse = {
  answer: string;
  citations: ThinkCitation[];
};

const EXAMPLE_KEYS = ['example_1', 'example_2', 'example_3'] as const;

type SearchResultPanelProps = {
  query: string;
  onCitationClick: () => void;
};

const SearchResultPanel: React.FC<SearchResultPanelProps> = ({ query, onCitationClick }) => {
  const state = useIjfwBrain<ThinkResponse>('think', { query, k: 5 }, [query]);

  return (
    <MCPVerbCard<ThinkResponse>
      state={state}
      render={(data) => (
        <div data-testid='memory-search-result'>
          {/* TODO Wave 6: render markdown */}
          <div className={styles.answer}>{data.answer}</div>
          {data.citations.length > 0 ? (
            <div className={styles.citations} data-testid='memory-search-citations'>
              {data.citations.map((citation, idx) => (
                <button
                  type='button'
                  key={`${citation.source}-${idx}`}
                  data-testid='memory-search-citation'
                  className={styles.citationBadge}
                  onClick={onCitationClick}
                  title={citation.snippet}
                  aria-label={citation.source}
                >
                  <LinkIcon size={12} aria-hidden />
                  <span className={styles.citationText}>{citation.source}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    />
  );
};

const SearchTab: React.FC = () => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<string>('');
  const [activeQuery, setActiveQuery] = useState<string>('');

  const submitQuery = (value: string): void => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    setActiveQuery(trimmed);
  };

  const handleExampleClick = (text: string): void => {
    setDraft(text);
  };

  const handleCitationClick = (): void => {
    Message.info(t('memory.search.citation_stub'));
  };

  return (
    <div data-testid='memory-tab-search' className={styles.container}>
      <div className={styles.searchRow}>
        <Input.Search
          data-testid='memory-search-input'
          className={styles.searchInput}
          placeholder={t('memory.search.placeholder')}
          value={draft}
          onChange={(v) => setDraft(v)}
          onSearch={submitQuery}
          searchButton
          allowClear
          style={{ flex: 1, maxWidth: 'unset' }}
        />
      </div>

      {activeQuery === '' ? (
        <div className={styles.examples} data-testid='memory-search-empty'>
          <p className={styles.examplesTitle}>{t('memory.search.examples_title')}</p>
          <div className={styles.examplesList}>
            {EXAMPLE_KEYS.map((key) => {
              const text = t(`memory.search.${key}`);
              return (
                <button
                  type='button'
                  key={key}
                  data-testid={`memory-search-example-${key}`}
                  className={styles.exampleChip}
                  onClick={() => handleExampleClick(text)}
                >
                  {text}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <SearchResultPanel query={activeQuery} onCitationClick={handleCitationClick} />
      )}
    </div>
  );
};

export default SearchTab;
