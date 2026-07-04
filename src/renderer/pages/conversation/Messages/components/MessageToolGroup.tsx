/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Copy, Download, ExternalLink, Loader2 } from 'lucide-react';
import { ipcBridge } from '@/common';
import type { IMessageToolGroup } from '@/common/chat/chatLib';
import { redactCommandSecrets } from '@/common/utils/redactCommandSecrets';
import { iconColors } from '@/renderer/styles/colors';
import { Alert, Button, Image, Message, Radio, Tag, Tooltip } from '@arco-design/web-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FileChangesPanel from '@/renderer/components/base/FileChangesPanel';
import { useDiffPreviewHandlers } from '@/renderer/hooks/file/useDiffPreviewHandlers';
import { parseDiff } from '@/renderer/utils/file/diffUtils';
import MessageFileChanges from '../codex/MessageFileChanges';
import CollapsibleContent from '@renderer/components/chat/CollapsibleContent';
import LocalImageView from '@renderer/components/media/LocalImageView';
import MarkdownView from '@renderer/components/Markdown';
import { ToolConfirmationOutcome } from '@renderer/utils/common';
import { openExternalUrl } from '@/renderer/utils/platform';
import { extractGoogleConsentUrl } from '@/renderer/utils/mcp/googleConsentUrl';
import { ImagePreviewContext } from '../MessageList';
import { COLLAPSE_CONFIG, TEXT_CONFIG } from '../constants';
import type { ImageGenerationResult, WriteFileResult } from '../types';

const CODE_STYLE = { marginTop: 4, marginBottom: 4 };

// Alert component style constant
// Top-align icon with content to avoid icon vertical-centering on multi-line text
const ALERT_CLASSES =
  '!items-start !rd-8px !px-8px [&_.arco-alert-icon]:flex [&_.arco-alert-icon]:items-start [&_.arco-alert-content-wrapper]:flex [&_.arco-alert-content-wrapper]:items-start [&_.arco-alert-content-wrapper]:w-full [&_.arco-alert-content]:flex-1';

// CollapsibleContent height constants
const RESULT_MAX_HEIGHT = COLLAPSE_CONFIG.MAX_HEIGHT;

interface IMessageToolGroupProps {
  message: IMessageToolGroup;
}

const useConfirmationButtons = (
  confirmationDetails: IMessageToolGroupProps['message']['content'][number]['confirmationDetails'],
  t: (key: string, options?: any) => string
) => {
  return useMemo(() => {
    if (!confirmationDetails) return {};
    let question: string;
    const options: Array<{ label: string; value: ToolConfirmationOutcome }> = [];
    switch (confirmationDetails.type) {
      case 'edit':
        {
          question = t('messages.confirmation.applyChange');
          options.push(
            {
              label: t('messages.confirmation.yesAllowOnce'),
              value: ToolConfirmationOutcome.ProceedOnce,
            },
            {
              label: t('messages.confirmation.yesAllowAlways'),
              value: ToolConfirmationOutcome.ProceedAlways,
            },
            { label: t('messages.confirmation.no'), value: ToolConfirmationOutcome.Cancel }
          );
        }
        break;
      case 'exec':
        {
          question = t('messages.confirmation.allowExecution');
          options.push(
            {
              label: t('messages.confirmation.yesAllowOnce'),
              value: ToolConfirmationOutcome.ProceedOnce,
            },
            {
              label: t('messages.confirmation.yesAllowAlways'),
              value: ToolConfirmationOutcome.ProceedAlways,
            },
            { label: t('messages.confirmation.no'), value: ToolConfirmationOutcome.Cancel }
          );
        }
        break;
      case 'info':
        {
          question = t('messages.confirmation.proceed');
          options.push(
            {
              label: t('messages.confirmation.yesAllowOnce'),
              value: ToolConfirmationOutcome.ProceedOnce,
            },
            {
              label: t('messages.confirmation.yesAllowAlways'),
              value: ToolConfirmationOutcome.ProceedAlways,
            },
            { label: t('messages.confirmation.no'), value: ToolConfirmationOutcome.Cancel }
          );
        }
        break;
      case 'question':
        // #504: an AskUserQuestion is answered in the confirmation dialog
        // (ConversationChatConfirm), whose options carry the choice's `answer`
        // back to the engine. The inline card only displays the question +
        // choices (see the `node` switch), so no inline buttons here.
        question = '';
        break;
      default: {
        const mcpProps = confirmationDetails;
        question = t('messages.confirmation.allowMCPTool', {
          toolName: mcpProps.toolName,
          serverName: mcpProps.serverName,
        });
        options.push(
          {
            label: t('messages.confirmation.yesAllowOnce'),
            value: ToolConfirmationOutcome.ProceedOnce,
          },
          {
            label: t('messages.confirmation.yesAlwaysAllowTool', {
              toolName: mcpProps.toolName,
              serverName: mcpProps.serverName,
            }),
            value: ToolConfirmationOutcome.ProceedAlwaysTool,
          },
          {
            label: t('messages.confirmation.yesAlwaysAllowServer', {
              serverName: mcpProps.serverName,
            }),
            value: ToolConfirmationOutcome.ProceedAlwaysServer,
          },
          { label: t('messages.confirmation.no'), value: ToolConfirmationOutcome.Cancel }
        );
      }
    }
    return {
      question,
      options,
    };
  }, [confirmationDetails, t]);
};

