import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// vi.mock is hoisted - must come before the imports that use the mocked modules.
vi.mock('@renderer/pages/cron/useCronJobs', () => ({
  useAllCronJobs: vi.fn(),
}));

vi.mock('@renderer/components/layout/Sider/CronJobSiderSection/CronJobSiderItem', () => ({
  default: ({ job }: { job: { id: string } }) => <div data-testid={`cron-row-${job.id}`}>{job.id}</div>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) => (opts?.count !== undefined ? `${key}:${opts.count}` : key),
  }),
}));

import { useAllCronJobs } from '@renderer/pages/cron/useCronJobs';
import { SiderScheduledSection } from '@renderer/components/layout/Sider/SiderAccordion/SiderScheduledSection';

const mockUseAllCronJobs = useAllCronJobs as unknown as ReturnType<typeof vi.fn>;

interface RenderOpts {
  pathname?: string;
  collapsed?: boolean;
}

function renderSection(opts: RenderOpts = {}) {
  return render(
    <MemoryRouter>
      <SiderScheduledSection
        collapsed={opts.collapsed ?? false}
        pathname={opts.pathname ?? '/'}
        onNavigate={vi.fn()}
      />
    </MemoryRouter>
  );
}

describe('SiderScheduledSection', () => {
  beforeEach(() => {
    localStorage.clear();
    mockUseAllCronJobs.mockReset();
  });

  it('renders accordion with label and badge count from useAllCronJobs.activeCount', () => {
    mockUseAllCronJobs.mockReturnValue({
      jobs: [
        { id: 'j1', metadata: { conversationId: 'c1' } },
        { id: 'j2', metadata: { conversationId: 'c2' } },
      ],
      activeCount: 2,
      loading: false,
    });
    renderSection();
    expect(screen.getByText('sider.accordion.scheduled')).toBeInTheDocument();
    expect(screen.getByTestId('sider-accordion-badge')).toHaveTextContent('2');
  });

  it('hide-when-empty: renders nothing when activeCount is 0 (expanded mode)', () => {
    mockUseAllCronJobs.mockReturnValue({ jobs: [], activeCount: 0, loading: false });
    const { container } = renderSection();
    // Entire section absent - TopZone "Scheduled" entry covers discover/create.
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('sider.accordion.scheduled')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sider-accordion-badge')).not.toBeInTheDocument();
  });

  it('hide-when-empty: renders nothing when activeCount is 0 (collapsed mode)', () => {
    mockUseAllCronJobs.mockReturnValue({ jobs: [], activeCount: 0, loading: false });
    const { container } = renderSection({ collapsed: true });
    // No redundant icon - TopZone "Scheduled" icon serves nav at all times.
    expect(container.firstChild).toBeNull();
  });

  it('auto-expands when pathname matches /scheduled', () => {
    mockUseAllCronJobs.mockReturnValue({
      jobs: [{ id: 'j1', metadata: { conversationId: 'c1' } }],
      activeCount: 1,
      loading: false,
    });
    renderSection({ pathname: '/scheduled' });
    expect(screen.getByTestId('cron-row-j1')).toBeInTheDocument();
  });

  it('auto-expands when pathname is a /conversation/:id that has a cron job', () => {
    mockUseAllCronJobs.mockReturnValue({
      jobs: [{ id: 'j1', metadata: { conversationId: 'c-9' } }],
      activeCount: 1,
      loading: false,
    });
    renderSection({ pathname: '/conversation/c-9' });
    expect(screen.getByTestId('cron-row-j1')).toBeInTheDocument();
  });

  it('caps body to 5 visible rows with Show N more link', () => {
    const jobs = Array.from({ length: 8 }, (_, i) => ({
      id: `j${i}`,
      metadata: { conversationId: `c${i}` },
    }));
    mockUseAllCronJobs.mockReturnValue({ jobs, activeCount: 8, loading: false });
    renderSection({ pathname: '/scheduled' });
    expect(screen.getAllByTestId(/^cron-row-/)).toHaveLength(5);
    expect(screen.getByText('sider.accordion.showMore:3')).toBeInTheDocument();
  });

  it('returns null in collapsed mode', () => {
    mockUseAllCronJobs.mockReturnValue({
      jobs: [{ id: 'j1', metadata: { conversationId: 'c1' } }],
      activeCount: 1,
      loading: false,
    });
    renderSection({ collapsed: true });
    expect(screen.queryByTestId('sider-scheduled-section')).not.toBeInTheDocument();
  });
});
