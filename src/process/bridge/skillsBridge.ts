/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';
import { homedir } from 'node:os';
import { mkdir, writeFile } from 'node:fs/promises';
import { ipcBridge } from '@/common';
import { SkillGuard } from '@process/services/skills/SkillGuard';
import { SkillLibrary } from '@process/services/skills/SkillLibrary';
import { SkillImport } from '@process/services/skills/SkillImport';
import { SkillQuarantine } from '@process/services/skills/SkillQuarantine';
import { ProcessConfig } from '@process/utils/initStorage';
import { loadTeamSkills } from '@process/extensions/data/bundle-vendored/teamSkillMerge';
import { loadCliSkills } from '@process/services/skills/CliSkillDiscovery';
import { getDatabase } from '@process/services/database';

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

  ipcBridge.skills.rescanAll.provider(async () => {
    const lib = SkillLibrary.getInstance();
    const { SKILL_SCANNER_VERSION } = await import('@/common/types/skillTypes');
    const all = await lib.list();
    let rescanned = 0;
    for (const e of all) {
      const sv = e.security?.scannerVersion ?? 0;
      if (sv < SKILL_SCANNER_VERSION) {
        await lib.rescanIfStale(e.name);
        rescanned += 1;
      }
    }
    return { rescanned };
  });

  const importer = new SkillImport();

  ipcBridge.skills.import.folder.provider(async ({ srcPath }) => importer.importFolder(srcPath));
  ipcBridge.skills.import.git.provider(async ({ url }) => importer.importGit(url));
  ipcBridge.skills.import.zip.provider(async ({ zipPath }) => importer.importZip(zipPath));
  ipcBridge.skills.import.singleSkillMd.provider(async ({ srcPath }) => importer.importSingleSkillMd(srcPath));

  ipcBridge.skills.list.provider(async (req) => {
    // Default to `type: 'skill'` so the existing Skills page (which invokes
    // with no args) sees only the 1,965 + 88 + N skills. Workflows page
    // calls with `{ type: 'workflow' }`; agent-profiles never surface
    // via this IPC (they're merged into Workspace > Assistants).
    const lib = SkillLibrary.getInstance();
    return lib.list({ type: req?.type ?? 'skill' });
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

  ipcBridge.skills.save.provider(async ({ name, description, category, tags, body }) => {
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
        type: 'skill',
        source: 'user',
        metadata: { tags, category: category || undefined },
        path: destFile,
        security: report,
      },
    ]);

    return { name: kebab, verdict: report.verdict };
  });
}
