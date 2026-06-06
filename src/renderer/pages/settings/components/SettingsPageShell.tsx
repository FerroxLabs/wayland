import React from 'react';
import SettingsPageWrapper from './SettingsPageWrapper';
import PageHeader from '@renderer/components/settings/shared/forms/PageHeader';
import type { SaveState } from '@renderer/components/settings/shared/feedback/SavedIndicator';

type BreadcrumbItem = { label: string; onClick?: () => void };

type Props = {
  title: string;
  /** One-line description shown under the title. Pages without a subtitle should still pass an empty string consciously. */
  subtitle?: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: React.ReactNode;
  savedIndicator?: SaveState;
  /** Pass-through to widen the content column for pages with card grids. */
  contentClassName?: string;
  children: React.ReactNode;
};

/**
 * Single, consistent chrome for every Settings route built since the
 * redesign. Wraps SettingsPageWrapper (padding, max-width, mobile nav,
 * command palette, shortcuts overlay) and renders a standardized
 * PageHeader so title / subtitle / breadcrumb / saved indicator are
 * uniform across all pages.
 */
const SettingsPageShell: React.FC<Props> = ({
  title,
  subtitle,
  breadcrumb,
  actions,
  savedIndicator,
  contentClassName,
  children,
}) => {
  return (
    <SettingsPageWrapper contentClassName={contentClassName}>
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumb={breadcrumb}
        actions={actions}
        savedIndicator={savedIndicator}
      />
      <div className='flex flex-col gap-16px'>{children}</div>
    </SettingsPageWrapper>
  );
};

export default SettingsPageShell;
