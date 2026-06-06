import WaylandSelect from '@/renderer/components/base/WaylandSelect';
import type { SelectHandle } from '@arco-design/web-react/es/Select/interface';
import React, { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/renderer/services/i18n';
import { LANGUAGE_OPTIONS } from '@/common/config/i18n';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const selectRef = useRef<SelectHandle>(null);

  const handleLanguageChange = useCallback((value: string) => {
    // Blur before switching to avoid dropdown and language change fighting for layout
    selectRef.current?.blur?.();

    const applyLanguage = () => {
      changeLanguage(value).catch((error: Error) => {
        console.error('Failed to change language:', error);
      });
    };

    if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
      // defer to next frame so DOM animations finish
      window.requestAnimationFrame(() => window.requestAnimationFrame(applyLanguage));
    } else {
      setTimeout(applyLanguage, 0);
    }
  }, []);

  return (
    <div className='flex items-center gap-8px'>
      <WaylandSelect ref={selectRef} className='w-160px' value={i18n.language} onChange={handleLanguageChange}>
        {LANGUAGE_OPTIONS.map((lang) => (
          <WaylandSelect.Option key={lang.code} value={lang.code}>
            {lang.label}
          </WaylandSelect.Option>
        ))}
      </WaylandSelect>
    </div>
  );
};

export default LanguageSwitcher;
