import React from 'react';
import { Button } from '@arco-design/web-react';
import { useLayoutContext } from '@/renderer/hooks/context/LayoutContext';
import type { SaveState } from '../feedback/SavedIndicator';
import SavedIndicator from '../feedback/SavedIndicator';

type BreadcrumbItem = { label: string; onClick?: () => void };

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: React.ReactNode;
  savedIndicator?: SaveState;
};

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, breadcrumb, actions, savedIndicator }) => {
  const isMobile = useLayoutContext()?.isMobile ?? false;
  return (
    <div
      className={
        isMobile
          ? 'flex flex-col items-stretch gap-12px mb-20px'
          : 'flex items-start justify-between gap-12px mb-20px'
      }
    >
      <div className='flex flex-col gap-4px min-w-0'>
        {breadcrumb && breadcrumb.length > 0 && (
          <div className='flex items-center flex-wrap gap-6px text-12px text-[var(--text-muted)]'>
            {breadcrumb.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span>/</span>}
                {crumb.onClick ? (
                  <Button
                    type='text'
                    size='mini'
                    className='!h-auto !p-0 !text-12px hover:!text-[var(--text-secondary)]'
                    onClick={crumb.onClick}
                  >
                    {crumb.label}
                  </Button>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 className='text-22px font-semibold text-[var(--text-primary)] m-0 leading-tight'>{title}</h1>
        {subtitle && (
          <p className='text-13px text-[var(--text-secondary)] m-0 leading-snug max-w-[640px]'>{subtitle}</p>
        )}
      </div>
      <div className={isMobile ? 'flex items-center flex-wrap gap-12px' : 'flex items-center gap-12px shrink-0'}>
        {savedIndicator !== undefined && <SavedIndicator state={savedIndicator} />}
        {actions}
      </div>
    </div>
  );
};

export default PageHeader;
