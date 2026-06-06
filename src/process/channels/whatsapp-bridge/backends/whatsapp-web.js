/**
 * Uses the upstream `whatsapp-web.js` library:
 *   https://github.com/pedroslopez/whatsapp-web.js
 *   Copyright (c) Pedro S. Lopez - Apache-2.0 License
 *
 * @license
 * Copyright 2025 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Alternate WhatsApp backend powered by whatsapp-web.js (Chromium + Puppeteer
 * driving the WhatsApp Web UI). Useful when Baileys protocol changes break
 * authentication or when the operator already has a Chromium runtime in scope.
 *
 * Implements the same handler surface as backends/baileys.js so the parent
 * doesn't care which backend is loaded.
 */

import path from 'path';
import { existsSync } from 'fs';
import wwebPkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = wwebPkg;

/**
 * @param {Object} opts
 * @param {(method:string, params:object)=>void} opts.emit
 * @param {string} opts.sessionDir
 */
export async function createBackend({ emit, sessionDir }) {
  const dataPath = sessionDir
    ? path.join(sessionDir, 'whatsapp-web')
    : path.join(
        process.env.HOME || process.env.USERPROFILE || '.',
        '.wayland',
        'whatsapp',
        'whatsapp-web',
      );

  let client = null;
  let connectionState = 'disconnected';
  let stopRequested = false;

  function setStatus(state, extra = {}) {
    connectionState = state;
    emit('connection.status', { state, backend: 'whatsapp-web', ...extra });
  }

  function buildClient() {
    const c = new Client({
      authStrategy: new LocalAuth({ dataPath, clientId: 'wayland' }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    c.on('qr', (qr) => emit('qr.update', { qr }));
    c.on('loading_screen', (percent, message) =>
      setStatus('connecting', { percent, message }),
    );
    c.on('authenticated', () => setStatus('connecting', { phase: 'authenticated' }));
    c.on('auth_failure', (msg) => {
      setStatus('logged_out', { reason: 'auth_failure', message: msg });
    });
    c.on('ready', () => {
      setStatus('connected', { jid: c.info?.wid?._serialized || null });
    });
    c.on('disconnected', (reason) => {
      setStatus('disconnected', { reason });
      if (!stopRequested) {
        // whatsapp-web.js does not auto-reconnect; rebuild client.
        setTimeout(() => {
          if (!stopRequested) {
            client = buildClient();
            client.initialize().catch((err) =>
              emit('error', { kind: 'reconnect', message: String(err?.message || err) }),
            );
          }
        }, 3000);
      }
    });

    c.on('message', async (msg) => {
      let mediaPath = null;
      let mediaType = '';
      if (msg.hasMedia) {
        try {
          const media = await msg.downloadMedia();
          if (media?.data) {
            mediaType = media.mimetype?.split('/')[0] || 'document';
            // whatsapp-web.js returns base64; persist to disk for parent to read.
            const fs = await import('fs');
            const cacheDir = path.join(dataPath, 'media-cache');
            fs.mkdirSync(cacheDir, { recursive: true });
            const ext = guessExt(media.mimetype) || '.bin';
            mediaPath = path.join(cacheDir, `${msg.id?.id || Date.now()}${ext}`);
            fs.writeFileSync(mediaPath, Buffer.from(media.data, 'base64'));
          }
        } catch (err) {
          emit('error', { kind: 'media_download', message: String(err?.message || err) });
        }
      }

      emit('inbound.message', {
        messageId: msg.id?._serialized || msg.id?.id || null,
        chatId: msg.from,
        senderId: msg.author || msg.from,
        senderName: msg._data?.notifyName || msg.from,
        isGroup: typeof msg.from === 'string' && msg.from.endsWith('@g.us'),
        fromMe: !!msg.fromMe,
        body: msg.body || '',
        mediaType: mediaType || undefined,
        mediaPath: mediaPath || undefined,
        timestamp: msg.timestamp || Date.now() / 1000,
      });
    });

    return c;
  }

  function requireClient() {
    if (!client || connectionState !== 'connected') {
      throw new Error('whatsapp_not_connected');
    }
    return client;
  }

  const handlers = {
    async connect() {
      stopRequested = false;
      if (client && connectionState === 'connected') {
        return { state: connectionState };
      }
      client = buildClient();
      await client.initialize();
      return { state: connectionState, dataPath };
    },

    async disconnect() {
      stopRequested = true;
      try {
        await client?.destroy();
      } catch {
        // best-effort
      }
      client = null;
      setStatus('disconnected', { reason: 'parent_requested' });
      return { ok: true };
    },

    async sendText({ chatId, text }) {
      if (!chatId || typeof text !== 'string') {
        throw new Error('chatId and text required');
      }
      const c = requireClient();
      const sent = await c.sendMessage(chatId, text);
      return { messageId: sent?.id?._serialized || sent?.id?.id || null };
    },

    async sendMedia({ chatId, filePath, caption }) {
      if (!chatId || !filePath) {
        throw new Error('chatId and filePath required');
      }
      const c = requireClient();
      if (!existsSync(filePath)) {
        throw new Error(`file_not_found: ${filePath}`);
      }
      const media = MessageMedia.fromFilePath(filePath);
      const sent = await c.sendMessage(chatId, media, { caption: caption || undefined });
      return { messageId: sent?.id?._serialized || sent?.id?.id || null };
    },

    async setPresence({ chatId, presence }) {
      const c = requireClient();
      // whatsapp-web.js exposes typing/recording via chat.sendStateTyping etc.
      try {
        const chat = await c.getChatById(chatId);
        if (presence === 'recording') await chat.sendStateRecording();
        else if (presence === 'paused' || presence === 'unavailable') await chat.clearState();
        else await chat.sendStateTyping();
        return { ok: true };
      } catch (err) {
        throw new Error(`setPresence_failed: ${err?.message || err}`, { cause: err });
      }
    },

    async react({ chatId, messageId, emoji }) {
      if (!chatId || !messageId) throw new Error('chatId and messageId required');
      const c = requireClient();
      try {
        const chat = await c.getChatById(chatId);
        const messages = await chat.fetchMessages({ limit: 50 });
        const target = messages.find((m) => (m.id?._serialized || m.id?.id) === messageId);
        if (!target) throw new Error('message_not_found_in_recent');
        await target.react(emoji || '');
        return { ok: true };
      } catch (err) {
        throw new Error(`react_failed: ${err?.message || err}`, { cause: err });
      }
    },

    async subscribe({ chatId }) {
      // whatsapp-web.js doesn't expose presence subscribe; no-op.
      return { ok: true, chatId, note: 'presence_subscribe_not_supported_in_whatsapp_web_js' };
    },
  };

  return {
    handlers,
    isConnected: () => connectionState === 'connected',
  };
}

function guessExt(mime) {
  if (!mime) return null;
  const map = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'video/mp4': '.mp4',
    'audio/ogg': '.ogg',
    'audio/mpeg': '.mp3',
    'application/pdf': '.pdf',
  };
  return map[mime] || null;
}
