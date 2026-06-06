/**
 * Hook for detecting multi-agent mode on application startup
 */

import { ipcBridge } from '@/common';
import { Message } from '@arco-design/web-react';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useMultiAgentDetection = () => {
  const { t } = useTranslation();
  const [message, contextHolder] = Message.useMessage();

  useEffect(() => {
    const checkMultiAgentMode = async () => {
      try {
        const response = await ipcBridge.acpConversation.getAvailableAgents.invoke();
        if (response && response.success && response.data) {
          // Detect whether multiple ACP agents exist (excluding the built-in Gemini)
          const acpAgents = response.data.filter(
            (agent: { backend: string; name: string; cliPath?: string }) => agent.backend !== 'gemini'
          );
          if (acpAgents.length > 1) {
            // message.success({
            //   content: (
            //     <div style={{ lineHeight: '1.5' }}>
            //       <div style={{ fontWeight: 'bold', marginTop: '4px' }}>{t('conversation.welcome.multiAgentModeEnabled')}</div>
            //     </div>
            //   ),
            //   duration: 3000,
            //   showIcon: false,
            //   className: 'multi-agent-message',
            // });
            message.success(t('conversation.welcome.multiAgentModeEnabled'));
          }
        }
      } catch (error) {
        // Silently handle errors to avoid affecting app startup
        console.log('Multi-agent detection failed:', error);
      }
    };

    checkMultiAgentMode().catch((error) => {
      console.error('Multi-agent detection failed:', error);
    });
  }, []); // Empty dependency array ensures this runs only once on component init

  return { contextHolder };
};
