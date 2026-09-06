import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import FeedbackReportModal from '@renderer/components/settings/SettingsModal/contents/FeedbackReportModal';

const {
  modalWrapperMock,
  mockCaptureEvent,
  mockWithScope,
  mockGetClient,
  mockIsInitialized,
  mockIsEnabled,
  mockClientFlush,
  mockCopyText,
  mockCollectFeedbackLogs,
  messageSuccess,
  messageError,
} = vi.hoisted(() => ({
  modalWrapperMock: vi.fn(),
  mockCaptureEvent: vi.fn(),
  mockWithScope: vi.fn(),
  mockGetClient: vi.fn(),
  mockIsInitialized: vi.fn(),
  mockIsEnabled: vi.fn(),
  mockClientFlush: vi.fn(),
  mockCopyText: vi.fn(),
  mockCollectFeedbackLogs: vi.fn(),
  messageSuccess: vi.fn(),
  messageError: vi.fn(),
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock Sentry
vi.mock('@sentry/electron/renderer', () => ({
  captureEvent: mockCaptureEvent,
  withScope: mockWithScope,
  getClient: mockGetClient,
  isInitialized: mockIsInitialized,
  isEnabled: mockIsEnabled,
}));
vi.mock('@renderer/utils/ui/clipboard', () => ({ copyText: mockCopyText }));

function createClipboardEvent(files: File[]): ClipboardEvent {
  const fileList = Object.assign([...files], { item: (index: number) => files[index] ?? null });
  const event = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;

  Object.defineProperty(event, 'clipboardData', {
    value: {
      files: fileList,
    },
  });

  return event;
}

// Mock electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: {
    collectFeedbackLogs: mockCollectFeedbackLogs,
  },
  writable: true,
});

// Mock ModalWrapper to render children directly
vi.mock('@renderer/components/base/ModalWrapper', () => ({
  default: ({
    children,
    visible,
    title,
    onCancel,
    onOk,
    confirmLoading,
    okText,
    cancelText,
    okButtonProps,
    alignCenter,
    className,
    autoFocus,
  }: {
    children: React.ReactNode;
    visible: boolean;
    title?: React.ReactNode;
    onCancel?: () => void;
    onOk?: () => void;
    confirmLoading?: boolean;
    okText?: React.ReactNode;
    cancelText?: React.ReactNode;
    okButtonProps?: {
      disabled?: boolean;
    };
    alignCenter?: boolean;
    className?: string;
    autoFocus?: boolean;
  }) => {
    modalWrapperMock({
      visible,
      title,
      onCancel,
      onOk,
      confirmLoading,
      okText,
      cancelText,
      okButtonProps,
      alignCenter,
      className,
      autoFocus,
    });
    if (!visible) return null;
    return (
      <div data-testid='modal-wrapper' className={className}>
        {title && <div data-testid='modal-title'>{title}</div>}
        {children}
        <div data-testid='modal-footer'>
          <button onClick={onCancel}>{cancelText}</button>
          <button onClick={onOk} disabled={okButtonProps?.disabled} data-loading={confirmLoading}>
            {okText}
          </button>
        </div>
      </div>
    );
  },
}));

