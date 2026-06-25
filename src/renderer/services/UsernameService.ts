/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCsrfToken } from '@process/webserver/middleware/csrfClient';

/**
 * Browser/WebUI client for the write-only change-username route
 * (remote-secure-config W3 task H). On desktop the username flow goes through
 * Electron IPC (`webuiChangeUsername`); in a hosted WebUI that path is denied
 * (the `webui.change-username` bridge channel is in the remote denylist and has
 * no current-password check), so the headless WebUI admin pane posts the change
 * through this token-authed + CSRF'd HTTP route instead.
 *
 * The route is WRITE-ONLY: it verifies the current password, renames the admin
 * login, and returns only non-secret status (`{ username }`), never a password.
 */

function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { 'x-csrf-token': token } : {};
}

export type ChangeUsernameResult = { success: boolean; username?: string; msg?: string };

/**
 * Rename the WebUI admin from the remote WebUI. Verifies the current password.
 * Returns `{ success, username }` on success, or `{ success: false, msg }` with
 * the server's reason on failure. No secret is ever echoed back.
 */
export async function changeUsernameHttp(newUsername: string, currentPassword: string): Promise<ChangeUsernameResult> {
  const csrf = getCsrfToken();
  const res = await fetch('/api/auth/change-username', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
    body: JSON.stringify({ newUsername, currentPassword, _csrf: csrf }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: { username?: string };
    msg?: string;
  };

  if (res.ok && json.success) {
    return { success: true, username: json.data?.username };
  }
  return { success: false, msg: json.msg };
}
