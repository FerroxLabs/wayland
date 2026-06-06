/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ProtocolDetectionResponse } from '@/common/utils/protocolDetector';
import { ipcBridge } from '@/common';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Protocol detection hook configuration
 */
interface UseProtocolDetectionOptions {
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Whether to auto-detect */
  autoDetect?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Whether to test all keys */
  testAllKeys?: boolean;
}

/**
 * Protocol detection hook return value
 */
interface UseProtocolDetectionResult {
  /** Whether detecting */
  isDetecting: boolean;
  /** Detection result */
  result: ProtocolDetectionResponse | null;
  /** Error message */
  error: string | null;
  /** Manually trigger detection */
  detect: (baseUrl: string, apiKey: string) => Promise<void>;
  /** Reset state */
  reset: () => void;
}

/**
 * Protocol Detection Hook
 *
 * Used to auto-detect the protocol type used by an API endpoint
 *
 * @param baseUrl - Base URL
 * @param apiKey - API Key (can be multiple keys separated by commas or newlines)
 * @param options - Configuration options
 */
export function useProtocolDetection(
  baseUrl: string,
  apiKey: string,
  options: UseProtocolDetectionOptions = {}
): UseProtocolDetectionResult {
  const { debounceMs = 800, autoDetect = true, timeout = 10000, testAllKeys = false } = options;

  const [isDetecting, setIsDetecting] = useState(false);
  const [result, setResult] = useState<ProtocolDetectionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounce timer
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Request version (used to cancel stale requests)
  const requestVersionRef = useRef(0);

  /**
   * Execute protocol detection
   */
  const detect = useCallback(
    async (url: string, key: string) => {
      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      // Validate input
      if (!url || !key) {
        setResult(null);
        setError(null);
        return;
      }

      // Increment request version
      const currentVersion = ++requestVersionRef.current;

      setIsDetecting(true);
      setError(null);

      try {
        const response = await ipcBridge.mode.detectProtocol.invoke({
          baseUrl: url,
          apiKey: key,
          timeout,
          testAllKeys,
        });

        // Check if this is still the latest request
        if (currentVersion !== requestVersionRef.current) {
          return;
        }

        if (response.success && response.data) {
          setResult(response.data);
          setError(null);
        } else {
          setResult(response.data || null);
          setError(response.msg || 'Detection failed');
        }
      } catch (e: any) {
        // Check if this is still the latest request
        if (currentVersion !== requestVersionRef.current) {
          return;
        }

        setResult(null);
        setError(e.message || String(e));
      } finally {
        // Check if this is still the latest request
        if (currentVersion === requestVersionRef.current) {
          setIsDetecting(false);
        }
      }
    },
    [timeout, testAllKeys]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    requestVersionRef.current++;
    setIsDetecting(false);
    setResult(null);
    setError(null);
  }, []);

  /**
   * Auto-detect with debounce
   */
  useEffect(() => {
    if (!autoDetect) {
      return;
    }

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Reset state if no valid input
    if (!baseUrl || !apiKey) {
      setResult(null);
      setError(null);
      return;
    }

    // Set debounce timer
    debounceTimerRef.current = setTimeout(() => {
      void detect(baseUrl, apiKey);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [baseUrl, apiKey, autoDetect, debounceMs, detect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      requestVersionRef.current++;
    };
  }, []);

  return {
    isDetecting,
    result,
    error,
    detect,
    reset,
  };
}

export default useProtocolDetection;