// Mock Arco Design components
vi.mock('@arco-design/web-react', () => ({
  Button: ({ children, onClick }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button type='button' onClick={onClick}>
      {children}
    </button>
  ),
  Input: Object.assign(
    ({
      placeholder,
      value,
      onChange,
      maxLength,
      ...rest
    }: {
      placeholder?: string;
      value?: string;
      onChange?: (val: string) => void;
      maxLength?: number;
      [key: string]: unknown;
    }) => (
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        maxLength={maxLength}
        {...rest}
      />
    ),
    {
      TextArea: ({
        placeholder,
        value,
        onChange,
        maxLength,
      }: {
        placeholder?: string;
        value?: string;
        onChange?: (val: string) => void;
        maxLength?: number;
      }) => (
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          maxLength={maxLength}
        />
      ),
    }
  ),
  Select: Object.assign(
    ({
      children,
      placeholder,
      value,
      onChange,
    }: {
      children?: React.ReactNode;
      placeholder?: string;
      value?: string;
      onChange?: (val: string) => void;
    }) => (
      <select value={value ?? ''} onChange={(e) => onChange?.(e.target.value)}>
        <option value='' disabled>
          {placeholder}
        </option>
        {children}
      </select>
    ),
    {
      Option: ({ children, value }: { children: React.ReactNode; value: string }) => (
        <option value={value}>{children}</option>
      ),
    }
  ),
  Message: {
    success: messageSuccess,
    error: messageError,
  },
  Upload: ({
    tip,
    fileList,
    children,
  }: {
    tip?: string;
    fileList?: Array<{ name: string }>;
    children?: React.ReactNode;
  }) => (
    <div data-testid='upload' data-file-count={fileList?.length ?? 0}>
      {children}
      {tip}
      {fileList?.map((file) => (
        <span key={file.name}>{file.name}</span>
      ))}
    </div>
  ),
}));

// Mock icon-park
vi.mock('@icon-park/react', () => ({
  Info: () => <span data-testid='info-icon' />,
  Plus: () => <span data-testid='plus-icon' />,
}));

import React from 'react';

