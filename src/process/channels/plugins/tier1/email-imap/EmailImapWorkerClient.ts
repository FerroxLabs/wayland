/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Main-process handle to the forked email worker (out/main/emailImap.js). Wraps
 * ForkTask so EmailImapPlugin can drive the IMAP/SMTP connection without owning
 * any socket on the main event loop. Commands are request/response; inbound
 * messages arrive as 'email.message' events.
 */

import { ForkTask } from '@process/worker/fork/ForkTask';
import { resolveMainBundlePath } from '@process/utils/mainBundlePath';
import type { IUnifiedIncomingMessage, IUnifiedOutgoingMessage } from '../../../types';
import type { ResolvedCredentials } from './EmailImapShared';

type TestResult = { success: boolean; botUsername?: string; error?: string };

export class EmailImapWorkerClient extends ForkTask<Record<string, never>> {
  constructor() {
    // Worker entry is emitted beside the main entry in out/main/. The caller
    // itself may execute from out/main/chunks after bootstrap code splitting.
    super(resolveMainBundlePath('emailImap.js'), {}, true);
  }

  /** Subscribe to inbound messages pushed up from the worker. */
  onMessage(handler: (message: IUnifiedIncomingMessage) => void): void {
    this.on('email.message', (data) => handler(data as IUnifiedIncomingMessage));
  }

  /** Connect + arm IDLE/poll. Resolves on first successful connect. */
  connect(creds: ResolvedCredentials): Promise<void> {
    return this.postMessagePromise('email.connect', { creds });
  }

  /** Send an outbound email via SMTP. Resolves to the Message-ID. */
  sendEmail(chatId: string, message: IUnifiedOutgoingMessage, fromUser: string): Promise<string> {
    return this.postMessagePromise('email.send', { chatId, message, fromUser });
  }

  /** One-shot connection probe for the Settings test flow. */
  test(creds: ResolvedCredentials): Promise<TestResult> {
    return this.postMessagePromise('email.test', { creds });
  }

  /** Logout and tear down the connection (worker process stays alive). */
  stopConnection(): Promise<void> {
    return this.postMessagePromise('email.stop', {});
  }
}
