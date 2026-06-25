/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AuthType,
  clearCachedCredentialFile,
  Config,
  getOauthInfoWithCache,
  loginWithOauth,
  Storage,
} from '@office-ai/aioncli-core';
import { ipcBridge } from '@/common';
import { promises as fsAsync } from 'node:fs';
import { xaiOAuthLogin, xaiRefreshToken, xaiSubmitManualCode } from '@process/onboarding/xaiOAuth';
import { chatgptOAuthLogin, chatgptRefreshToken } from '@process/onboarding/chatgptOAuth';

export function initAuthBridge(): void {
  // Native xAI "Sign in with X (Grok)" OAuth - PKCE loopback against
  // accounts.x.ai, persisted through the model-registry connect path as the
  // `xai` provider. Both handlers are remote-denied in `bridgeAllowlist.ts`
  // (they mint/persist a credential). They never reject - the renderer branches
  // on the returned `XaiOAuthResult`.
  ipcBridge.xaiAuth.login.provider(() => xaiOAuthLogin());
  ipcBridge.xaiAuth.refresh.provider(() => xaiRefreshToken());
  // xAI shows a code to copy rather than redirecting to the loopback; the
  // renderer's paste box feeds it back here to complete the in-flight flow.
  ipcBridge.xaiAuth.submitCode.provider(async ({ code }) => ({ accepted: xaiSubmitManualCode(code) }));

  // Native "Sign in with ChatGPT" OAuth - PKCE loopback against
  // auth.openai.com (the same path the Codex CLI uses), persisted as the
  // `chatgpt-subscription` provider. Both handlers are remote-denied in
  // `bridgeAllowlist.ts` (they mint/persist a credential). They never reject -
  // the renderer branches on the returned `ChatGptOAuthResult`.
  ipcBridge.chatgptAuth.login.provider(() => chatgptOAuthLogin());
  ipcBridge.chatgptAuth.refresh.provider(() => chatgptRefreshToken());

  ipcBridge.googleAuth.status.provider(async ({ proxy }) => {
    try {
      const credsPath = Storage.getOAuthCredsPath();

      // Check credential file existence without blocking the main process
      try {
        await fsAsync.access(credsPath);
      } catch {
        // Return early when credential file is missing to avoid noisy ENOENT logs
        return { success: false };
      }

      // First try to get user info from cache
      const info = await getOauthInfoWithCache(proxy);

      if (info) return { success: true, data: { account: info.email } };

      // If cache retrieval failed, check if credential file exists.
      // This can happen when: terminal is logged in but google_accounts.json has active: null
      try {
        // Credentials file exists but getOauthInfoWithCache failed; token may need refresh.
        // Read credentials file to check for refresh_token
        const credsContent = await fsAsync.readFile(credsPath, 'utf-8');
        const creds = JSON.parse(credsContent);
        if (creds.refresh_token) {
          // Has refresh_token, credentials are valid but may need refresh when used
          console.log('[Auth] Credentials exist with refresh_token, returning success');
          return { success: true, data: { account: 'Logged in (refresh needed)' } };
        }
      } catch (fsError) {
        // Ignore filesystem errors, continue to return false
        console.debug('[Auth] Error checking credentials file:', fsError);
      }

      return { success: false };
    } catch (e) {
      return { success: false, msg: e.message || e.toString() };
    }
  });

  // Google OAuth login handler
  ipcBridge.googleAuth.login.provider(async ({ proxy }) => {
    try {
      // Create config object with proxy settings
      const config = new Config({
        proxy,
        sessionId: '',
        targetDir: '',
        debugMode: false,
        cwd: '',
        model: '',
      });

      // Execute OAuth login flow.
      // Add timeout to prevent hanging if user doesn't complete login
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Login timed out after 2 minutes')), 2 * 60 * 1000);
      });

      const client = await Promise.race([loginWithOauth(AuthType.LOGIN_WITH_GOOGLE, config), timeoutPromise]);

      if (client) {
        // After successful login, verify credentials were saved properly
        try {
          // Brief delay to ensure credential file is written
          await new Promise((resolve) => setTimeout(resolve, 500));

          const oauthInfo = await getOauthInfoWithCache(proxy);
          if (oauthInfo && oauthInfo.email) {
            console.log('[Auth] Login successful, account:', oauthInfo.email);
            const profile = oauthInfo as { email: string; given_name?: string; name?: string };
            return { success: true, data: { account: oauthInfo.email, firstName: profile.given_name ?? profile.name } };
          }

          // Credential retrieval failed - login returned client but credentials weren't saved properly
          console.warn('[Auth] Login completed but no credentials found');
          return {
            success: false,
            msg: 'Login completed but credentials were not saved. Please try again.',
          };
        } catch (error) {
          console.error('[Auth] Failed to verify credentials after login:', error);
          return {
            success: false,
            msg: `Login verification failed: ${error.message || error.toString()}`,
          };
        }
      }

      // Login failed, return error message
      return { success: false, msg: 'Login failed: No client returned' };
    } catch (error) {
      // Catch all exceptions during login to prevent unhandled errors from showing error dialogs
      console.error('[Auth] Login error:', error);
      return { success: false, msg: error.message || error.toString() };
    }
  });

  ipcBridge.googleAuth.logout.provider(async () => {
    return await clearCachedCredentialFile();
  });
}
