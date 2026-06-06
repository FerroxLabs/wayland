import React from 'react';
import { Info } from 'lucide-react';

type HelpBlockProps = {
  body: React.ReactNode;
  icon?: React.ReactNode;
};

const HelpBlock: React.FC<HelpBlockProps> = ({ body, icon }) => {
  return (
    <div className='flex gap-10px px-14px py-12px rounded-8px bg-[var(--brand-soft-bg)] border border-[var(--brand-soft-border)]'>
      <span className='shrink-0 mt-1px text-[var(--brand)]'>
        {icon ?? <Info size={15} />}
      </span>
      <div className='text-13px text-[var(--text-secondary)] leading-relaxed'>{body}</div>
    </div>
  );
};

export default HelpBlock;
