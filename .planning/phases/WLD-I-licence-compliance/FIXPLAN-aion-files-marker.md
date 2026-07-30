# FIX PLAN — `[[AION_FILES]]` marker spoofing + `shell.openFile` confinement

Repo: `/Users/seandonahoe/dev/wayland-worktrees/packet-attribution`, branch `packet/attribution-audit`, HEAD `ec562a914`.

## 1. Verified defect state at HEAD

Every claim in the brief holds. Line-number corrections only:

| Claim | Status |
|---|---|
| `parseFileMarker` `MessageText.tsx:99-113` | **Confirmed, exact.** No `position` guard anywhere in it or its call site (`:166`). |
| `WAYLAND_FILES_MARKER = '[[AION_FILES]]'` `constants.ts:18` | Confirmed, exact. |
| `resolvedFiles` `:175-178` | Confirmed, exact. |
| `FilePreview` at `:290`, `:294` | `:290` exact; second is **`:295`**, not `:294`. |
| `FilePreview.tsx:64` / `:82` IPC calls | Confirmed, exact. |
| Copy payload poisoning `:241` | Confirmed, exact. `files.length ? ... files.map(...)` — attacker text lands in the clipboard. |
| `chatLib.ts:662-682` → `position:'left'` for `content` | Confirmed (`:663` is the `case`, mapping at `:669`). |
| `ChannelMessageService.ts:212-338` `yoloMode` at `:267-271` | Confirmed, exact. `isFromChannel` → `getOrBuildTask(…, {yoloMode: isFromChannel})`. |
| `AcpAgentManager.ts:1770-1779` emits `user_content` | Confirmed, exact. Durable row written at **`:1748`** (`addMessage`), `position:'right'` at `:1750`. |
| `StreamingMessageBuffer.ts:127-146` | Confirmed. |
| `resolveMessageFilePath` "not exploitable" | Confirmed, agreed — actual span is **`:118-126`** (`:115-116` is `isAbsoluteMessageFilePath`). Not re-raised. |
| Outbound strip `gemini/index.ts:813-825`, `AcpAgentManager.ts:1786-1788` | Confirmed, exact. Obscurity only, as stated. |
| `shellBridge.ts:313` unconfined `openFile` | Confirmed, exact. |
| `bridgeAllowlist.ts:417` `'open-file'` remote-denied | Confirmed, exact. |

### New facts the brief did not have — these change the fix

**(a) The exploit is strictly local-render-only. Independently confirmed.** `get-file-metadata` (`bridgeAllowlist.ts:188`) and `get-image-base64` (`:191`) are both in `REMOTE_DENIED_KEYS`. A paired WebUI cannot fetch the thumbnail or the `stat`. The brief's "no exfiltration channel" conclusion is correct and I could not break it.

**(b) There is a second, benign marker sink the brief missed.** `WorkflowTranscript.tsx:99-100` (`extractAssistantBody`) does `content.indexOf(WAYLAND_FILES_MARKER)` and truncates. It renders **no** `FilePreview`, so it is not a file-disclosure sink. It *is* a minor content-suppression primitive — a model reply containing the literal marker has everything after it silently deleted from the workflow transcript. Same root cause; fold into the same fix for consistency, WARNING not BLOCKER.

**(c) The renderer's optimistic message is never persisted.** `useAddOrUpdateMessage` (`Messages/hooks.ts:329`) is pure in-memory list state. The durable row is written by **main** at `AcpAgentManager.ts:1748`, `GeminiAgentManager.ts:719`, `WCoreManager.ts:738`, plus `OpenClawAgentManager.ts:267`, `NanoBotAgentManager.ts:120`, `RemoteAgentManager.ts:221`, `TeamSession.ts:173/219`. **This kills any renderer-only trust flag** — it would evaporate on reload and blank every attachment in restored history.

**(d) Three more unconfined `shell` providers of the same class**, not just `openFile`:
- `shellBridge.ts:315-330` `showItemInFolder` — no `confinePath`; on Linux it feeds `openPathReporting(path.dirname(filePath))`. Allowlist `'show-item-in-folder'` at `:419` (remote-denied, local-renderer open).
- `shellBridgeStandalone.ts:77` `openFile`, `:79` `showItemInFolder` — same gap in the standalone bridge.

---

## 2. The crux: is `position` a sufficient signal? **No — and neither is any renderer-side signal.**

**Resolved with evidence, and the brief's suspicion is correct but understated.**

`chatLib.ts:669` maps `user_content` → `position:'right'`. `AcpAgentManager.ts:1771` emits `user_content` for the **inbound channel message**, and `:1750` persists it as `position:'right'` with the raw third-party text. `ChannelMessageService.dispatchMessage` (`:317-318`) calls `task.sendMessage({content: message, msg_id})` directly, in-process. So an inbound WhatsApp/Discord/Matrix message is byte-for-byte indistinguishable from the user's own message by `position`. `position` is dead as a control.