function fillRequiredReport(description = 'Agent unavailable after update') {
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'agent-detection' } });
  fireEvent.change(screen.getByPlaceholderText('settings.bugReportDescriptionPlaceholder'), {
    target: { value: description },
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('FeedbackReportModal', () => {
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockWithScope.mockImplementation((callback) => callback({ setTag: vi.fn(), addAttachment: vi.fn() }));
    mockGetClient.mockReturnValue({ flush: mockClientFlush });
    mockIsInitialized.mockReturnValue(true);
    mockIsEnabled.mockReturnValue(true);
    mockClientFlush.mockResolvedValue(true);
    mockCopyText.mockResolvedValue(undefined);
    mockCollectFeedbackLogs.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render form fields when visible', () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);
    expect(screen.getByText('settings.bugReportModuleLabel')).toBeDefined();
    expect(screen.getByText('settings.bugReportDescriptionLabel')).toBeDefined();
    expect(screen.getByText('settings.bugReportScreenshotDropzoneText')).toBeDefined();
    expect(screen.getByText('settings.bugReportScreenshotFormats')).toBeDefined();
  });

  it('should not render when not visible', () => {
    render(<FeedbackReportModal visible={false} onCancel={onCancel} />);
    expect(screen.queryByText('settings.bugReportModuleLabel')).toBeNull();
  });

  it('should not render a separate title field', () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);
    expect(screen.queryByText('settings.bugReportTitleLabel')).toBeNull();
    expect(screen.queryByPlaceholderText('settings.bugReportTitlePlaceholder')).toBeNull();
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('settings.bugReportCancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('should request centered modal layout', () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);
    expect(modalWrapperMock).toHaveBeenCalledWith(
      expect.objectContaining({
        visible: true,
        alignCenter: true,
      })
    );
  });

  it('should use the shared modal wrapper title and actions', () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);

    expect(screen.getByTestId('modal-footer')).toBeDefined();
    expect(modalWrapperMock).toHaveBeenCalledWith(
      expect.objectContaining({
        visible: true,
        title: 'settings.bugReportTitle',
        okText: 'settings.bugReportSubmit',
        cancelText: 'settings.bugReportCancel',
      })
    );
  });

  it('should disable submit until the required fields are filled', () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);

    const submitButton = screen.getByRole('button', { name: 'settings.bugReportSubmit' });

    expect(submitButton).toBeDisabled();

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'agent-detection' },
    });
    fireEvent.change(screen.getByPlaceholderText('settings.bugReportDescriptionPlaceholder'), {
      target: { value: 'Agent unavailable after update' },
    });

    expect(submitButton).not.toBeDisabled();
  });

  it('should explain the selected module below the selector', () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);

    expect(screen.queryByText('settings.bugReportModulePermissionDescription')).toBeNull();

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'agent-detection' },
    });

    expect(screen.getByText('settings.bugReportModulePermissionDescription')).toBeDefined();
  });

  it('should constrain body height and keep the form scrollable', () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);

    const scrollBody = screen.getByTestId('feedback-report-scroll-body');
    expect(scrollBody.className).toContain('overflow-y-auto');
    expect(scrollBody.className).toContain('overflow-x-hidden');
    expect(scrollBody.className).toContain('max-h-[min(66vh,520px)]');
  });

  it('should render a compact auto-info banner aligned to the text', () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);

    const autoInfo = screen.getByTestId('feedback-report-auto-info');
    expect(autoInfo.className).toContain('inline-flex');
    expect(autoInfo.className).toContain('items-start');
    expect(autoInfo.className).toContain('leading-18px');
  });

  it('should render the paste hint inside the upload dropzone instead of a separate helper line', () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);

    const uploadTrigger = screen.getByTestId('feedback-report-upload-trigger');

    expect(uploadTrigger.className).toContain('min-h-180px');
    expect(uploadTrigger.className).toContain('w-full');
    expect(uploadTrigger.className).toContain('box-border');
    expect(screen.queryByText('settings.bugReportScreenshotHelp')).toBeNull();
  });

  it('should submit a generated summary based on the selected module and description', async () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);

    fillRequiredReport();
    fireEvent.click(screen.getByText('settings.bugReportSubmit'));

    await waitFor(() => {
      expect(mockCaptureEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          message: 'settings.bugReportModulePermission: Agent unavailable after update',
          extra: {
            description: 'Agent unavailable after update',
          },
        }),
        expect.objectContaining({
          attachments: [],
        })
      );
    });
    expect(await screen.findByTestId('feedback-report-unconfirmed')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('settings.bugReportDescriptionPlaceholder')).toHaveValue(
      'Agent unavailable after update'
    );
    expect(mockClientFlush).toHaveBeenCalledWith(5_000);
    expect(messageSuccess).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('checks transport availability before reading diagnostics and keeps the draft', async () => {
    mockGetClient.mockReturnValue(undefined);
    const screenshot = new File([new Uint8Array([1, 2, 3])], 'kept.png', { type: 'image/png' });
    const readScreenshot = vi.spyOn(screenshot, 'arrayBuffer');
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);
    document.dispatchEvent(createClipboardEvent([screenshot]));
    fillRequiredReport('Keep this exact draft');

    fireEvent.click(screen.getByText('settings.bugReportSubmit'));

    expect(await screen.findByTestId('feedback-report-unavailable')).toBeInTheDocument();
    expect(mockCollectFeedbackLogs).not.toHaveBeenCalled();
    expect(readScreenshot).not.toHaveBeenCalled();
    expect(mockCaptureEvent).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText('settings.bugReportDescriptionPlaceholder')).toHaveValue(
      'Keep this exact draft'
    );
    expect(screen.getByTestId('upload')).toHaveAttribute('data-file-count', '1');
  });

  it('treats a present but disabled client as unavailable', async () => {
    mockIsEnabled.mockReturnValue(false);
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);
    fillRequiredReport();

    fireEvent.click(screen.getByText('settings.bugReportSubmit'));

    expect(await screen.findByTestId('feedback-report-unavailable')).toBeInTheDocument();
    expect(mockCollectFeedbackLogs).not.toHaveBeenCalled();
    expect(mockCaptureEvent).not.toHaveBeenCalled();
  });

  it('copies report text only after the clipboard helper succeeds', async () => {
    mockGetClient.mockReturnValue(undefined);
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);
    fillRequiredReport('Copy me manually');
    fireEvent.click(screen.getByText('settings.bugReportSubmit'));
    await screen.findByTestId('feedback-report-unavailable');

    fireEvent.click(screen.getByRole('button', { name: 'settings.bugReportCopy' }));

    await waitFor(() => expect(mockCopyText).toHaveBeenCalledOnce());
    expect(mockCopyText.mock.calls[0][0]).toContain(
      'settings.bugReportModuleLabel: settings.bugReportModulePermission'
    );
    expect(mockCopyText.mock.calls[0][0]).toContain('settings.bugReportDescriptionLabel: Copy me manually');
    expect(mockCopyText.mock.calls[0][0]).toContain('settings.bugReportCopyAttachments');
    expect(messageSuccess).toHaveBeenCalledWith('settings.bugReportCopySuccess');
  });

  it('discards the retained draft only when the user explicitly cancels', async () => {
    mockGetClient.mockReturnValue(undefined);
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);
    fillRequiredReport('Discard only on cancel');
    fireEvent.click(screen.getByText('settings.bugReportSubmit'));
    await screen.findByTestId('feedback-report-unavailable');

    fireEvent.click(screen.getByText('settings.bugReportCancel'));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(screen.getByPlaceholderText('settings.bugReportDescriptionPlaceholder')).toHaveValue('');
    expect(screen.queryByTestId('feedback-report-unavailable')).toBeNull();
  });

  it('reports clipboard failure without clearing the draft', async () => {
    mockGetClient.mockReturnValue(undefined);
    mockCopyText.mockRejectedValue(new Error('clipboard denied'));
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);
    fillRequiredReport('Still here after copy failure');
    fireEvent.click(screen.getByText('settings.bugReportSubmit'));
    await screen.findByTestId('feedback-report-unavailable');

    fireEvent.click(screen.getByRole('button', { name: 'settings.bugReportCopy' }));

    await waitFor(() => expect(messageError).toHaveBeenCalledWith('settings.bugReportCopyError'));
    expect(screen.getByPlaceholderText('settings.bugReportDescriptionPlaceholder')).toHaveValue(
      'Still here after copy failure'
    );
  });

  it('prevents overlapping attempts from duplicate submit clicks', async () => {
    const logs = deferred<null>();
    mockCollectFeedbackLogs.mockReturnValue(logs.promise);
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);
    fillRequiredReport();
    const submit = screen.getByText('settings.bugReportSubmit');

    fireEvent.click(submit);
    fireEvent.click(submit);

    await waitFor(() => expect(mockCollectFeedbackLogs).toHaveBeenCalledOnce());
    logs.resolve(null);
    expect(await screen.findByTestId('feedback-report-unconfirmed')).toBeInTheDocument();
    expect(mockCaptureEvent).toHaveBeenCalledOnce();
  });

  it('settles a hung collection at 15 seconds and retains the draft', async () => {
    vi.useFakeTimers();
    const logs = deferred<null>();
    mockCollectFeedbackLogs.mockReturnValue(logs.promise);
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);
    fillRequiredReport('Timeout draft');
    fireEvent.click(screen.getByText('settings.bugReportSubmit'));

    await act(async () => {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(15_000);
    });

    expect(screen.getByTestId('feedback-report-timeout')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('settings.bugReportDescriptionPlaceholder')).toHaveValue('Timeout draft');
    logs.resolve(null);
    await act(async () => {
      await logs.promise;
      await Promise.resolve();
    });
    expect(mockCaptureEvent).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('ignores a late attempt after the modal closes and reopens', async () => {
    const logs = deferred<null>();
    mockCollectFeedbackLogs.mockReturnValue(logs.promise);
    const view = render(<FeedbackReportModal visible={true} onCancel={onCancel} />);
    fillRequiredReport('Old draft');
    fireEvent.click(screen.getByText('settings.bugReportSubmit'));
    await waitFor(() => expect(mockCollectFeedbackLogs).toHaveBeenCalledOnce());

    view.rerender(<FeedbackReportModal visible={false} onCancel={onCancel} />);
    view.rerender(<FeedbackReportModal visible={true} onCancel={onCancel} />);
    fireEvent.change(screen.getByPlaceholderText('settings.bugReportDescriptionPlaceholder'), {
      target: { value: 'New draft' },
    });
    logs.resolve(null);
    await act(async () => {
      await logs.promise;
      await Promise.resolve();
    });

    expect(screen.getByPlaceholderText('settings.bugReportDescriptionPlaceholder')).toHaveValue('New draft');
    expect(screen.queryByTestId('feedback-report-unconfirmed')).toBeNull();
    expect(mockCaptureEvent).not.toHaveBeenCalled();
  });

  it('does not capture a canceled draft when delayed diagnostics later resolve', async () => {
    const logs = deferred<null>();
    mockCollectFeedbackLogs.mockReturnValue(logs.promise);
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);
    fillRequiredReport('Canceled draft');
    fireEvent.click(screen.getByText('settings.bugReportSubmit'));
    await waitFor(() => expect(mockCollectFeedbackLogs).toHaveBeenCalledOnce());

    fireEvent.click(screen.getByText('settings.bugReportCancel'));
    logs.resolve(null);
    await act(async () => {
      await logs.promise;
      await Promise.resolve();
    });

    expect(mockCaptureEvent).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('should attach pasted screenshots when submitting the report', async () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);

    document.dispatchEvent(
      createClipboardEvent([new File([new Uint8Array([1, 2, 3])], 'clipboard.png', { type: 'image/png' })])
    );

    await waitFor(() => {
      expect(screen.getByTestId('upload')).toHaveAttribute('data-file-count', '1');
    });

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'agent-detection' },
    });
    fireEvent.change(screen.getByPlaceholderText('settings.bugReportDescriptionPlaceholder'), {
      target: { value: 'Agent unavailable after update' },
    });
    fireEvent.click(screen.getByText('settings.bugReportSubmit'));

    await waitFor(() => {
      expect(mockCaptureEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'settings.bugReportModulePermission: Agent unavailable after update',
        }),
        expect.objectContaining({
          attachments: [
            expect.objectContaining({
              filename: 'screenshot-1-clipboard.png',
              contentType: 'image/png',
            }),
          ],
        })
      );
    });
    expect(await screen.findByTestId('feedback-report-unconfirmed')).toBeInTheDocument();
    expect(screen.getByTestId('upload')).toHaveAttribute('data-file-count', '1');
  });

  it('should keep only the first three pasted screenshots', async () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);

    document.dispatchEvent(
      createClipboardEvent([
        new File([new Uint8Array([1])], 'one.png', { type: 'image/png' }),
        new File([new Uint8Array([2])], 'two.png', { type: 'image/png' }),
        new File([new Uint8Array([3])], 'three.png', { type: 'image/png' }),
        new File([new Uint8Array([4])], 'four.png', { type: 'image/png' }),
      ])
    );

    await waitFor(() => {
      expect(screen.getByTestId('upload')).toHaveAttribute('data-file-count', '3');
    });

    expect(screen.getByText('one.png')).toBeDefined();
    expect(screen.getByText('two.png')).toBeDefined();
    expect(screen.getByText('three.png')).toBeDefined();
    expect(screen.queryByText('four.png')).toBeNull();
  });

  it('should show an error when submitting fails', async () => {
    mockWithScope.mockImplementationOnce(() => {
      throw new Error('submit failed');
    });

    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'agent-detection' },
    });
    fireEvent.change(screen.getByPlaceholderText('settings.bugReportDescriptionPlaceholder'), {
      target: { value: 'Agent unavailable after update' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'settings.bugReportSubmit' }));

    await waitFor(() => {
      expect(screen.getByText('settings.bugReportError')).toBeDefined();
    });
  });
});
