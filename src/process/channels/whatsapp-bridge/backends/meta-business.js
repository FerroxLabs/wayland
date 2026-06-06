/**
 * @license
 * Copyright 2025 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Meta WhatsApp Business Cloud API backend.
 *
 * Uses Meta's official Graph API (v21.0) at https://graph.facebook.com/.
 * Reference: https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * Architecture note: this backend does NOT run an HTTP server. Meta delivers
 * inbound messages via webhooks to the parent Electron process's
 * WebhookReceiver. The parent calls our `webhookDelivery` RPC to forward
 * each verified payload here, where it is parsed and re-emitted as
 * `inbound.message` notifications upstream (so the WhatsApp plugin sees the
 * same event shape regardless of backend).
 *
 * Required parent-supplied params on `connect`:
 *   - phoneNumberId : Meta phone-number-id (numeric string)
 *   - accessToken   : Meta system-user or temporary access token
 *   - businessAccountId (optional): for richer metadata
 *   - apiVersion (optional): defaults to 'v21.0'
 */

import axios from 'axios';

/**
 * @param {Object} opts
 * @param {(method:string, params:object)=>void} opts.emit
 * @param {string} opts.sessionDir
 */
export async function createBackend({ emit, sessionDir: _sessionDir }) {
  let config = null; // { phoneNumberId, accessToken, apiVersion, businessAccountId }
  let connected = false;

  function setStatus(state, extra = {}) {
    connected = state === 'connected';
    emit('connection.status', { state, backend: 'meta-business', ...extra });
  }

  function requireConfig() {
    if (!config || !connected) {
      throw new Error('meta_business_not_configured');
    }
    return config;
  }

  function endpoint(suffix) {
    const { apiVersion, phoneNumberId } = config;
    return `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/${suffix}`;
  }

  async function postMessage(body) {
    const { accessToken } = config;
    const res = await axios.post(endpoint('messages'), body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30_000,
    });
    return res.data;
  }

  /**
   * Parse a Meta webhook payload and emit an inbound.message notification
   * for each contained message. Returns the count of messages emitted.
   */
  function processWebhook(payload) {
    if (!payload || payload.object !== 'whatsapp_business_account') {
      throw new Error('invalid_webhook_object');
    }
    const entries = Array.isArray(payload.entry) ? payload.entry : [];
    let count = 0;
    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : [];
      for (const change of changes) {
        if (change.field !== 'messages') continue;
        const value = change.value || {};
        const contacts = Array.isArray(value.contacts) ? value.contacts : [];
        const contactByWaId = new Map(
          contacts.map((c) => [c.wa_id, c.profile?.name || c.wa_id]),
        );
        const messages = Array.isArray(value.messages) ? value.messages : [];
        for (const msg of messages) {
          const senderName = contactByWaId.get(msg.from) || msg.from;
          let body = '';
          let mediaType;
          let mediaId;
          /** W-6: id of the message a reaction targets. */
          let reactionMessageId;
          if (msg.type === 'text') {
            body = msg.text?.body || '';
          } else if (msg.type === 'image') {
            mediaType = 'image';
            mediaId = msg.image?.id;
            body = msg.image?.caption || '';
          } else if (msg.type === 'video') {
            mediaType = 'video';
            mediaId = msg.video?.id;
            body = msg.video?.caption || '';
          } else if (msg.type === 'audio') {
            mediaType = 'audio';
            mediaId = msg.audio?.id;
          } else if (msg.type === 'document') {
            mediaType = 'document';
            mediaId = msg.document?.id;
            body = msg.document?.caption || '';
          } else if (msg.type === 'sticker') {
            mediaType = 'sticker';
            mediaId = msg.sticker?.id;
          } else if (msg.type === 'reaction') {
            body = msg.reaction?.emoji || '';
            reactionMessageId =
              typeof msg.reaction?.message_id === 'string' ? msg.reaction.message_id : undefined;
          }

          // W-5: Meta forwards the original message id via `msg.context.id`
          // whenever this inbound message is a reply.
          const replyToMessageId =
            typeof msg.context?.id === 'string' && msg.context.id.length > 0
              ? msg.context.id
              : undefined;

          emit('inbound.message', {
            messageId: msg.id,
            chatId: msg.from,
            senderId: msg.from,
            senderName,
            isGroup: false, // Cloud API is 1:1 only (no group inbound).
            fromMe: false,
            body,
            mediaType,
            mediaId,
            replyToMessageId,
            reactionMessageId,
            timestamp: Number(msg.timestamp) || Date.now() / 1000,
          });
          count += 1;
        }
      }
    }
    return count;
  }

  const handlers = {
    async connect(params) {
      const phoneNumberId = params?.phoneNumberId;
      const accessToken = params?.accessToken;
      if (!phoneNumberId || !accessToken) {
        throw new Error('phoneNumberId and accessToken required');
      }
      config = {
        phoneNumberId: String(phoneNumberId),
        accessToken: String(accessToken),
        apiVersion: params?.apiVersion || 'v21.0',
        businessAccountId: params?.businessAccountId || null,
      };
      // Verify credentials with a cheap GET on the phone-number node.
      try {
        await axios.get(
          `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}`,
          {
            headers: { Authorization: `Bearer ${config.accessToken}` },
            timeout: 15_000,
          },
        );
      } catch (err) {
        config = null;
        const detail = err?.response?.data?.error?.message || err?.message || String(err);
        throw new Error(`meta_auth_failed: ${detail}`, { cause: err });
      }
      setStatus('connected', { phoneNumberId: config.phoneNumberId });
      return { state: 'connected', phoneNumberId: config.phoneNumberId };
    },

    async disconnect() {
      config = null;
      setStatus('disconnected', { reason: 'parent_requested' });
      return { ok: true };
    },

    async sendText({ chatId, text }) {
      if (!chatId || typeof text !== 'string') {
        throw new Error('chatId and text required');
      }
      requireConfig();
      const res = await postMessage({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: chatId,
        type: 'text',
        text: { body: text },
      });
      return { messageId: res?.messages?.[0]?.id ?? null };
    },

    async sendMedia({ chatId, mediaType, mediaUrl, mediaId, caption, fileName }) {
      if (!chatId) throw new Error('chatId required');
      if (!mediaUrl && !mediaId) throw new Error('mediaUrl or mediaId required');
      requireConfig();
      const type = mediaType || 'document';
      // Meta accepts only this exact set; anything else returns an opaque
      // schema error from the Graph API.
      const ALLOWED_MEDIA_TYPES = ['image', 'video', 'audio', 'document', 'sticker'];
      if (!ALLOWED_MEDIA_TYPES.includes(type)) {
        throw new Error(
          `unsupported_media_type: ${type} (allowed: ${ALLOWED_MEDIA_TYPES.join(', ')})`,
        );
      }
      const media = mediaId ? { id: mediaId } : { link: mediaUrl };
      if (caption && ['image', 'video', 'document'].includes(type)) {
        media.caption = caption;
      }
      if (type === 'document' && fileName) {
        media.filename = fileName;
      }
      const res = await postMessage({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: chatId,
        type,
        [type]: media,
      });
      return { messageId: res?.messages?.[0]?.id ?? null };
    },

    async setPresence(_params) {
      // Cloud API does not expose typing indicators outbound.
      return { ok: false, reason: 'meta_cloud_api_does_not_support_presence' };
    },

    async react({ chatId, messageId, emoji }) {
      if (!chatId || !messageId) throw new Error('chatId and messageId required');
      requireConfig();
      const res = await postMessage({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: chatId,
        type: 'reaction',
        reaction: { message_id: messageId, emoji: emoji || '' },
      });
      return { messageId: res?.messages?.[0]?.id ?? null };
    },

    async subscribe(_params) {
      // No-op - Cloud API subscriptions are managed in Meta's dashboard,
      // not via Graph API calls.
      return { ok: true, note: 'cloud_api_subscriptions_managed_in_meta_dashboard' };
    },

    /**
     * Parent forwards a verified Meta webhook payload here.
     * Parent owns HMAC verification (X-Hub-Signature-256) before calling.
     */
    async webhookDelivery(params) {
      const payload = params?.payload;
      if (!payload) throw new Error('payload required');
      const count = processWebhook(payload);
      return { ok: true, emitted: count };
    },
  };

  return {
    handlers,
    isConnected: () => connected,
  };
}
