/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import i18n from '@process/services/i18n';
import type { IChannelMediaAction } from '../../types';
import { TypingManager } from './WeixinTyping';

// ==================== Public types ====================

export type WeixinAttachment = {
  path: string;
  kind: 'image' | 'file';
  name: string;
};

export type WeixinChatRequest = {
  conversationId: string;
  /** Tencent iLink msg_id - used downstream as the unified message id for dedup/threading (LOW-4). */
  msgId?: string;
  text?: string;
  attachments?: WeixinAttachment[];
  sendTextNow?: (text: string) => Promise<void>;
};

export type WeixinChatResponse = {
  text?: string;
  mediaActions?: IChannelMediaAction[];
};

export type WeixinAgent = {
  chat: (req: WeixinChatRequest) => Promise<WeixinChatResponse>;
};

export type MonitorOptions = {
  baseUrl: string;
  token: string;
  accountId: string;
  /**
   * Persisted per-account WeChat UIN sent in the `X-WECHAT-UIN` header.
   * Must be stable across process restarts - Tencent treats UIN rotation
   * as a strong bot-activity signal (audit CRIT-3). Generated and cached
   * by `WeixinPlugin.loadOrCreateWechatUin`; tests may pass a literal.
   * When omitted, `startMonitor` falls back to a deterministic
   * accountId-derived UIN so the value is still stable across restarts.
   */
  wechatUin?: string;
  /** Directory used to persist get_updates_buf. Pass getPlatformServices().paths.getDataDir(). */
  dataDir: string;
  agent: WeixinAgent;
  abortSignal?: AbortSignal;
  log?: (msg: string) => void;
};

// ==================== Utilities ====================

function formatError(err: unknown): string {
  if (err instanceof Error) {
    const cause = (err as Error & { cause?: unknown }).cause;
    return cause !== undefined ? `${err.message}: ${String(cause)}` : err.message;
  }
  return String(err);
}

function stringifyLogValue(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function summarizeUploadUrlResponse(data: unknown): string {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return stringifyLogValue(data);
  }

  const record = data as Record<string, unknown>;
  const summary = {
    keys: Object.keys(record),
    ret: record.ret,
    errcode: record.errcode,
    errmsg: record.errmsg,
    msg: record.msg,
    message: record.message,
    upload_full_url_type: typeof record.upload_full_url,
    upload_full_url_preview:
      typeof record.upload_full_url === 'string' ? record.upload_full_url.slice(0, 160) : record.upload_full_url,
  };

  return stringifyLogValue(summary);
}

// ==================== Constants ====================

const LONG_POLL_TIMEOUT_MS = 35_000;
const API_TIMEOUT_MS = 15_000;
const RETRY_DELAY_MS = 2_000;
const BACKOFF_DELAY_MS = 30_000;
/** MED-7: cap derived from a Retry-After header so a missing/invalid value can't pin us forever. */
const MAX_RATE_LIMIT_BACKOFF_MS = 5 * 60_000;
const MAX_CONSECUTIVE_FAILURES = 3;
const UPLOAD_MAX_RETRIES = 3;
const TEXT_ITEM_TYPE = 1;
const IMAGE_ITEM_TYPE = 2;
const VOICE_ITEM_TYPE = 3;
const FILE_ITEM_TYPE = 4;
const CDN_BASE_URL = 'https://novac2c.cdn.weixin.qq.com/c2c';
const UPLOADS_TTL_MS = 72 * 60 * 60 * 1000;
const UPLOADS_MAX_BYTES = 200 * 1024 * 1024;

// ==================== Internal API types ====================

type GetUpdatesResp = {
  ret?: number;
  errcode?: number;
  errmsg?: string;
  msgs?: WeixinRawMessage[];
  get_updates_buf?: string;
  longpolling_timeout_ms?: number;
};

type WeixinMediaData = {
  media?: { encrypt_query_param?: string; aes_key?: string };
  aeskey?: string;
  file_name?: string;
};

type WeixinRawItem = {
  type?: number;
  text_item?: { text?: string };
  voice_item?: { text?: string };
  image_item?: WeixinMediaData;
  file_item?: WeixinMediaData;
};

type WeixinRawMessage = {
  from_user_id?: string;
  context_token?: string;
  msg_id?: string;
  item_list?: WeixinRawItem[];
};