const EditConfirmationDiff: React.FC<{ diff: string; fileName: string; title: string }> = ({
  diff,
  fileName,
  title,
}) => {
  const fileInfo = useMemo(() => parseDiff(diff, fileName), [diff, fileName]);
  const displayName = fileName.split(/[/\\]/).pop() || fileName;
  const { handleFileClick, handleDiffClick } = useDiffPreviewHandlers({
    diffText: diff,
    displayName,
    filePath: fileName,
    title,
  });

  return (
    <FileChangesPanel
      title={title}
      files={[fileInfo]}
      onFileClick={handleFileClick}
      onDiffClick={handleDiffClick}
      defaultExpanded={true}
    />
  );
};

const ConfirmationDetails: React.FC<{
  content: IMessageToolGroupProps['message']['content'][number];
  onConfirm: (outcome: ToolConfirmationOutcome) => void;
}> = ({ content, onConfirm }) => {
  const { t } = useTranslation();
  const { confirmationDetails } = content;
  if (!confirmationDetails) return;
  const node = useMemo(() => {
    if (!confirmationDetails) return null;
    switch (confirmationDetails.type) {
      case 'edit':
        return null; // Rendered separately below with hooks support
      case 'exec': {
        // Mask inline secrets (Bearer tokens, sk- keys, key=value pairs) before
        // rendering the real command in the expanded card (#610).
        const bashSnippet = `\`\`\`bash\n${redactCommandSecrets(confirmationDetails.command)}\n\`\`\``;
        return (
          <div className='w-full max-w-100% min-w-0'>
            <MarkdownView codeStyle={CODE_STYLE}>{bashSnippet}</MarkdownView>
          </div>
        );
      }
      case 'info':
        return <span className='text-t-primary'>{confirmationDetails.prompt}</span>;
      case 'mcp':
        return <span className='text-t-primary'>{confirmationDetails.toolDisplayName}</span>;
      case 'question':
        // #504: show the question and its choices (read-only). The actual pick
        // is made in the confirmation dialog, which returns the chosen answer.
        return (
          <div className='text-t-primary'>
            <div className='font-medium'>{confirmationDetails.question}</div>
            <ul className='mt-6px pl-18px list-disc'>
              {confirmationDetails.choices.map((choice, i) => (
                <li key={choice.label + i}>
                  <span>{choice.label}</span>
                  {choice.description && <span className='text-t-secondary'> — {choice.description}</span>}
                </li>
              ))}
            </ul>
          </div>
        );
    }
  }, [confirmationDetails]);

  const { question = '', options = [] } = useConfirmationButtons(confirmationDetails, t);

  const [selected, setSelected] = useState<ToolConfirmationOutcome | null>(null);

  const isConfirm = content.status === 'Confirming';

  return (
    <div>
      {confirmationDetails.type === 'edit' ? (
        <EditConfirmationDiff
          diff={confirmationDetails?.fileDiff || ''}
          fileName={confirmationDetails.fileName}
          title={isConfirm ? confirmationDetails.title : content.description}
        />
      ) : (
        node
      )}
      {content.status === 'Confirming' && confirmationDetails.type !== 'question' && (
        <>
          <div className='mt-10px text-t-primary'>{question}</div>
          <Radio.Group direction='vertical' size='mini' value={selected} onChange={setSelected}>
            {options.map((item) => {
              return (
                <Radio key={item.value} value={item.value}>
                  {item.label}
                </Radio>
              );
            })}
          </Radio.Group>
          <div className='flex justify-start pl-20px'>
            <Button type='primary' size='mini' disabled={!selected} onClick={() => onConfirm(selected)}>
              {t('messages.confirm')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

// ImageDisplay: Image generation result display component
const ImageDisplay: React.FC<{
  imgUrl: string;
  relativePath?: string;
}> = ({ imgUrl, relativePath }) => {
  const { t } = useTranslation();
  const [messageApi, messageContext] = Message.useMessage();
  const [imageUrl, setImageUrl] = useState<string>(imgUrl);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { inPreviewGroup } = useContext(ImagePreviewContext);

  // Load local paths as base64
  React.useEffect(() => {
    if (imgUrl.startsWith('data:') || imgUrl.startsWith('http')) {
      setImageUrl(imgUrl);
      setLoading(false);
    } else {
      setLoading(true);
      setError(false);
      ipcBridge.fs.getImageBase64
        .invoke({ path: imgUrl })
        .then((base64) => {
          setImageUrl(base64);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Failed to load image:', error);
          setError(true);
          setLoading(false);
        });
    }
  }, [imgUrl]);

  // Get image blob (reusable logic)
  const getImageBlob = useCallback(async (): Promise<Blob> => {
    const response = await fetch(imageUrl);
    return await response.blob();
  }, [imageUrl]);

  const handleCopy = useCallback(async () => {
    try {
      const blob = await getImageBlob();

      // Try using Clipboard API with blob (requires secure context in WebUI)
      if (navigator.clipboard && window.isSecureContext && typeof navigator.clipboard.write === 'function') {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob,
            }),
          ]);
          messageApi.success(t('messages.copySuccess', { defaultValue: 'Copied' }));
          return;
        } catch (clipboardError) {
          console.warn('[ImageDisplay] Clipboard API failed, trying fallback:', clipboardError);
        }
      }

      // Fallback: Use canvas to copy image for browsers/Electron that don't support ClipboardItem with images
      const img = document.createElement('img');
      img.src = imageUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      ctx.drawImage(img, 0, 0);
      canvas.toBlob(async (canvasBlob) => {
        if (!canvasBlob) {
          messageApi.error(t('messages.copyFailed', { defaultValue: 'Failed to copy' }));
          return;
        }
        if (!navigator.clipboard || !window.isSecureContext || typeof navigator.clipboard.write !== 'function') {
          messageApi.error(t('messages.copyFailed', { defaultValue: 'Failed to copy' }));
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': canvasBlob,
            }),
          ]);
          messageApi.success(t('messages.copySuccess', { defaultValue: 'Copied' }));
        } catch (canvasError) {
          console.error('[ImageDisplay] Canvas fallback also failed:', canvasError);
          messageApi.error(t('messages.copyFailed', { defaultValue: 'Failed to copy' }));
        }
      }, 'image/png');
    } catch (error) {
      console.error('Failed to copy image:', error);
      messageApi.error(t('messages.copyFailed', { defaultValue: 'Failed to copy' }));
    }
  }, [getImageBlob, imageUrl, t, messageApi]);

  const handleDownload = useCallback(async () => {
    try {
      const blob = await getImageBlob();
      const fileName = relativePath?.split(/[\\/]/).pop() || 'image.png';

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      messageApi.success(t('messages.downloadSuccess', { defaultValue: 'Download successful' }));
    } catch (error) {
      console.error('Failed to download image:', error);
      messageApi.error(t('messages.downloadFailed', { defaultValue: 'Failed to download' }));
    }
  }, [getImageBlob, relativePath, t, messageApi]);

  // Loading state
  if (loading) {
    return (
      <div className='flex items-center gap-8px my-8px'>
        <Loader2 className='loading' size={14} color={iconColors.primary} />
        <span className='text-t-secondary text-sm'>{t('common.loading', { defaultValue: 'Loading...' })}</span>
      </div>
    );
  }

  // Error state
  if (error || !imageUrl) {
    return (
      <div className='flex items-center gap-8px my-8px text-t-secondary text-sm'>
        <span>{t('messages.imageLoadFailed', { defaultValue: 'Failed to load image' })}</span>
      </div>
    );
  }

  // Image element
  const imageElement = (
    <Image
      src={imageUrl}
      alt={relativePath || 'Generated image'}
      width={197}
      style={{
        maxHeight: '320px',
        objectFit: 'contain',
        borderRadius: '8px',
        cursor: 'pointer',
      }}
    />
  );

  return (
    <>
      {messageContext}
      <div className='flex flex-col gap-8px my-8px' style={{ maxWidth: '197px' }}>
        {/* Image preview - render directly if already in PreviewGroup, otherwise wrap with PreviewGroup */}
        {inPreviewGroup ? imageElement : <Image.PreviewGroup>{imageElement}</Image.PreviewGroup>}
        {/* Action buttons */}
        <div className='flex gap-8px'>
          <Tooltip content={t('common.copy', { defaultValue: 'Copy' })}>
            <Button
              type='secondary'
              size='small'
              shape='circle'
              icon={<Copy size={14} color={iconColors.primary} />}
              onClick={handleCopy}
            />
          </Tooltip>
          <Tooltip content={t('common.download', { defaultValue: 'Download' })}>
            <Button
              type='secondary'
              size='small'
              shape='circle'
              icon={<Download size={14} color={iconColors.primary} />}
              onClick={handleDownload}
            />
          </Tooltip>
        </div>
      </div>
    </>
  );
};

