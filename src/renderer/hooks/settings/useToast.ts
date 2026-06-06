import { useContext } from 'react';
import { ToastContext } from '@renderer/components/settings/shared/feedback/Toast';

/**
 * Returns { show } to fire bottom-right toast notifications.
 * Must be used within a <ToastProvider>.
 */
export const useToast = () => useContext(ToastContext);
