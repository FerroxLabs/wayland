/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Presentational HuggingFace voice-model search.
 *
 * A debounced search box + results list for discovering voice models beyond the
 * curated catalog. Each result is already mapped to a
 * {@link VoiceModelEntry}-compatible {@link HfSearchResult}, carries a `trust`
 * badge, and is selectable via `onSelect`.
 *
 * Intentionally dumb beyond the search call: it does not download, persist, or
 * mount itself anywhere. The parent (the settings picker) decides what
 * `onSelect` does — typically add the entry to the picker and kick off a
 * download.
 */

import { Button, Empty, Input, List, Spin, Tag } from '@arco-design/web-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { VoiceModelKind } from '@/common/voice/voiceModelCatalog';
import { type HfSearchResult, searchVoiceModels } from '@/renderer/services/huggingFaceVoiceSearch';

const DEBOUNCE_MS = 350;
const RESULT_LIMIT = 20;

export type HuggingFaceModelSearchProps = {
  kind: VoiceModelKind;
  onSelect: (entry: HfSearchResult) => void;
};

const HuggingFaceModelSearch: React.FC<HuggingFaceModelSearchProps> = ({ kind, onSelect }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HfSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Guards against out-of-order responses overwriting a newer query's results.
  const seqRef = useRef(0);

  const runSearch = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) {
        setResults([]);
        setLoading(false);
        setSearched(false);
        return;
      }
      const seq = ++seqRef.current;
      setLoading(true);
      const found = await searchVoiceModels(trimmed, kind, RESULT_LIMIT);
      if (seq !== seqRef.current) return; // a newer query superseded this one
      setResults(found);
      setLoading(false);
      setSearched(true);
    },
    [kind],
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      void runSearch(query);
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query, runSearch]);

  const trustLabel = (trust: HfSearchResult['trust']): string =>
    trust === 'community'
      ? t('voice.hfSearch.trust.community', { defaultValue: 'Community' })
      : t('voice.hfSearch.trust.unverified', { defaultValue: 'Unverified' });

  return (
    <div className='flex flex-col gap-2' data-testid='hf-model-search'>
      <Input.Search
        allowClear
        value={query}
        onChange={setQuery}
        placeholder={t('voice.hfSearch.placeholder', {
          defaultValue: 'Search HuggingFace voice models…',
        })}
        aria-label={t('voice.hfSearch.placeholder', {
          defaultValue: 'Search HuggingFace voice models…',
        })}
      />

      {loading ? (
        <div className='flex justify-center py-4'>
          <Spin />
        </div>
      ) : results.length > 0 ? (
        <List
          size='small'
          dataSource={results}
          render={(item: HfSearchResult) => (
            <List.Item
              key={`${item.engineId}:${item.modelId}`}
              actions={[
                <Button
                  key='select'
                  size='mini'
                  type='primary'
                  onClick={() => onSelect(item)}
                >
                  {t('voice.hfSearch.add', { defaultValue: 'Add' })}
                </Button>,
              ]}
            >
              <div className='flex flex-col gap-1'>
                <div className='flex items-center gap-2'>
                  <span className='font-medium'>{item.label}</span>
                  <Tag
                    size='small'
                    color={item.trust === 'community' ? 'arcoblue' : 'orange'}
                  >
                    {trustLabel(item.trust)}
                  </Tag>
                </div>
                <span className='text-xs opacity-70'>
                  {t('voice.hfSearch.downloads', {
                    defaultValue: '{{count}} downloads',
                    count: item.downloads ?? 0,
                  })}
                </span>
              </div>
            </List.Item>
          )}
        />
      ) : searched ? (
        <Empty
          description={t('voice.hfSearch.empty', { defaultValue: 'No matching models found' })}
        />
      ) : null}
    </div>
  );
};

export default HuggingFaceModelSearch;
