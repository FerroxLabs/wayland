import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Input } from '@arco-design/web-react';
import type { RefInputType } from '@arco-design/web-react/es/Input/interface';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { SettingsSearchIndex } from './SettingsSearchIndex';
import { type SearchEntry } from './searchEntries';

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
};

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<RefInputType>(null);

  const index = useMemo(() => new SettingsSearchIndex(), []);
  const results = useMemo(() => index.search(query), [index, query]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      // Focus input after modal transition
      const timer = window.setTimeout(() => inputRef.current?.dom?.focus(), 60);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [open]);

  // Keep activeIdx in bounds
  useEffect(() => {
    setActiveIdx(0);
  }, [results.length]);

  const navigate_ = useCallback(
    (entry: SearchEntry) => {
      void navigate(`/settings/${entry.path}${entry.anchor ? `#${entry.anchor}` : ''}`);
      onClose();
    },
    [navigate, onClose]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        const entry = results[activeIdx];
        if (entry) navigate_(entry);
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [results, activeIdx, navigate_, onClose]
  );

  if (!open) return null;

  const content = (
    <div
      className='fixed inset-0 z-9999 flex items-start justify-center pt-[15vh] bg-[var(--bg-overlay)]'
      onClick={onClose}
    >
      <div
        className='w-full max-w-640px mx-16px bg-[var(--bg-elevated)] rounded-16px shadow-2xl overflow-hidden'
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        role='dialog'
        aria-modal
        aria-label={t('settings.commandPalette.placeholder')}
      >
        {/* Search input */}
        <div className='flex items-center gap-10px px-16px py-12px border-b border-[var(--color-border-1)]'>
          <Search size={16} className='text-[var(--color-text-3)] shrink-0' />
          <Input
            ref={inputRef}
            value={query}
            onChange={setQuery}
            placeholder={t('settings.commandPalette.placeholder')}
            className='flex-1'
            style={{ background: 'transparent', boxShadow: 'none', border: 'none' }}
          />
          <kbd className='text-11px text-[var(--color-text-3)] bg-[var(--color-bg-4)] rounded-4px px-6px py-2px'>Esc</kbd>
        </div>

        {/* Results */}
        <div className='max-h-400px overflow-y-auto py-8px'>
          {results.length === 0 ? (
            <div className='px-16px py-20px text-14px text-[var(--color-text-3)] text-center'>
              {t('settings.commandPalette.noResults')}
            </div>
          ) : (
            results.map((entry, idx) => (
              <button
                key={entry.id}
                type='button'
                className={[
                  'w-full text-left flex items-center gap-12px px-16px py-10px transition-colors',
                  idx === activeIdx
                    ? 'bg-[var(--brand-soft-bg)] text-[var(--color-text-1)]'
                    : 'text-[var(--color-text-1)] hover:bg-[var(--color-bg-4)]',
                ].join(' ')}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => navigate_(entry)}
              >
                <span className='text-14px flex-1 truncate'>{entry.title}</span>
                {entry.subtitle && (
                  <span className='text-12px text-[var(--color-text-3)] shrink-0'>{entry.subtitle}</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default CommandPalette;
