import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SiderAccordionShell } from '@renderer/components/layout/Sider/SiderAccordion/SiderAccordionShell';
import { Workflow } from 'lucide-react';

describe('SiderAccordionShell', () => {
  const baseProps = {
    icon: <Workflow size={16} />,
    label: 'Workflows',
    badgeCount: 0,
    isLive: false,
    open: false,
    onToggle: vi.fn(),
  };

  it('renders header with label + icon', () => {
    render(<SiderAccordionShell {...baseProps}>body</SiderAccordionShell>);
    expect(screen.getByText('Workflows')).toBeInTheDocument();
  });

  it('hides badge when count is 0', () => {
    render(
      <SiderAccordionShell {...baseProps} badgeCount={0}>
        body
      </SiderAccordionShell>
    );
    expect(screen.queryByTestId('sider-accordion-badge')).not.toBeInTheDocument();
  });

  it('shows neutral badge when count >= 1 and not live', () => {
    render(
      <SiderAccordionShell {...baseProps} badgeCount={3}>
        body
      </SiderAccordionShell>
    );
    const badge = screen.getByTestId('sider-accordion-badge');
    expect(badge).toHaveTextContent('3');
    expect(badge).not.toHaveClass('live');
  });

  it('shows live badge when count >= 1 and isLive', () => {
    render(
      <SiderAccordionShell {...baseProps} badgeCount={2} isLive>
        body
      </SiderAccordionShell>
    );
    expect(screen.getByTestId('sider-accordion-badge')).toHaveClass('live');
  });

  it('hides body when open=false', () => {
    render(
      <SiderAccordionShell {...baseProps} open={false}>
        body content
      </SiderAccordionShell>
    );
    expect(screen.queryByText('body content')).not.toBeInTheDocument();
  });

  it('shows body when open=true', () => {
    render(
      <SiderAccordionShell {...baseProps} open>
        body content
      </SiderAccordionShell>
    );
    expect(screen.getByText('body content')).toBeInTheDocument();
  });

  it('header click fires onToggle', () => {
    const onToggle = vi.fn();
    render(
      <SiderAccordionShell {...baseProps} onToggle={onToggle}>
        body
      </SiderAccordionShell>
    );
    fireEvent.click(screen.getByRole('button', { name: /workflows/i }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('aria-expanded reflects open state', () => {
    const { rerender } = render(
      <SiderAccordionShell {...baseProps} open={false}>
        body
      </SiderAccordionShell>
    );
    expect(screen.getByRole('button', { name: /workflows/i })).toHaveAttribute('aria-expanded', 'false');
    rerender(
      <SiderAccordionShell {...baseProps} open>
        body
      </SiderAccordionShell>
    );
    expect(screen.getByRole('button', { name: /workflows/i })).toHaveAttribute('aria-expanded', 'true');
  });

  it('keyboard Enter toggles', () => {
    const onToggle = vi.fn();
    render(
      <SiderAccordionShell {...baseProps} onToggle={onToggle}>
        body
      </SiderAccordionShell>
    );
    const header = screen.getByRole('button', { name: /workflows/i });
    fireEvent.keyDown(header, { key: 'Enter' });
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('keyboard Space toggles', () => {
    const onToggle = vi.fn();
    render(
      <SiderAccordionShell {...baseProps} onToggle={onToggle}>
        body
      </SiderAccordionShell>
    );
    const header = screen.getByRole('button', { name: /workflows/i });
    fireEvent.keyDown(header, { key: ' ' });
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
