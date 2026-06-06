/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import SettingsModal, { type SettingTab } from './index';

/**
 * Settings modal hook return type
 */
interface UseSettingsModalReturn {
  /** Open settings modal */
  openSettings: (tab?: SettingTab) => void;
  /** Close settings modal */
  closeSettings: () => void;
  /** Settings modal component */
  settingsModal: React.ReactNode;
  /** Modal visibility state */
  visible: boolean;
}

/**
 * Hook for using the settings modal
 *
 * Provides state management and operation methods for settings modal
 *
 * @returns Hook return object
 *
 * @example
 * ```tsx
 * const { openSettings, settingsModal } = useSettingsModal();
 *
 * return (
 *   <>
 *     <Button onClick={() => openSettings()}>Open Settings</Button>
 *     <Button onClick={() => openSettings('model')}>Open Model Settings</Button>
 *     {settingsModal}
 *   </>
 * );
 * ```
 */
export const useSettingsModal = (): UseSettingsModalReturn => {
  // Modal visibility state
  const [visible, setVisible] = useState(false);
  // Default selected tab
  const [defaultTab, setDefaultTab] = useState<SettingTab>('gemini');

  /**
   * Open settings modal
   * @param tab - Optional, specify which tab to open
   */
  const openSettings = useCallback((tab?: SettingTab) => {
    if (tab) {
      setDefaultTab(tab);
    }
    setVisible(true);
  }, []);

  /**
   * Close settings modal
   */
  const closeSettings = useCallback(() => {
    setVisible(false);
  }, []);

  // Render settings modal component
  const settingsModal = <SettingsModal visible={visible} onCancel={closeSettings} defaultTab={defaultTab} />;

  return {
    openSettings,
    closeSettings,
    settingsModal,
    visible,
  };
};

export default useSettingsModal;
