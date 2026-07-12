/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';
import { homedir } from 'node:os';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { app, dialog } from 'electron';
import type { ImportSummary, ImportItemResult } from '@/common/adapter/ipcBridge';
import { ipcBridge } from '@/common';
import { exportAssistantToSkillMd } from '@process/services/skills/agentProfileExport';
import { SkillGuard } from '@process/services/skills/SkillGuard';
import { SkillLibrary } from '@process/services/skills/SkillLibrary';
import { SkillImport, type ImportResult } from '@process/services/skills/SkillImport';
import { SkillQuarantine } from '@process/services/skills/SkillQuarantine';
import { importAgentProfile } from '@process/services/skills/agentProfileImport';
import { parseFrontmatter } from '@process/task/AcpSkillManager';
import { ProcessConfig, getAssistantsDir } from '@process/utils/initStorage';
import { loadTeamSkills } from '@process/extensions/data/bundle-vendored/teamSkillMerge';
import { loadCliSkills } from '@process/services/skills/CliSkillDiscovery';
import { getDatabase } from '@process/services/database';

/** Emit a scan-progress tick to the renderer every N swept skills. */
const SCAN_PROGRESS_EVERY = 10;

/** Filesystem-safe base name for an exported file (#512). */
function exportFileSlug(name: string): string {
  const slug = (name || 'export')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'export';
}

/**
 * Run the batched library sweep, streaming progress to the renderer every
 * {@link SCAN_PROGRESS_EVERY} skills plus a final `done === total` tick - so a
 * 1,900-skill scan reads as "Scanning 640 / 1,900", not an indeterminate
 * spinner.
 */
function runLibrarySweep(): Promise<{ rescanned: number }> {
  return SkillLibrary.getInstance().rescanStale({
    onProgress: ({ done, total, currentName }) => {
      if (done % SCAN_PROGRESS_EVERY === 0 || done === total) {
        ipcBridge.skills.scanProgress.emit({ done, total, currentName });
      }
    },
  });
}