type GetUploadUrlResp = {
  upload_param?: string;
  upload_full_url?: string;
};

/** MED-7: error subclass that lets the monitor loop respect Tencent's Retry-After hint on 429. */
class RateLimitError extends Error {
  readonly rateLimited = true;
  readonly retryAfterMs?: number;
  constructor(message: string, retryAfterMs?: number) {
    super(message);
    this.retryAfterMs = retryAfterMs;
  }
}

function isRateLimitError(err: unknown): err is RateLimitError {
  return err instanceof Error && (err as Partial<RateLimitError>).rateLimited === true;
}

// ==================== HTTP ====================

async function apiPost<T>(
  baseUrl: string,
  endpoint: string,
  bodyObj: unknown,
  token: string,
  wechatUin: string,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<T> {
  const url = `${baseUrl.replace(/\/$/, '')}/${endpoint}`;
  const body = JSON.stringify(bodyObj);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        AuthorizationType: 'ilink_bot_token',
        Authorization: `Bearer ${token}`,
        // MED-3: Content-Length set automatically by fetch (undici); manual computation invites drift.
        'X-WECHAT-UIN': wechatUin,
      },
      body,
      signal: controller.signal,
    });
    if (!res.ok) {
      // MED-7: surface 429 so the monitor loop can honor Retry-After instead of flat 30s backoff.
      if (res.status === 429) {
        const retryAfterRaw = res.headers.get('retry-after');
        const retryAfterSec = Number(retryAfterRaw ?? 0);
        const retryAfterMs =
          Number.isFinite(retryAfterSec) && retryAfterSec > 0
            ? Math.min(retryAfterSec * 1000, MAX_RATE_LIMIT_BACKOFF_MS)
            : undefined;
        throw new RateLimitError(`HTTP 429 rate-limited`, retryAfterMs);
      }
      throw new Error(`HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

// ==================== API calls ====================

async function callGetUpdates(
  baseUrl: string,
  token: string,
  wechatUin: string,
  buf: string,
  signal?: AbortSignal
): Promise<GetUpdatesResp> {
  return apiPost<GetUpdatesResp>(
    baseUrl,
    'ilink/bot/getupdates',
    { get_updates_buf: buf, base_info: {} },
    token,
    wechatUin,
    LONG_POLL_TIMEOUT_MS,
    signal
  );
}

async function callSendMessage(
  baseUrl: string,
  token: string,
  wechatUin: string,
  toUserId: string,
  text: string,
  contextToken?: string
): Promise<void> {
  const clientId = crypto.randomUUID();
  await apiPost(
    baseUrl,
    'ilink/bot/sendmessage',
    {
      msg: {
        to_user_id: toUserId,
        client_id: clientId,
        message_type: 2,
        message_state: 2,
        item_list: [{ type: TEXT_ITEM_TYPE, text_item: { text } }],
        context_token: contextToken,
      },
      base_info: {},
    },
    token,
    wechatUin,
    API_TIMEOUT_MS
    // No abort signal - send should complete even if the monitor is stopping
  );
}

type UploadedWeixinMedia = {
  itemType: typeof IMAGE_ITEM_TYPE | typeof FILE_ITEM_TYPE;
  fileName: string;
  rawSize: number;
  ciphertextSize: number;
  aesKeyForMessage: string;
  downloadEncryptedQueryParam: string;
};

function getWeixinUploadMediaType(action: IChannelMediaAction): 1 | 3 {
  return action.type === 'image' ? 1 : 3;
}

function getWeixinSendItemType(action: IChannelMediaAction): typeof IMAGE_ITEM_TYPE | typeof FILE_ITEM_TYPE {
  return action.type === 'image' ? IMAGE_ITEM_TYPE : FILE_ITEM_TYPE;
}

function getAesEcbPaddedSize(size: number): number {
  return Math.ceil((size + 1) / 16) * 16;
}

// MED-4: AES-128-ECB is required by the Tencent iLink CDN protocol (both upload + download
// directions are ECB-encrypted blobs). Not a Wayland security choice - do not "fix" to CBC/GCM
// without a corresponding protocol change on Tencent's side or attachments will be rejected.
function encryptAesEcb(buffer: Buffer, key: Buffer): Buffer {
  const cipher = crypto.createCipheriv('aes-128-ecb', key, null);
  cipher.setAutoPadding(true);
  return Buffer.concat([cipher.update(buffer), cipher.final()]);
}

async function callGetUploadUrl(
  baseUrl: string,
  token: string,
  wechatUin: string,
  toUserId: string,
  action: IChannelMediaAction,
  fileData: Buffer,
  aesKeyHex: string,
  fileKey: string,
  log?: (msg: string) => void
): Promise<{ uploadFullUrl?: string; uploadParam?: string }> {
  const data = await apiPost<GetUploadUrlResp>(
    baseUrl,
    'ilink/bot/getuploadurl',
    {
      filekey: fileKey,
      media_type: getWeixinUploadMediaType(action),
      to_user_id: toUserId,
      rawsize: fileData.length,
      rawfilemd5: crypto.createHash('md5').update(fileData).digest('hex'),
      filesize: getAesEcbPaddedSize(fileData.length),
      no_need_thumb: true,
      aeskey: aesKeyHex,
      base_info: {},
    },
    token,
    wechatUin,
    API_TIMEOUT_MS
  );

  const uploadParam = String(data.upload_param ?? '').trim();
  const uploadUrl = String(data.upload_full_url ?? '').trim();
  if (!uploadUrl && !uploadParam) {
    log?.(
      `[weixin] getuploadurl missing upload url for ${toUserId}: ${summarizeUploadUrlResponse(data)} metadata=${stringifyLogValue({ type: action.type, fileName: action.fileName || path.basename(action.path), path: action.path, size: fileData.length })}`
    );
    throw new Error('getuploadurl missing upload url');
  }
  return {
    uploadFullUrl: uploadUrl || undefined,
    uploadParam: uploadParam || undefined,
  };
}

function buildCdnUploadUrl(uploadParam: string, fileKey: string): string {
  return `${CDN_BASE_URL}/upload?encrypted_query_param=${encodeURIComponent(uploadParam)}&filekey=${encodeURIComponent(fileKey)}`;
}

async function uploadBufferToCdn(
  fileData: Buffer,
  upload: { uploadFullUrl?: string; uploadParam?: string },
  fileKey: string,
  aesKey: Buffer,
  log?: (msg: string) => void
): Promise<{
  downloadEncryptedQueryParam: string;
  ciphertextSize: number;
}> {
  const ciphertext = encryptAesEcb(fileData, aesKey);
  const trimmedUploadFullUrl = upload.uploadFullUrl?.trim();
  const uploadUrl = trimmedUploadFullUrl
    ? trimmedUploadFullUrl
    : upload.uploadParam
      ? buildCdnUploadUrl(upload.uploadParam, fileKey)
      : '';

  if (!uploadUrl) {
    throw new Error('CDN upload URL missing');
  }

  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= UPLOAD_MAX_RETRIES; attempt++) {
    try {
      const resp = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: new Uint8Array(ciphertext),
        signal: AbortSignal.timeout(30_000),
      });
      const errorHeader = String(resp.headers.get('x-error-message') ?? '').trim();
      const downloadEncryptedQueryParam = String(resp.headers.get('x-encrypted-param') ?? '').trim();

      if (resp.status >= 400 && resp.status < 500) {
        throw new Error(`CDN upload client error ${resp.status}: ${errorHeader || 'no error message'}`);
      }
      if (resp.status !== 200) {
        throw new Error(`CDN upload server error ${resp.status}: ${errorHeader || 'no error message'}`);
      }
      if (!downloadEncryptedQueryParam) {
        throw new Error('CDN upload response missing x-encrypted-param header');
      }

      return {
        downloadEncryptedQueryParam,
        ciphertextSize: ciphertext.length,
      };
    } catch (err) {
      const uploadError = err instanceof Error ? err : new Error(String(err));
      lastError = uploadError;
      if (uploadError.message.includes('client error')) {
        throw uploadError;
      }
      if (attempt < UPLOAD_MAX_RETRIES) {
        log?.(`[weixin] CDN upload attempt ${attempt} failed for ${fileKey}, retrying: ${uploadError.message}`);
      } else {
        log?.(`[weixin] CDN upload failed for ${fileKey} after ${UPLOAD_MAX_RETRIES} attempts: ${uploadError.message}`);
      }
    }
  }

  throw lastError ?? new Error('CDN upload failed');
}

async function uploadMediaAction(
  baseUrl: string,
  token: string,
  wechatUin: string,
  toUserId: string,
  action: IChannelMediaAction,
  log?: (msg: string) => void
): Promise<UploadedWeixinMedia> {
  const fileStats = fs.statSync(action.path);
  if (!fileStats.isFile()) {
    throw new Error(`not a file: ${action.path}`);
  }
  if (fileStats.size > UPLOADS_MAX_BYTES) {
    throw new Error(`file too large: ${fileStats.size}`);
  }
  const fileData = await fs.promises.readFile(action.path);

  const aesKey = crypto.randomBytes(16);
  const aesKeyHex = aesKey.toString('hex');
  const fileKey = crypto.randomBytes(16).toString('hex');
  const upload = await callGetUploadUrl(baseUrl, token, wechatUin, toUserId, action, fileData, aesKeyHex, fileKey, log);
  const uploaded = await uploadBufferToCdn(fileData, upload, fileKey, aesKey, log);

  return {
    itemType: getWeixinSendItemType(action),
    fileName: action.fileName || path.basename(action.path),
    rawSize: fileData.length,
    ciphertextSize: uploaded.ciphertextSize,
    aesKeyForMessage: Buffer.from(aesKeyHex, 'utf-8').toString('base64'),
    downloadEncryptedQueryParam: uploaded.downloadEncryptedQueryParam,
  };
}

async function callSendMediaMessage(
  baseUrl: string,
  token: string,
  wechatUin: string,
  toUserId: string,
  media: UploadedWeixinMedia,
  contextToken?: string
): Promise<void> {
  const item =
    media.itemType === IMAGE_ITEM_TYPE
      ? {
          type: IMAGE_ITEM_TYPE,
          image_item: {
            media: {
              encrypt_query_param: media.downloadEncryptedQueryParam,
              aes_key: media.aesKeyForMessage,
              encrypt_type: 1,
            },
            mid_size: media.ciphertextSize,
          },
        }
      : {
          type: FILE_ITEM_TYPE,
          file_item: {
            media: {
              encrypt_query_param: media.downloadEncryptedQueryParam,
              aes_key: media.aesKeyForMessage,
              encrypt_type: 1,
            },
            file_name: media.fileName,
            len: String(media.rawSize),
          },
        };

  await apiPost(
    baseUrl,
    'ilink/bot/sendmessage',
    {
      msg: {
        to_user_id: toUserId,
        client_id: crypto.randomUUID(),
        message_type: 2,
        message_state: 2,
        item_list: [item],
        context_token: contextToken,
      },
      base_info: {},
    },
    token,
    wechatUin,
    API_TIMEOUT_MS
  );
}

// ==================== Buf persistence ====================

function getBufPath(dataDir: string, accountId: string): string {
  return path.join(dataDir, 'weixin-monitor', `${accountId}.buf`);
}

function loadBuf(dataDir: string, accountId: string): string {
  try {
    return fs.readFileSync(getBufPath(dataDir, accountId), 'utf-8');
  } catch {
    return '';
  }
}

function saveBuf(dataDir: string, accountId: string, buf: string): void {
  const dir = path.join(dataDir, 'weixin-monitor');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getBufPath(dataDir, accountId), buf, 'utf-8');
}

// ==================== Attachment download ====================

function sniffExtAndKind(buf: Buffer): { ext: string; kind: 'image' | 'file' } {
  if (buf[0] === 0xff && buf[1] === 0xd8) return { ext: '.jpg', kind: 'image' };
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return { ext: '.png', kind: 'image' };
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return { ext: '.gif', kind: 'image' };
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return { ext: '.pdf', kind: 'file' };
  if (buf[0] === 0x50 && buf[1] === 0x4b) return { ext: '.zip', kind: 'file' };
  return { ext: '.bin', kind: 'file' };
}

async function downloadMediaItem(
  item: WeixinRawItem,
  msgId: string,
  idx: number,
  uploadsDir: string
): Promise<WeixinAttachment> {
  const itemData = item.image_item ?? item.file_item ?? null;
  const encryptQueryParam = itemData?.media?.encrypt_query_param;
  if (!encryptQueryParam) throw new Error('missing encrypt_query_param');

  let aesKey: Buffer | undefined;
  const aesKeyHex = itemData?.aeskey;
  const aesKeyB64 = itemData?.media?.aes_key;
  if (aesKeyHex) {
    aesKey = Buffer.from(aesKeyHex, 'hex');
  } else if (aesKeyB64) {
    const decoded = Buffer.from(aesKeyB64, 'base64');
    aesKey =
      decoded.length === 16
        ? decoded
        : decoded.length === 32
          ? Buffer.from(decoded.toString('ascii'), 'hex')
          : undefined;
  }

  const cdnUrl = `${CDN_BASE_URL}/download?encrypted_query_param=${encodeURIComponent(encryptQueryParam)}`;
  const resp = await fetch(cdnUrl, { signal: AbortSignal.timeout(30_000) });
  if (!resp.ok) throw new Error(`CDN HTTP ${resp.status}`);
  const rawBuf = Buffer.from(await resp.arrayBuffer());
  if (rawBuf.length === 0) throw new Error('CDN returned empty data');

  let resultBuf: Buffer;
  if (aesKey) {
    const decipher = crypto.createDecipheriv('aes-128-ecb', aesKey, null);
    decipher.setAutoPadding(true);
    resultBuf = Buffer.concat([decipher.update(rawBuf), decipher.final()]);
  } else {
    resultBuf = rawBuf;
  }

  const { ext, kind } = sniffExtAndKind(resultBuf);
  const declaredName = String(itemData?.file_name ?? (item.type === IMAGE_ITEM_TYPE ? 'image' : 'file'));
  const safeName = declaredName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 64);
  const safeMsgId = msgId.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 48);
  const fileName = `${safeMsgId}-${idx}-${safeName}${ext}`;

  // Defense-in-depth: prevent any future regex regression that allows path-traversal chars
  // (e.g. `..`) from escaping uploadsDir. The sanitizer already strips `/` and `\`, but the
  // resolved path must still land under uploadsDir.
  fs.mkdirSync(uploadsDir, { recursive: true });
  const filePath = path.resolve(uploadsDir, fileName);
  const uploadsRoot = path.resolve(uploadsDir) + path.sep;
  if (!filePath.startsWith(uploadsRoot)) {
    throw new Error(`unsafe attachment path: ${fileName}`);
  }
  fs.writeFileSync(filePath, resultBuf);
  return { path: filePath, kind, name: declaredName };
}

function cleanUploads(uploadsDir: string): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(uploadsDir, { withFileTypes: true });
  } catch {
    return;
  }
  const now = Date.now();
  let totalBytes = 0;
  const files: Array<{ path: string; mtime: number; size: number }> = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    const fp = path.join(uploadsDir, e.name);
    try {
      const st = fs.statSync(fp);
      if (now - st.mtimeMs > UPLOADS_TTL_MS) {
        fs.unlinkSync(fp);
        continue;
      }
      totalBytes += st.size;
      files.push({ path: fp, mtime: st.mtimeMs, size: st.size });
    } catch {}
  }
  files.sort((a, b) => a.mtime - b.mtime);
  for (const f of files) {
    if (totalBytes <= UPLOADS_MAX_BYTES) break;
    try {
      fs.unlinkSync(f.path);
    } catch {}
    totalBytes -= f.size;
  }
}

// ==================== Monitor loop ====================

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    // MED-1: detach the abort listener on the happy path so long-lived monitors don't accumulate
    // listeners across thousands of sleep() calls (otherwise MaxListenersExceededWarning fires
    // and listeners begin to silently leak).
    const onAbort = () => {
      clearTimeout(t);
      signal?.removeEventListener('abort', onAbort);
      reject(new Error('aborted'));
    };
    const t = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function runMonitor(
  baseUrl: string,
  token: string,
  accountId: string,
  dataDir: string,
  agent: WeixinAgent,
  wechatUin: string,
  signal: AbortSignal | undefined,
  log: (msg: string) => void
): Promise<void> {
  let buf = loadBuf(dataDir, accountId);
  let consecutiveFailures = 0;
  const typingMgr = new TypingManager({ baseUrl, token, wechatUin, abortSignal: signal, log });

  // oxlint-disable-next-line eslint/no-unmodified-loop-condition
  while (!signal?.aborted) {
    try {
      // oxlint-disable-next-line eslint/no-await-in-loop
      const resp = await callGetUpdates(baseUrl, token, wechatUin, buf, signal);

      const isApiError =
        (resp.ret !== undefined && resp.ret !== 0) || (resp.errcode !== undefined && resp.errcode !== 0);

      if (isApiError) {
        consecutiveFailures++;
        log(
          `[weixin] getUpdates failed: ret=${resp.ret} errcode=${resp.errcode} (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES})`
        );
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          consecutiveFailures = 0;
          // oxlint-disable-next-line eslint/no-await-in-loop
          await sleep(BACKOFF_DELAY_MS, signal);
        } else {
          // oxlint-disable-next-line eslint/no-await-in-loop
          await sleep(RETRY_DELAY_MS, signal);
        }
        continue;
      }

      consecutiveFailures = 0;

      // MED-8: do NOT advance buf until every message in this batch has been handled (or
      // explicitly errored). Previously buf was persisted immediately on poll success, which
      // meant any agent-timeout / agent-error mid-batch silently dropped the message because
      // the next poll skipped past it. We now defer saveBuf to the end of the loop body.
      const nextBuf = resp.get_updates_buf;

      for (const msg of resp.msgs ?? []) {
        const items = msg.item_list ?? [];
        const textItem = items.find((i) => i.type === TEXT_ITEM_TYPE);
        const voiceItems = items.filter((i) => i.type === VOICE_ITEM_TYPE);
        const voiceTextItems = voiceItems.filter((i) => i.voice_item?.text);
        const mediaItems = items.filter((i) => i.type === IMAGE_ITEM_TYPE || i.type === FILE_ITEM_TYPE);

        // MED-5: voice arrived but Tencent didn't transcribe it. Log so operators can detect
        // a silently-broken voice path (user hears a "sent" indicator, bot gets nothing).
        const droppedVoice = voiceItems.length - voiceTextItems.length;
        if (droppedVoice > 0) {
          log(
            `[weixin] voice received but no transcript (${droppedVoice} item${droppedVoice === 1 ? '' : 's'}) for ${msg.from_user_id ?? 'unknown'} msg=${msg.msg_id ?? 'unknown'}`
          );
        }

        if (!textItem && voiceTextItems.length === 0 && mediaItems.length === 0) continue;

        const conversationId = msg.from_user_id ?? '';
        const text = [textItem?.text_item?.text?.trim(), ...voiceTextItems.map((item) => item.voice_item?.text?.trim())]
          .filter((part): part is string => Boolean(part))
          .join('\n\n');
        const msgId = msg.msg_id ?? String(Date.now());

        // Download attachments if any
        const attachments: WeixinAttachment[] = [];
        if (mediaItems.length > 0) {
          const uploadsDir = path.join(dataDir, 'weixin-uploads');
          for (const [idx, item] of mediaItems.entries()) {
            try {
              // oxlint-disable-next-line eslint/no-await-in-loop
              attachments.push(await downloadMediaItem(item, msgId, idx, uploadsDir));
            } catch (dlErr) {
              log(`[weixin] attachment download failed (${conversationId}#${idx}): ${formatError(dlErr)}`);
            }
          }
          if (attachments.length > 0) cleanUploads(uploadsDir);
        }

        if (!text && attachments.length === 0) continue;

        // oxlint-disable-next-line eslint/no-await-in-loop
        const stopTyping = await typingMgr.startTyping(conversationId, msg.context_token);
        let response: WeixinChatResponse | undefined;
        try {
          // oxlint-disable-next-line eslint/no-await-in-loop
          response = await agent.chat({
            conversationId,
            // LOW-4: thread the real Tencent msg_id through so downstream dedup/threading
            // sees a per-message id instead of conversationId (which collides across messages
            // from the same user).
            msgId,
            text,
            attachments: attachments.length > 0 ? attachments : undefined,
            sendTextNow: (outgoingText) =>
              callSendMessage(baseUrl, token, wechatUin, conversationId, outgoingText, msg.context_token),
          });
        } catch (agentErr) {
          // oxlint-disable-next-line eslint/no-await-in-loop
          await stopTyping();
          log(`[weixin] agent error for ${conversationId}: ${formatError(agentErr)}`);
          continue;
        }
        // oxlint-disable-next-line eslint/no-await-in-loop
        await stopTyping();
        const fallbackNotices: string[] = [];
        for (const mediaAction of response.mediaActions ?? []) {
          try {
            if (mediaAction.caption) {
              // Match openclaw-weixin ordering: send caption text before media item.
              // oxlint-disable-next-line eslint/no-await-in-loop
              await callSendMessage(baseUrl, token, wechatUin, conversationId, mediaAction.caption, msg.context_token);
            }
            // oxlint-disable-next-line eslint/no-await-in-loop
            const uploaded = await uploadMediaAction(baseUrl, token, wechatUin, conversationId, mediaAction, log);
            // oxlint-disable-next-line eslint/no-await-in-loop
            await callSendMediaMessage(baseUrl, token, wechatUin, conversationId, uploaded, msg.context_token);
          } catch (sendErr) {
            const failedName = mediaAction.fileName || path.basename(mediaAction.path);
            fallbackNotices.push(i18n.t('settings.channels.mediaSendFailed', { name: failedName }));
            log(`[weixin] media send error for ${conversationId}: ${formatError(sendErr)}`);
          }
        }

        const finalText = [response.text, ...fallbackNotices].filter(Boolean).join('\n\n');
        if (finalText) {
          try {
            // oxlint-disable-next-line eslint/no-await-in-loop
            await callSendMessage(baseUrl, token, wechatUin, conversationId, finalText, msg.context_token);
          } catch (sendErr) {
            log(`[weixin] send error for ${conversationId}: ${formatError(sendErr)}`);
          }
        }
      }

      // MED-8: now safe to advance - every message in the batch has either been processed
      // or explicitly errored (with the error logged). A crash before this point causes the
      // next poll to redeliver the entire batch.
      if (nextBuf) {
        buf = nextBuf;
        saveBuf(dataDir, accountId, buf);
      }
    } catch (err) {
      if (signal?.aborted) return;

      // MED-7: honor Tencent's Retry-After hint on 429 instead of the flat 30s backoff.
      if (isRateLimitError(err)) {
        const wait = err.retryAfterMs ?? BACKOFF_DELAY_MS;
        log(`[weixin] rate-limited by Tencent; backing off ${wait}ms`);
        consecutiveFailures = 0;
        // oxlint-disable-next-line eslint/no-await-in-loop
        await sleep(wait, signal);
        continue;
      }

      consecutiveFailures++;
      log(`[weixin] getUpdates error (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}): ${String(err)}`);
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        consecutiveFailures = 0;
        // oxlint-disable-next-line eslint/no-await-in-loop
        await sleep(BACKOFF_DELAY_MS, signal);
      } else {
        // oxlint-disable-next-line eslint/no-await-in-loop
        await sleep(RETRY_DELAY_MS, signal);
      }
    }
  }
}

/**
 * Start the long-poll monitor in the background (non-blocking).
 * Errors are logged via opts.log. Loop stops when abortSignal fires.
 */
export function startMonitor(opts: MonitorOptions): void {
  const { baseUrl, token, accountId, wechatUin, dataDir, agent, abortSignal, log } = opts;
  const logFn = log ?? ((_msg: string) => {});
  // CRIT-3 + LOW-2: prefer a caller-supplied UIN persisted by the plugin so
  // restarts keep the same header. Fall back to a deterministic
  // accountId-derived hex value (NOT per-startup randomBytes) so even the
  // legacy callable shape avoids "bot rotation" signals to risk-control.
  // Hex stays in the safe ASCII subset; base64 padding `=` and `+` may
  // not be valid header characters depending on Tencent's parser.
  const effectiveUin =
    wechatUin && wechatUin.length > 0
      ? wechatUin
      : crypto.createHash('sha256').update(accountId).digest('hex').slice(0, 8);

  void runMonitor(baseUrl, token, accountId, dataDir, agent, effectiveUin, abortSignal, logFn).catch((err: unknown) => {
    if (!abortSignal?.aborted) {
      logFn(`[weixin] monitor terminated unexpectedly: ${String(err)}`);
    }
  });
}
