# MCP Library — Integration Handoff for Wayland CLI

**Audience:** Wayland CLI (Claude Code / Codex / Gemini / whichever agent picks this up in `~/dev/wayland/app`).
**Purpose:** Take the in-tree MCP Library scaffold from "wired but stubbed" → "actually works in the running app."
**Source of truth:** This file. Read it top to bottom before touching anything.
**Source repos:**
- `~/dev/wayland/app` (this repo — has the catalog + UI + router wiring)
- `~/dev/waylandmcp` (sibling repo — has the 4 npm-publishable Wayland MCP servers + design spec + plans)

---

## 1. Mission in one paragraph

In a previous session, the full MCP Library feature was built end-to-end across both repos (8 plans, 57 commits). The desktop app now ships a bundled 47-entry MCP catalog, three React pages (Browse / Detail / Installed) replacing the old `McpManagement` system, and a router wired to expose them. **But the install / uninstall / re-authorize actions in the UI are intentionally stubbed as P8 TODOs** because the existing `useMcpServers` hook surface didn't match what P7 was written against. Your job is to (a) verify the inherited state is intact, (b) wire those stubs to real hook calls, (c) port the design-mockup CSS so the pages look like the brand, (d) backfill content gaps the catalog implementer flagged, and (e) drive the full flow in a dev session so we know it actually works before users see it.

---

## 2. Verify the inherited state (do this FIRST)

Run all of these. Every one must report the value below. If any of them disagrees, stop and ask for help before editing anything.

```sh
cd ~/dev/wayland/app

# 1. Catalog is bundled and validates
ls src/renderer/mcp-catalog/entries/*.json | wc -l       # → 47
ls src/renderer/mcp-catalog/guides/*.md   | wc -l        # → 47
ls src/renderer/mcp-catalog/icons/*.svg   | wc -l        # → 47
bun run src/renderer/mcp-catalog/scripts/validate-catalog.ts
# expect: "All catalog files valid."

# 2. New React pages exist
ls src/renderer/pages/settings/McpLibrary/                # BrowsePage.tsx, InstalledPage.tsx, DetailPage.tsx,
                                                          # components/, hooks/, types.ts, index.ts, styles.css

# 3. Old McpManagement files are gone
grep -rln "McpManagement\|McpServerItem\|McpServerHeader\|McpServerActions\|McpServerToolsList" src/
# expect: EMPTY

# 4. Migration helper is wired into useMcpServers
grep -n "migrateExistingServers" src/renderer/hooks/mcp/useMcpServers.ts
# expect: at least one import and one call

# 5. IMcpServer record carries the new fields
grep -nA2 "source\?:" src/common/config/storage.ts
# expect: lines defining `source?: McpServerSource` and `libraryEntryId?: string`

# 6. Router has the new routes
grep -n "mcp-library\|tools/mcp" src/renderer/components/layout/Router.tsx
# expect: ≥ 4 mcp-library route lines plus a /settings/tools/mcp redirect

# 7. Tests pass for the new module
bun run vitest run tests/unit/renderer/mcp-library/
bun run vitest run tests/unit/renderer/mcp-hooks/migrateExistingServers
# expect: 17 pass total

# 8. Typecheck — only pre-existing errors should remain
bunx tsc --noEmit 2>&1 | grep -E "McpLibrary|McpManagement|McpServer" | head
# expect: EMPTY. Pre-existing errors in `validate-catalog.ts` (ajv version)
# and `ChatConversation.tsx` (workflowApplyStepMarker prop) are NOT yours.

# 9. Git log shows the wiring commits
git log --oneline 9cd68fbcd^..HEAD | grep -c "^"        # ≥ 17
git tag | grep mcp-library                              # → wayland/v0.8.0-mcp-library

# 10. PRE-EXISTING dirty state — CRITICAL
git status --short | grep -v "^?? .ijfw\|^?? ijfw/\|memory\|MemoryPage\|FullPanelShell\|ijfw" | head
# expect: EMPTY. The IJFW / memory dirty files are someone else's WIP. DO NOT
# stage or commit them under any circumstance. See §10 anti-footguns.
```

If those 10 checks all pass, the inheritance is intact. Proceed to §3.

---

## 3. What was built and where it lives

### 3.1 Catalog (`src/renderer/mcp-catalog/`)

Pure content + schemas + helper scripts:

