/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId } from 'react';

/**
 * Preference row component
 * Displays a label and control in a unified horizontal layout.
 *
 * The visible label is linked to its control via `aria-labelledby` so unlabeled
 * Arco controls (Switch renders a bare `<button role="switch">`, InputNumber a
 * bare spinbutton) get an accessible name for screen readers — otherwise axe
 * flags button-name / label / aria-input-field-name (QA-01). Arco spreads
 * unknown props onto the control element, so the attr reaches the button/input.
 */
const PreferenceRow: React.FC<{
  label: string;
  children: React.ReactNode;
  description?: string;
}> = ({ label, children, description }) => {
  const labelId = useId();
  const child = children as React.ReactElement<Record<string, unknown>>;
  const labelledChild = React.isValidElement(children)
    ? React.cloneElement(child, {
        'aria-labelledby': `${(child.props['aria-labelledby'] as string) ?? ''} ${labelId}`.trim(),
      })
    : children;
  return (
    <div className='flex items-center justify-between gap-24px py-12px'>
      <div className='flex-1'>
        <div id={labelId} className='text-14px text-2'>
          {label}
        </div>
        {description && <div className='text-12px text-t-tertiary mt-4px'>{description}</div>}
      </div>
      <div className='flex-shrink-0'>{labelledChild}</div>
    </div>
  );
};

export default PreferenceRow;