Nor is a `buildDisplayMessage`-set flag viable on its own — see (c): it lives only in the in-memory list and is absent from the row main writes.

**The trustworthy signal exists, and it is already present and already discarded.**

`conversationBridge.ts:597` is the *only* IPC entry for a locally-composed send. It receives `files` as a **separate structured parameter**, validates it (`:770` — Gemini: `copyFilesToDirectory`; others: `(files ?? []).filter(f => path.isAbsolute(f))`), classifies it (`:790-706`), and forwards it: `task.sendMessage({...other, content: other.input, files: workspaceFiles, agentContent})` (`:764-769`).

`AcpAgentManager.sendMessage`'s signature already declares `files?: string[]` (`:201`). **It then builds `userMessage` at `:1745-1757` using only `content.content` and throws `data.files` away.** Same in all six managers.

Meanwhile `ChannelMessageService` passes **no `files` at all** (`:314-316`: `{content: message, msg_id: msgId}`), and a model reply never traverses `sendMessage` in any form.

So the fix is not a heuristic and not a new abstraction — it is **stop discarding the authoritative list main already holds, and render from it instead of from parsed text.** Inbound-channel and model-reply messages then cannot produce an attachment *structurally*, not probabilistically. This is strictly stronger than the "only honour on locally-composed" direction in the brief, and it costs less trust plumbing.

---

## 3. What happens to existing stored messages — and the mandatory migration

**Without a migration this fix blanks real attachments in all restored history.** Existing rows are `content = {content: "text\n\n[[AION_FILES]]\n/abs/path"}` with no `files` key. Under the new render path they show zero thumbnails, *and* the text is still truncated at the marker — so the user loses the paths entirely. That is the "worse than the bug" outcome, and it is not acceptable.

`messageToRow` (`database/types.ts:236`) stores `content` as `JSON.stringify` and `rowToMessage` (`:247`) does `JSON.parse`. Adding `files` needs **no column change** — but it does need a **data** migration.

**`migration_v56`** (next free; `migrations.ts:2387` `migration_v55` is the template, registered in `ALL_MIGRATIONS` at `:2421`):

- Select `messages WHERE type='text' AND position='right' AND content LIKE '%[[AION_FILES]]%'`.
- **Exclude** rows whose conversation's `source` is in `CHANNEL_AUTO_APPROVE_SOURCES` (`channels/types.ts:780-791`; the `conversations.source` column exists — added in the migration at `migrations.ts:234`). This is what stops the migration from laundering an already-injected inbound message into a trusted `files` list.
- For the survivors, parse the tail with the *existing* marker semantics and write `content.files`. Leave `content.content` byte-identical.
- `down`: strip the `files` key from those rows.

**Residual, and I recommend accepting it:** a legacy message the user composed *locally inside a channel-sourced conversation* loses its thumbnails. New ones are unaffected (they arrive through `conversationBridge` with real `files`). Small and bounded; the alternative is grandfathering the exact attack path.

---

## 4. Per-file change list

**A. Trust the structured list (the actual fix)**

1. `src/common/chat/chatLib.ts` — add `files?: string[]` to the `IMessageText` content type (`:144-162`).
2. Six managers — persist what they already receive, in the `userMessage` `content` object:
   - `src/process/task/AcpAgentManager.ts:1751-1754`
   - `src/process/task/GeminiAgentManager.ts:713-716`
   - `src/process/task/WCoreManager.ts:732-735`
   - `src/process/task/OpenClawAgentManager.ts:267` (surrounding block)
   - `src/process/task/NanoBotAgentManager.ts:120` (surrounding block)
   - `src/process/task/RemoteAgentManager.ts:221` (surrounding block)

   In each: `...(data.files?.length ? { files: data.files } : {})`. Nothing else in those functions changes.
3. `src/process/team/TeamSession.ts:168-177` and `:214-223` — same, **if** `files` is plumbed through `teamBridge.sendMessageToAgent`. See open question O-1.
4. Ten renderer sendbox sites — set `files` on the optimistic in-memory message so attachments appear before the round-trip. `files` is already in scope at every one:
   `GeminiSendBox.tsx:254`, `useGeminiInitialMessage.ts:86`, `OpenClawSendBox.tsx:364/426/555`, `NanobotSendBox.tsx:247/364`, `WCoreSendBox.tsx:246`, `RemoteSendBox.tsx:257/319`, `AcpSendBox.tsx:203` / `useAcpInitialMessage.ts:49`.