export const ToolResultDisplay: React.FC<{
  content: IMessageToolGroupProps['message']['content'][number];
}> = ({ content }) => {
  const { t } = useTranslation();
  const { resultDisplay, name } = content;

  // Google Workspace MCP OAuth (#475): start_google_auth returns a consent URL
  // as plain text. The <pre> below isn't clickable, so surface an explicit
  // always-visible button that opens the consent page in the browser. Scoped to
  // that tool + accounts.google.com so arbitrary tool output can't be turned
  // into a one-click link.
  const consentUrl = extractGoogleConsentUrl(name, resultDisplay);

  // Special handling for image generation
  if (name === 'ImageGeneration' && typeof resultDisplay === 'object') {
    const result = resultDisplay as ImageGenerationResult;
    // Only render image when img_url is present, otherwise show the error
    if (result.img_url) {
      return (
        <LocalImageView
          src={result.img_url}
          alt={result.relative_path || result.img_url}
          className='max-w-100% max-h-100%'
        />
      );
    }
    // For error case, fall through to the JSON display logic below
  }

  // Convert result to string
  const display = typeof resultDisplay === 'string' ? resultDisplay : JSON.stringify(resultDisplay, null, 2);

  // Wrap long content with CollapsibleContent
  return (
    <>
      {consentUrl && (
        <Button
          type='primary'
          size='small'
          className='mb-8px'
          icon={<ExternalLink size={14} />}
          onClick={() => void openExternalUrl(consentUrl)}
        >
          {t('conversation.tool.openGoogleConsent')}
        </Button>
      )}
      <CollapsibleContent maxHeight={RESULT_MAX_HEIGHT} defaultCollapsed={true} useMask={false}>
        <pre
          className='text-t-primary whitespace-pre-wrap break-words m-0'
          style={{ fontSize: `${TEXT_CONFIG.FONT_SIZE}px`, lineHeight: TEXT_CONFIG.LINE_HEIGHT }}
        >
          {display}
        </pre>
      </CollapsibleContent>
    </>
  );
};

