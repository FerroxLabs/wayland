/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { SkillLibrary } from '@process/services/skills/SkillLibrary';
import { ProcessConfig } from '@process/utils/initStorage';

export function initSkillsBridge(): void {
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

  ipcBridge.skills.list.provider(async () => {
    const lib = SkillLibrary.getInstance();
    return lib.list();
  });

  ipcBridge.skills.stats.provider(async () => {
    const lib = SkillLibrary.getInstance();
    return lib.stats();
  });

  ipcBridge.skills.setPinned.provider(async ({ name, pinned }) => {
    const prefs = (await ProcessConfig.get('skills.preferences')) ?? {};
    const current: string[] = Array.isArray(prefs.pinned) ? prefs.pinned : [];
    const next = pinned
      ? [...new Set([...current, name])]
      : current.filter((n) => n !== name);
    await ProcessConfig.set('skills.preferences', { ...prefs, pinned: next });
  });
}
