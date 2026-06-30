/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { IExtensionAcronym } from '@/common/adapter/ipcBridge';
import type { UserAcronym } from '@/common/chat/acronyms/userAcronyms';
import { installExtensionAcronymPrompt } from '@/renderer/utils/chat/acronymPrompt';
import { useUserAcronyms } from '@/renderer/hooks/chat/useUserAcronyms';
import { useEffect, useMemo } from 'react';
import useSWR from 'swr';

export const EXTENSION_ACRONYMS_SWR_KEY = 'extensions.acronyms';

export type ManagedAcronym = IExtensionAcronym & {
  _source: 'extension' | 'custom' | 'override';
  _userAcronymId?: string;
  _sourceId?: string;
};

function toCustomAcronym(item: UserAcronym): ManagedAcronym {
  return {
    id: item.id,
    acronym: item.acronym,
    expansion: item.expansion,
    description: item.description,
    enabled: item.enabled,
    _extensionName: 'Custom',
    _source: item.sourceId ? 'override' : 'custom',
    _userAcronymId: item.id,
    _sourceId: item.sourceId,
  };
}

export function mergeUserAcronyms(
  extensionAcronyms: readonly IExtensionAcronym[],
  userAcronyms: readonly UserAcronym[]
): ManagedAcronym[] {
  const overridesBySource = new Map(userAcronyms.filter((item) => item.sourceId).map((item) => [item.sourceId!, item]));
  const usedAcronyms = new Set<string>();
  const merged: ManagedAcronym[] = [];

  for (const extension of extensionAcronyms) {
    const override = overridesBySource.get(extension.id);
    if (override) {
      if (override.enabled !== false) {
        merged.push(toCustomAcronym(override));
        usedAcronyms.add(override.acronym.toLowerCase());
      }
      continue;
    }

    const lower = extension.acronym.toLowerCase();
    if (usedAcronyms.has(lower)) {
      continue;
    }
    merged.push({ ...extension, _source: 'extension' });
    usedAcronyms.add(lower);
  }

  for (const userAcronym of userAcronyms) {
    if (userAcronym.sourceId || userAcronym.enabled === false) {
      continue;
    }
    const lower = userAcronym.acronym.toLowerCase();
    if (usedAcronyms.has(lower)) {
      continue;
    }
    merged.push(toCustomAcronym(userAcronym));
    usedAcronyms.add(lower);
  }

  return merged.sort((a, b) => a.acronym.localeCompare(b.acronym));
}

export function useExtensionAcronyms() {
  const { data, isLoading } = useSWR<IExtensionAcronym[]>(EXTENSION_ACRONYMS_SWR_KEY, () =>
    ipcBridge.extensions.getAcronyms.invoke().catch(() => [] as IExtensionAcronym[])
  );
  const { userAcronyms } = useUserAcronyms();

  const extensionAcronyms = data ?? [];
  const acronyms = useMemo(
    () => mergeUserAcronyms(extensionAcronyms, userAcronyms),
    [extensionAcronyms, userAcronyms]
  );

  useEffect(() => {
    installExtensionAcronymPrompt(acronyms);
  }, [acronyms]);

  return { acronyms, extensionAcronyms, userAcronyms, isLoading };
}
