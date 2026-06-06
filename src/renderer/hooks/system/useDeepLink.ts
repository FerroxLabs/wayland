/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ipcBridge } from '@/common';

/**
 * Deep link event payload from main process.
 * `decoded` is the parsed `?data=<base64-JSON>` blob - untrusted, must be
 * shape-validated before any field is read (see `validateAddProviderDecoded`).
 */
export type DeepLinkPayload = {
  action: string;
  params: Record<string, string>;
  decoded?: unknown;
};

export type DeepLinkAddProviderDetail = {
  baseUrl?: string;
  apiKey?: string;
  name?: string;
  platform?: string;
};

/**
 * Hand-written validator for the `add-provider` / `provider/add` decoded payload.
 * Returns only string-typed known fields; everything else is dropped.
 * Pattern: consumers of `payload.decoded` MUST do this before reading any field
 * (M8: attacker-controlled keys in base64 JSON would otherwise pollute trusted state).
 */
const validateAddProviderDecoded = (decoded: unknown): DeepLinkAddProviderDetail => {
  if (!decoded || typeof decoded !== 'object') return {};
  const d = decoded as Record<string, unknown>;
  const pickString = (k: string): string | undefined => (typeof d[k] === 'string' ? (d[k] as string) : undefined);
  return {
    baseUrl: pickString('baseUrl') ?? pickString('base_url'),
    apiKey: pickString('apiKey') ?? pickString('api_key') ?? pickString('key'),
    name: pickString('name'),
    platform: pickString('platform'),
  };
};

/**
 * Pending deep link data for the add-provider action. Read-once: consumed by
 * the Models settings page on mount.
 *
 * Historical note: the Wave 3B refactor deleted the `ModelModalContent` flow
 * that originally read this pending value, but the deep-link API is still
 * exported for forward-compatibility with a future add-provider deep-link
 * handler in the new Models page.
 */
let pendingDeepLinkData: DeepLinkAddProviderDetail | null = null;

/**
 * Consume (read and clear) pending deep link data.
 * Returns the data if present, or null. Subsequent calls return null until new data arrives.
 */
export const consumePendingDeepLink = (): DeepLinkAddProviderDetail | null => {
  const data = pendingDeepLinkData;
  pendingDeepLinkData = null;
  return data;
};

/**
 * Allowed route patterns for the navigate deep link action.
 * Only routes matching these patterns are permitted.
 */
const ALLOWED_NAVIGATE_PATTERNS = [/^\/team\/[^/]+$/, /^\/conversation\/[^/]+$/];

/**
 * Hook to listen for wayland:// deep link events from main process.
 * Routes 'add-provider' action to the Models settings page.
 * Routes 'navigate' action to the specified route (whitelist-validated).
 * The pre-fill data is stored in a module-level variable and consumed
 * by the Models settings page on mount via consumePendingDeepLink().
 */
export const useDeepLink = () => {
  const navigate = useNavigate();

  const handler = useCallback(
    (payload: DeepLinkPayload) => {
      // Support both formats: "add-provider" and "provider/add" (one-api style)
      if (payload.action === 'add-provider' || payload.action === 'provider/add') {
        // Prefer shape-validated `decoded` (from base64 JSON), fall back to query params.
        // M8: decoded fields are NEVER trusted by key - they are pulled through an explicit
        // allowlist validator so attacker-chosen JSON keys can't inject trusted-looking state.
        const fromDecoded = validateAddProviderDecoded(payload.decoded);
        pendingDeepLinkData = {
          baseUrl: fromDecoded.baseUrl ?? payload.params.baseUrl ?? payload.params.base_url,
          apiKey: fromDecoded.apiKey ?? payload.params.apiKey ?? payload.params.api_key ?? payload.params.key,
          name: fromDecoded.name ?? payload.params.name,
          platform: fromDecoded.platform ?? payload.params.platform,
        };

        // Navigate to the Models settings page; consumers can read the
        // pending data via `consumePendingDeepLink()` on mount.
        void navigate('/settings/models');
        return;
      }

      if (payload.action === 'navigate') {
        const route = payload.params.route;
        if (!route) {
          console.warn('[DeepLink] navigate action missing route param');
          return;
        }

        const isAllowed = ALLOWED_NAVIGATE_PATTERNS.some((pattern) => pattern.test(route));
        if (!isAllowed) {
          console.warn(`[DeepLink] navigate blocked: route "${route}" not in whitelist`);
          return;
        }

        void navigate(route);
      }
    },
    [navigate]
  );

  useEffect(() => {
    return ipcBridge.deepLink.received.on(handler);
  }, [handler]);
};
