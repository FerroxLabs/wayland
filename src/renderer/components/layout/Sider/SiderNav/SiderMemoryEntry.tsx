/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Brain, ChevronDown, ChevronRight, Archive, BookOpen } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { Tooltip } from '@arco-design/web-react';
import classNames from 'classnames';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { wiki as wikiBridge } from '@/common/adapter/ipcBridge';
import type { SiderTooltipProps } from '@renderer/utils/ui/siderTooltip';

const EXPANDED_LS_KEY = 'wayland.sidebar.memory.expanded';

/**
 * SiderMemoryEntry - expandable top-zone nav entry for the IJFW Memory section.
 *
 * When expanded shows two indented children:
 *   - "Archive" → /memory
 *   - "Wiki"    → /wiki
 *
 * An orange 8px dot badge appears on the parent row when wiki.orphanCandidates > 0.
 * Expand/collapse state is persisted to localStorage.
 */
interface SiderMemoryEntryProps {
  isMobile: boolean;
  isActive: boolean;
  collapsed: boolean;
  siderTooltipProps: SiderTooltipProps;
  onClick?: () => void;
}

const SiderMemoryEntry: React.FC<SiderMemoryEntryProps> = ({
  isMobile,
  isActive,
  collapsed,
  siderTooltipProps,
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const label = t('sider.memory');

  const isOnMemoryOrWiki =
    location.pathname.startsWith('/memory') || location.pathname.startsWith('/wiki');

  const [expanded, setExpanded] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(EXPANDED_LS_KEY);
      if (stored !== null) return stored === 'true';
    } catch {
      // Ignore
    }
    // Default expanded if already on a memory/wiki route
    return isOnMemoryOrWiki;
  });

  const [orphanCount, setOrphanCount] = useState(0);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(EXPANDED_LS_KEY, String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  // Fetch orphan count on mount + subscribe to wiki state changes (Fix 12).
  // Uses wiki.getState to get orphanCandidates on cold load without waiting
  // for a stateChanged event.
  useEffect(() => {
    let cancelled = false;
    const fetchOrphans = async (): Promise<void> => {
      try {
        const state = await wikiBridge.getState.invoke(undefined);
        if (!cancelled && state) {
          setOrphanCount(state.orphanCandidates.length);
        }
      } catch {
        // Non-fatal
      }
    };
    void fetchOrphans();
    const unsub = wikiBridge.stateChanged.on((state) => {
      if (!cancelled) setOrphanCount(state.orphanCandidates.length);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const handleNavigate = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate],
  );

  const isArchiveActive = location.pathname.startsWith('/memory');
  const isWikiActive = location.pathname.startsWith('/wiki');

  if (collapsed) {
    return (
      <Tooltip {...siderTooltipProps} content={label} position='right'>
        <div
          className={classNames(
            'w-full h-26px flex items-center justify-center cursor-pointer transition-colors rd-8px text-t-primary relative',
            isActive ? 'bg-[rgba(var(--primary-6),0.12)] text-primary' : 'hover:bg-fill-3 active:bg-fill-4'
          )}
          onClick={toggleExpanded}
          data-testid='sider-memory-entry'
        >
          <Brain
            size={16}
            className='block leading-none shrink-0'
            style={{ lineHeight: 0 }}
          />
          {orphanCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--orange, #FF7A45)',
              }}
              aria-label={`${orphanCount} emerging concepts`}
            />
          )}
        </div>
      </Tooltip>
    );
  }

  return (
    <div data-testid='sider-memory-entry-group'>
      {/* Parent row */}
      <div
        className={classNames(
          'box-border h-26px w-full flex items-center justify-start gap-8px px-8px rd-0.5rem cursor-pointer shrink-0 transition-all text-t-primary',
          isMobile && 'sider-action-btn-mobile',
          isOnMemoryOrWiki && !isArchiveActive && !isWikiActive
            ? 'bg-[rgba(var(--primary-6),0.12)] text-primary'
            : 'hover:bg-fill-3 active:bg-fill-4'
        )}
        onClick={toggleExpanded}
        data-testid='sider-memory-entry'
        aria-expanded={expanded}
      >
        <span className='w-20px h-20px flex items-center justify-center shrink-0 relative'>
          <Brain size={16} className='block leading-none' style={{ lineHeight: 0 }} />
          {orphanCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--orange, #FF7A45)',
              }}
              aria-label={`${orphanCount} emerging concepts`}
            />
          )}
        </span>
        <span className='collapsed-hidden text-t-primary text-12px font-medium leading-20px flex-1'>
          {label}
        </span>
        <span className='collapsed-hidden text-t-3 flex items-center'>
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
      </div>

      {/* Expanded children */}
      {expanded && (
        <>
          <div
            className={classNames(
              'box-border h-30px w-full flex items-center justify-start gap-8px pl-20px pr-10px rd-0.5rem cursor-pointer shrink-0 transition-all',
              isArchiveActive
                ? 'bg-[rgba(var(--primary-6),0.12)] text-primary'
                : 'text-t-secondary hover:bg-fill-3 active:bg-fill-4'
            )}
            onClick={() => handleNavigate('/memory')}
            data-testid='sider-memory-archive-entry'
          >
            <span className='w-20px h-20px flex items-center justify-center shrink-0'>
              <Archive size={14} className='block leading-none' style={{ lineHeight: 0 }} />
            </span>
            <span className='collapsed-hidden text-12px font-medium leading-22px'>
              Archive
            </span>
          </div>

          <div
            className={classNames(
              'box-border h-30px w-full flex items-center justify-start gap-8px pl-20px pr-10px rd-0.5rem cursor-pointer shrink-0 transition-all',
              isWikiActive
                ? 'bg-[rgba(var(--primary-6),0.12)] text-primary'
                : 'text-t-secondary hover:bg-fill-3 active:bg-fill-4'
            )}
            onClick={() => handleNavigate('/wiki')}
            data-testid='sider-memory-wiki-entry'
          >
            <span className='w-20px h-20px flex items-center justify-center shrink-0'>
              <BookOpen size={14} className='block leading-none' style={{ lineHeight: 0 }} />
            </span>
            <span className='collapsed-hidden text-12px font-medium leading-22px'>
              Wiki
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default SiderMemoryEntry;
