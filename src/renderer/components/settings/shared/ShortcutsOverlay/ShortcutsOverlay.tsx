import React from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import SHORTCUTS from './shortcuts';

type ShortcutsOverlayProps = {
  open: boolean;
  onClose: () => void;
};

const ShortcutsOverlay: React.FC<ShortcutsOverlayProps> = ({ open, onClose }) => {
  const { t } = useTranslation();

  if (!open) return null;

  const content = (
    <div
      className='fixed inset-0 z-9999 flex items-center justify-center bg-[var(--bg-overlay)]'
      onClick={onClose}
      role='dialog'
      aria-modal
      aria-label={t('settings.shortcuts.title')}
    >
      <div
        className='bg-[var(--bg-elevated)] rounded-16px shadow-2xl w-full max-w-480px mx-16px overflow-hidden'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between px-20px py-14px border-b border-[var(--color-border-1)]'>
          <span className='text-15px font-semibold text-[var(--color-text-1)]'>
            {t('settings.shortcuts.title')}
          </span>
          <kbd className='text-11px text-[var(--color-text-3)] bg-[var(--color-bg-4)] rounded-4px px-6px py-2px'>Esc</kbd>
        </div>

        {/* Shortcut rows */}
        <div className='py-8px'>
          {SHORTCUTS.map((s) => (
            <div
              key={s.i18nKey}
              className='flex items-center justify-between px-20px py-10px'
            >
              <span className='text-14px text-[var(--color-text-1)]'>{t(s.i18nKey)}</span>
              <div className='flex items-center gap-4px'>
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className='text-12px text-[var(--color-text-3)] bg-[var(--color-bg-4)] rounded-4px px-8px py-2px font-mono'
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default ShortcutsOverlay;
