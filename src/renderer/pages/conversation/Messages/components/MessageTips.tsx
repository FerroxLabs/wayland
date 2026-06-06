/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { IMessageTips } from '@/common/chat/chatLib';
import { theme } from '@office-ai/platform';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import MarkdownView from '@renderer/components/Markdown';
import CollapsibleContent from '@renderer/components/chat/CollapsibleContent';
import { sanitizeHtml } from '@renderer/utils/sanitize';

const icon = {
  success: <CheckCircle2 size={16} color={theme.Color.FunctionalColor.success} className='m-t-2px' />,
  warning: (
    <AlertTriangle size={16}
      strokeLinejoin='bevel'
      className='m-t-2px' color={theme.Color.FunctionalColor.warn}
    />
  ),
  error: (
    <AlertTriangle size={16}
      strokeLinejoin='bevel'
      className='m-t-2px' color={theme.Color.FunctionalColor.error}
    />
  ),
};

const useFormatContent = (content: string) => {
  return useMemo(() => {
    try {
      const json = JSON.parse(content);
      return {
        json: true,
        data: json,
      };
    } catch {
      return { data: content };
    }
  }, [content]);
};

const MessageTips: React.FC<{ message: IMessageTips }> = ({ message }) => {
  const { content, type } = message.content;
  const { json, data } = useFormatContent(content);

  const displayContent = json ? '' : content;

  if (json)
    return (
      <div className='w-full'>
        <div className={classNames('bg-message-tips rd-8px p-x-12px p-y-8px flex items-start gap-4px')}>
          {icon[type] || icon.warning}
          <MarkdownView>{`\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``}</MarkdownView>
        </div>
      </div>
    );
  return (
    <div className='w-full'>
      <div className={classNames('bg-message-tips rd-8px  p-x-12px p-y-8px flex items-start gap-4px')}>
        {icon[type] || icon.warning}
        <CollapsibleContent maxHeight={48} defaultCollapsed={true} className='flex-1' useMask={true}>
          <span
            className='whitespace-break-spaces text-t-primary [word-break:break-word]'
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(displayContent),
            }}
          ></span>
        </CollapsibleContent>
      </div>
    </div>
  );
};

export default MessageTips;