| Path | What |
|---|---|
| `catalog.json` | Index of 47 entries sorted by `popularityRank`. Generated; don't hand-edit. |
| `entries/<id>.json` | One per MCP. Top-level is verbatim MCP Registry `server.json`; Wayland-specific fields under `x-wayland`. |
| `guides/<id>.md` | One per MCP. YAML frontmatter declares structured `steps` consumed by `SetupGuide.tsx`; body is free-form markdown. |
| `icons/<id>.svg` | 32×32 SVG per entry. Currently tasteful approximations (see §6). |
| `schema/{catalog,entry}.schema.json` | JSON schemas for both file types. |
| `scripts/build-catalog-index.ts` | Regenerates `catalog.json` from `entries/*`. Run after any entry change. |
| `scripts/validate-catalog.ts` | CI gate — validates everything against schema. |

**Filename slug convention:** reverse-DNS with dots-to-dashes. Example: `io.github.taylorwilsdon/google-workspace-mcp` → `io.github.taylorwilsdon-google-workspace-mcp.json`.

### 3.2 React UI (`src/renderer/pages/settings/McpLibrary/`)

| Path | What |
|---|---|
| `types.ts` | All TS types (`CatalogIndexEntry`, `CatalogEntry`, `SetupGuide`, `SetupStep`, `Tier`, `MaintainerType`, `AuthMethod`) |
| `hooks/useMcpLibrary.ts` | Reads bundled catalog via `import.meta.glob`; exposes `entries`, `recommended`, `byTier`, `byCategory`, `getEntry`, `getGuide`. Parses guide YAML with `js-yaml` `FAILSAFE_SCHEMA` + zod validation. |
| `components/TierBadge.tsx` | Green/blue/purple pill for Core/Worker/Builder |
| `components/MaintainerBadge.tsx` | Gold/orange/gray pill for Official/Wayland/Community |
| `components/McpCard.tsx` | The catalog card |
| `components/TierFilter.tsx` | The Core/Worker/Builder chip filter |
| `components/RecommendedGrid.tsx` | The top-6 grid on Browse |
| `components/CategorySection.tsx` | Labelled grid section |
| `components/ServerRow.tsx` | Row used in InstalledPage (status border, status pill, actions) |
| `components/SetupGuide.tsx` | Step renderer for DetailPage's Setup Guide tab |
| `BrowsePage.tsx` | Recommended top-6 + tier filters + category sections |
| `InstalledPage.tsx` | "From Library" + "Custom" groupings + status summary strip |
| `DetailPage.tsx` | Tabs (Overview / Setup Guide / Tools / Permissions / Changelog), inline OAuth field paste, primary action button |
| `styles.css` | Ported from design-mockup CSS variables (see §6 for status) |
| `index.ts` | Public exports |

### 3.3 Hook + storage extensions

| Path | Change |
|---|---|
| `src/renderer/hooks/mcp/migrateExistingServers.ts` | NEW. Idempotent: tags pre-library servers as `source: "custom"`. |
| `src/renderer/hooks/mcp/useMcpServers.ts` | Calls the migration on first read; persists the tagging. |
| `src/common/config/storage.ts` | `IMcpServer` now has `source?: McpServerSource` + `libraryEntryId?: string`. `McpServerSource` type exported. |

### 3.4 Router + nav

| Path | Change |
|---|---|
| `src/renderer/components/layout/Router.tsx` | 4 new routes: `/settings/mcp-library`, `.../browse`, `.../installed`, `.../:entryId`. Legacy `/settings/tools/mcp` redirects to `.../installed`. Old `/settings/mcp` also redirected (no longer exists as a page). |
| `src/renderer/pages/settings/components/SettingsSider.tsx` | Settings sidebar now shows a single "MCP Library" item. |
| `src/renderer/pages/settings/components/SettingsPageWrapper.tsx` | Page-mode wrapper mirrored the same change. |
| `src/renderer/components/settings/shared/CommandPalette/searchEntries.ts` | Three new command palette entries: Library — Browse, Library — Installed, Add custom MCP. Legacy `mcp` anchor remapped to `mcp-library`. |
| `src/renderer/components/settings/SettingsModal/contents/ToolsModalContent.tsx` | The previous ~295-line inline MCP CRUD section was replaced with a CTA (`ModalMcpLibraryLinkSection`) that navigates to `/settings/mcp-library/installed`. |

### 3.5 The 4 Wayland-built MCP server packages (sibling repo `~/dev/waylandmcp`)

These are NOT in this repo. They are independent npm packages that the catalog references by `@wayland/*` name. They are tagged `v0.1.0` locally but **not yet published to npm**. Until they are published, any catalog entry that points at them (Apple Ecosystem, Generic IMAP, Cal.com Scheduling, News & RSS) will fail to install for end users. See §8.

