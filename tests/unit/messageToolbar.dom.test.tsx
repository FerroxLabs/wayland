import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MessageToolbar from '@/renderer/components/chat/observability/MessageToolbar';

vi.mock('@arco-design/web-react', () => ({
  Tooltip: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  Button: ({
    icon,
    onClick,
    'aria-label': ariaLabel,
    'aria-pressed': ariaPressed,
    className,
  }: {
    icon?: React.ReactNode;
    onClick?: () => void;
    'aria-label'?: string;
    'aria-pressed'?: boolean;
    className?: string;
  }) => (
    <button aria-label={ariaLabel} aria-pressed={ariaPressed} className={className} onClick={onClick}>
      {icon}
    </button>
  ),
}));

vi.mock('@icon-park/react', () => ({
  Copy: () => <span data-testid='copy-icon' />,
  Check: () => <span data-testid='check-icon' />,
  Refresh: () => <span data-testid='refresh-icon' />,
  Like: () => <span data-testid='like-icon' />,
  Unlike: () => <span data-testid='unlike-icon' />,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

describe('MessageToolbar', () => {
  it('renders copy + thumbs by default (regenerate hidden without a handler)', () => {
    render(<MessageToolbar text='hello' />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.queryByLabelText('Regenerate')).toBeNull();
  });

  it('renders the regenerate button only when onRegenerate is provided', () => {
    render(<MessageToolbar text='hello' onRegenerate={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(4);
    expect(screen.getByLabelText('Regenerate')).toBeTruthy();
  });

  it('copies text and shows the success state', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<MessageToolbar text='copy me' />);
    fireEvent.click(screen.getByLabelText('Copy'));

    expect(writeText).toHaveBeenCalledWith('copy me');
    await waitFor(() => expect(screen.getByTestId('check-icon')).toBeTruthy());
  });

  it('handles a clipboard failure without crashing or false-showing success', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.assign(navigator, { clipboard: { writeText } });

    render(<MessageToolbar text='copy me' />);
    fireEvent.click(screen.getByLabelText('Copy'));

    await waitFor(() => expect(writeText).toHaveBeenCalled());
    // No success check-icon on failure; the copy icon stays (graceful, no crash).
    expect(screen.queryByTestId('check-icon')).toBeNull();
    expect(screen.getByTestId('copy-icon')).toBeTruthy();
  });

  it('fires onRegenerate when the regenerate button is clicked', () => {
    const onRegenerate = vi.fn();
    render(<MessageToolbar text='x' onRegenerate={onRegenerate} />);
    fireEvent.click(screen.getByLabelText('Regenerate'));
    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });

  it('toggles thumbs feedback up then back to null', () => {
    const onFeedback = vi.fn();
    render(<MessageToolbar text='x' onFeedback={onFeedback} />);
    const up = screen.getByLabelText('Good response');

    fireEvent.click(up);
    expect(onFeedback).toHaveBeenNthCalledWith(1, 'up');

    fireEvent.click(up);
    expect(onFeedback).toHaveBeenNthCalledWith(2, null);
  });

  it('fires onFeedback with down', () => {
    const onFeedback = vi.fn();
    render(<MessageToolbar text='x' onFeedback={onFeedback} />);
    fireEvent.click(screen.getByLabelText('Bad response'));
    expect(onFeedback).toHaveBeenCalledWith('down');
  });
});
