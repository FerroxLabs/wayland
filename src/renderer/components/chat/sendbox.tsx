/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import AtFileMenu from '@/renderer/components/chat/AtFileMenu';
import BtwOverlay from '@/renderer/components/chat/BtwOverlay';
import DoctorReportModal from '@/renderer/components/chat/DoctorReportModal';
import { useInputFocusRing } from '@/renderer/hooks/chat/useInputFocusRing';
import SlashCommandMenu, { type SlashCommandMenuItem } from '@/renderer/components/chat/SlashCommandMenu';
import { useBtwCommand } from '@/renderer/components/chat/BtwOverlay/useBtwCommand';
import { useSlashCommandController } from '@/renderer/hooks/chat/useSlashCommandController';
import { useUserSlashCommands } from '@/renderer/hooks/chat/useUserSlashCommands';
import { useLayoutContext } from '@/renderer/hooks/context/LayoutContext';
import { useConversationContextSafe } from '@/renderer/hooks/context/ConversationContext';
import { usePreviewContext } from '@/renderer/pages/conversation/Preview';
import { buildAtFileInsertion, getActiveAtFileQuery, getAllAtFileQueries } from '@/renderer/utils/chat/atFileQuery';
import { getLastAssistantText } from '@/renderer/utils/chat/getLastAssistantText';
import { emitter, type ReplyQuote, useAddEventListener } from '@/renderer/utils/emitter';
import { mergeFileSelectionItems, type FileSelectionItem } from '@/renderer/utils/file/fileSelection';
import type { FileOrFolderItem } from '@/renderer/utils/file/fileTypes';
import { filterWorkspaceMentionItems } from '@/renderer/utils/file/workspaceMentions';
import { copyText } from '@/renderer/utils/ui/clipboard';
import { isElectronDesktop } from '@/renderer/utils/platform';
import { blurActiveElement, shouldBlockMobileInputFocus } from '@/renderer/utils/ui/focus';
import { Button, Input, Message, Tag } from '@arco-design/web-react';
import { ArrowUp, Quote, X } from 'lucide-react';
import type { SlashCommandItem } from '@/common/chat/slash/types';
import { theme } from '@office-ai/platform';
import React, { useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompositionInput } from '@renderer/hooks/chat/useCompositionInput';
import { useConversationExport } from '@renderer/hooks/file/useConversationExport';
import { useDragUpload } from '@renderer/hooks/file/useDragUpload';
import { useLatestRef } from '@renderer/hooks/ui/useLatestRef';
import { usePasteService } from '@renderer/hooks/file/usePasteService';
import { useMessageList } from '@renderer/pages/conversation/Messages/hooks';
import type { FileMetadata } from '@renderer/services/FileService';
import { useUploadState } from '@renderer/hooks/file/useUploadState';
import UploadProgressBar from '@renderer/components/media/UploadProgressBar';
import { allSupportedExts } from '@renderer/services/FileService';
import SpeechInputButton from '@/renderer/components/chat/SpeechInputButton';
import { appendSpeechTranscript } from '@/renderer/hooks/system/useSpeechInput';
import { getConversationInputHistory, isCaretOnFirstLine } from '@/renderer/utils/chat/messageHistory';
import './sendbox.css';

const constVoid = (): void => undefined;
// Threshold: switch to multi-line mode directly when character count exceeds this value to avoid heavy layout work
const MAX_SINGLE_LINE_CHARACTERS = 800;
const BTW_COMMAND_RE = /^\/btw(?:\s+([\s\S]*))?$/i;
const AT_FILE_HIGHLIGHT_COLOR = theme.Color.PrimaryColor;

const getSelectedItemMatchKeys = (item: FileSelectionItem): string[] => {
  if (typeof item === 'string') {
    return [item];
  }
  return [item.relativePath, item.path].filter((value): value is string => Boolean(value));
};

const getSelectedItemPath = (item: FileSelectionItem): string | undefined => {
  if (typeof item === 'string') {
    return item;
  }
  return item.path;
};

const getSelectedItemDisplayLabel = (item: FileSelectionItem): string => {
  if (typeof item === 'string') {
    return item.split(/[\\/]/).pop() || item;
  }
  return item.relativePath || item.name || item.path;
};

const rememberSelectedItem = (itemsByPath: Map<string, FileSelectionItem>, item: FileSelectionItem): void => {
  const path = getSelectedItemPath(item);
  if (!path) {
    return;
  }

  const existing = itemsByPath.get(path);
  if (typeof existing === 'string' && typeof item !== 'string') {
    itemsByPath.set(path, item);
    return;
  }

  if (!existing) {
    itemsByPath.set(path, item);
  }
};

const areSelectionItemsEquivalent = (left: FileSelectionItem[], right: FileSelectionItem[]): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    const leftItem = left[index];
    const rightItem = right[index];
    if (leftItem === rightItem) {
      continue;
    }

    if (typeof leftItem !== typeof rightItem) {
      return false;
    }

    if (getSelectedItemPath(leftItem) !== getSelectedItemPath(rightItem)) {
      return false;
    }
  }

  return true;
};

const buildOwnedSelectionItems = (
  currentItems: FileSelectionItem[],
  mentionOwnedPaths: Set<string>,
  externalOwnedPaths: Set<string>,
  itemsByPath: Map<string, FileSelectionItem>
): FileSelectionItem[] => {
  const ownedPaths = new Set([...mentionOwnedPaths, ...externalOwnedPaths]);
  const nextItems: FileSelectionItem[] = [];
  const seenPaths = new Set<string>();

  for (const item of currentItems) {
    const path = getSelectedItemPath(item);
    if (!path || seenPaths.has(path) || !ownedPaths.has(path)) {
      continue;
    }

    nextItems.push(item);
    seenPaths.add(path);
  }

  for (const path of ownedPaths) {
    if (seenPaths.has(path)) {
      continue;
    }

    nextItems.push(itemsByPath.get(path) ?? path);
    seenPaths.add(path);
  }

  return nextItems;
};

function extractBtwQuestion(value: string): string | null {
  const match = value.trim().match(BTW_COMMAND_RE);
  return match ? match[1] || '' : null;
}

