/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { bridge } from '@office-ai/platform';
import React, { useCallback, useEffect, useState } from 'react';
import { SHOW_OPEN_REQUEST_EVENT } from '@/common/adapter/constant';
import DirectorySelectionModal from '@renderer/components/settings/DirectorySelectionModal';

interface DirectorySelectionRequest {
  id: string;
  isFileMode?: boolean;
  properties?: string[];
}

export const useDirectorySelection = () => {
  const [visible, setVisible] = useState(false);
  const [requestData, setRequestData] = useState<DirectorySelectionRequest | null>(null);

  const handleConfirm = useCallback(
    (paths: string[] | undefined) => {
      if (requestData) {
        // Bridge framework callback event naming convention: subscribe.callback-{event-name}{id}
        const callbackEventName = `subscribe.callback-show-open${requestData.id}`;
        // Use the global function to dispatch the callback to the bridge emitter
        if ((window as any).__emitBridgeCallback) {
          (window as any).__emitBridgeCallback(callbackEventName, paths);
        }
      }
      setVisible(false);
      setRequestData(null);
    },
    [requestData]
  );

  const handleCancel = useCallback(() => {
    if (requestData) {
      // Bridge framework callback event naming convention: subscribe.callback-{event-name}{id}
      const callbackEventName = `subscribe.callback-show-open${requestData.id}`;
      // Use the global function to dispatch the callback to the bridge emitter
      if ((window as any).__emitBridgeCallback) {
        (window as any).__emitBridgeCallback(callbackEventName, undefined);
      }
    }
    setVisible(false);
    setRequestData(null);
  }, [requestData]);

  useEffect(() => {
    const handleShowOpenRequest = (data: DirectorySelectionRequest) => {
      // Determine whether this is a file or directory selection
      let isFileMode = data.isFileMode === true;

      // Infer automatically from properties
      if (!isFileMode && data.properties) {
        isFileMode = data.properties.includes('openFile') && !data.properties.includes('openDirectory');
      }

      setRequestData({ ...data, isFileMode });
      setVisible(true);
    };

    // Listen for file selection requests from browser.ts
    bridge.on(SHOW_OPEN_REQUEST_EVENT, handleShowOpenRequest);

    return () => {
      bridge.off(SHOW_OPEN_REQUEST_EVENT, handleShowOpenRequest);
    };
  }, []);

  const contextHolder = (
    <DirectorySelectionModal
      visible={visible}
      isFileMode={requestData?.isFileMode}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { contextHolder };
};
