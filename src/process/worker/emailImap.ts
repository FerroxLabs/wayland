/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Forked email worker. Owns the imapflow (inbound IDLE/poll) and nodemailer
 * (outbound SMTP) sockets so their I/O runs on this process's event loop, NOT
 * the Electron main loop. A busy main process (channel pollers, agent
 * subprocesses, a dev vite rebuild) used to starve the IMAP socket and trip
 * "Socket timeout" / "Failed to establish connection in required time"; running
 * the connection here makes it immune to main-thread blocking.
 *
 * The connection logic lives in EmailImapConnection (so it stays unit-testable);
 * this entry only wires it to the pipe protocol:
 *   main -> worker : email.connect {creds} | email.send {chatId,message,fromUser}
 *                    | email.test {creds} | email.stop {}
 *   worker -> main : email.message {IUnifiedIncomingMessage}
 */

import type { IUnifiedOutgoingMessage } from '@process/channels/types';
import {
  EmailImapConnection,
  testEmailConnection,
} from '@process/channels/plugins/tier1/email-imap/EmailImapConnection';
import type { ResolvedCredentials } from '@process/channels/plugins/tier1/email-imap/EmailImapShared';
import pipe from './fork/pipe';

const connection = new EmailImapConnection((message) => pipe.call('email.message', message));

pipe.on('email.connect', (data: { creds: ResolvedCredentials }, deferred) => {
  deferred?.with(connection.connect(data.creds));
});
pipe.on('email.send', (data: { chatId: string; message: IUnifiedOutgoingMessage; fromUser: string }, deferred) => {
  deferred?.with(connection.send(data.chatId, data.message, data.fromUser));
});
pipe.on('email.test', (data: { creds: ResolvedCredentials }, deferred) => {
  deferred?.with(testEmailConnection(data.creds));
});
pipe.on('email.stop', (_data: unknown, deferred) => {
  deferred?.with(connection.stop());
});