| Package | Tools | Path |
|---|---|---|
| `@wayland/apple-mcp` | 23 (Notes/Reminders/Mail/Calendar/Maps/Photos) | `~/dev/waylandmcp/packages/apple-mcp/` |
| `@wayland/imap-mcp` | 12 (Mailbox/Messages/Send/Manage/Attachments) | `~/dev/waylandmcp/packages/imap-mcp/` |
| `@wayland/cal-com-mcp` | 8 (Event Types/Bookings/Availability/Attendees) | `~/dev/waylandmcp/packages/cal-com-mcp/` |
| `@wayland/news-mcp` | 5 (NewsAPI/HN/RSS) | `~/dev/waylandmcp/packages/news-mcp/` |

---

## 4. Integration work — ordered tasks

Each task has a short rationale, exact file targets, an acceptance check, and an explicit commit message.

### TASK A — Connect DetailPage's Install button to `useMcpServers`

**Why:** `DetailPage.tsx`'s `install` function is currently a stub with a `// P8 TODO` comment. Clicking Install on a catalog entry does nothing.

**Where:**
- `src/renderer/pages/settings/McpLibrary/DetailPage.tsx` — find the `install` function (likely near a `// P8 TODO` comment).
- `src/renderer/hooks/mcp/useMcpServers.ts` — find the real "add server" mutation. (Hint: `useMcpServerCRUD.ts` is the CRUD facade, may also be relevant.)

**What to do:**

1. Read `src/renderer/hooks/mcp/useMcpServers.ts` AND `src/renderer/hooks/mcp/useMcpServerCRUD.ts`. Identify the canonical write path. The hook surface that P7 was written against assumed `mcpServers.addServer({...})`; the real surface may instead use `useMcpServerCRUD()` returning a function like `createServer` or `saveServer` that takes a different shape.

2. Compose a real `install(entry, envValues)` function:

   ```ts
   // sketch — adapt to your real CRUD signature
   const crud = useMcpServerCRUD();

   async function install(entry: CatalogEntry, envValues: Record<string, string>) {
     const pkg = entry.packages?.[0];
     const remote = entry.remotes?.[0];
     if (!pkg && !remote) throw new Error(`Entry ${entry.name} has no installable target.`);

     const record: Partial<IMcpServer> = pkg
       ? {
           id: entry.name,
           name: entry.title,
           transport: { type: "stdio" },
           command: pkg.runtimeHint,                   // "npx" | "uvx" | "docker" | "native"
           args: [pkg.identifier],
           env: envValues,
           source: "library",
           libraryEntryId: entry.name,
         }
       : {
           id: entry.name,
           name: entry.title,
           transport: { type: remote!.type as any, url: remote!.url },
           source: "library",
           libraryEntryId: entry.name,
         };

     await crud.createServer(record);                  // adapt to actual function name
   }
   ```

3. Wire `install` to the existing `onClick` on the big "Install" button in DetailPage. Also wire `SetupGuide`'s `onPrimary(action)` so `action === "oauth-flow"` triggers `useMcpOAuth().login(entry.name)` (or whatever the existing OAuth-start function is called — check `useMcpOAuth.ts`).

4. Add a `useMcpServers()` selector to compute `installed: boolean` for the current entry, so the button toggles to "Installed" once persisted.

**Acceptance:**
- Click Install on the **Brave Search** entry (api-key auth, no OAuth, simplest case). After completing the setup-guide step that takes the env vars, the server appears in `~/.wayland/mcp.json` (or wherever `useMcpServers` persists) with `source: "library"` and `libraryEntryId: "com.brave/brave-search-mcp"`.
- Navigating to `/settings/mcp-library/installed` shows the new entry under the **From Library** group.
- The Install button now reads "Installed" and is disabled.

**Commit:** `MCP Library: wire DetailPage install to real useMcpServerCRUD`

---

### TASK B — Connect InstalledPage actions to existing CRUD/OAuth/status hooks

**Why:** `InstalledPage.tsx`'s per-row callbacks (`onReauth`, `onSettings`, `onLogs`, `onRemove`, `onToggle`) are stubs.

**Where:**
- `src/renderer/pages/settings/McpLibrary/InstalledPage.tsx`
- `src/renderer/pages/settings/McpLibrary/components/ServerRow.tsx`
- The existing MCP hook surface:
  - `useMcpServers()` for the list of records
  - `useMcpServerCRUD()` for create/update/delete/toggle
  - `useMcpOAuth()` for `login`/`logout`/expiration state
  - `useMcpAgentStatus()` for live `running` / `error` / `stopped` per server
  - `useMcpConnection()` for the IPC-level lifecycle

**What to do:**

