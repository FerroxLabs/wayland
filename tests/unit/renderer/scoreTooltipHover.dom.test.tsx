/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Regression for #751: hovering the promotion-score (?) help icon in the Memory
 * Archive detail panel blanked the whole app. The icon (@icon-park/react `Help`)
 * does not forwardRef, so Arco's <Tooltip> received a null trigger ref and threw
 * while positioning the popup on hover; with no error boundary over the memory
 * page the whole tree unmounted. The fix wraps the trigger in a ref-forwarding
 * host element (a span), matching the DesktopActionButton pattern.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Tooltip } from '@arco-design/web-react';
import { Help } from '@icon-park/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

describe('promotion-score tooltip hover (#751)', () => {
  it('does not throw when hovering an icon-park trigger wrapped for the tooltip', async () => {
    render(
      <Tooltip content='Score formula' position='top'>
        <span style={{ display: 'inline-flex' }}>
          <Help theme='outline' size='13' aria-label='Score formula' />
        </span>
      </Tooltip>
    );

    const trigger = screen.getByLabelText('Score formula').closest('span') as HTMLElement;
    expect(trigger).not.toBeNull();

    // Hovering must not throw / tear down the tree. Arco shows the popup on
    // mouseEnter after a short delay; the content becomes reachable.
    expect(() => {
      fireEvent.mouseEnter(trigger);
    }).not.toThrow();

    await waitFor(() => expect(screen.getByText('Score formula')).toBeInTheDocument());
    // The trigger icon is still mounted (the tree did not blank out).
    expect(screen.getByLabelText('Score formula')).toBeInTheDocument();
  });
});