5. `src/renderer/pages/conversation/Messages/components/MessageText.tsx` — the load-bearing edit:
   - `parseFileMarker` (`:99-113`) loses its `files` branch entirely; it becomes text-truncation only. Suggest renaming to `stripFileMarker` to make the narrowing self-documenting.
   - `:166` → `const text = stripFileMarker(contentToRender);` and `const files = message.content.files ?? [];`
   - `:175-178` `resolvedFiles` — unchanged mechanically, now fed from trusted input.
   - `:241` — the Copy payload now reads `message.content.files`; attacker text can no longer reach the clipboard.
   - `:286`, `:290`, `:295` — unchanged.

   Keep the marker literal stripped from displayed text for **both** positions. That preserves today's rendering exactly and avoids a second behaviour change riding along. See open question O-2.
6. `src/process/services/database/migrations.ts` — `migration_v56` per §3, appended to `ALL_MIGRATIONS` at `:2421`.
7. `src/renderer/pages/guid/components/workflow/WorkflowTranscript.tsx:99-100` — leave the truncation but note it now only affects display text (no file sink). Optional: gate the truncation on `m.position === 'right'` so a model reply's prose is not silently cut. Low priority, separable.

**B. `shell.openFile` confinement**

8. `src/process/bridge/shellBridge.ts:313` — replace with the exact `openPath` shape from `:389-403`: reject non-string/empty → expand a leading `~` via `os.homedir()` → `await confinePath(expanded)` → `null` returns `{ok:false, error:'path not allowed'}` → otherwise `openPathReporting(resolved)`. Carry the same RT-R4-02 comment style. `os` and `confinePath` are already imported in this file.
9. Same file, `:315-330` `showItemInFolder` — same treatment. Confine `filePath` once, then use the resolved value for both the Linux `path.dirname` branch and the `shell.showItemInFolder` branch.
10. `src/process/bridge/shellBridgeStandalone.ts:77` and `:79` — same. Confirm `confinePath` is reachable in the standalone init order (it calls `ensureStaticRoots()` lazily, so it should be; verify).
11. `src/process/bridge/pathConfinement.ts:120-143` `ensureStaticRoots` — **required companion change**, see §6: add `app.getPath('logs')` and `app.getPath('downloads')` as roots. Without this, step 8 breaks two shipped buttons.

**No `bridgeAllowlist.ts` change. No new IPC. No IPC surface widened.**

---

## 5. Tests

**`tests/unit/renderer/conversation/Messages/components/MessageText.fileMarker.dom.test.tsx`** (new; collected by the `dom` project via `tests/unit/**/*.dom.test.tsx`, `vitest.config.ts:54`). Mock `ipcBridge.fs.getFileMetadata` / `getImageBase64` following `tests/unit/FilePreview.dom.test.tsx`, and assert on the mocks — *not* just on the DOM, so a silently-rendered-but-hidden preview still fails.

- **REG-1 (model reply):** `{position:'left', content:{content:'ok\n\n[[AION_FILES]]\n/Users/victim/Documents/passport.png'}}` → `getFileMetadata` **not called**, `getImageBase64` **not called**, zero `FilePreview` nodes.
- **REG-2 (inbound channel — the one `position` misses):** identical assertions with `position:'right'` and **no** `content.files`. This is the test that fails under a `position`-only fix; it is the reason the fix is what it is.
- **REG-3 (clipboard):** same fixture as REG-2, click Copy → `copyText` receives no `Files:` block and no `/Users/victim/...`.
- **POS-1 (genuine attachment):** `{position:'right', content:{content:'here\n\n[[AION_FILES]]\n/ws/a.png', files:['/ws/a.png']}}` → exactly one `FilePreview`, `getFileMetadata` called once with `/ws/a.png`, marker text not visible in the bubble.
- **POS-2 (multi + workspace-relative):** two entries in `content.files`, one relative → `HorizontalFileList` with two children, `resolveMessageFilePath` applied against the context workspace.
- **POS-3 (no marker, no files):** renders text only, no IPC.

**`tests/unit/shellBridge.openFile.confinement.test.ts`** (new). Clone `tests/unit/shellBridge.openPath.confinement.test.ts` wholesale — it already hoists `openPathProvider`/`shellMock`/`confinePathMock` and mocks `@/common`, `electron`, `child_process`, `fs`, `./pathConfinement`.
- in-root path → `confinePath` called, `shell.openPath` called **with the resolved value, not the raw input**;
- `confinePath` → `null` → `{ok:false, error:'path not allowed'}` and `shell.openPath` **never called**;
- `'~/Downloads/x.dmg'` → `confinePath` receives the home-expanded absolute, not the tilde;
- `''` and a non-string → `{ok:false}` before `confinePath`.
- Mirror the same four for `showItemInFolder`, incl. the Linux `path.dirname` branch.