1. Replace each stub with the real call from the appropriate hook. Specifically:

   ```ts
   const crud = useMcpServerCRUD();
   const oauth = useMcpOAuth();
   const status = useMcpAgentStatus();

   const onToggle  = (id: string) => crud.toggleEnabled(id);    // adapt name
   const onReauth  = (id: string) => oauth.login(id);
   const onSettings = (id: string) => crud.openEdit(id);        // or open modal
   const onLogs    = (id: string) => crud.viewLogs(id);         // may not exist; open log viewer modal
   const onRemove  = (id: string) => crud.deleteServer(id);
   ```

2. Map the existing status hook to the 4-state `running | warn | error | stopped` model the UI expects:
   - `useMcpAgentStatus.get(id) === "running"` → `running`
   - `useMcpOAuth.statusFor?.(id) === "expired"` → `warn`
   - `useMcpAgentStatus.get(id) === "error"` → `error`
   - everything else → `stopped`

3. Pipe the `status summary strip` numbers (Running / Needs re-auth / Error / Tools available) from the same hook outputs. Don't recompute — read from the source.

**Acceptance:**
- A running library server shows green left border, "Running" pill, working toggle.
- An expired-OAuth server shows orange left border, "OAuth expired" pill, "Re-authorize" button that triggers the existing OAuth flow.
- Remove deletes the row immediately and removes from `mcp.json`.
- The status summary strip's numbers match reality.

**Commit:** `MCP Library: wire InstalledPage row actions to real CRUD/OAuth/status hooks`

---

### TASK C — Verify the migration runs and is correct

**Why:** P8 wired `migrateExistingServers` into `useMcpServers`, but it hasn't been exercised against a real saved `mcp.json` with pre-existing entries. We need to confirm pre-existing user servers persist and pick up `source: "custom"`.

**Where:**
- `src/renderer/hooks/mcp/useMcpServers.ts`
- `src/renderer/hooks/mcp/migrateExistingServers.ts`
- `tests/unit/renderer/mcp-hooks/migrateExistingServers.dom.test.ts` (already has 3 unit tests — passing)

**What to do:**

1. Manually create a fake `~/.wayland/mcp.json` (or wherever the app persists — verify the path by reading `useMcpServers.ts`) with at least one entry missing `source`. Example:

   ```json
   {
     "servers": [
       {
         "id": "old-pg",
         "name": "Local Postgres",
         "command": "uvx",
         "args": ["postgres-mcp"],
         "env": { "DATABASE_URL": "postgres://localhost/test" },
         "transport": { "type": "stdio" }
       }
     ]
   }
   ```

2. Run the app (`bun start`), navigate to `/settings/mcp-library/installed`. The Custom group must show "old-pg" exactly once with full fields intact.

3. Quit the app. Re-read the persisted file. The entry should now carry `"source": "custom"`. (This is the idempotency proof — the migration only writes back if a change was made.)

4. Repeat the launch. The file should NOT be rewritten on re-launch (no diff). Add a temporary `console.log` in `useMcpServers` to confirm if needed, then remove before committing.

**Acceptance:**
- One existing record → tagged once → no re-write on subsequent launches.
- Records with existing `source: "library"` (added via Task A) are not re-tagged.

**Commit:** `MCP Library: verify migration is idempotent against real mcp.json` (or skip if no code change — record findings in PR description).

---

### TASK D — Port the design-mockup CSS into `styles.css`

**Why:** P7's `styles.css` is a placeholder/minimal port. The pages may render with default browser styles for things not covered. The mockups define the full visual treatment — dark theme, brand orange accents, tier color tokens, card hover states.

**Where:**
- Reference: `~/dev/waylandmcp/design-mockups/library-page.html` `<style>` block (the canonical visual)
- Also: `~/dev/waylandmcp/design-mockups/library-detail.html` (detail page tokens)
- Also: `~/dev/waylandmcp/design-mockups/installed-servers.html` (status strip + server row)
- Target: `src/renderer/pages/settings/McpLibrary/styles.css`

**What to do:**

1. Copy the `:root` CSS variable block from `library-page.html` verbatim — those are the canonical Wayland tokens. Wrap them in a `.mcp-library-page, .mcp-detail-page, .mcp-installed-page` selector so they're scoped to the feature and don't leak into other settings pages.

2. Port the card / grid / tier-badge / maintainer-badge / status-pill rules. The HTML mockups use class names like `.mcp-card`, `.mcp-rec-grid`, `.tag.tier-core` — the React components also use these prefixes, so the rules transfer directly.

3. **Brand discipline (saved as memory `feedback-brand-palette-discipline`):** stopped/idle states get NO chromatic accent. Only `running` (green), `warn` (brand orange), `error` (red) get colored left borders. Don't introduce extra accent colors.

