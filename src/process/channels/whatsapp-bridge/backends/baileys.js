/**
 * Portions adapted from OpenClaw:
 *   extensions/whatsapp/src/connection-controller.ts
 *   extensions/whatsapp/src/session.ts
 *   extensions/whatsapp/src/auth-store.ts
 *   extensions/whatsapp/src/identity.ts
 *   extensions/whatsapp/src/creds-files.ts
 *   Copyright (c) 2025 OpenClaw contributors - MIT License
 *
 * Wayland modifications:
 * @license
 * Copyright 2025 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Baileys backend - direct WhatsApp Web protocol via @whiskeysockets/baileys.
 * Implements: connect, disconnect, sendText, sendMedia, setPresence, react, subscribe.
 * Emits: inbound.message, connection.status, qr.update, error.
 *
 * Auth state is the standard Baileys multi-file store, written under
 * `${sessionDir}/baileys/` (one subdir per logical "account", though this
 * bridge currently runs single-account per child process).
 */

import path from 'path';
import fs from 'fs';
import { mkdirSync, existsSync, readFileSync, copyFileSync, statSync, chmodSync } from 'fs';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  downloadMediaMessage,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';

// ---------- credential files (lifted from OpenClaw creds-files.ts) ----------
function resolveWebCredsPath(authDir) {
  return path.join(authDir, 'creds.json');
}
function resolveWebCredsBackupPath(authDir) {
  return path.join(authDir, 'creds.json.bak');
}

