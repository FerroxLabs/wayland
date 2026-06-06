# Wayland WhatsApp Bridge

Node subprocess that connects the Wayland main process (Electron) to WhatsApp via JSON-RPC over stdio. Three pluggable backends share one handler surface so the parent does not care which protocol is in use.

## Architecture

- **Subprocess, not a bundle module.** Runs under plain Node (`type: module`). Stays out of the Electron main bundle so cold-start is fast and a bridge crash cannot bring down the app.
- **stdio JSON-RPC 2.0.** One JSON value per line. The parent owns request ids; the bridge owns notifications (`inbound.message`, `connection.status`, `qr.update`, `error`).
- **Method allowlist.** `allowlist.js` rejects any RPC method outside `ALLOWED_RPC_METHODS` with `-32601`. Defense-in-depth in case the parent IPC channel is ever exposed.
- **No HTTP server inside the bridge.** Meta webhooks are received by the parent's `WebhookReceiver` (HMAC-verified there) and forwarded via the `webhookDelivery` RPC.

## Backends

Selected at launch with `--backend <name>` (default: `baileys`):

| Backend | When to use |
| --- | --- |
| `baileys` | Personal WhatsApp via Web protocol. Fastest. QR pairing. Risk of Meta bans for high-volume bot use. |
| `whatsapp-web` | Same Web protocol but driven through Chromium + Puppeteer. Useful as a fallback when Baileys breaks on a protocol bump. Heavier (~150 MB Chromium). |
| `meta-business` | Official Meta WhatsApp Business Cloud API. Required for production / regulated traffic. Pay per message. No group inbound. |

## RPC surface (every backend)

- `connect(params)` - bring the backend online. Per-backend params (Meta needs `phoneNumberId` + `accessToken`).
- `disconnect()` - stop reconnection loop, close socket.
- `sendText({ chatId, text })`
- `sendMedia({ chatId, filePath | mediaUrl | mediaId, mediaType?, caption?, fileName? })`
- `setPresence({ chatId, presence })` - `composing` / `paused` / `recording` (Meta backend: no-op).
- `react({ chatId, messageId, emoji })`
- `subscribe({ chatId })` - presence subscription (no-op on Meta and `whatsapp-web`).
- `webhookDelivery({ payload })` - Meta-only; parent forwards verified webhook payloads.
- `health()` - bridge-level status (always allowed; no backend load).

Upstream notifications: `inbound.message`, `connection.status`, `qr.update`, `error`.

## Bundling in the packaged app

The bridge ships as a self-contained Node program - it is **not** part of the
Electron main bundle. Three pieces work together so `child_process.fork` finds
it on disk in production builds:

1. **`extraResources` rule (`electron-builder.yml`).** Copies the entire bridge
   directory verbatim to `<process.resourcesPath>/whatsapp-bridge/` in the
   packaged app. We use `extraResources` instead of `files:` because the bridge
   must live outside `app.asar` - `fork()` requires a real path on disk.

2. **`postinstall` script (`scripts/postinstall.js → installBridgeDeps()`).**
   After the root `bun install`, runs `bun install` (or `npm install` as a
   fallback) inside `src/process/channels/whatsapp-bridge/` so the bridge's own
   `node_modules/` exists. That directory is copied along with the bridge by
   the `extraResources` rule above, so the packaged app ships everything the
   bridge needs at runtime.

3. **`resolveBridgeEntryPath()` (`WhatsAppPlugin.ts`).** Branches on
   `app.isPackaged`:
   - Packaged: `path.join(process.resourcesPath, 'whatsapp-bridge', 'bridge.js')`
   - Dev: relative to the source tree (`../../../whatsapp-bridge/bridge.js`
     from the compiled main-process location).

If you add a new file to the bridge dir, the `extraResources` filter is
`**/*` minus `*.test.*` / `*.spec.*`, so it picks it up automatically. If you
add a new dependency to `package.json` here, no electron-builder change is
needed - the next `bun install` (root) will fan out via postinstall.

## Attribution

- `bridge.js`, `allowlist.js` - architectural pattern adapted from [Hermes Agent](https://github.com/hermes-agent/hermes-agent) (`scripts/whatsapp-bridge/`), Peter Steinberger / Hermes contributors, MIT.
- `backends/baileys.js` - session, auth-store, identity logic ported from [OpenClaw](https://github.com/openclaw/openclaw) (`extensions/whatsapp/src/`), OpenClaw contributors, MIT.
- `backends/whatsapp-web.js` - wraps [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js) by Pedro S. Lopez, Apache-2.0.
- `backends/meta-business.js` - Wayland original. Calls Meta Graph API directly via `axios`.

Wayland modifications are Apache-2.0, see individual file headers.
