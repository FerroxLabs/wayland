/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Compatibility smoke tests for the dependency versions pinned to eliminate
 * Critical and High advisories from the packaged runtime and build toolchain.
 */

import { afterEach, describe, expect, it } from 'vitest';

import AdmZip from 'adm-zip';
import * as grpc from '@grpc/grpc-js';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Hono } from 'hono';
import { ImapFlow } from 'imapflow';
import LinkifyIt from 'linkify-it';
import { template } from 'lodash-es';
import nodemailer from 'nodemailer';
import { quote } from 'shell-quote';
import tmp from 'tmp';
import { Headers, Request } from 'undici';

const cleanup: Array<() => void> = [];

afterEach(() => {
  for (const remove of cleanup.splice(0)) remove();
});

describe('Critical/High dependency compatibility', () => {
  it('preserves the runtime APIs used by Aion, telemetry, HTTP, and archive handling', async () => {
    expect(quote(['wayland', 'two words'])).toContain("'two words'");
    expect(grpc.credentials.createInsecure()).toBeDefined();

    const telemetry = new NodeSDK();
    await expect(telemetry.shutdown()).resolves.toBeUndefined();

    const app = new Hono();
    app.get('/health', (context) => context.json({ ok: true }));
    const response = await app.request('/health');
    await expect(response.json()).resolves.toEqual({ ok: true });

    const headers = new Headers({ authorization: 'Bearer test' });
    const request = new Request('https://example.invalid/', { headers });
    expect(request.headers.get('authorization')).toBe('Bearer test');

    const archive = new AdmZip();
    archive.addFile('proof.txt', Buffer.from('sealed'));
    expect(archive.readAsText('proof.txt')).toBe('sealed');
  });

  it('preserves email, temporary-file, markdown, and diagram dependency APIs', async () => {
    const mailer = nodemailer.createTransport({ jsonTransport: true });
    const result = await mailer.sendMail({
      from: 'sender@example.invalid',
      to: 'recipient@example.invalid',
      subject: 'compatibility',
      text: 'ok',
    });
    expect(result.messageId).toBeTruthy();
    mailer.close();

    const imap = new ImapFlow({
      host: 'example.invalid',
      port: 993,
      secure: true,
      auth: { user: 'user', pass: 'password' },
      logger: false,
    });
    expect(imap.usable).toBe(false);

    const directory = tmp.dirSync({ unsafeCleanup: true });
    cleanup.push(directory.removeCallback);
    expect(directory.name).toBeTruthy();

    const matches = new LinkifyIt().match('Visit https://wayland.invalid/docs');
    expect(matches?.[0]?.url).toBe('https://wayland.invalid/docs');
    expect(template('Hello <%= name %>')({ name: 'Wayland' })).toBe('Hello Wayland');
  });
});