export function initSkillsBridge(): void {
  // Register the waylandteams bundle's 88 curated skills as the second
  // source on the Skills page (alongside the 1,965 vendored library
  // skills). Runs once per process, fail-soft when the bundle isn't on
  // disk (e.g. packaged build with no team install).
  loadTeamSkills();
  // Opt-in CLI skill discovery (~/.claude/skills, ~/.codex/skills,
  // ~/.gemini/skills). Default off - gated on the
  // `skills.cliDiscovery.enabled` config flag. Async-fire-and-forget
  // because each root requires fs I/O; we don't block boot waiting.
  void loadCliSkills();
  ipcBridge.skills.scan.provider(async ({ name }) => {
    const lib = SkillLibrary.getInstance();
    return lib.rescanIfStale(name) ?? null;
  });

  ipcBridge.skills.getReport.provider(async ({ name }) => {
    const lib = SkillLibrary.getInstance();
    const entry = await lib.get(name);
    return entry?.security ?? null;
  });

  // Regex-only, scannerVersion-gated library sweep (C4). Both the legacy
  // rescanAll IPC and the manual "Scan library" action delegate to the same
  // batched SkillLibrary.rescanStale so there is one code path and one gate.
  ipcBridge.skills.rescanAll.provider(async () => runLibrarySweep());
  ipcBridge.skills.scanLibrary.provider(async () => runLibrarySweep());

  const importer = new SkillImport();

  ipcBridge.skills.import.folder.provider(async ({ srcPath }) => importer.importFolder(srcPath));
  ipcBridge.skills.import.git.provider(async ({ url }) => importer.importGit(url));
  ipcBridge.skills.import.zip.provider(async ({ zipPath }) => importer.importZip(zipPath));
  ipcBridge.skills.import.singleSkillMd.provider(async ({ srcPath }) => importer.importSingleSkillMd(srcPath));

  // #512: credential-redacted export of an assistant to a portable agent-profile
  // SKILL.md. The credential boundary is exportAssistantToSkillMd (allowlist); the
  // system prompt is additionally secret-masked. Round-trips through the importer.
  ipcBridge.dataExport.assistant.provider(async ({ id }) => {
    try {
      const assistants = (await ProcessConfig.get('assistants')) ?? [];
      const custom = (await ProcessConfig.get('acp.customAgents')) ?? [];
      const assistant = [...assistants, ...custom].find((a) => a.id === id);
      if (!assistant) return { ok: false, error: 'Assistant not found' };

      // The rule file is the edit source of truth for the system prompt; fall
      // back to the in-config context for a preset with no rule file on disk.
      let systemPrompt = assistant.context ?? '';
      try {
        systemPrompt = await readFile(path.join(getAssistantsDir(), `${id}.en-US.md`), 'utf-8');
      } catch {
        // no rule file — use config context
      }

      const { content, redacted } = exportAssistantToSkillMd(assistant, systemPrompt, {
        appVersion: app.getVersion(),
        exportedAt: new Date().toISOString(),
      });

      const result = await dialog.showSaveDialog({
        title: 'Export assistant',
        defaultPath: `${exportFileSlug(assistant.name)}.SKILL.md`,
        filters: [{ name: 'SKILL.md', extensions: ['md'] }],
      });
      if (result.canceled || !result.filePath) return { ok: true, canceled: true };
      await writeFile(result.filePath, content, 'utf-8');
      return { ok: true, path: result.filePath, redacted };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // C3: register a previously-swept, user-approved `review` skill. Idempotent
  // and replay-safe (keyed by the imported on-disk path + the contentHash the
  // user actually approved). See SkillImport.confirmImport.
  ipcBridge.skills.confirmImport.provider(async ({ name, destPath, contentHash }) =>
    importer.confirmImport({ name, destPath, contentHash })
  );

  // ---------------------------------------------------------------------------
  // Type-aware import (Assistants + Workflows)
  // ---------------------------------------------------------------------------
  // Reuse the hardened SkillImport pipeline, then route each registered entry
  // by its frontmatter `type:`. Workflows/skills are already in SkillLibrary
  // (importer registers them under the parsed type); agent-profiles must be
  // written into the custom-assistant store - the SkillLibrary type filter
  // does NOT surface them on the Assistants page.
  const dispatchImport = async (result: ImportResult): Promise<ImportSummary> => {
    const items: ImportItemResult[] = [];

    for (const entry of result.imported) {
      // C3: a `review` entry is HELD (registered:false) pending explicit
      // consent - do not silently activate it as an assistant. It is still
      // reported so the caller can surface the verdict.
      if (!entry.registered) {
        items.push({ name: entry.name, registeredAs: entry.type, verdict: entry.report.verdict });
        continue;
      }
      if (entry.type === 'agent-profile') {
        const parsed = parseFrontmatter(entry.body);
        const name = parsed?.name ?? entry.name;
        // Sequential by design: each call read-modify-writes the same
        // ConfigStorage('assistants') array, so parallelizing would drop
        // writes. A single import batch is tiny, so the cost is negligible.
        // oxlint-disable-next-line no-await-in-loop
        const imported = await importAgentProfile({ name, description: parsed?.description }, entry.body, {
          getAssistants: async () => (await ProcessConfig.get('assistants')) ?? [],
          setAssistants: async (next) => {
            await ProcessConfig.set('assistants', next);
          },
          writeRule: async (assistantId, content) => {
            await mkdir(getAssistantsDir(), { recursive: true });
            await writeFile(path.join(getAssistantsDir(), `${assistantId}.en-US.md`), content, 'utf-8');
          },
          now: Date.now,
        });
        items.push({
          name: entry.name,
          registeredAs: 'agent-profile',
          verdict: entry.report.verdict,
          ...(imported ? { assistantId: imported.id } : {}),
        });
      } else {
        items.push({ name: entry.name, registeredAs: entry.type, verdict: entry.report.verdict });
      }
    }

    return { items, quarantined: result.quarantined, warnings: result.warnings };
  };

  ipcBridge.imports.folder.provider(async ({ srcPath }) => dispatchImport(await importer.importFolder(srcPath)));
  ipcBridge.imports.git.provider(async ({ url }) => dispatchImport(await importer.importGit(url)));
  ipcBridge.imports.singleSkillMd.provider(async ({ srcPath }) =>
    dispatchImport(await importer.importSingleSkillMd(srcPath))
  );

  ipcBridge.skills.list.provider(async (req) => {
    // Default to `type: 'skill'` so the existing Skills page (which invokes
    // with no args) sees only the 1,965 + 88 + N skills. Workflows page
    // calls with `{ type: 'workflow' }`; agent-profiles never surface
    // via this IPC (they're merged into Workspace > Assistants).
    const lib = SkillLibrary.getInstance();
    return lib.list({ type: req?.type ?? 'skill' });
  });

  ipcBridge.skills.suggest.provider(async ({ query, limit }) => {
    const { retrieveSkillSuggestions } = await import('@process/task/agentUtils');
    return retrieveSkillSuggestions(query, limit ?? 2);
  });

  ipcBridge.skills.stats.provider(async () => {
    // Stats must mirror the list filter so the four health cards count the
    // same set the user is browsing. Otherwise the page shows e.g.
    // "2,105 skills" while the row list has 1,973.
    const lib = SkillLibrary.getInstance();
    return lib.stats({ type: 'skill' });
  });

  // CLI skill discovery flag (default off; restart required to take effect).
  ipcBridge.skills.getCliDiscoveryEnabled.provider(async () => {
    return (await ProcessConfig.get('skills.cliDiscovery.enabled')) ?? false;
  });
  ipcBridge.skills.setCliDiscoveryEnabled.provider(async ({ enabled }) => {
    await ProcessConfig.set('skills.cliDiscovery.enabled', enabled);
  });

  ipcBridge.skills.getBody.provider(async ({ name }) => {
    return SkillLibrary.getInstance().loadBody(name);
  });

  ipcBridge.skills.updateBody.provider(async ({ name, body }) => {
    const lib = SkillLibrary.getInstance();
    const entry = await lib.get(name);
    if (!entry) {
      return { ok: false, error: 'not-found' };
    }
    // Only user-authored / imported skills live in a writable path. Bundled
    // library, team, and cli-discovered skills are read-only.
    if (entry.source !== 'user' && entry.source !== 'imported') {
      return { ok: false, error: 'read-only' };
    }
    if (!entry.path || !path.isAbsolute(entry.path)) {
      return { ok: false, error: 'no-writable-path' };
    }
    // Re-scan before writing - never persist a body that fails the guard.
    const [report] = await SkillGuard.scan(
      [{ name: entry.name, body, description: entry.description ?? '', tags: entry.metadata.tags ?? [] }],
      { llm: true }
    );
    if (report.verdict === 'blocked') {
      return { ok: false, error: 'blocked' };
    }
    await writeFile(entry.path, body, 'utf-8');
    lib.registerSource([{ ...entry, security: report }]);
    return { ok: true, verdict: report.verdict };
  });

  ipcBridge.skills.setPinned.provider(async ({ name, pinned }) => {
    const prefs = (await ProcessConfig.get('skills.preferences')) ?? { pinned: [], disabled: [], revision: 0 };
    const current = prefs.pinned ?? [];
    const next = pinned ? [...new Set([...current, name])] : current.filter((n) => n !== name);
    await ProcessConfig.set('skills.preferences', {
      pinned: next,
      disabled: prefs.disabled ?? [],
      revision: (prefs.revision ?? 0) + 1,
    });
  });

  ipcBridge.skills.getPinned.provider(async () => {
    const prefs = await ProcessConfig.get('skills.preferences');
    return prefs?.pinned ?? [];
  });

  ipcBridge.skills.addToConversation.provider(async ({ conversationId, name }) => {
    const lib = SkillLibrary.getInstance();
    const entry = await lib.get(name);
    if (!entry) return { ok: false, error: 'not-found' };
    if (entry.security?.verdict === 'blocked') return { ok: false, error: 'blocked' };
    try {
      const db = await getDatabase();
      const res = db.getConversation(conversationId);
      if (!res.success || !res.data) return { ok: false, error: 'conversation-not-found' };
      const conversation = res.data;
      const extra = (conversation.extra ?? {}) as {
        sessionSkills?: string[];
        loadedSkills?: Array<{ name: string; description: string }>;
      };
      const sessionSkills = new Set(extra.sessionSkills ?? []);
      sessionSkills.add(name);
      const loaded = extra.loadedSkills ?? [];
      const updatedExtra = {
        ...conversation.extra,
        sessionSkills: Array.from(sessionSkills),
        loadedSkills: loaded.some((s) => s.name === name)
          ? loaded
          : [...loaded, { name, description: entry.description ?? '' }],
      };
      db.updateConversation(conversationId, { extra: updatedExtra } as Partial<typeof conversation>);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'failed' };
    }
  });

  // ---------------------------------------------------------------------------
  // Skill builder
  // ---------------------------------------------------------------------------

  ipcBridge.skills.build.draft.provider(async ({ description }) => {
    // TODO: replace with a real model call to generate a SKILL.md from the description.
    // The stub returns a minimal valid template so the UI can bootstrap the Write tab.
    const skillMd = [
      '# new-skill',
      '',
      `> ${description}`,
      '',
      '## Use when',
      '',
      '- (fill in)',
      '',
      '## Do NOT use when',
      '',
      '- (fill in)',
      '',
      '## Instructions',
      '',
      description,
    ].join('\n');
    return { skillMd };
  });

  ipcBridge.skills.save.provider(async ({ name, description, category, tags, body, type }) => {
    const kebab = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // C3: scan BEFORE writing. The previous flow wrote the body to
    // ~/.wayland/skills/<name>/SKILL.md, scanned it, and only skipped the
    // SkillLibrary registration when blocked - leaving the body permanently
    // on the user's filesystem. Now the body never lands in the live skills
    // tree until the verdict is known. Blocked content goes straight to
    // ~/.wayland/skills/.quarantine/<name>/SKILL.md instead.
    const [report] = await SkillGuard.scan([{ name: kebab, body, description, tags }], { llm: true });

    if (report.verdict === 'blocked') {
      const quarantinedAt = await SkillQuarantine.quarantineFromMemory({ name: kebab, body });
      return { name: kebab, verdict: report.verdict, quarantinedAt };
    }

    const destDir = path.join(homedir(), '.wayland', 'skills', kebab);
    await mkdir(destDir, { recursive: true });
    const destFile = path.join(destDir, 'SKILL.md');
    await writeFile(destFile, body, 'utf-8');

    SkillLibrary.getInstance().registerSource([
      {
        name: kebab,
        description,
        type: type ?? 'skill',
        source: 'user',
        metadata: { tags, category: category || undefined },
        path: destFile,
        security: report,
      },
    ]);

    return { name: kebab, verdict: report.verdict };
  });

  // C4: one-time library sweep on app start. The 2,054 vendored skills seed as
  // `unscanned` and nothing ever scans them, so the "verified safe" counter
  // reads 0. Run the regex-only, scannerVersion-gated sweep once, fire-and-
  // forget so it never blocks boot; after a full sweep the gate makes it a
  // no-op on subsequent launches. Failures are swallowed - a scan miss must
  // never crash startup. Streams the same scan-progress ticks as the manual
  // action so an open Skills page shows the boot sweep's progress too.
  void runLibrarySweep().catch((err) => {
    console.warn('[skillsBridge] startup library sweep failed', err);
  });
}