4. The Wayland orbit-mark SVG (3 arcs + 3 dots in `#ff6b35`) should appear in the page header if there's a brand-mark slot. Reference: `~/dev/waylandmcp/design-mockups/library-page.html` lines containing `class="brand-mark"`.

5. Verify the layout end-to-end on three viewport widths: 1440 (desktop), 1280, 960.

**Acceptance:**
- `/settings/mcp-library/browse` visually matches `library-page.html` rendered at 1440px wide.
- `/settings/mcp-library/<some-id>` visually matches `library-detail.html`.
- `/settings/mcp-library/installed` visually matches `installed-servers.html`.

**Commit:** `MCP Library: port design-mockup CSS into styles.css`

---

### TASK E — Refine the catalog placeholders the P6 implementer flagged

The catalog content is complete but the content writer flagged five categories of placeholder data. These don't block the UI rendering, but they MUST be corrected before users hit "Install" on those entries.

**Where:** `src/renderer/mcp-catalog/entries/*.json` and `src/renderer/mcp-catalog/guides/*.md`

**What to do:**

For EACH category below, do the work, then run `bun run src/renderer/mcp-catalog/scripts/build-catalog-index.ts && bun run src/renderer/mcp-catalog/scripts/validate-catalog.ts`. Both must pass.

1. **Real hosted MCP URLs.** Open each entry that has `remotes[].url`. The current values follow patterns like `https://mcp.<vendor>.com` and are educated guesses. Look up the actual URL each vendor publishes:
   - GitHub: `https://api.githubcopilot.com/mcp/`
   - Sentry: `https://mcp.sentry.dev/mcp`
   - Linear: `https://mcp.linear.app/sse`
   - Atlassian: `https://mcp.atlassian.com/v1/mcp`
   - Notion: `https://mcp.notion.com/mcp`
   - Stripe: `https://mcp.stripe.com`
   - Vercel: `https://mcp.vercel.com`
   - Supabase: (uses OAuth DCR + remote endpoint — check `supabase-community/supabase-mcp`)
   - Cloudflare: 13 separate endpoints — check `developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/`
   - Slack: official MCP — check `docs.slack.dev/ai/slack-mcp-server`
   - Asana V2, ClickUp, Monday, Calendly, HubSpot, Salesforce, Zoom — check each vendor's MCP docs
   - Cross-reference: `https://registry.modelcontextprotocol.io/` for canonical URLs

2. **Pin real npm/PyPI package versions.** Most entries have `"version": "1.0.0"` or `"0.1.0"` placeholders. For each entry with a `packages[]` array, look up the latest release and pin it. For npm: `npm view <pkg> version`. For uvx: `pip index versions <pkg>`.

3. **Real OAuth scope strings.** Each entry with `auth.scopes[]` has scopes derived from public docs. Verify they match exactly what each vendor's MCP server requests during the OAuth flow. (You can derive this by running each MCP server once in a sandbox and capturing the `Authorize` redirect URL's `scope=` parameter.) For each scope, also confirm the `plainLanguage` description is accurate — that text is what end users see during the BYO-OAuth setup flow.

4. **Icons.** The 47 SVGs in `icons/` are minimal hand-drawn approximations (geometric shapes in brand colors). Pull real vendor SVG logos from each vendor's brand asset page where possible. For the 4 Wayland-built MCPs, use Lucide icons (`mountain` for apple, `mail` for imap, `calendar-days` for cal-com, `newspaper` for news) on the Wayland orange-gradient tile (`linear-gradient(135deg, rgba(255,107,53,0.18), rgba(255,107,53,0.05))`).

5. **`popularityRank` gap.** Rank 7 is intentionally absent in the current catalog (cosmetic, not blocking). When you update entries, you may compact the ordering. Just keep the ordering monotonic.

**Acceptance:**
- Every `remotes[].url` is verifiable by hitting it with `curl -I` (expect 200/401/405 — anything but DNS failure).
- Every `packages[].version` matches an actual released version.
- Validation script still passes.

**Commit each category separately:**
- `MCP Library: pin real hosted MCP URLs across catalog`
- `MCP Library: pin real npm/PyPI package versions in catalog`
- `MCP Library: verify OAuth scopes against vendor MCP docs`
- `MCP Library: replace placeholder icons with vendor brand SVGs`

---

### TASK F — Drive the full flow in a dev session

**Why:** Tests verify components in isolation. Nothing has yet exercised the full Browse → Install → Setup Guide → Authorize → Tool-Listed path against the running app.

**What to do:**

