/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConfigStorage } from '@/common/config/storage';
import {
  createCommand,
  deleteCommand,
  updateCommand,
  type UserSlashCommand,
  type UserSlashCommandInput,
} from '@/common/chat/slash/userCommands';
import { useCallback } from 'react';
import useSWR from 'swr';

/** SWR key for the persisted user slash command list (single source of truth). */
export const USER_SLASH_COMMANDS_SWR_KEY = 'slash.customCommands';

/**
 * Shared, reactive view of the user-defined slash commands (issue #28).
 *
 * Backed by `ConfigStorage('slash.customCommands')` through a single SWR cache
 * key, so the Slash Commands settings page (where the user authors them) and
 * the composer slash menu stay in sync without a reload: a CRUD write persists
 * then revalidates the shared key, re-rendering every consumer.
 */
export function useUserSlashCommands() {
  const { data, mutate } = useSWR<UserSlashCommand[]>(USER_SLASH_COMMANDS_SWR_KEY, async () => {
    const stored = await ConfigStorage.get('slash.customCommands');
    return stored ?? [];
  });

  const commands = data ?? [];

  const persist = useCallback(
    async (next: UserSlashCommand[]) => {
      await ConfigStorage.set('slash.customCommands', next);
      // Bound mutate so every consumer of this key revalidates, including a
      // separately-mounted composer.
      await mutate(next, { revalidate: false });
    },
    [mutate]
  );

  const addCommand = useCallback(
    async (input: UserSlashCommandInput) => {
      const current = (await ConfigStorage.get('slash.customCommands')) ?? [];
      await persist(createCommand(current, input));
    },
    [persist]
  );

  const editCommand = useCallback(
    async (id: string, input: UserSlashCommandInput) => {
      const current = (await ConfigStorage.get('slash.customCommands')) ?? [];
      await persist(updateCommand(current, id, input));
    },
    [persist]
  );

  const removeCommand = useCallback(
    async (id: string) => {
      const current = (await ConfigStorage.get('slash.customCommands')) ?? [];
      await persist(deleteCommand(current, id));
    },
    [persist]
  );

  return { commands, addCommand, editCommand, removeCommand };
}
