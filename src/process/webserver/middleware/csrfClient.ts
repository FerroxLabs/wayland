/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { parse as parseCookie } from 'cookie';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@process/webserver/config/constants';

// Read cookie by name in browser environment with error handling
function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  try {
    const cookieString = document.cookie;
    if (!cookieString) {
      return null;
    }

    const cookies = parseCookie(cookieString);
    return cookies[name] ?? null;
  } catch (error) {
    console.error('Failed to read cookie:', error);
    return null;
  }
}

// Clear a specific cookie by name
export function clearCookie(name: string, path = '/'): void {
  if (typeof document === 'undefined') {
    return;
  }

  try {
    // Clear cookie for current domain and path
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;

    // Also try clearing with common path variations
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${location.hostname}`;
  } catch (error) {
    console.error('Failed to clear cookie:', error);
  }
}

// Clear all cookies for the current domain
export function clearAllCookies(): void {
  if (typeof document === 'undefined') {
    return;
  }

  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name] = cookie.split('=');
      if (name && name.trim()) {
        clearCookie(name.trim());
      }
    }
  } catch (error) {
    console.error('Failed to clear all cookies:', error);
  }
}

// Retrieve current CSRF token from cookie (if present)
export function getCsrfToken(): string | null {
  try {
    return readCookie(CSRF_COOKIE_NAME);
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    return null;
  }
}

// Check if CSRF token exists and is valid (non-empty)
export function hasValidCsrfToken(): boolean {
  const token = getCsrfToken();
  return token !== null && token.length > 0;
}

// Attach CSRF token to request headers, keeping original headers untouched when token missing
export function withCsrfHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getCsrfToken();
  if (!token) {
    return headers;
  }

  try {
    if (headers instanceof Headers) {
      headers.set(CSRF_HEADER_NAME, token);
      return headers;
    }

    if (Array.isArray(headers)) {
      // [[name, value]] format
      const normalized = headers.filter(([name]) => name.toLowerCase() !== CSRF_HEADER_NAME.toLowerCase());
      normalized.push([CSRF_HEADER_NAME, token]);
      return normalized;
    }

    if (typeof headers === 'object' && headers !== null) {
      const plainHeaders: Record<string, string> = {
        ...(headers as Record<string, string>),
      };
      plainHeaders[CSRF_HEADER_NAME] = token;
      return plainHeaders;
    }
  } catch (error) {
    console.error('Failed to attach CSRF header:', error);
  }

  return headers;
}

// Attach CSRF token to request body for tiny-csrf compatibility
// tiny-csrf expects token in req.body._csrf, not in headers
export function withCsrfToken<T = unknown>(body: T): T & { _csrf?: string } {
  const token = getCsrfToken();
  if (!token) {
    return body as T & { _csrf?: string };
  }

  try {
    // Handle different body types
    if (body === null || body === undefined) {
      return { _csrf: token } as T & { _csrf?: string };
    }

    if (typeof body === 'object' && !Array.isArray(body)) {
      return { ...body, _csrf: token };
    }

    // For non-object bodies (string, FormData, etc.), return as-is
    // The caller should handle adding _csrf manually for these cases
    return body as T & { _csrf?: string };
  } catch (error) {
    console.error('Failed to attach CSRF token:', error);
    return body as T & { _csrf?: string };
  }
}