1. Start the dev server:
   ```sh
   cd ~/dev/wayland/app
   bun start          # electron-vite dev
   ```

2. Open the app. Navigate to **Settings → MCP Library**.

3. **Browse smoke test:**
   - The Recommended row shows 6 cards with Google Workspace at #1.
   - At least 4 category sections render (Communication, Productivity & Knowledge, Developer Tools, Search & Web).
   - Tier filter chips show counts: All / Core 12 / Worker 18 / Builder 17.
   - Search input filters live as you type.

4. **Install flow smoke test (Brave Search — simplest, just an API key):**
   - Click the Brave Search card.
   - DetailPage opens; Setup Guide tab is active.
   - Step 1 ("Install the MCP server") is auto-checked.
   - Step 2 ("Paste your Brave API key") shows a single env-var input.
   - Paste a fake key. Click "Sign in" / "Done." (Adjust based on what the primary action says for `api-key` auth.)
   - Server is added to `mcp.json`. Tab "Tools" shows the registered tool count.
   - Navigating to Installed tab: Brave Search appears under "From Library."

5. **OAuth flow smoke test (Notion or Linear — hosted MCP with OAuth):**
   - Click Notion. DetailPage shows the 2-step guide: install + "Sign in with Notion."
   - Click "Sign in with Notion." The existing OAuth flow opens a browser tab.
   - Complete OAuth in browser. Tab redirects back to Wayland.
   - InstalledPage now shows Notion as Running.

6. **Migration smoke test:** Confirm any pre-existing user MCPs still appear under "Custom" (Task C above).

7. **Legacy route test:** In the URL bar (DevTools), navigate to `/settings/tools/mcp` (the old path). It should redirect to `/settings/mcp-library/installed`.

8. **Command palette test:** Hit ⌘K (or Ctrl+K). Search "mcp library" — three entries (Browse / Installed / Add custom) should surface.

If anything in 3–8 fails, file it as a follow-up task and fix before declaring done.

**Acceptance:** Each step above works end-to-end on a fresh user profile.

**Commit:** Whatever specific fixes the smoke uncovers. May be none.

---

### TASK G — Visual review against the mockups

After Task D's CSS port and Task F's smoke, do a visual review pass.

**Reference files:**
- `~/dev/waylandmcp/design-mockups/library-page.html`
- `~/dev/waylandmcp/design-mockups/library-detail.html`
- `~/dev/waylandmcp/design-mockups/installed-servers.html`

**What to check:**

- Page background `#0d0d0d`; cards `#161616`; borders `#232323` / `#262626`; text primary `#f0f0f0`.
- Brand orange `#ff6b35` appears only on: brand mark, Recommended star icon, "Built by Wayland" maintainer pill, "Wayland verified" tick, primary CTA buttons, hover borders on Wayland-built cards.
- Tier badges: Core green `#4ade80`, Worker blue `#60a5fa`, Builder purple `#a78bfa`. Used in small pills with low-opacity background tint.
- Inter font, weights 400/500/600/700. JetBrains Mono for the publisher line and code blocks.
- Lucide icons throughout — never emoji.
- 8px rounded corners on cards; 10px on category sections; 12px on Recommended cards.
- Status pill green dot has a subtle glow (`box-shadow: 0 0 6px rgba(74,222,128,0.6)`).
- Stopped servers have NO left border (per the brand-palette discipline saved as memory).

Anything off-brand: fix in `styles.css`.

**Commit:** `MCP Library: visual polish — align to design mockups`

---

## 5. The four Wayland-built MCP servers — publish to npm

The sibling repo `~/dev/waylandmcp` holds four packages tagged `v0.1.0`. Until they're published, the catalog entries that reference `@wayland/*` cannot install for end users.

```sh
cd ~/dev/waylandmcp

# Pre-publish gate
bun install                # confirm clean
bun test                   # 65 pass
bun run typecheck          # all clean

# Build each
cd packages/imap-mcp && bun run build && cd ../..
cd packages/news-mcp && bun run build && cd ../..
cd packages/cal-com-mcp && bun run build && cd ../..
cd packages/apple-mcp && bun run build && cd ../..   # macOS only — produces dist/eventkit-bridge

# Publish (requires npm login as a maintainer of @wayland)
cd packages/imap-mcp && npm publish --access public && cd ../..
cd packages/news-mcp && npm publish --access public && cd ../..
cd packages/cal-com-mcp && npm publish --access public && cd ../..
cd packages/apple-mcp && npm publish --access public && cd ../..
```

