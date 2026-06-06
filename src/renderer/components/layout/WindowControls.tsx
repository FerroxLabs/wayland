import { Minus, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { ipcBridge } from '@/common';

const WindowMaximizeIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox='0 0 18 18' fill='none' stroke='currentColor' strokeWidth='1.4'>
    <rect x='3.5' y='3.5' width='11' height='11' rx='1.2' />
  </svg>
);

const WindowRestoreIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox='0 0 18 18' fill='none' stroke='currentColor' strokeWidth='1.4'>
    <rect x='4.75' y='6.75' width='8' height='8' rx='1.1' />
    <path
      d='M6.5 5.25V4.5c0-.7.57-1.25 1.25-1.25h5c.69 0 1.25.56 1.25 1.25v5c0 .69-.56 1.25-1.25 1.25h-.7'
      strokeWidth='1.2'
    />
  </svg>
);

const WindowControls: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [available, setAvailable] = useState(true);

  // Sync current window state and subscribe to maximize events
  useEffect(() => {
    let isMounted = true;

    // Get initial window state
    ipcBridge.windowControls.isMaximized
      .invoke()
      .then((state) => {
        if (isMounted) {
          setIsMaximized(state);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAvailable(false);
        }
      });

    // Subscribe to window maximize state changes
    const unsubscribe = ipcBridge.windowControls.maximizedChanged.on(({ isMaximized }) => {
      if (isMounted) {
        setIsMaximized(isMaximized);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Hide when window controls are not available (non-desktop)
  if (!available) {
    return null;
  }

  // Handle minimize, maximize/restore, and close button events
  const handleMinimize = () => {
    void ipcBridge.windowControls.minimize.invoke();
  };

  const handleClose = () => {
    void ipcBridge.windowControls.close.invoke();
  };

  const handleToggleMaximize = () => {
    if (isMaximized) {
      void ipcBridge.windowControls.unmaximize.invoke();
    } else {
      void ipcBridge.windowControls.maximize.invoke();
    }
  };

  return (
    <div className='app-window-controls'>
      <button type='button' className='app-window-controls__button' onClick={handleMinimize} aria-label='Minimize'>
        <Minus size={14} strokeWidth={4} />
      </button>
      <button
        type='button'
        className='app-window-controls__button'
        onClick={handleToggleMaximize}
        aria-label={isMaximized ? 'Restore' : 'Maximize'}
      >
        {isMaximized ? <WindowRestoreIcon size={14} /> : <WindowMaximizeIcon size={14} />}
      </button>
      <button
        type='button'
        className='app-window-controls__button app-window-controls__button--close'
        onClick={handleClose}
        aria-label='Close'
      >
        <X size={16} strokeWidth={3} />
      </button>
    </div>
  );
};

export default WindowControls;
