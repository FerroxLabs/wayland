/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { ipcBridge } from '@/common';
import type { TChatConversation } from '@/common/config/storage';
import ComposerAddMenu, { type ComposerUploadItem } from './ComposerAddMenu';

type Props = {
  conversationId: string;
  uploadItems: ComposerUploadItem[];
  uploading?: boolean;
  /** Current composer draft, for suggestion matching (omitted today in-chat). */
  draftText?: string;
};

/**
 * Live-mode wrapper around ComposerAddMenu for the in-chat composer. Sources
 * the builtin-skill state from the conversation: builtins come from the global
 * list, their disabled set is read from (and persisted back to)
 * conversation.extra.excludeBuiltinSkills so toggling a builtin off in-chat
 * actually excludes it on the next turn. Added skills write through
 * skills.add-to-conversation (handled inside ComposerAddMenu's live mode).
 */
const InChatComposerAddMenu: React.FC<Props> = ({ conversationId, uploadItems, uploading, draftText }) => {
  const [builtinAutoSkills, setBuiltinAutoSkills] = useState<Array<{ name: string; description: string }>>([]);
  const [disabledBuiltin, setDisabledBuiltin] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    ipcBridge.fs.listBuiltinAutoSkills
      .invoke()
      .then((list) => {
        if (!cancelled) setBuiltinAutoSkills(list ?? []);
      })
      .catch(() => {
        /* builtins just won't show if the list fails to load */
      });
    ipcBridge.conversation.get
      .invoke({ id: conversationId })
      .then((conv) => {
        if (cancelled) return;
        const excluded = (conv?.extra as { excludeBuiltinSkills?: string[] } | undefined)?.excludeBuiltinSkills ?? [];
        setDisabledBuiltin(excluded);
      })
      .catch(() => {
        /* default to none disabled if the conversation can't be read */
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  const onToggleBuiltinSkill = useCallback(
    (name: string) => {
      setDisabledBuiltin((prev) => {
        const next = prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name];
        void ipcBridge.conversation.update
          .invoke({
            id: conversationId,
            updates: { extra: { excludeBuiltinSkills: next } } as Partial<TChatConversation>,
            mergeExtra: true,
          })
          .catch(() => {
            /* the toggle stays applied in the menu even if persistence fails */
          });
        return next;
      });
    },
    [conversationId]
  );

  return (
    <ComposerAddMenu
      mode='live'
      conversationId={conversationId}
      draftText={draftText}
      uploadItems={uploadItems}
      uploading={uploading}
      builtinAutoSkills={builtinAutoSkills}
      disabledBuiltinSkills={disabledBuiltin}
      onToggleBuiltinSkill={onToggleBuiltinSkill}
    />
  );
};

export default InChatComposerAddMenu;
