import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Button } from '@arco-design/web-react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';

export type ToastVariant = 'success' | 'error' | 'info';

export type ToastOptions = {
  variant: ToastVariant;
  title: string;
  body?: string;
  duration?: number;
};

type ToastItem = ToastOptions & { id: number };

type ToastContextValue = {
  show: (opts: ToastOptions) => void;
};

export const ToastContext = React.createContext<ToastContextValue>({ show: () => undefined });

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 size={16} className='text-[var(--success)]' />,
  error: <AlertCircle size={16} className='text-[var(--danger)]' />,
  info: <Info size={16} className='text-[var(--brand)]' />,
};

const BORDER: Record<ToastVariant, string> = {
  success: 'border-[var(--success)]',
  error: 'border-[var(--danger)]',
  info: 'border-[var(--brand-soft-border)]',
};

let nextId = 0;

const ToastItem: React.FC<{ item: ToastItem; onDismiss: (id: number) => void }> = ({ item, onDismiss }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(item.id), item.duration ?? 5000);
    return () => window.clearTimeout(timer);
  }, [item.id, item.duration, onDismiss]);

  return (
    <div
      className={classNames(
        'flex items-start gap-10px px-14px py-12px rounded-10px bg-[var(--bg-elevated)] shadow-lg border border-l-3',
        BORDER[item.variant]
      )}
      style={{ minWidth: 280, maxWidth: 360 }}
    >
      <span className='shrink-0 mt-1px'>{ICONS[item.variant]}</span>
      <div className='flex-1 min-w-0'>
        <div className='text-13px font-medium text-[var(--text-primary)]'>{item.title}</div>
        {item.body && <div className='text-12px text-[var(--text-muted)] mt-2px'>{item.body}</div>}
      </div>
      <Button
        type='text'
        size='mini'
        icon={<X size={14} />}
        onClick={() => onDismiss(item.id)}
        aria-label={t('settings.shared.dismiss')}
      />
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((opts: ToastOptions) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { ...opts, id }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const portal = ReactDOM.createPortal(
    <div className='fixed bottom-24px right-24px z-9999 flex flex-col gap-8px items-end'>
      {toasts.map((item) => (
        <ToastItem key={item.id} item={item} onDismiss={dismiss} />
      ))}
    </div>,
    document.body
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {portal}
    </ToastContext.Provider>
  );
};

// Re-export hook for convenience
export { useToast } from '@renderer/hooks/settings/useToast';