**Caveats:**
- `@wayland/apple-mcp` declares `os: ["darwin"]`. Publishing from a non-macOS host won't build the Swift binary — publish from a Mac.
- The `@wayland` npm scope must be reserved by TradeCanyon first. If it isn't, register at https://www.npmjs.com/org/wayland.
- After publishing, push the tags upstream: `git push --tags`.

**Post-publish in this repo:** Update the affected catalog entries' `packages[].version` to whatever npm now serves. Run validate again. Commit.

---

## 6. Known gaps and stubs (full list)

Cross-reference with §4. Each item below is either explicitly an integration task or a content polish item.

| # | File | What | Severity | Task |
|---|---|---|---|---|
| 1 | `DetailPage.tsx` install action | Stub — no real CRUD call | **Blocking** | A |
| 2 | `InstalledPage.tsx` row actions | Stubs — toggle/reauth/edit/logs/remove no-op | **Blocking** | B |
| 3 | `styles.css` | Minimal/placeholder rules | **Blocking** (visual) | D |
| 4 | `catalog/entries/*.json` `remotes[].url` | Pattern-guessed URLs | **Blocking before install** | E.1 |
| 5 | `catalog/entries/*.json` `packages[].version` | Placeholder versions | **Blocking before install** | E.2 |
| 6 | `catalog/entries/*.json` `auth.scopes[]` | Names from docs, not verified against MCP | Medium | E.3 |
| 7 | `catalog/icons/*.svg` | Geometric approximations | Cosmetic | E.4 |
| 8 | `catalog.json` popularityRank gap (rank 7) | Cosmetic | Low | E.5 |
| 9 | `@wayland/*` packages not on npm | The 4 catalog entries can't actually install | **Blocking before users see it** | §5 |
| 10 | P5 apple-mcp AppleScript files | Static text exists; bridge wired by implementer; not exercised | Medium — verify | F (smoke) |

---

## 7. Test commands quick reference

```sh
cd ~/dev/wayland/app

# All MCP-related tests in this repo
bun run vitest run tests/unit/renderer/mcp-library/ tests/unit/renderer/mcp-hooks/

# Typecheck — only pre-existing errors should remain
bunx tsc --noEmit 2>&1 | grep -vE "validate-catalog|ChatConversation" | head

# Catalog validation
bun run src/renderer/mcp-catalog/scripts/validate-catalog.ts

# Rebuild the catalog index (after editing entries)
bun run src/renderer/mcp-catalog/scripts/build-catalog-index.ts

# In the sibling repo
cd ~/dev/waylandmcp
bun test                  # 65 pass across 4 packages
bun run typecheck         # all clean
bun run --filter '*' build
```

---

## 8. Suggested PR plan

Don't bundle everything into one giant PR — it'll be unreviewable.

| PR | Scope |
|---|---|
| **#1** | Tasks A + B (real CRUD/OAuth wiring) |
| **#2** | Task C (migration verification — may be docs-only) |
| **#3** | Task D + Task G (styles + visual polish) |
| **#4** | Task E (catalog content refinements, split into 4 sub-commits) |
| **#5** | §5 (publish `@wayland/*` to npm + bump catalog versions) |
| **#6** | Smoke fixes from Task F if any |

Each PR is small and reviewable. Each lands clean to `main` and the next builds on the previous.

---

## 9. Where to find things

### Documentation
- This file: `~/dev/wayland/app/docs/MCP_LIBRARY_HANDOFF.md`
- Design spec: `~/dev/waylandmcp/docs/superpowers/specs/2026-05-27-waylandmcp-library-design.md`
- 8 plans: `~/dev/waylandmcp/docs/plans/2026-05-27-P{1..8}-*.md`
- Session handoff: `~/dev/waylandmcp/docs/HANDOFF.md`

### Design mockups (the visual source of truth)
- `~/dev/waylandmcp/design-mockups/library-page.html`
- `~/dev/waylandmcp/design-mockups/library-detail.html`
- `~/dev/waylandmcp/design-mockups/installed-servers.html`

### Locked decisions (recorded in agent memory at `~/.claude/projects/-Users-seandonahoe-dev-waylandmcp/memory/`)
- `project-oauth-strategy.md` — BYO keys with setup guides; no hosted OAuth in v1
- `project-catalog-lives-in-wayland-app.md` — Catalog is bundled, not hosted
- `feedback-brand-palette-discipline.md` — Restrained accents (orange + grays + green/red); no Vercel-style rainbows

---

## 10. Anti-footguns — don't do these

### 10.1 Don't touch the pre-existing IJFW / memory dirty state