const SendBox: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
  onSend: (message: string) => Promise<void>;
  onStop?: () => Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  tools?: React.ReactNode;
  prefix?: React.ReactNode;
  placeholder?: string;
  onFilesAdded?: (files: FileMetadata[]) => void;
  supportedExts?: string[];
  defaultMultiLine?: boolean;
  lockMultiLine?: boolean;
  sendButtonPrefix?: React.ReactNode;
  slashCommands?: SlashCommandItem[];
  onSlashBuiltinCommand?: (name: string) => void;
  hasPendingAttachments?: boolean;
  enableBtw?: boolean;
  allowSendWhileLoading?: boolean;
  compactActions?: boolean;
  selectedWorkspaceItems?: FileSelectionItem[];
  onSelectedWorkspaceItemsChange?: (items: FileSelectionItem[]) => void;
}> = ({
  onSend,
  onStop,
  prefix,
  className,
  loading,
  tools,
  disabled,
  placeholder,
  value: input = '',
  onChange: setInput = constVoid,
  onFilesAdded,
  supportedExts = allSupportedExts,
  defaultMultiLine = false,
  lockMultiLine = false,
  sendButtonPrefix,
  slashCommands = [],
  onSlashBuiltinCommand,
  hasPendingAttachments = false,
  enableBtw = false,
  allowSendWhileLoading = false,
  compactActions = false,
  selectedWorkspaceItems,
  onSelectedWorkspaceItemsChange,
}) => {
  const layout = useLayoutContext();
  const isMobile = layout?.isMobile ?? false;
  const conversationContext = useConversationContextSafe();
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSingleLine, setIsSingleLine] = useState(!defaultMultiLine);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const isInputActive = isInputFocused;
  const { activeBorderColor, inactiveBorderColor, activeShadow } = useInputFocusRing();
  const containerRef = useRef<HTMLDivElement>(null);
  const singleLineWidthRef = useRef<number>(0);
  const measurementCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mobileUserFocusIntentUntilRef = useRef(0);
  const warmedConversationRef = useRef<string | undefined>(undefined);
  const warmupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestInputRef = useLatestRef(input);
  const setInputRef = useLatestRef(setInput);
  const messageList = useMessageList();
  const [historyNavigationIndex, setHistoryNavigationIndex] = useState<number | null>(null);
  const historyDraftRef = useRef<string | null>(null);
  const [replyQuote, setReplyQuote] = useState<ReplyQuote | null>(null);
  const [caretPosition, setCaretPosition] = useState(0);
  const [workspaceMentionItems, setWorkspaceMentionItems] = useState<FileOrFolderItem[]>([]);
  const [workspaceMentionLoading, setWorkspaceMentionLoading] = useState(false);
  const [atFileMenuActiveIndex, setAtFileMenuActiveIndex] = useState(0);
  const [dismissedAtFileToken, setDismissedAtFileToken] = useState<string | null>(null);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const mentionOwnedPathsRef = useRef<Set<string>>(new Set());
  const everMentionOwnedPathsRef = useRef<Set<string>>(new Set());
  const externalOwnedPathsRef = useRef<Set<string>>(new Set());
  const selectedItemByPathRef = useRef<Map<string, FileSelectionItem>>(new Map());
  const suppressedExternalAppendPathsRef = useRef<Set<string>>(new Set());
  const fetchedAtFileSessionKeyRef = useRef<string | null>(null);
  const highlightScrollRef = useRef<HTMLDivElement>(null);

  // Listen for reply events from message actions
  useAddEventListener('sendbox.reply', (quote) => setReplyQuote(quote), []);
  useAddEventListener('sendbox.reply.clear', () => setReplyQuote(null), []);

  // Integrate preview panel's "Add to chat" functionality
  const { setSendBoxHandler, domSnippets, removeDomSnippet, clearDomSnippets } = usePreviewContext();

  // Register handler to receive text from preview panel
  useEffect(() => {
    const handler = (text: string) => {
      const base = latestInputRef.current;
      const newValue = base ? `${base}\n\n${text}` : text;
      setInputRef.current(newValue);
    };
    setSendBoxHandler(handler);
    return () => {
      setSendBoxHandler(null);
    };
  }, [setSendBoxHandler]);

  // Initialize and get the available width of single-line input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current && singleLineWidthRef.current === 0) {
        const textarea = containerRef.current.querySelector('textarea');
        if (textarea) {
          // Save the available width in single-line mode as a fixed baseline
          singleLineWidthRef.current = textarea.offsetWidth;
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // On mobile, clear focus after mount to intercept non-user-triggered focus from route changes
  useEffect(() => {
    if (!isMobile) return;
    const timer = setTimeout(() => {
      blurActiveElement();
    }, 0);
    return () => clearTimeout(timer);
  }, [isMobile]);

  // Detect whether to use single-line or multi-line mode
  useEffect(() => {
    // Switch to multi-line mode if newline character exists
    if (input.includes('\n')) {
      setIsSingleLine(false);
      return;
    }

    // Skip detection if baseline width is not yet obtained
    if (singleLineWidthRef.current === 0) {
      return;
    }

    // Skip measurement for long text and switch to multi-line immediately to avoid expensive layout caused by extra-wide DOM
    if (input.length >= MAX_SINGLE_LINE_CHARACTERS) {
      setIsSingleLine(false);
      return;
    }

    // Detect content width
    const frame = requestAnimationFrame(() => {
      const textarea = containerRef.current?.querySelector('textarea');
      if (!textarea) {
        return;
      }

      // Reuse a single offscreen canvas to avoid creating/destroying DOM nodes repeatedly
      const canvas = measurementCanvasRef.current ?? document.createElement('canvas');
      if (!measurementCanvasRef.current) {
        measurementCanvasRef.current = canvas;
      }
      const context = canvas.getContext('2d');
      if (!context) {
        return;
      }

      const textareaStyle = getComputedStyle(textarea);
      const fallbackFontSize = textareaStyle.fontSize || '14px';
      const fallbackFontFamily = textareaStyle.fontFamily || 'sans-serif';
      context.font = textareaStyle.font || `${fallbackFontSize} ${fallbackFontFamily}`.trim();

      const textWidth = context.measureText(input || '').width;

      // Use the fixed baseline width saved during initialization
      const baseWidth = singleLineWidthRef.current;

      // Switch to multi-line when text width exceeds baseline width
      if (textWidth >= baseWidth) {
        setIsSingleLine(false);
      } else if (textWidth < baseWidth - 30 && !lockMultiLine) {
        // Switch back to single-line when text width is less than baseline minus 30px, leaving a small buffer to avoid flickering at the threshold
        // If lockMultiLine is true, do not switch back to single-line
        setIsSingleLine(true);
      }
      // Maintain current state between (baseWidth-30) and baseWidth
    });

    return () => cancelAnimationFrame(frame);
  }, [input, lockMultiLine]);

  // Use drag-upload hook
  const { isFileDragging, dragHandlers } = useDragUpload({
    supportedExts,
    onFilesAdded,
    conversationId: conversationContext?.conversationId,
  });

  const { isUploading } = useUploadState('sendbox');
  const [message, context] = Message.useMessage();
  const conversationExport = useConversationExport({
    conversationId: conversationContext?.conversationId,
    workspace: conversationContext?.workspace,
    t,
    messageApi: message,
  });
  const btwCommand = useBtwCommand(conversationContext?.conversationId, enableBtw);
  const btwQuestion = useMemo(() => extractBtwQuestion(input), [input]);
  const activeAtFileQuery = useMemo(() => {
    if (!conversationContext?.workspace) {
      return null;
    }
    return getActiveAtFileQuery(input, caretPosition);
  }, [caretPosition, conversationContext?.workspace, input]);
  const activeAtFileTokenKey = useMemo(() => {
    if (!activeAtFileQuery) {
      return null;
    }
    return `${activeAtFileQuery.start}:${activeAtFileQuery.rawQuery}`;
  }, [activeAtFileQuery]);
  const atFileSessionKey = useMemo(() => {
    if (!conversationContext?.workspace || !activeAtFileQuery) {
      return null;
    }
    return `${conversationContext.workspace}:${activeAtFileQuery.start}`;
  }, [activeAtFileQuery, conversationContext?.workspace]);
  const allAtFileQueries = useMemo(() => getAllAtFileQueries(input), [input]);
  const deferredAtFileQuery = useDeferredValue(activeAtFileQuery?.query ?? '');
  const inputHistory = useMemo(
    () => getConversationInputHistory(messageList, conversationContext?.conversationId),
    [conversationContext?.conversationId, messageList]
  );
  const unmatchedSelectedWorkspaceItems = useMemo(() => {
    if (!selectedWorkspaceItems?.length) {
      return [];
    }

    const mentionQueries = new Set(allAtFileQueries.map((item) => item.query));
    return selectedWorkspaceItems.filter((item) => {
      if (typeof item !== 'string' && !item.isFile) {
        return false;
      }
      return !getSelectedItemMatchKeys(item).some((key) => mentionQueries.has(key));
    });
  }, [allAtFileQueries, selectedWorkspaceItems]);

  const builtinSlashCommands = useMemo<SlashCommandItem[]>(() => {
    const commands: SlashCommandItem[] = [];
    if (enableBtw) {
      commands.push({
        name: 'btw',
        description: t('conversation.sideQuestion.description'),
        kind: 'builtin',
        source: 'builtin',
        selectionBehavior: 'insert',
      });
    }
    if (onSlashBuiltinCommand) {
      commands.push({
        name: 'open',
        description: t('conversation.workspace.addFile', { defaultValue: 'Add File' }),
        kind: 'builtin',
        source: 'builtin',
      });
    }
    if (conversationContext?.conversationId) {
      commands.push({
        name: 'copy',
        description: t('messages.copy', { defaultValue: 'Copy' }),
        kind: 'builtin',
        source: 'builtin',
      });
      commands.push({
        name: 'export',
        description: t('messages.export.commandDescription'),
        kind: 'builtin',
        source: 'builtin',
      });
    }
    // App-wide diagnostic, handled inline (opens a modal). Desktop-only: the
    // `doctor.run` IPC is in REMOTE_DENIED_KEYS, so a paired-WebUI/remote session
    // would open the modal only to have the run dropped ("Could not run the
    // Doctor"). Gate the command on the local Electron desktop so it's never a
    // dead affordance remotely.
    if (isElectronDesktop()) {
      commands.push({
        name: 'doctor',
        description: t('messages.doctor.commandDescription', { defaultValue: 'Run a health check on your setup' }),
        kind: 'builtin',
        source: 'builtin',
      });
    }
    return commands;
  }, [conversationContext?.conversationId, enableBtw, onSlashBuiltinCommand, t]);

  const { commands: userSlashCommands } = useUserSlashCommands();

  // User-defined commands mapped into the shared SlashCommandItem shape with a
  // "Custom" badge so they're distinguishable from agent/builtin commands.
  const userSlashCommandItems = useMemo<SlashCommandItem[]>(
    () =>
      userSlashCommands.map((command) => ({
        name: command.name,
        description: command.description,
        kind: 'template',
        source: 'user',
        hint: t('messages.slash.customBadge', { defaultValue: 'Custom' }),
      })),
    [userSlashCommands, t]
  );

  // Template bodies keyed by command name, for expansion on select.
  const userTemplateByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const command of userSlashCommands) {
      map.set(command.name, command.template);
    }
    return map;
  }, [userSlashCommands]);

  const mergedSlashCommands = useMemo(() => {
    const map = new Map<string, SlashCommandItem>();
    for (const command of builtinSlashCommands) {
      map.set(command.name, command);
    }
    // User commands take precedence over agent commands of the same name (the
    // user explicitly authored them) but never over builtins.
    for (const command of userSlashCommandItems) {
      if (!map.has(command.name)) {
        map.set(command.name, command);
      }
    }
    for (const command of slashCommands) {
      if (!map.has(command.name)) {
        map.set(command.name, command);
      }
    }
    return Array.from(map.values());
  }, [builtinSlashCommands, userSlashCommandItems, slashCommands]);

  const slashController = useSlashCommandController({
    input,
    commands: mergedSlashCommands,
    onExecuteBuiltin: (name) => {
      if (name === 'copy') {
        const lastAssistantText = getLastAssistantText(messageList, Boolean(loading));
        if (!lastAssistantText) {
          Message.warning(t('messages.copyLastOutput.empty'));
        } else {
          void copyText(lastAssistantText)
            .then(() => {
              Message.success(t('messages.copySuccess'));
            })
            .catch(() => {
              Message.error(t('messages.copyFailed'));
            });
        }
      } else if (name === 'export') {
        void conversationExport.openExportFlow();
      } else if (name === 'doctor') {
        setIsDoctorModalOpen(true);
      } else {
        onSlashBuiltinCommand?.(name);
      }
      setInput('');
    },
    onSelectTemplate: (name) => {
      setInput(`/${name} `);
    },
    onSelectUserCommand: (name) => {
      // v1 UX: expand the template body into the composer with any `{arg}` /
      // `{{arg}}` placeholders left in place for the user to fill before
      // sending. No interactive arg-collection step in v1 (see issue #28).
      const template = userTemplateByName.get(name);
      setInput(template ?? `/${name} `);
    },
  });

  const slashMenuItems = useMemo<SlashCommandMenuItem[]>(
    () =>
      slashController.filteredCommands.map((command) => ({
        key: command.name,
        label: `/${command.name}`,
        description: command.description,
        badge: command.hint,
      })),
    [slashController.filteredCommands]
  );

  const isCommandMenuOpen = conversationExport.isOpen || slashController.isOpen;
  const isAtFileMenuOpen =
    Boolean(conversationContext?.workspace) &&
    Boolean(activeAtFileQuery) &&
    activeAtFileTokenKey !== dismissedAtFileToken &&
    !isCommandMenuOpen;
  const visibleAtFileMenuItems = useMemo(
    () => filterWorkspaceMentionItems(workspaceMentionItems, deferredAtFileQuery),
    [deferredAtFileQuery, workspaceMentionItems]
  );
  const isOverlayOpen = isCommandMenuOpen || btwCommand.isOpen || isAtFileMenuOpen;

  const getTextareaElement = useCallback((): HTMLTextAreaElement | null => {
    const textarea = containerRef.current?.querySelector('textarea');
    return textarea instanceof HTMLTextAreaElement ? textarea : null;
  }, []);

  const syncCaretPosition = useCallback(
    (target?: EventTarget | null) => {
      const textarea = target instanceof HTMLTextAreaElement ? target : getTextareaElement();
      if (!textarea) {
        return;
      }
      setCaretPosition(textarea.selectionStart ?? textarea.value.length);
    },
    [getTextareaElement]
  );

  const syncHighlightScroll = useCallback(
    (target?: EventTarget | null) => {
      const textarea = target instanceof HTMLTextAreaElement ? target : getTextareaElement();
      if (!textarea || !highlightScrollRef.current) {
        return;
      }
      highlightScrollRef.current.scrollTop = textarea.scrollTop;
      highlightScrollRef.current.scrollLeft = textarea.scrollLeft;
    },
    [getTextareaElement]
  );

  const syncHighlightTextMetrics = useCallback(
    (target?: EventTarget | null) => {
      const textarea = target instanceof HTMLTextAreaElement ? target : getTextareaElement();
      const highlightLayer = highlightScrollRef.current;
      if (!textarea || !highlightLayer) {
        return;
      }

      const textareaStyle = getComputedStyle(textarea);
      highlightLayer.style.direction = textareaStyle.direction;
      highlightLayer.style.fontFamily = textareaStyle.fontFamily;
      highlightLayer.style.fontSize = textareaStyle.fontSize;
      highlightLayer.style.fontStyle = textareaStyle.fontStyle;
      highlightLayer.style.fontWeight = textareaStyle.fontWeight;
      highlightLayer.style.letterSpacing = textareaStyle.letterSpacing;
      highlightLayer.style.lineHeight = textareaStyle.lineHeight;
      highlightLayer.style.paddingTop = textareaStyle.paddingTop;
      highlightLayer.style.paddingRight = textareaStyle.paddingRight;
      highlightLayer.style.paddingBottom = textareaStyle.paddingBottom;
      highlightLayer.style.paddingLeft = textareaStyle.paddingLeft;
      highlightLayer.style.tabSize = textareaStyle.tabSize;
      highlightLayer.style.textAlign = textareaStyle.textAlign;
      highlightLayer.style.textIndent = textareaStyle.textIndent;
      highlightLayer.style.textTransform = textareaStyle.textTransform;
      highlightLayer.style.wordSpacing = textareaStyle.wordSpacing;
    },
    [getTextareaElement]
  );

  useLayoutEffect(() => {
    syncHighlightTextMetrics();
  }, [input, isInputFocused, isMobile, isSingleLine, syncHighlightTextMetrics]);

  const handleTextAreaChange = (value: string) => {
    if (historyNavigationIndex !== null) {
      historyDraftRef.current = null;
      setHistoryNavigationIndex(null);
    }
    if (conversationExport.isOpen && value) {
      conversationExport.closeExportFlow();
    }
    setInput(value);
    requestAnimationFrame(() => {
      syncCaretPosition();
      syncHighlightScroll();
    });
  };

  const handleOverlayKeyDown = (event: React.KeyboardEvent) => {
    return conversationExport.handleKeyDown(event) || slashController.onKeyDown(event);
  };

  const renderExportFileNamePanel = () => {
    return (
      <div
        className='rounded-14px border border-solid overflow-hidden p-12px flex flex-col gap-10px'
        style={{
          borderColor: 'var(--color-border-2)',
          background: 'color-mix(in srgb, var(--color-bg-1) 88%, transparent)',
          backdropFilter: 'blur(14px) saturate(1.1)',
          WebkitBackdropFilter: 'blur(14px) saturate(1.1)',
        }}
      >
        <div className='text-13px font-semibold text-t-primary'>{t('messages.export.fileNameLabel')}</div>
        <Input
          autoFocus
          value={conversationExport.filename}
          onChange={conversationExport.setFilename}
          placeholder={t('messages.export.fileNamePlaceholder')}
          disabled={conversationExport.loading}
          onKeyDown={(event) => {
            conversationExport.handleKeyDown(event);
          }}
        />
        <div className='text-12px text-t-secondary break-all'>
          {t('messages.export.pathLabel')}: {conversationExport.pathPreview}
        </div>
        <div className='flex items-center justify-end gap-8px'>
          <Button
            size='small'
            type='secondary'
            disabled={conversationExport.loading}
            onClick={() => {
              conversationExport.closeExportFlow();
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            size='small'
            type='secondary'
            disabled={conversationExport.loading}
            onClick={() => {
              conversationExport.showMenu();
            }}
          >
            {t('common.back')}
          </Button>
          <Button
            size='small'
            type='primary'
            loading={conversationExport.loading}
            onClick={() => {
              void conversationExport.submitFilename();
            }}
          >
            {t('common.save')}
          </Button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (!isAtFileMenuOpen || !conversationContext?.workspace || !atFileSessionKey) {
      fetchedAtFileSessionKeyRef.current = null;
      setWorkspaceMentionItems([]);
      setWorkspaceMentionLoading(false);
      return;
    }

    if (fetchedAtFileSessionKeyRef.current === atFileSessionKey) {
      return;
    }

    let cancelled = false;
    fetchedAtFileSessionKeyRef.current = atFileSessionKey;
    setWorkspaceMentionLoading(true);

    void ipcBridge.fs.listWorkspaceFiles
      .invoke({ root: conversationContext.workspace })
      .then((result) => {
        if (cancelled) {
          return;
        }
        const files = result.map((item) => ({
          path: item.fullPath,
          name: item.name,
          isFile: true,
          relativePath: item.relativePath || undefined,
        }));
        setWorkspaceMentionItems(files);
      })
      .catch((error) => {
        if (!cancelled) {
          fetchedAtFileSessionKeyRef.current = null;
          console.warn('[SendBox] Failed to load workspace file mentions:', error);
          setWorkspaceMentionItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setWorkspaceMentionLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [atFileSessionKey, conversationContext?.workspace, isAtFileMenuOpen]);

  useEffect(() => {
    if (!activeAtFileTokenKey) {
      setAtFileMenuActiveIndex(0);
      return;
    }
    setAtFileMenuActiveIndex(0);
  }, [activeAtFileTokenKey]);

  useEffect(() => {
    if (!visibleAtFileMenuItems.length) {
      setAtFileMenuActiveIndex(0);
      return;
    }
    setAtFileMenuActiveIndex((previous) => Math.min(previous, visibleAtFileMenuItems.length - 1));
  }, [visibleAtFileMenuItems]);

  useEffect(() => {
    if (!selectedWorkspaceItems || !onSelectedWorkspaceItemsChange) {
      return;
    }

    const mentionQueries = new Set(allAtFileQueries.map((item) => item.query));
    selectedWorkspaceItems.forEach((item) => rememberSelectedItem(selectedItemByPathRef.current, item));

    const nextMentionOwnedPaths = new Set<string>();
    for (const path of mentionOwnedPathsRef.current) {
      const item = selectedItemByPathRef.current.get(path);
      if (!item) {
        continue;
      }

      if (getSelectedItemMatchKeys(item).some((key) => mentionQueries.has(key))) {
        nextMentionOwnedPaths.add(path);
      }
    }

    for (const item of selectedWorkspaceItems) {
      const path = getSelectedItemPath(item);
      if (!path) {
        continue;
      }

      if (getSelectedItemMatchKeys(item).some((key) => mentionQueries.has(key))) {
        nextMentionOwnedPaths.add(path);
      }
    }

    const incomingPaths = new Set<string>();
    for (const item of selectedWorkspaceItems) {
      const path = getSelectedItemPath(item);
      if (path) {
        incomingPaths.add(path);
      }
    }

    const nextExternalOwnedPaths = new Set(
      Array.from(externalOwnedPathsRef.current).filter((path) => incomingPaths.has(path))
    );
    for (const path of incomingPaths) {
      if (!nextMentionOwnedPaths.has(path) && !everMentionOwnedPathsRef.current.has(path)) {
        nextExternalOwnedPaths.add(path);
      }
    }

    mentionOwnedPathsRef.current = nextMentionOwnedPaths;
    nextMentionOwnedPaths.forEach((path) => {
      everMentionOwnedPathsRef.current.add(path);
    });
    externalOwnedPathsRef.current = nextExternalOwnedPaths;

    const nextItems = buildOwnedSelectionItems(
      selectedWorkspaceItems,
      mentionOwnedPathsRef.current,
      externalOwnedPathsRef.current,
      selectedItemByPathRef.current
    );

    if (!areSelectionItemsEquivalent(selectedWorkspaceItems, nextItems)) {
      onSelectedWorkspaceItemsChange(nextItems);
    }
  }, [allAtFileQueries, onSelectedWorkspaceItemsChange, selectedWorkspaceItems]);

  const handleExternalSelectionAppend = useCallback((items: FileSelectionItem[]) => {
    for (const item of items) {
      const path = getSelectedItemPath(item);
      if (!path) {
        continue;
      }

      if (suppressedExternalAppendPathsRef.current.has(path)) {
        suppressedExternalAppendPathsRef.current.delete(path);
        continue;
      }

      rememberSelectedItem(selectedItemByPathRef.current, item);
      externalOwnedPathsRef.current.add(path);
    }
  }, []);

  useAddEventListener(
    'gemini.selected.file.append',
    (items: FileSelectionItem[]) => {
      if (conversationContext?.type === 'gemini') {
        handleExternalSelectionAppend(items);
      }
    },
    [conversationContext?.type, handleExternalSelectionAppend]
  );
  useAddEventListener(
    'wcore.selected.file.append',
    (items: FileSelectionItem[]) => {
      if (conversationContext?.type === 'wcore') {
        handleExternalSelectionAppend(items);
      }
    },
    [conversationContext?.type, handleExternalSelectionAppend]
  );
  useAddEventListener(
    'acp.selected.file.append',
    (items: FileSelectionItem[]) => {
      if (conversationContext?.type === 'acp') {
        handleExternalSelectionAppend(items);
      }
    },
    [conversationContext?.type, handleExternalSelectionAppend]
  );
  useAddEventListener(
    'remote.selected.file.append',
    (items: FileSelectionItem[]) => {
      if (conversationContext?.type === 'remote') {
        handleExternalSelectionAppend(items);
      }
    },
    [conversationContext?.type, handleExternalSelectionAppend]
  );
  useAddEventListener(
    'openclaw-gateway.selected.file.append',
    (items: FileSelectionItem[]) => {
      if (conversationContext?.type === 'openclaw-gateway') {
        handleExternalSelectionAppend(items);
      }
    },
    [conversationContext?.type, handleExternalSelectionAppend]
  );
  useAddEventListener(
    'nanobot.selected.file.append',
    (items: FileSelectionItem[]) => {
      if (conversationContext?.type === 'nanobot') {
        handleExternalSelectionAppend(items);
      }
    },
    [conversationContext?.type, handleExternalSelectionAppend]
  );
  useAddEventListener(
    'codex.selected.file.append',
    (items: FileSelectionItem[]) => {
      if (conversationContext?.type === 'codex') {
        handleExternalSelectionAppend(items);
      }
    },
    [conversationContext?.type, handleExternalSelectionAppend]
  );

  const emitSelectedFileAppend = useCallback(
    (item: FileOrFolderItem) => {
      switch (conversationContext?.type) {
        case 'gemini':
          emitter.emit('gemini.selected.file.append', [item]);
          break;
        case 'wcore':
          emitter.emit('wcore.selected.file.append', [item]);
          break;
        case 'acp':
          emitter.emit('acp.selected.file.append', [item]);
          break;
        case 'remote':
          emitter.emit('remote.selected.file.append', [item]);
          break;
        case 'openclaw-gateway':
          emitter.emit('openclaw-gateway.selected.file.append', [item]);
          break;
        case 'nanobot':
          emitter.emit('nanobot.selected.file.append', [item]);
          break;
        case 'codex':
          emitter.emit('codex.selected.file.append', [item]);
          break;
        default:
          break;
      }
    },
    [conversationContext?.type]
  );

  const insertSelectedAtFile = useCallback(
    (item: FileOrFolderItem) => {
      if (!activeAtFileQuery) {
        return;
      }

      const nextInsertion = buildAtFileInsertion(item);
      const nextValue = input.slice(0, activeAtFileQuery.start) + nextInsertion + input.slice(activeAtFileQuery.end);
      const nextCaret = activeAtFileQuery.start + nextInsertion.length;
      const insertedTokenKey = `${activeAtFileQuery.start}:${nextInsertion.slice(1)}`;
      const path = getSelectedItemPath(item);

      setDismissedAtFileToken(insertedTokenKey);
      setInput(nextValue);
      if (path) {
        rememberSelectedItem(selectedItemByPathRef.current, item);
        mentionOwnedPathsRef.current.add(path);
        everMentionOwnedPathsRef.current.add(path);
        suppressedExternalAppendPathsRef.current.add(path);
      }
      if (selectedWorkspaceItems && onSelectedWorkspaceItemsChange) {
        const mergedItems = mergeFileSelectionItems(selectedWorkspaceItems, [item]);
        const nextItems = buildOwnedSelectionItems(
          mergedItems,
          mentionOwnedPathsRef.current,
          externalOwnedPathsRef.current,
          selectedItemByPathRef.current
        );
        onSelectedWorkspaceItemsChange(nextItems);
      }
      emitSelectedFileAppend(item);

      requestAnimationFrame(() => {
        const textarea = getTextareaElement();
        if (!textarea) {
          return;
        }
        textarea.focus();
        textarea.setSelectionRange(nextCaret, nextCaret);
        setCaretPosition(nextCaret);
      });
    },
    [
      activeAtFileQuery,
      emitSelectedFileAppend,
      getTextareaElement,
      input,
      onSelectedWorkspaceItemsChange,
      selectedWorkspaceItems,
      setInput,
    ]
  );

  // Use shared IME composition handling
  const { compositionHandlers, isComposingState, createKeyDownHandler } = useCompositionInput();

  // Use shared PasteService integration
  const { onPaste, onFocus: handlePasteFocus } = usePasteService({
    supportedExts,
    onFilesAdded,
    conversationId: conversationContext?.conversationId,
    onTextPaste: (text: string) => {
      // Handle cleaned text paste; insert text at the current caret position instead of replacing entire content
      const textarea = document.activeElement as HTMLTextAreaElement;
      if (textarea && textarea.tagName === 'TEXTAREA') {
        const cursorPosition = textarea.selectionStart;
        const currentValue = textarea.value;
        const start = textarea.selectionStart ?? textarea.value.length;
        const end = textarea.selectionEnd ?? start;
        const newValue = currentValue.slice(0, start) + text + currentValue.slice(end);
        setInput(newValue);
        // Set caret to the position after the inserted text
        setTimeout(() => {
          textarea.setSelectionRange(cursorPosition + text.length, cursorPosition + text.length);
        }, 0);
      } else {
        // If caret position is unavailable, fall back to appending at the end
        setInput(text);
      }
    },
  });
  const markMobileFocusIntent = useCallback(() => {
    if (!isMobile) return;
    mobileUserFocusIntentUntilRef.current = Date.now() + 1500;
  }, [isMobile]);

  const handleInputFocus = useCallback(() => {
    if (isMobile && Date.now() > mobileUserFocusIntentUntilRef.current) {
      blurActiveElement();
      return;
    }
    if (isMobile && shouldBlockMobileInputFocus()) {
      blurActiveElement();
      return;
    }
    mobileUserFocusIntentUntilRef.current = 0;
    handlePasteFocus();
    setIsInputFocused(true);

    // Pre-warm worker bootstrap after focus stays for 1s (debounce).
    // Avoids triggering warmup for every conversation during rapid switching.
    const cid = conversationContext?.conversationId;
    if (cid && warmedConversationRef.current !== cid) {
      if (warmupTimerRef.current) clearTimeout(warmupTimerRef.current);
      warmupTimerRef.current = setTimeout(() => {
        warmedConversationRef.current = cid;
        // intentional fire-and-forget; failure is non-actionable
        ipcBridge.conversation.warmup.invoke({ conversation_id: cid }).catch(() => {});
      }, 1000);
    }
  }, [handlePasteFocus, isMobile, conversationContext?.conversationId]);
  const handleInputBlur = useCallback(() => {
    if (warmupTimerRef.current) {
      clearTimeout(warmupTimerRef.current);
      warmupTimerRef.current = null;
    }
    setIsInputFocused(false);
  }, []);

  useEffect(() => {
    historyDraftRef.current = null;
    setHistoryNavigationIndex(null);
    mentionOwnedPathsRef.current = new Set();
    everMentionOwnedPathsRef.current = new Set();
    externalOwnedPathsRef.current = new Set();
    selectedItemByPathRef.current = new Map();
    suppressedExternalAppendPathsRef.current = new Set();
  }, [conversationContext?.conversationId]);

  const applyHistoryInput = useCallback(
    (value: string) => {
      setInputRef.current(value);
      requestAnimationFrame(() => {
        const textarea = containerRef.current?.querySelector('textarea');
        if (!(textarea instanceof HTMLTextAreaElement)) {
          return;
        }
        const caret = textarea.value.length;
        textarea.setSelectionRange(caret, caret);
      });
    },
    [setInputRef]
  );

  const exitHistoryNavigation = useCallback(
    (restoreDraft: boolean) => {
      const draft = historyDraftRef.current;
      historyDraftRef.current = null;
      setHistoryNavigationIndex(null);
      if (restoreDraft && draft !== null) {
        applyHistoryInput(draft);
      }
    },
    [applyHistoryInput]
  );

  const handleHistoryKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return false;
      }

      if (!(event.currentTarget instanceof HTMLTextAreaElement)) {
        return false;
      }

      if (event.key === 'Escape' && historyNavigationIndex !== null) {
        event.preventDefault();
        exitHistoryNavigation(true);
        return true;
      }

      if (!inputHistory.length) {
        return false;
      }

      if (event.key === 'ArrowUp') {
        if (historyNavigationIndex === null && !isCaretOnFirstLine(event.currentTarget)) {
          return false;
        }

        const nextIndex =
          historyNavigationIndex === null ? 0 : Math.min(historyNavigationIndex + 1, inputHistory.length - 1);
        const nextValue = inputHistory[nextIndex];
        if (nextValue === undefined) {
          return false;
        }

        if (historyNavigationIndex === null) {
          historyDraftRef.current = latestInputRef.current;
        }

        event.preventDefault();
        setHistoryNavigationIndex(nextIndex);
        applyHistoryInput(nextValue);
        return true;
      }

      if (event.key === 'ArrowDown' && historyNavigationIndex !== null) {
        event.preventDefault();
        if (historyNavigationIndex === 0) {
          exitHistoryNavigation(true);
          return true;
        }

        const nextIndex = historyNavigationIndex - 1;
        const nextValue = inputHistory[nextIndex];
        if (nextValue === undefined) {
          exitHistoryNavigation(true);
          return true;
        }

        setHistoryNavigationIndex(nextIndex);
        applyHistoryInput(nextValue);
        return true;
      }

      return false;
    },
    [applyHistoryInput, exitHistoryNavigation, historyNavigationIndex, inputHistory, latestInputRef]
  );

  const handleAtFileMenuKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isAtFileMenuOpen || !activeAtFileTokenKey) {
        return false;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        setDismissedAtFileToken(activeAtFileTokenKey);
        return true;
      }

      if (!visibleAtFileMenuItems.length) {
        return false;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setAtFileMenuActiveIndex((previous) => (previous + 1) % visibleAtFileMenuItems.length);
        return true;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setAtFileMenuActiveIndex((previous) => (previous === 0 ? visibleAtFileMenuItems.length - 1 : previous - 1));
        return true;
      }

      if (event.key === 'Enter') {
        const selectedItem = visibleAtFileMenuItems[atFileMenuActiveIndex];
        if (!selectedItem) {
          return false;
        }
        event.preventDefault();
        insertSelectedAtFile(selectedItem);
        return true;
      }

      return false;
    },
    [activeAtFileTokenKey, atFileMenuActiveIndex, insertSelectedAtFile, isAtFileMenuOpen, visibleAtFileMenuItems]
  );

  const sendMessageHandler = () => {
    if (isUploading) return;
    if (enableBtw && btwQuestion !== null) {
      const normalizedQuestion = btwQuestion.trim();
      if (!normalizedQuestion) {
        message.warning(t('conversation.sideQuestion.emptyQuestion'));
        return;
      }
      if (btwCommand.isLoading) {
        message.warning(t('conversation.sideQuestion.alreadyRunning'));
        return;
      }
      if (hasPendingAttachments || domSnippets.length > 0) {
        message.warning(t('conversation.sideQuestion.attachmentsNotAllowed'));
        return;
      }
      historyDraftRef.current = null;
      setHistoryNavigationIndex(null);
      setInput('');
      void btwCommand.ask(normalizedQuestion);
      return;
    }

    if (!allowSendWhileLoading && (isLoading || loading)) {
      console.info('[sendbox]', {
        event: 'blocked-while-loading',
        allowSendWhileLoading,
        isLoading,
        loading,
      });
      message.warning(t('messages.conversationInProgress'));
      return;
    }
    if (!input.trim() && domSnippets.length === 0) {
      return;
    }
    console.info('[sendbox]', {
      event: 'submit',
      allowSendWhileLoading,
      isLoading,
      loading,
      inputLength: input.length,
      domSnippetCount: domSnippets.length,
    });
    setIsLoading(true);
    historyDraftRef.current = null;
    setHistoryNavigationIndex(null);

    // Build message content
    let finalMessage = input;

    // Prepend reply quote as blockquote
    if (replyQuote) {
      const quotedLines = replyQuote.content
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');
      finalMessage = `${quotedLines}\n\n${finalMessage}`;
    }

    // If has DOM snippets, append full HTML
    if (domSnippets.length > 0) {
      const snippetsHtml = domSnippets
        .map((s) => `\n\n---\nDOM Snippet (${s.tag}):\n\`\`\`html\n${s.html}\n\`\`\``)
        .join('');
      finalMessage = input + snippetsHtml;
    }

    // Clear input immediately to prevent async onSend completion from overwriting new user input
    setInput('');
    clearDomSnippets();
    setReplyQuote(null);

    onSend(finalMessage)
      .catch((err) => {
        console.warn('[sendbox.send] onSend failed', {
          conversationId: conversationContext?.conversationId,
          messageLength: finalMessage.length,
          hasDomSnippets: domSnippets.length > 0,
          error: err,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const stopHandler = async () => {
    if (!onStop) return;
    try {
      await onStop();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeechTranscript = useCallback(
    (transcript: string) => {
      const currentValue = latestInputRef.current;
      setInputRef.current(appendSpeechTranscript(currentValue, transcript));
    },
    [latestInputRef, setInputRef]
  );
  const speechLocale = i18n?.language || 'en-US';

  const hasDraftToSend = input.trim().length > 0 || domSnippets.length > 0;

  // Calculate button disabled state
  const isButtonDisabled = disabled || isUploading || (!input.trim() && domSnippets.length === 0);

  // Reusable send button component
  const sendButton = (
    <Button
      shape='circle'
      type='primary'
      disabled={isButtonDisabled}
      className='send-button-custom'
      icon={<ArrowUp size={14} color='white' strokeWidth={3} />}
      onClick={() => {
        sendMessageHandler();
      }}
    />
  );

  const stopButton = (
    <Button
      shape='circle'
      type='secondary'
      className='bg-animate sendbox-stop-button'
      icon={<div className='mx-auto size-12px bg-6'></div>}
      onClick={stopHandler}
    ></Button>
  );

  // Visible "the agent is still working" indicator. Keys off the same
  // running/processing flag that decides whether the Stop button shows, so it
  // stays in lockstep across every platform that renders this shared SendBox.
  const isRunning = isLoading || loading;
  const runningIndicator = isRunning ? (
    <span className='sendbox-running' role='status' aria-live='polite'>
      <span className='sendbox-running-dot' aria-hidden='true' />
      {t('messages.working', { defaultValue: 'Working...' })}
    </span>
  ) : null;

  const renderActionButtons = () => {
    if (allowSendWhileLoading && (isLoading || loading)) {
      // Keep a single action slot while processing: show stop when the draft is empty,
      // and only switch back to send once the user has prepared a queued message.
      if (compactActions || !hasDraftToSend || disabled || isUploading) {
        return stopButton;
      }
      return sendButton;
    }

    if (isLoading || loading) {
      return stopButton;
    }

    return sendButton;
  };

  const shouldUseHighlightOverlay = !isComposingState && allAtFileQueries.length > 0;

  const renderHighlightedInputValue = useCallback(() => {
    if (!input) {
      return <span className='sendbox-highlight-text'>{'\u200b'}</span>;
    }

    const segments: React.ReactNode[] = [];
    let cursor = 0;

    allAtFileQueries.forEach((match, index) => {
      if (cursor < match.start) {
        segments.push(
          <span className='sendbox-highlight-text' key={`text-${cursor}`}>
            {input.slice(cursor, match.start)}
          </span>
        );
      }

      segments.push(
        <span
          className='sendbox-highlight-mention'
          key={`mention-${match.start}-${index}`}
          style={{ color: AT_FILE_HIGHLIGHT_COLOR }}
        >
          {input.slice(match.start, match.end)}
        </span>
      );
      cursor = match.end;
    });

    if (cursor < input.length) {
      segments.push(
        <span className='sendbox-highlight-text' key={`text-${cursor}`}>
          {input.slice(cursor)}
        </span>
      );
    }

    return segments;
  }, [allAtFileQueries, input]);

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className={`sendbox-panel relative p-16px border-3 b bg-dialog-fill-0 b-solid rd-20px flex flex-col ${isOverlayOpen ? 'overflow-visible' : 'overflow-hidden'} ${isFileDragging ? 'b-dashed sendbox-panel--dragging' : ''}`}
        style={{
          transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
          ...(isFileDragging
            ? {
                backgroundColor: 'var(--color-primary-light-1)',
                borderColor: 'rgb(var(--primary-3))',
                borderWidth: '1px',
              }
            : {
                borderWidth: '1px',
                borderColor: isInputActive ? activeBorderColor : inactiveBorderColor,
                boxShadow: isInputActive ? activeShadow : 'none',
              }),
        }}
        {...dragHandlers}
      >
        <BtwOverlay
          answer={btwCommand.answer}
          anchorEl={containerRef.current}
          isLoading={btwCommand.isLoading}
          isOpen={btwCommand.isOpen}
          onDismiss={btwCommand.dismiss}
          parentTaskRunning={Boolean(loading || isLoading)}
          question={btwCommand.question}
        />
        <DoctorReportModal visible={isDoctorModalOpen} onClose={() => setIsDoctorModalOpen(false)} />
        {isAtFileMenuOpen && (
          <div className='absolute left-12px right-12px bottom-[calc(100%+8px)] z-70'>
            <AtFileMenu
              activeIndex={atFileMenuActiveIndex}
              emptyText={
                deferredAtFileQuery
                  ? t('conversation.workspace.search.empty', { defaultValue: 'No files found' })
                  : t('messages.atFile.hint', { defaultValue: 'Type to search for files' })
              }
              items={visibleAtFileMenuItems}
              label={t('messages.atFile.menuLabel', { defaultValue: 'File mentions' })}
              loading={workspaceMentionLoading}
              loadingText={t('messages.atFile.loading', { defaultValue: 'Loading...' })}
              onHoverItem={setAtFileMenuActiveIndex}
              onSelectItem={insertSelectedAtFile}
            />
          </div>
        )}
        {isCommandMenuOpen && (
          <div className='absolute left-12px right-12px bottom-[calc(100%+8px)] z-70'>
            {conversationExport.step === 'menu' ? (
              <SlashCommandMenu
                title={t('messages.export.menuTitle')}
                hint={t('messages.export.menuHint')}
                items={conversationExport.menuItems}
                activeIndex={conversationExport.activeIndex}
                loading={conversationExport.loading}
                onHoverItem={conversationExport.setActiveIndex}
                onSelectItem={(item) => {
                  conversationExport.onSelectMenuItem(item.key);
                }}
                emptyText={t('messages.slash.empty', { defaultValue: 'No commands found' })}
              />
            ) : conversationExport.step === 'filename' ? (
              renderExportFileNamePanel()
            ) : (
              <SlashCommandMenu
                title={t('messages.slash.title', { defaultValue: 'Commands' })}
                hint={t('messages.slash.hint', { defaultValue: 'Type / to open command menu' })}
                items={slashMenuItems}
                activeIndex={slashController.activeIndex}
                loading={false}
                onHoverItem={slashController.setActiveIndex}
                onSelectItem={(item) => {
                  const targetIndex = slashController.filteredCommands.findIndex(
                    (command) => command.name === item.key
                  );
                  if (targetIndex >= 0) {
                    slashController.onSelectByIndex(targetIndex);
                  }
                }}
                emptyText={t('messages.slash.empty', { defaultValue: 'No commands found' })}
              />
            )}
          </div>
        )}
        <div style={{ width: '100%' }}>
          {prefix}
          {context}
          {/* Reply quote preview */}
          {replyQuote && (
            <div className='flex items-start gap-10px mb-8px px-12px py-10px rd-10px bg-fill-1 b-1 b-solid b-border-2'>
              <div className='flex-shrink-0 mt-2px' style={{ lineHeight: 0 }}>
                <Quote size={16} color='rgb(var(--primary-6))' />
              </div>
              <div className='flex-1 min-w-0 text-13px text-t-primary line-clamp-3 lh-20px whitespace-pre-wrap break-all'>
                {replyQuote.content}
              </div>
              <div
                className='flex-shrink-0 mt-2px p-2px rd-full cursor-pointer hover:bg-fill-3 transition-colors'
                onClick={() => setReplyQuote(null)}
                style={{ lineHeight: 0 }}
              >
                <X size={14} />
              </div>
            </div>
          )}
          {/* DOM snippet tags */}
          {domSnippets.length > 0 && (
            <div className='flex flex-wrap gap-6px mb-8px'>
              {domSnippets.map((snippet) => (
                <Tag
                  key={snippet.id}
                  closable
                  closeIcon={<X size={12} />}
                  onClose={() => removeDomSnippet(snippet.id)}
                  className='text-12px bg-fill-2 b-1 b-solid b-border-2 rd-4px'
                >
                  {snippet.tag}
                </Tag>
              ))}
            </div>
          )}
          {unmatchedSelectedWorkspaceItems.length > 0 && onSelectedWorkspaceItemsChange && (
            <div className='flex flex-wrap gap-6px mb-8px'>
              {unmatchedSelectedWorkspaceItems.map((item) => (
                <Tag
                  key={typeof item === 'string' ? item : item.path}
                  closable
                  closeIcon={<X size={12} />}
                  onClose={() => {
                    const path = getSelectedItemPath(item);
                    if (!path) {
                      return;
                    }
                    externalOwnedPathsRef.current.delete(path);
                    const nextItems = buildOwnedSelectionItems(
                      selectedWorkspaceItems ?? [],
                      mentionOwnedPathsRef.current,
                      externalOwnedPathsRef.current,
                      selectedItemByPathRef.current
                    );
                    onSelectedWorkspaceItemsChange(nextItems);
                  }}
                  className='text-12px bg-fill-2 b-1 b-solid b-border-2 rd-4px'
                >
                  {getSelectedItemDisplayLabel(item)}
                </Tag>
              ))}
            </div>
          )}
        </div>
        <UploadProgressBar source='sendbox' />
        <div
          className={isSingleLine ? 'flex items-center gap-2 w-full min-w-0 overflow-hidden' : 'w-full overflow-hidden'}
        >
          {isSingleLine && (
            <div className={isMobile ? 'sendbox-tools sendbox-tools-scroll-mobile' : 'flex-shrink-0 sendbox-tools'}>
              {tools}
            </div>
          )}
          <div
            className={`sendbox-highlight-container ${isSingleLine ? 'sendbox-highlight-container--single' : ''}`}
            style={{
              width: isSingleLine ? 'auto' : '100%',
              flex: isSingleLine ? 1 : 'none',
              minWidth: 0,
              maxWidth: '100%',
              marginBottom: isSingleLine ? 0 : '8px',
              minHeight: isSingleLine ? '20px' : '40px',
            }}
          >
            <div
              ref={highlightScrollRef}
              aria-hidden='true'
              className={`sendbox-highlight-layer text-14px ${isMobile ? 'sendbox-input--mobile' : ''} ${isSingleLine ? 'sendbox-highlight-layer--single' : ''}`}
              data-testid='sendbox-highlight-layer'
              style={!shouldUseHighlightOverlay ? { visibility: 'hidden' } : undefined}
            >
              {renderHighlightedInputValue()}
            </div>
            <Input.TextArea
              autoFocus={!isMobile}
              disabled={disabled}
              spellCheck={false}
              value={input}
              placeholder={placeholder}
              className={`${shouldUseHighlightOverlay ? 'sendbox-highlight-textarea ' : ''}pl-0 pr-0 !b-none focus:shadow-none m-0 !bg-transparent !focus:bg-transparent !hover:bg-transparent lh-[20px] !resize-none text-14px ${isMobile ? 'sendbox-input--mobile' : ''}`}
              style={{
                width: isSingleLine ? 'auto' : '100%',
                flex: isSingleLine ? 1 : 'none',
                minWidth: 0,
                maxWidth: '100%',
                marginLeft: 0,
                marginRight: 0,
                marginBottom: 0,
                height: isSingleLine ? '20px' : 'auto',
                minHeight: isSingleLine ? '20px' : '40px',
                overflowY: isSingleLine ? 'hidden' : 'auto',
                overflowX: 'hidden',
                whiteSpace: isSingleLine ? 'nowrap' : 'pre-wrap',
                textOverflow: isSingleLine ? 'ellipsis' : 'clip',
                wordBreak: isSingleLine ? 'normal' : 'break-word',
                overflowWrap: 'break-word',
              }}
              onChange={handleTextAreaChange}
              onPaste={onPaste}
              onTouchStart={markMobileFocusIntent}
              onMouseDown={markMobileFocusIntent}
              onClick={(event) => {
                syncCaretPosition(event.target);
              }}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyUp={(event) => {
                syncCaretPosition(event.currentTarget);
              }}
              onSelect={(event) => {
                syncCaretPosition(event.currentTarget);
              }}
              onScroll={(event) => {
                syncHighlightScroll(event.currentTarget);
              }}
              {...compositionHandlers}
              autoSize={isSingleLine ? false : { minRows: 1, maxRows: 10 }}
              onKeyDown={createKeyDownHandler(sendMessageHandler, (event) => {
                return handleAtFileMenuKeyDown(event) || handleOverlayKeyDown(event) || handleHistoryKeyDown(event);
              })}
            ></Input.TextArea>
          </div>
          {isSingleLine && (
            <div className='flex items-center gap-2'>
              {runningIndicator}
              <SpeechInputButton
                disabled={disabled || isLoading || loading || isUploading}
                locale={speechLocale}
                onTranscript={handleSpeechTranscript}
              />
              {sendButtonPrefix}
              {renderActionButtons()}
            </div>
          )}
        </div>
        {!isSingleLine && (
          <div className='flex items-center justify-between gap-2 w-full'>
            <div className={isMobile ? 'sendbox-tools sendbox-tools-scroll-mobile' : 'sendbox-tools'}>{tools}</div>
            <div className='flex items-center gap-2'>
              {runningIndicator}
              <SpeechInputButton
                disabled={disabled || isLoading || loading || isUploading}
                locale={speechLocale}
                onTranscript={handleSpeechTranscript}
              />
              {sendButtonPrefix}
              {renderActionButtons()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SendBox;