// ---------- auth-store helpers (lifted from OpenClaw auth-store.ts) ----------
function readCredsJsonRaw(filePath) {
  try {
    if (!existsSync(filePath)) return null;
    const stats = statSync(filePath);
    if (!stats.isFile() || stats.size <= 1) return null;
    return readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * If creds.json is missing or corrupt but creds.json.bak parses cleanly,
 * restore from backup. Best-effort - silent on failure.
 */
function maybeRestoreCredsFromBackup(authDir) {
  try {
    const credsPath = resolveWebCredsPath(authDir);
    const backupPath = resolveWebCredsBackupPath(authDir);
    const raw = readCredsJsonRaw(credsPath);
    if (raw) {
      JSON.parse(raw);
      return;
    }
    const backupRaw = readCredsJsonRaw(backupPath);
    if (!backupRaw) return;
    JSON.parse(backupRaw);
    copyFileSync(backupPath, credsPath);
    try {
      chmodSync(credsPath, 0o600);
    } catch {
      // best-effort
    }
  } catch {
    // ignore
  }
}

// ---------- identity (lifted from OpenClaw identity.ts) ----------
const WHATSAPP_LID_RE = /@(lid|hosted\.lid)$/i;

function normalizeDeviceScopedJid(jid) {
  return jid ? String(jid).replace(/:\d+/, '') : null;
}

function isLidJid(jid) {
  return Boolean(jid && WHATSAPP_LID_RE.test(jid));
}

/** Strip device suffix and JID host to bare digits. */
function normalizeIdentifier(value) {
  return String(value || '')
    .trim()
    .replace(/:.*@/, '@')
    .replace(/@.*/, '')
    .replace(/^\+/, '');
}

// ---------- backend factory ----------
/**
 * Build a Baileys-backed bridge backend.
 *
 * @param {Object} opts
 * @param {(method:string, params:object)=>void} opts.emit  upstream notification sink
 * @param {string} opts.sessionDir  parent-supplied session root (defaults to ~/.wayland/whatsapp)
 * @returns {Promise<{handlers: Object, isConnected: () => boolean}>}
 */
export async function createBackend({ emit, sessionDir }) {
  const authDir = sessionDir
    ? path.join(sessionDir, 'baileys')
    : path.join(process.env.HOME || process.env.USERPROFILE || '.', '.wayland', 'whatsapp', 'baileys');
  mkdirSync(authDir, { recursive: true });

  const logger = pino({ level: 'warn' });
  /** @type {ReturnType<typeof makeWASocket> | null} */
  let sock = null;
  let connectionState = 'disconnected';
  let reconnectTimer = null;
  let stopRequested = false;
  let saveCreds = null;

  /**
   * Bounded in-memory message store keyed by `msg.key.id`. Baileys's
   * `getMessage` callback consults this during E2EE Signal-session resync
   * (LOW finding). Capacity is kept tight to bound memory: only recent
   * conversation traffic is recoverable.
   */
  const messageStore = new Map();
  const MESSAGE_STORE_CAP = 2048;
  function rememberMessage(key, message) {
    if (!key?.id || !message) return;
    if (messageStore.size >= MESSAGE_STORE_CAP) {
      const oldest = messageStore.keys().next().value;
      if (oldest !== undefined) messageStore.delete(oldest);
    }
    messageStore.set(key.id, message);
  }

  function setStatus(state, extra = {}) {
    connectionState = state;
    emit('connection.status', { state, backend: 'baileys', ...extra });
  }

  async function startSocket() {
    maybeRestoreCredsFromBackup(authDir);
    const auth = await useMultiFileAuthState(authDir);
    saveCreds = auth.saveCreds;
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      browser: ['Wayland', 'Chrome', '120.0'],
      syncFullHistory: false,
      markOnlineOnConnect: false,
      auth: {
        creds: auth.state.creds,
        keys: makeCacheableSignalKeyStore(auth.state.keys, logger),
      },
      // Without getMessage, Baileys 7.x silently drops messages that need
      // E2EE session re-establishment (msg.message === null). We keep a
      // small in-memory message store (last MESSAGE_STORE_CAP messages,
      // keyed by msg.key.id) so resync after temporary disconnects can
      // re-decrypt recent traffic. Full persistent history is out of scope
      // for the bridge; operators who need that should run a file-backed
      // Baileys store.
      getMessage: async (key) => {
        const cached = key?.id ? messageStore.get(key.id) : null;
        return cached || { conversation: '' };
      },
    });

    sock.ev.on('creds.update', () => {
      Promise.resolve(saveCreds?.()).catch((err) =>
        emit('error', { kind: 'creds_save', message: String(err?.message || err) }),
      );
    });

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        // Render to stderr only for humans running the bridge directly during
        // dev (no IPC parent). Under the Electron parent the renderer paints
        // the QR via QRCodeSVG and stderr is inherited into the packaged-app
        // log file - left unguarded, every QR refresh would dump 50 lines of
        // ANSI into the log every ~minute until pairing completes.
        const hasIpc = typeof process.send === 'function';
        if (!hasIpc) {
          try {
            qrcode.generate(qr, { small: true }, (rendered) => {
              process.stderr.write(`${rendered}\n`);
            });
          } catch {
            // best-effort QR render
          }
        }
        emit('qr.update', { qr });
      }

      if (connection === 'close') {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        const loggedOut = reason === (DisconnectReason?.loggedOut ?? 401);
        setStatus(loggedOut ? 'logged_out' : 'disconnected', { reason });

        if (stopRequested) return;
        if (loggedOut) {
          // Don't loop on logged-out - parent must trigger a fresh login.
          return;
        }
        // 515 = restart requested (common immediately after pairing). Otherwise backoff 3s.
        const delayMs = reason === 515 ? 1000 : 3000;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          if (!stopRequested) {
            startSocket().catch((err) =>
              emit('error', { kind: 'reconnect', message: String(err?.message || err) }),
            );
          }
        }, delayMs);
      } else if (connection === 'open') {
        setStatus('connected', {
          jid: normalizeDeviceScopedJid(sock?.user?.id),
          lid: normalizeDeviceScopedJid(sock?.user?.lid),
        });
      } else if (connection === 'connecting') {
        setStatus('connecting');
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify' && type !== 'append') return;
      for (const msg of messages) {
        if (!msg?.message) continue;
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || chatId;
        const isGroup = chatId?.endsWith('@g.us') ?? false;

        let body = '';
        let mediaType = '';
        let mediaPath = null;
        const c = msg.message;
        if (c.conversation) {
          body = c.conversation;
        } else if (c.extendedTextMessage?.text) {
          body = c.extendedTextMessage.text;
        } else if (c.imageMessage || c.videoMessage || c.audioMessage || c.documentMessage) {
          mediaType = c.imageMessage
            ? 'image'
            : c.videoMessage
              ? 'video'
              : c.audioMessage
                ? 'audio'
                : 'document';
          body =
            c.imageMessage?.caption ||
            c.videoMessage?.caption ||
            c.documentMessage?.caption ||
            '';
          try {
            const buf = await downloadMediaMessage(
              msg,
              'buffer',
              {},
              { logger, reuploadRequest: sock.updateMediaMessage },
            );
            const cacheDir = path.join(authDir, '..', 'media-cache');
            mkdirSync(cacheDir, { recursive: true });
            const ext = mediaType === 'image' ? '.jpg' : mediaType === 'video' ? '.mp4' : '.bin';
            mediaPath = path.join(cacheDir, `${msg.key.id || Date.now()}${ext}`);
            fs.writeFileSync(mediaPath, buf);
          } catch (err) {
            emit('error', { kind: 'media_download', message: String(err?.message || err) });
          }
        }
        if (!body && !mediaType) continue;

        // W-5: extract quoted-message id from Baileys contextInfo so the agent
        // can reply to specific messages. Both `extendedTextMessage.contextInfo`
        // and per-media `contextInfo` shapes carry `stanzaId`.
        const contextInfo =
          c.extendedTextMessage?.contextInfo ||
          c.imageMessage?.contextInfo ||
          c.videoMessage?.contextInfo ||
          c.audioMessage?.contextInfo ||
          c.documentMessage?.contextInfo ||
          null;
        const replyToMessageId =
          typeof contextInfo?.stanzaId === 'string' && contextInfo.stanzaId.length > 0
            ? contextInfo.stanzaId
            : undefined;

        // Persist for getMessage() Signal-resync lookups (LOW finding).
        rememberMessage(msg.key, msg.message);

        emit('inbound.message', {
          messageId: msg.key.id,
          chatId,
          // W-9: keep the full JID alongside the normalized bare-digit form.
          // Agents that echo `senderId` back into `sendText({chatId: ...})`
          // need the JID host or Baileys outbound will fail.
          senderId: normalizeIdentifier(senderId),
          senderRawJid: typeof senderId === 'string' ? senderId : undefined,
          senderName: msg.pushName || normalizeIdentifier(senderId),
          isGroup,
          fromMe: !!msg.key.fromMe,
          body,
          mediaType: mediaType || undefined,
          mediaPath: mediaPath || undefined,
          replyToMessageId,
          timestamp: Number(msg.messageTimestamp) || Date.now() / 1000,
        });
      }
    });
  }

  function requireSocket() {
    if (!sock || connectionState !== 'connected') {
      throw new Error('whatsapp_not_connected');
    }
    return sock;
  }

  // ---------- handlers ----------
  const handlers = {
    async connect() {
      stopRequested = false;
      if (sock && connectionState === 'connected') {
        return { state: connectionState };
      }
      await startSocket();
      return { state: connectionState, authDir };
    },

    async disconnect() {
      stopRequested = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      try {
        sock?.ws?.close?.();
      } catch {
        // best-effort
      }
      sock = null;
      setStatus('disconnected', { reason: 'parent_requested' });
      return { ok: true };
    },

    async sendText({ chatId, text }) {
      if (!chatId || typeof text !== 'string') {
        throw new Error('chatId and text required');
      }
      const s = requireSocket();
      const sent = await s.sendMessage(chatId, { text });
      return { messageId: sent?.key?.id ?? null };
    },

    async sendMedia({ chatId, filePath, mediaType, caption, fileName }) {
      if (!chatId || !filePath) {
        throw new Error('chatId and filePath required');
      }
      const s = requireSocket();
      if (!existsSync(filePath)) {
        throw new Error(`file_not_found: ${filePath}`);
      }
      const buffer = readFileSync(filePath);
      const type = mediaType || inferMediaType(filePath);
      let payload;
      switch (type) {
        case 'image':
          payload = { image: buffer, caption: caption || undefined };
          break;
        case 'video':
          payload = { video: buffer, caption: caption || undefined };
          break;
        case 'audio':
          payload = { audio: buffer, mimetype: 'audio/ogg; codecs=opus', ptt: true };
          break;
        default:
          payload = {
            document: buffer,
            fileName: fileName || path.basename(filePath),
            caption: caption || undefined,
          };
      }
      const sent = await s.sendMessage(chatId, payload);
      return { messageId: sent?.key?.id ?? null };
    },

    async setPresence({ chatId, presence }) {
      const s = requireSocket();
      // composing | paused | available | unavailable | recording
      await s.sendPresenceUpdate(presence || 'composing', chatId);
      return { ok: true };
    },

    async react({ chatId, messageId, emoji, fromMe }) {
      if (!chatId || !messageId) {
        throw new Error('chatId and messageId required');
      }
      const s = requireSocket();
      const sent = await s.sendMessage(chatId, {
        react: {
          text: emoji || '',
          key: { id: messageId, remoteJid: chatId, fromMe: Boolean(fromMe) },
        },
      });
      return { messageId: sent?.key?.id ?? null };
    },

    async subscribe({ chatId }) {
      const s = requireSocket();
      try {
        await s.presenceSubscribe(chatId);
        return { ok: true };
      } catch (err) {
        throw new Error(`subscribe_failed: ${err?.message || err}`, { cause: err });
      }
    },
  };

  return {
    handlers,
    isConnected: () => connectionState === 'connected',
  };
}

function inferMediaType(filePath) {
  const ext = (filePath.split('.').pop() || '').toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'mkv', '3gp', 'avi'].includes(ext)) return 'video';
  if (['ogg', 'opus', 'mp3', 'wav', 'm4a'].includes(ext)) return 'audio';
  return 'document';
}
