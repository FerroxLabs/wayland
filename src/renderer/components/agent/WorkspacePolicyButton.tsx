/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { WCoreWorkspacePolicy } from '@/process/agent/wcore/protocol';
import { Button, Popover } from '@arco-design/web-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Displays Core's live filesystem receipt; never infers tool registration or approval. */
export default function WorkspacePolicyButton({ conversationId }: { conversationId: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<{ conversationId: string; policy: WCoreWorkspacePolicy | null }>();
  const version = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++version.current;
    try {
      const result = await ipcBridge.acpConversation.getMode.invoke({ conversationId });
      if (request === version.current) {
        setSnapshot({ conversationId, policy: result.success ? (result.data?.workspacePolicy ?? null) : null });
      }
    } catch {
      if (request === version.current) setSnapshot({ conversationId, policy: null });
    }
  }, [conversationId]);

  useEffect(() => {
    void refresh();
    const unsubscribe = ipcBridge.conversation.responseStream.on((event) => {
      if (
        event.conversation_id === conversationId &&
        ['workspace_policy', 'start', 'finish', 'error'].includes(event.type)
      ) {
        // Stream frames only invalidate the view. Read authority back from main
        // so a raw frame or an old conversation cannot manufacture access.
        void refresh();
      }
    });
    return () => {
      version.current += 1;
      unsubscribe();
    };
  }, [conversationId, refresh]);

  useEffect(() => {
    if (!open) return;
    void refresh();
    // Transport death between turns need not emit a turn error. Recheck while
    // the details are visible so a retained receipt cannot remain live forever.
    const timer = setInterval(() => void refresh(), 5000);
    return () => clearInterval(timer);
  }, [open, refresh]);

  const policy = snapshot?.conversationId === conversationId ? snapshot.policy : null;
  const paths = (values: readonly string[]) =>
    values.length ? (
      <ul className='m-0 pl-16px'>
        {values.map((path, index) => (
          <li key={`${index}:${path}`} className='break-all'>
            {path}
          </li>
        ))}
      </ul>
    ) : (
      <span>{t('conversation.workspacePolicy.none')}</span>
    );
  return (
    <Popover
      trigger='click'
      popupVisible={open}
      onVisibleChange={setOpen}
      content={
        <div className='max-w-400px max-h-400px overflow-auto text-t-primary'>
          <p>{t('conversation.workspacePolicy.scope')}</p>
          {policy ? (
            <dl className='m-0'>
              <dt>{t('conversation.workspacePolicy.readable')}</dt>
              <dd>{paths(policy.readable_roots)}</dd>
              <dt>{t('conversation.workspacePolicy.writable')}</dt>
              <dd>{paths(policy.writable_roots)}</dd>
              <dt>{t('conversation.workspacePolicy.executables')}</dt>
              <dd>
                {policy.capabilities.length ? (
                  <ul className='m-0 pl-16px'>
                    {policy.capabilities.map((capability, index) => (
                      <li key={`${index}:${capability.name}`} className='break-all'>
                        {capability.name}: {capability.executable}
                        {capability.read_only_roots.length > 0 ? paths(capability.read_only_roots) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  t('conversation.workspacePolicy.none')
                )}
              </dd>
            </dl>
          ) : (
            <p role='status'>{t('conversation.workspacePolicy.unknown')}</p>
          )}
        </div>
      }
    >
      <Button type='text' size='mini' aria-expanded={open}>
        {t('conversation.workspacePolicy.title')}
      </Button>
    </Popover>
  );
}