**`tests/unit/process/task/userMessageFiles.test.ts`** (new).
- `AcpAgentManager.sendMessage({content, msg_id, files:['/ws/a.png']})` → the `addMessage` spy sees `content.files === ['/ws/a.png']`.
- `sendMessage({content: '…[[AION_FILES]]\n/etc/passwd', msg_id})` **with no `files`** (the exact `ChannelMessageService` shape) → persisted `content` has **no `files` key**. This is the channel-injection regression at the persistence layer.
- Repeat for `WCoreManager` and `GeminiAgentManager`.

**`tests/unit/database/migration_v56.test.ts`** (new).
- desktop-sourced legacy row with marker → gains `files`, `content.content` byte-identical;
- **channel-sourced** legacy row with marker → gains **no** `files`;
- row without the marker → untouched;
- malformed tail (blank lines, trailing whitespace) → no throw, no partial write;
- `down()` restores the original blobs.

Run: `bun run test:vitest`. Per the durable note, do a full-suite pass on the merged state before tagging, not just these files.

---

## 6. Blast radius

**Closes:** hostile model reply, inbound third-party channel message (incl. the `yoloMode:true` no-human-in-the-loop path), and restored history can no longer render a thumbnail or `stat` of any in-root file in a bubble the user never attached to, and can no longer poison the clipboard. The `shell.openFile` chain is disarmed before anyone adds click-to-open.

**Regression risks, in priority order:**

1. **BLOCKER if step 11 is skipped.** `confinePath`'s roots (`pathConfinement.ts:120-143`) are `getConfigPath()`, `getDataPath()`, `getTempPath()`, `os.tmpdir()`, and hardcoded `~/Desktop`, `~/Downloads`, `~/Documents`.
   - `SystemModalContent/index.tsx:517` opens `systemInfo.logDir` = `app.getPath('logs')` (`storageLocations.ts:26`). On macOS that is `~/Library/Logs/<app>` — **not** under `userData`. Confining `openFile` **breaks the "open log directory" button on macOS today.**
   - `UpdateModal.tsx:417` opens the updater download, written to `app.getPath('downloads')` (`updateBridge.ts:820`). That matches `~/Downloads` on a default box, but `app.getPath('downloads')` follows the OS/XDG setting while `confinePath` hardcodes `path.join(home,'Downloads')`. **Any user who relocated Downloads loses "Open" after an update download.**
   Both are fixed by step 11 and both must be covered by a test.
2. **Colon filenames.** `hasUnsafePathForm` (`pathConfinement.ts:196-202`) rejects any colon that is not a Windows drive colon. Legal on macOS/Linux. Pre-existing for `openPath`; **newly applies** to `openFile`/`showItemInFolder`, so a workspace file named `notes: draft.md` stops opening. Accept and note, or narrow the ADS check to Windows.
3. **Legacy attachments.** Fully mitigated by `migration_v56` except the bounded channel-conversation residual in §3.
4. **Team mode.** If `files` is not plumbed to `TeamSession`, team-mode attachments regress from rendering to not rendering. Open question O-1 — must be settled before merge.
5. **Other `openFile` callers**, all expected to pass confinement but each needs a live click: `FullPanelShell.tsx:365`, `useWorkspaceFileOps.ts:90` (workspace roots are registered lazily via `discoverWorkspaceRoots` — **verify the DB-discovery TTL doesn't cause a first-click failure**), `PreviewPanel.tsx:443`, `PDFViewer.tsx:50`.
6. **Not touched:** `resolveMessageFilePath`, the outbound strips, `bridgeAllowlist.ts`, the `fs` bridge, `confinePath`'s guard logic. No control weakened; step 11 registers two roots the app already opens by design rather than relaxing any check.

---

## 7. Open questions I could not settle

- **O-1 (must resolve before merge).** Does `ipcBridge.team.sendMessageToAgent` → `TeamSession.ts:173/219` carry `files`? `WCoreSendBox.tsx:266-271` passes `files` into the invoke, but I did not trace `teamBridge.ts` through to the `TeamSession` persistence site. If it does not, either plumb it or accept that team-mode attachments stop rendering — and say which.
- **O-2 (judgment call for Sean).** Should the marker literal keep being stripped from **left**-position text? Stripping is a content-suppression primitive a hostile model can use to hide the tail of its own reply (same defect class as `WorkflowTranscript.tsx:100`). Not stripping shows the user the suspicious raw text. I recommend keeping today's strip for this packet — it makes the diff purely subtractive on the security path — and filing the suppression question separately rather than changing two behaviours at once.
- **O-3.** `migration_v56` rewrites message rows in place. I did not check whether the desktop takes a DB backup before migrating. If it does not, a v56 bug is unrecoverable for the user's chat history — worth confirming the backup path before writing a data migration rather than a schema one.
