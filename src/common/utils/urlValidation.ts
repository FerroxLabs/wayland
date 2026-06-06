/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * API Provider Host Configuration
 *
 * Centralized management of official API hostnames for AI providers
 */
export const API_HOST_CONFIG = {
  /**
   * Google AI Official Hosts
   */
  google: {
    /** Gemini API (generativelanguage.googleapis.com) */
    gemini: 'generativelanguage.googleapis.com',
    /** Vertex AI (aiplatform.googleapis.com) */
    vertexAi: 'aiplatform.googleapis.com',
  },

  /**
   * OpenAI Official Hosts
   */
  openai: {
    api: 'api.openai.com',
  },

  /**
   * Anthropic Official Hosts
   */
  anthropic: {
    api: 'api.anthropic.com',
  },
} as const;

/**
 * Google API Hosts Whitelist (derived from config)
 */
export const GOOGLE_API_HOSTS = Object.values(API_HOST_CONFIG.google);

/**
 * Safely validate if URL is an official host for specified provider
 *
 * @param urlString - URL string to validate
 * @param allowedHosts - List of allowed hostnames
 * @returns Returns true if valid official host
 */
export function isOfficialHost(urlString: string, allowedHosts: readonly string[]): boolean {
  try {
    const url = new URL(urlString);
    return allowedHosts.includes(url.hostname);
  } catch {
    return false;
  }
}

/**
 * Safely validate if URL is a Google APIs host
 *
 * Uses URL parsing instead of string includes to prevent malicious URL bypass
 *
 * @param urlString - URL string to validate
 * @returns Returns true if valid Google APIs host
 *
 * @example
 * isGoogleApisHost('https://generativelanguage.googleapis.com/v1') // true
 * isGoogleApisHost('https://evil.com/generativelanguage.googleapis.com') // false
 * isGoogleApisHost('https://generativelanguage.googleapis.com.evil.com') // false
 */
export function isGoogleApisHost(urlString: string): boolean {
  return isOfficialHost(urlString, GOOGLE_API_HOSTS);
}

/**
 * Validate if URL is an official OpenAI host
 */
export function isOpenAIHost(urlString: string): boolean {
  return isOfficialHost(urlString, Object.values(API_HOST_CONFIG.openai));
}

/**
 * Schemes allowed to be handed to the OS via shell.openExternal.
 *
 * Only web/mail and the app's own deep-link scheme (`wayland:`, see
 * src/process/utils/deepLink.ts PROTOCOL_SCHEME) are permitted. Everything else
 * - `file:`, `smb:`, `ms-*`, `vbscript:`, and any registered custom-protocol
 * handler - is rejected so model-rendered markdown links cannot drive the OS
 * into opening local files, leaking NTLM credentials, or launching arbitrary
 * protocol handlers. Schemes are compared lowercase, with the trailing colon.
 */
export const ALLOWED_EXTERNAL_URL_SCHEMES: readonly string[] = ['https:', 'http:', 'mailto:', 'wayland:'];

/**
 * Validate that a URL uses a scheme on the openExternal allowlist.
 *
 * Returns false for unparseable URLs and for any scheme not in
 * {@link ALLOWED_EXTERNAL_URL_SCHEMES}. Used by both the main-process shell
 * bridges and the renderer's openExternalUrl helper so the gate is identical on
 * every path.
 */
export function isAllowedExternalUrl(urlString: string): boolean {
  let protocol: string;
  try {
    protocol = new URL(urlString).protocol;
  } catch {
    return false;
  }
  return ALLOWED_EXTERNAL_URL_SCHEMES.includes(protocol.toLowerCase());
}