const MessageToolGroup: React.FC<IMessageToolGroupProps> = ({ message }) => {
  const { t } = useTranslation();

  // Collect all WriteFile results for summary display
  const writeFileResults = useMemo(() => {
    return message.content
      .filter(
        (item) =>
          item.name === 'WriteFile' &&
          item.resultDisplay &&
          typeof item.resultDisplay === 'object' &&
          'fileDiff' in item.resultDisplay
      )
      .map((item) => item.resultDisplay as WriteFileResult);
  }, [message.content]);

  // Find the index of first WriteFile
  const firstWriteFileIndex = useMemo(() => {
    return message.content.findIndex(
      (item) =>
        item.name === 'WriteFile' &&
        item.resultDisplay &&
        typeof item.resultDisplay === 'object' &&
        'fileDiff' in item.resultDisplay
    );
  }, [message.content]);

  return (
    <div>
      {message.content.map((content, index) => {
        const { status, callId, name, description, resultDisplay, confirmationDetails } = content;
        const isLoading = status !== 'Success' && status !== 'Error' && status !== 'Canceled';
        // status === "Confirming" &&
        if (confirmationDetails) {
          return (
            <ConfirmationDetails
              key={callId}
              content={content}
              onConfirm={(outcome) => {
                ipcBridge.geminiConversation.confirmMessage
                  .invoke({
                    confirmKey: outcome,
                    msg_id: message.id,
                    callId: callId,
                    conversation_id: message.conversation_id,
                  })
                  .then(() => {
                    // confirmation sent successfully
                  })
                  .catch((error) => {
                    console.error('Failed to confirm message:', error);
                  });
              }}
            ></ConfirmationDetails>
          );
        }

        // WriteFile special handling: use MessageFileChanges for summary display
        if (name === 'WriteFile' && typeof resultDisplay !== 'string') {
          if (resultDisplay && typeof resultDisplay === 'object' && 'fileDiff' in resultDisplay) {
            // Only show summary component at first WriteFile position
            if (index === firstWriteFileIndex && writeFileResults.length > 0) {
              return (
                <div className='w-full min-w-0' key={callId}>
                  <MessageFileChanges writeFileChanges={writeFileResults} />
                </div>
              );
            }
            // Skip other WriteFile
            return null;
          }
        }

        // Special handling for ImageGeneration: display image separately without Alert wrapper
        if (name === 'ImageGeneration' && typeof resultDisplay === 'object') {
          const result = resultDisplay as ImageGenerationResult;
          if (result.img_url) {
            return <ImageDisplay key={callId} imgUrl={result.img_url} relativePath={result.relative_path} />;
          }
        }

        // Generic tool call display
        // Place expandable long content below the Alert, keep Alert showing header info only
        return (
          <div key={callId}>
            <Alert
              className={ALERT_CLASSES}
              type={
                status === 'Error'
                  ? 'error'
                  : status === 'Success'
                    ? 'success'
                    : status === 'Canceled'
                      ? 'warning'
                      : 'info'
              }
              icon={isLoading && <Loader2 size={12} color={iconColors.primary} className='loading lh-[1] flex' />}
              content={
                <div>
                  <Tag className={'mr-4px'}>
                    {name}
                    {status === 'Canceled' ? `(${t('messages.canceledExecution')})` : ''}
                  </Tag>
                </div>
              }
            />

            {(description || resultDisplay || status === 'Error') && (
              <div className='mt-8px'>
                {description && (
                  <div
                    className={`text-12px text-t-secondary mb-2 ${status === 'Error' ? 'whitespace-pre-wrap break-words' : 'truncate'}`}
                  >
                    {redactCommandSecrets(description)}
                  </div>
                )}
                {resultDisplay && (
                  <div>
                    {/* Display full result outside Alert */}
                    {/* ToolResultDisplay already contains CollapsibleContent internally, avoid nesting */}
                    <ToolResultDisplay content={content} />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MessageToolGroup;