When you `cd ~/dev/wayland/app && git status`, you'll see ~100 modified/deleted files in `src/process/services/{memory,import,ijfw}/`, `src/renderer/pages/memory/`, `src/common/types/memory.ts`, `ijfw/`, etc. **None of that is yours.** It's an in-flight IJFW workstream from another contributor. If you `git add .` or `git commit -a` you will hijack their work and corrupt their branch.

**Always use specific paths:**
```sh
git add src/renderer/pages/settings/McpLibrary/
git add src/renderer/mcp-catalog/
git add src/renderer/hooks/mcp/migrateExistingServers.ts
git add src/renderer/hooks/mcp/useMcpServers.ts
git add src/renderer/components/layout/Router.tsx
git add src/renderer/pages/settings/components/SettingsSider.tsx
git add src/renderer/pages/settings/components/SettingsPageWrapper.tsx
git add src/renderer/components/settings/shared/CommandPalette/searchEntries.ts
git add src/renderer/components/settings/SettingsModal/contents/ToolsModalContent.tsx
git add src/common/config/storage.ts
git add tests/unit/renderer/mcp-library/
git add tests/unit/renderer/mcp-hooks/
git add docs/MCP_LIBRARY_HANDOFF.md
git add styles.css
# Never `git add .` in this repo until that IJFW work has landed.
```

### 10.2 Don't restore deleted McpManagement files

Some old code paths may still reference them (extension manifests, archived docs, dead imports). `grep -rln` first. If you find any, delete the references — DON'T resurrect McpManagement. The catalog model is the new home.

### 10.3 Don't run `bun start` in CI

`bun start` launches Electron in dev mode. It's interactive. CI uses `bun run vitest` + `bunx tsc --noEmit` + `bun run src/renderer/mcp-catalog/scripts/validate-catalog.ts` only.

### 10.4 Don't change the tier of any catalog entry

The 47-entry tier assignment (12 Core / 18 Worker / 17 Builder) is locked design output from §5 of the design spec. Changing it requires going back through brainstorming. If a new MCP needs to be added, that's a separate proposal — the catalog isn't meant to expand piecemeal in this milestone.

### 10.5 Don't introduce additional accent colors

Per brand-palette discipline: orange (`#ff6b35`) + grays + green (running) + red (broken). Anything else is off-brand. If a status needs to be signaled, add a Lucide icon or change the existing tier color tone — don't reach for amber/cyan/teal.

### 10.6 Don't add Composio integration

It was explicitly removed from v1 design scope. There is no hosted OAuth tier. BYO keys with detailed setup guides is the contract.

### 10.7 Don't restructure the catalog schema

The schema deliberately mirrors the official MCP Registry's `server.json` plus an `x-wayland` extension. Changing the top-level structure breaks the design's "publish to upstream registry for free" property. Add Wayland-specific fields under `x-wayland.*`, never at the top level.

---

## 11. Definition of done for the milestone

The MCP Library is shippable when:

- [ ] All 7 Tasks (A–G) complete with their per-task acceptance criteria met
- [ ] `bun run vitest run tests/unit/renderer/` is green for all MCP-related test files (17+ tests)
- [ ] `bunx tsc --noEmit` shows zero new errors (pre-existing ones can remain or get a separate cleanup PR)
- [ ] `bun run src/renderer/mcp-catalog/scripts/validate-catalog.ts` passes
- [ ] 4 `@wayland/*` packages published to npm under the right scope
- [ ] One end-to-end smoke walkthrough recorded (screen recording or detailed notes) showing Browse → Install (api-key path) → Install (OAuth path) → Installed status → Re-authorize → Remove
- [ ] Wayland desktop app version bumped (e.g. `0.7.x` → `0.8.0`) and tagged
- [ ] Release notes drafted listing the new MCP Library feature with screenshots

---

## 12. If you get stuck

- The 8 implementation plans at `~/dev/waylandmcp/docs/plans/` have task-by-task code with file paths and exact commands for every step that built this feature. Re-read them to understand the original intent.
- The 3 HTML mockups in `~/dev/waylandmcp/design-mockups/` are open in a browser via `open <path>` — they're the visual contract.
- The session memory at `~/.claude/projects/-Users-seandonahoe-dev-waylandmcp/memory/` records all locked decisions and their rationale. If something feels arbitrary, the rationale is in there.
- If you can't figure out the existing MCP hook surface (the most likely blocker for Tasks A and B), the canonical surface is the one used by the now-deleted `McpManagement.tsx`. You can `git show <sha-before-deletion>:src/renderer/pages/settings/ToolsSettings/McpManagement.tsx` to see how the previous UI consumed these hooks — that's the closest reference for "how do I write to mcp.json correctly."

---

*End of handoff. Read once. Then execute Tasks A → G in order.*
