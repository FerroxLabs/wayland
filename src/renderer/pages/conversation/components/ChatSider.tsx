/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TChatConversation } from '@/common/config/storage';
import { Message } from '@arco-design/web-react';
import React from 'react';
import ChatWorkspace from '../Workspace';

const ChatSider: React.FC<{
  conversation?: TChatConversation;
  teamId?: string;
}> = ({ conversation, teamId }) => {
  const [messageApi, messageContext] = Message.useMessage({ maxCount: 1 });

  let workspaceNode: React.ReactNode = null;
  if (conversation?.type === 'gemini') {
    workspaceNode = (
      <ChatWorkspace
        conversation_id={conversation.id}
        workspace={conversation.extra.workspace}
        messageApi={messageApi}
        teamId={teamId}
      ></ChatWorkspace>
    );
  } else if (conversation?.type === 'acp' && conversation.extra?.workspace) {
    workspaceNode = (
      <ChatWorkspace
        conversation_id={conversation.id}
        workspace={conversation.extra.workspace}
        eventPrefix='acp'
        messageApi={messageApi}
        teamId={teamId}
      ></ChatWorkspace>
    );
  } else if (conversation?.type === 'codex' && conversation.extra?.workspace) {
    workspaceNode = (
      <ChatWorkspace
        conversation_id={conversation.id}
        workspace={conversation.extra.workspace}
        eventPrefix='codex'
        messageApi={messageApi}
        teamId={teamId}
      ></ChatWorkspace>
    );
  } else if (conversation?.type === 'wcore' && conversation.extra?.workspace) {
    workspaceNode = (
      <ChatWorkspace
        conversation_id={conversation.id}
        workspace={conversation.extra.workspace}
        eventPrefix='wcore'
        messageApi={messageApi}
        teamId={teamId}
      ></ChatWorkspace>
    );
  }

  if (!workspaceNode) {
    return <div></div>;
  }

  return (
    <>
      {messageContext}
      {workspaceNode}
    </>
  );
};

export default ChatSider;
