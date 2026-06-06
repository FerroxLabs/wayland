import React from 'react';

type PreferenceRowProps = {
  label: string;
  help?: string;
  required?: boolean;
  children: React.ReactNode;
};

const PreferenceRow: React.FC<PreferenceRowProps> = ({ label, help, required, children }) => {
  return (
    <div className='flex items-center justify-between gap-16px py-10px min-h-44px'>
      <div className='flex flex-col gap-2px flex-1 min-w-0'>
        <span className='text-13px text-[var(--text-primary)]'>
          {label}
          {required && <span className='text-[var(--danger)] ml-2px'>*</span>}
        </span>
        {help && <span className='text-12px text-[var(--text-muted)] leading-snug'>{help}</span>}
      </div>
      <div className='shrink-0 flex items-center'>{children}</div>
    </div>
  );
};

export default PreferenceRow;
