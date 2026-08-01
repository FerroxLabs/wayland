/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button } from '@arco-design/web-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const DEFAULT_CATALOG_PAGE_SIZE = 48;

type CatalogWindowState = {
  resetKey: string;
  startIndex: number;
};

export type CatalogPaginationResult<Item> = {
  visibleItems: Item[];
  visibleCount: number;
  totalCount: number;
  remainingCount: number;
  pageSize: number;
  firstVisibleIndex: number;
  lastVisibleIndex: number;
  hasPrevious: boolean;
  hasMore: boolean;
  nextPage: () => void;
  previousPage: () => void;
};

/**
 * Keeps catalog DOM growth bounded without changing the source collection or
 * its search/filter/count semantics. Changing resetKey synchronously returns
 * the catalog to its first page, avoiding a one-frame stale-window render.
 */
export const useCatalogPagination = <Item,>(
  items: readonly Item[],
  resetKey: string,
  pageSize = DEFAULT_CATALOG_PAGE_SIZE
): CatalogPaginationResult<Item> => {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const [windowState, setWindowState] = useState<CatalogWindowState>({
    resetKey,
    startIndex: 0,
  });
  const maximumStart = items.length === 0 ? 0 : Math.floor((items.length - 1) / safePageSize) * safePageSize;
  const requestedStart = windowState.resetKey === resetKey ? windowState.startIndex : 0;
  const startIndex = Math.min(requestedStart, maximumStart);
  const endIndex = Math.min(items.length, startIndex + safePageSize);
  const visibleCount = endIndex - startIndex;
  const visibleItems = useMemo(() => items.slice(startIndex, endIndex), [endIndex, items, startIndex]);
  const remainingCount = Math.max(0, items.length - endIndex);
  const hasPrevious = startIndex > 0;
  const hasMore = remainingCount > 0;

  const nextPage = useCallback(() => {
    setWindowState((current) => {
      const currentStart = current.resetKey === resetKey ? current.startIndex : 0;
      return {
        resetKey,
        startIndex: Math.min(maximumStart, currentStart + safePageSize),
      };
    });
  }, [maximumStart, resetKey, safePageSize]);

  const previousPage = useCallback(() => {
    setWindowState((current) => {
      const currentStart = current.resetKey === resetKey ? current.startIndex : 0;
      return {
        resetKey,
        startIndex: Math.max(0, currentStart - safePageSize),
      };
    });
  }, [resetKey, safePageSize]);

  return {
    visibleItems,
    visibleCount,
    totalCount: items.length,
    remainingCount,
    pageSize: safePageSize,
    firstVisibleIndex: visibleCount === 0 ? 0 : startIndex + 1,
    lastVisibleIndex: endIndex,
    hasPrevious,
    hasMore,
    nextPage,
    previousPage,
  };
};

export type CatalogPaginationControlsProps = Omit<
  CatalogPaginationResult<unknown>,
  'visibleItems' | 'nextPage' | 'previousPage'
> & {
  onNextPage: () => void;
  onPreviousPage: () => void;
  controlsId: string;
  testId: string;
};

/** Keyboard-safe, live-announced page controls shared by catalog pages. */
export const CatalogPaginationControls: React.FC<CatalogPaginationControlsProps> = ({
  totalCount,
  remainingCount,
  pageSize,
  firstVisibleIndex,
  lastVisibleIndex,
  hasPrevious,
  hasMore,
  onNextPage,
  onPreviousPage,
  controlsId,
  testId,
}) => {
  const { t } = useTranslation();
  if (totalCount <= pageSize) return null;

  return (
    <div className='flex flex-col items-center gap-8px py-12px' data-testid={`${testId}-status`}>
      <span className='text-12px text-[var(--color-text-3)]' aria-live='polite' aria-atomic='true'>
        {t('mcpLibrary.browse.showMoreCount', {
          defaultValue: '({{shown}} of {{total}})',
          shown: `${firstVisibleIndex}–${lastVisibleIndex}`,
          total: totalCount,
        })}
      </span>
      <div className='flex items-center gap-8px'>
        <Button
          type='secondary'
          onClick={hasPrevious ? onPreviousPage : undefined}
          aria-controls={controlsId}
          aria-disabled={!hasPrevious}
          data-testid={`${testId}-previous`}
        >
          {t('settings.shared.back')}
        </Button>
        <Button
          type='secondary'
          onClick={hasMore ? onNextPage : undefined}
          aria-controls={controlsId}
          aria-disabled={!hasMore}
          data-testid={testId}
        >
          {hasMore ? (
            <>
              {t('mcpLibrary.browse.showMore')}{' '}
              {t('mcpLibrary.browse.showMoreCount', {
                defaultValue: '({{shown}} of {{total}})',
                shown: Math.min(pageSize, remainingCount),
                total: remainingCount,
              })}
            </>
          ) : (
            t('settings.shared.next')
          )}
        </Button>
      </div>
    </div>
  );
};
