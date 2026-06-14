/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Modal, Message, Tooltip } from '@arco-design/web-react';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import { iconColors } from '@/renderer/styles/colors';
import SkillPickerPanel from './composerMenu/SkillPickerPanel';

type Props = {
  conversationId: string;
};

/**
 * Composer affordance to add a skill to THIS conversation. The skill's body is
 * injected once on the next turn (server-side via skills.add-to-conversation)
 * and surfaces in the loaded-skills chip. The search + list body is shared with
 * the composer "+" Skills flyout via SkillPickerPanel.
 */
const AddSkillToChatButton: React.FC<Props> = ({ conversationId }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'skills' });
  const [open, setOpen] = useState(false);

  const handleAdd = async (name: string) => {
    const result = await ipcBridge.skills.addToConversation.invoke({ conversationId, name });
    if (result.ok) {
      Message.success(t('addToChat.added', { defaultValue: 'Added - applies on your next message.' }));
      setOpen(false);
    } else {
      throw new Error((result as { error?: string }).error ?? 'failed');
    }
  };

  return (
    <>
      <Tooltip content={t('addToChat.tooltip', { defaultValue: 'Add a skill to this chat' })}>
        <span
          className='inline-flex items-center justify-center w-24px h-24px rounded-full bg-2 cursor-pointer'
          data-testid='add-skill-to-chat'
          onClick={() => setOpen(true)}
        >
          <Plus size={14} color={iconColors.primary} strokeWidth={2} style={{ lineHeight: 0 }} />
        </span>
      </Tooltip>
      <Modal
        title={t('addToChat.title', { defaultValue: 'Add a skill to this chat' })}
        visible={open}
        onCancel={() => setOpen(false)}
        footer={null}
        unmountOnExit
        style={{ width: 560 }}
      >
        <SkillPickerPanel onAdd={handleAdd} addedNames={[]} maxHeight={380} autoFocus />
      </Modal>
    </>
  );
};

export default AddSkillToChatButton;
