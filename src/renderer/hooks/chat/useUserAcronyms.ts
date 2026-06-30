/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConfigStorage } from '@/common/config/storage';
import {
  createUserAcronym,
  deleteUserAcronym,
  updateUserAcronym,
  USER_ACRONYMS_CONFIG_KEY,
  type AcronymLike,
  type UserAcronym,
  type UserAcronymInput,
} from '@/common/chat/acronyms/userAcronyms';
import { useCallback } from 'react';
import useSWR from 'swr';

export const USER_ACRONYMS_SWR_KEY = USER_ACRONYMS_CONFIG_KEY;

export function useUserAcronyms() {
  const { data, mutate } = useSWR<UserAcronym[]>(USER_ACRONYMS_SWR_KEY, async () => {
    const stored = await ConfigStorage.get(USER_ACRONYMS_CONFIG_KEY);
    return stored ?? [];
  });

  const userAcronyms = data ?? [];

  const persist = useCallback(
    async (next: UserAcronym[]) => {
      await ConfigStorage.set(USER_ACRONYMS_CONFIG_KEY, next);
      await mutate(next, { revalidate: false });
    },
    [mutate]
  );

  const addAcronym = useCallback(
    async (input: UserAcronymInput, validationExisting?: readonly AcronymLike[]) => {
      const current = (await ConfigStorage.get(USER_ACRONYMS_CONFIG_KEY)) ?? [];
      await persist(createUserAcronym(current, input, validationExisting ?? current));
    },
    [persist]
  );

  const editAcronym = useCallback(
    async (id: string, input: UserAcronymInput, validationExisting?: readonly AcronymLike[]) => {
      const current = (await ConfigStorage.get(USER_ACRONYMS_CONFIG_KEY)) ?? [];
      await persist(updateUserAcronym(current, id, input, validationExisting ?? current));
    },
    [persist]
  );

  const removeAcronym = useCallback(
    async (id: string) => {
      const current = (await ConfigStorage.get(USER_ACRONYMS_CONFIG_KEY)) ?? [];
      await persist(deleteUserAcronym(current, id));
    },
    [persist]
  );

  return { userAcronyms, addAcronym, editAcronym, removeAcronym };
}
