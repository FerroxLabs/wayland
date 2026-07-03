import React from 'react';
import { useLayoutContext } from '@/renderer/hooks/context/LayoutContext';

type PreferenceRowProps = {
  label: React.ReactNode;
  help?: string;
  required?: boolean;
  children: React.ReactNode;
};

const PreferenceRow: React.FC<PreferenceRowProps> = ({ label, help, required, children }) => {
  const isMobile = useLayoutContext()?.isMobile ?? false;
  return (
    <div
      className={
        isMobile
          ? 'flex flex-col items-stretch gap-8px py-10px'
          : 'flex items-center justify-between gap-16px py-10px min-h-44px'
      }
    >
      <div className='flex flex-col gap-2px flex-1 min-w-0'>
        <span className='text-13px text-[var(--text-primary)]'>
          {label}
          {required && <span className='text-[var(--danger)] ml-2px'>*</span>}
        </span>
        {help && <span className='text-12px text-[var(--text-muted)] leading-snug'>{help}</span>}
      </div>
      <div className={isMobile ? 'w-full flex items-center' : 'shrink-0 flex items-center'}>{children}</div>
    </div>
  );
};

export default PreferenceRow;
