/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { transformMessage } from '@/common/chat/chatLib';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';
import type { TChatConversation, TokenUsageData } from '@/common/config/storage';
import type { ThoughtData } from '@/renderer/components/chat/ThoughtDisplay';
import { useAddOrUpdateMessage, useClearErrorTips } from '@/renderer/pages/conversation/Messages/hooks';
import { useTabResumeEffect } from '@/renderer/hooks/system/useTabResumeEffect';
import { isToolUnsupportedErrorMessage } from '@/renderer/utils/model/errorDetection';
import i18n from '@/renderer/services/i18n';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type TokenUsage = {
  input_tokens?: number;
  output_tokens?: number;
};

export const useWCoreMessage = (
  conversation_id: string,
  options?: {
    onError?: (message: IResponseMessage) => void;
    onConfigChanged?: (capabilities: Record<string, unknown>) => void;
  }
) => {
  const onError = options?.onError;
  const onConfigChanged = options?.onConfigChanged;
  const onConfigChangedRef = useRef(onConfigChanged);
  const addOrUpdateMessage = useAddOrUpdateMessage();
  const clearErrorTips = useClearErrorTips();
  const [streamRunning, setStreamRunning] = useState(false);
  const [hasActiveTools, setHasActiveTools] = useState(false);
  const [waitingResponse, setWaitingResponse] = useState(false);
  const [hasHydratedRunningState, setHasHydratedRunningState] = useState(false);
  const [thought, setThought] = useState<ThoughtData>({
    description: '',
    subject: '',
  });
  const [tokenUsage, setTokenUsage] = useState<TokenUsageData | null>(null);
  // Current active message ID to filter out events from old requests (prevents aborted request events from interfering with new ones)
  const activeMsgIdRef = useRef<string | null>(null);

  // Use refs to avoid useEffect re-subscription when these states change
  const hasActiveToolsRef = useRef(hasActiveTools);
  const streamRunningRef = useRef(streamRunning);
  const waitingResponseRef = useRef(waitingResponse);

  // Track whether current turn has content output
  // Only reset waitingResponse when finish arrives after content (not after tool calls)
  const hasContentInTurnRef = useRef(false);

  // Track whether the turn ended in an error: set on an `error` frame, cleared
  // whenever successful output (content/tool_group) arrives after it (which means
  // the error was a transient mid-turn diagnostic, not fatal). Used on `finish`
  // to decide whether the error tip is fatal (keep) or transient (clear). (#101)
  const turnEndedInErrorRef = useRef(false);

  // #486: tool cards (callId -> last active status) the backend has reported as
  // active (Executing/Confirming/Pending) but not yet terminalized with a
  // matching-callId completion frame. The engine can end a turn without
  // delivering that frame (root cause wayland-core#133, the ChatGPT-subscription
  // parallel/builtin path), which strands the step-panel spinner after the
  // assistant has already responded. On stream_end we terminalize whatever is
  // left here as defense-in-depth, mirroring the resume-time running reconcile.
  // The prior status decides the terminal status (an Executing tool most likely
  // finished; a Pending/Confirming one never ran), so we never assert a false
  // success on a tool that never executed.
  const activeToolCallsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    onConfigChangedRef.current = onConfigChanged;
  }, [onConfigChanged]);
  useEffect(() => {
    hasActiveToolsRef.current = hasActiveTools;
  }, [hasActiveTools]);
  useEffect(() => {
    streamRunningRef.current = streamRunning;
  }, [streamRunning]);

  // Throttle thought updates to reduce render frequency
  const thoughtThrottleRef = useRef<{
    lastUpdate: number;
    pending: ThoughtData | null;
    timer: ReturnType<typeof setTimeout> | null;
  }>({ lastUpdate: 0, pending: null, timer: null });

  const throttledSetThought = useMemo(() => {
    const THROTTLE_MS = 50; // 50ms throttle interval
    return (data: ThoughtData) => {
      const now = Date.now();
      const ref = thoughtThrottleRef.current;

      if (now - ref.lastUpdate >= THROTTLE_MS) {
        ref.lastUpdate = now;
        ref.pending = null;
        if (ref.timer) {
          clearTimeout(ref.timer);
          ref.timer = null;
        }
        setThought(data);
      } else {
        ref.pending = data;
        if (!ref.timer) {
          ref.timer = setTimeout(
            () => {
              ref.lastUpdate = Date.now();
              ref.timer = null;
              if (ref.pending) {
                setThought(ref.pending);
                ref.pending = null;
              }
            },
            THROTTLE_MS - (now - ref.lastUpdate)
          );
        }
      }
    };
  }, []);

  // Cleanup throttle timer
  useEffect(() => {
    return () => {
      if (thoughtThrottleRef.current.timer) {
        clearTimeout(thoughtThrottleRef.current.timer);
      }
    };
  }, []);

  // Combined running state: waiting for response OR stream is running OR tools are active
  const running = waitingResponse || streamRunning || hasActiveTools;

  // Set current active message ID
  const setActiveMsgId = useCallback((msgId: string | null) => {
    activeMsgIdRef.current = msgId;
  }, []);

  useEffect(() => {
    return ipcBridge.conversation.responseStream.on((message) => {
      if (conversation_id !== message.conversation_id) {
        return;
      }

      // Filter out events not belonging to current active request (prevents aborted events from interfering)
      // Note: only filter out thought and start messages, other messages must be rendered
      if (activeMsgIdRef.current && message.msg_id && message.msg_id !== activeMsgIdRef.current) {
        if (message.type === 'thought') {
          return;
        }
      }

      switch (message.type) {
        case 'thought':
          // Auto-recover streamRunning if thought arrives after finish
          if (!streamRunningRef.current) {
            setStreamRunning(true);
            streamRunningRef.current = true;
          }
          throttledSetThought(message.data as ThoughtData);
          break;
        case 'start':
          setStreamRunning(true);
          streamRunningRef.current = true;
          turnEndedInErrorRef.current = false;
          // #486: a new turn starts fresh. Drop any tool cards left tracked as
          // active by a prior turn that ended without a `finish` (e.g. an error
          // frame with no trailing stream_end), so they can't be mistakenly
          // terminalized against THIS turn's finish. Note we deliberately do NOT
          // clear on `error`: a mid-turn error can be transient and followed by
          // more tool activity in the same turn, which must stay tracked.
          activeToolCallsRef.current.clear();
          // Don't reset waitingResponse here - let tool completion flow handle it
          break;
        case 'finish':
          {
            // wcore stream_end carries usage in data field
            const usageData = message.data as TokenUsage | undefined;
            if (usageData && typeof usageData === 'object' && 'input_tokens' in usageData) {
              const newTokenUsage: TokenUsageData = {
                totalTokens: (usageData.input_tokens || 0) + (usageData.output_tokens || 0),
              };
              setTokenUsage(newTokenUsage);
              void ipcBridge.conversation.update.invoke({
                id: conversation_id,
                updates: {
                  extra: { lastTokenUsage: newTokenUsage } as TChatConversation['extra'],
                },
                mergeExtra: true,
              });
            }
            setStreamRunning(false);
            setWaitingResponse(false);
            setThought({ subject: '', description: '' });
            // Only drop transient mid-turn error tips (e.g. wcore's non-fatal
            // "Cache full miss: TtlExpiry") when the turn actually SUCCEEDED. A
            // turn that ENDS in an error must keep its error tip — that banner is
            // the only feedback the user gets that the request failed. The old
            // `hasContentInTurnRef` gate assumed fatal errors produce no content,
            // but agentic providers (e.g. Groq Compound's "tool calling is not
            // supported" 400) stream a preamble frame before erroring, so the
            // fatal tip was being cleared. Gate on the turn's terminal state
            // instead: the error frame was the last meaningful event, or the
            // engine reported finish_reason 'error'. (#101)
            const finishReason = (message.data as { finish_reason?: string } | undefined)?.finish_reason;
            const turnEndedInError = turnEndedInErrorRef.current || finishReason === 'error';
            if (hasContentInTurnRef.current && !turnEndedInError) {
              clearErrorTips();
            }

            // #486 defense-in-depth: the turn has ended, so no tool can still be
            // running. Terminalize any card the engine left active (missing
            // completion frame) so the step-panel spinner stops. We emit a
            // status-only update per callId: composeMessage merges by callId and
            // spreads over the existing card, so the name / resultDisplay /
            // description are preserved and a real completion frame that arrives
            // later still wins. If the turn errored, everything is Error;
            // otherwise an Executing tool most likely finished (Success), while
            // a Pending/Confirming one never actually ran (Canceled) — so we
            // never paint a false success on a tool that never executed.
            if (activeToolCallsRef.current.size > 0) {
              const data = Array.from(activeToolCallsRef.current.entries()).map(([callId, priorStatus]) => ({
                callId,
                status: turnEndedInError ? 'Error' : priorStatus === 'Executing' ? 'Success' : 'Canceled',
              }));
              activeToolCallsRef.current.clear();
              addOrUpdateMessage(
                transformMessage({
                  type: 'tool_group',
                  data,
                  msg_id: message.msg_id,
                  conversation_id,
                })
              );
            }
            // The turn is over: clear the global active-tools flag too, so the
            // combined `running` state can settle even if the last frame we saw
            // for a tool was non-terminal.
            setHasActiveTools(false);
            hasActiveToolsRef.current = false;
          }
          break;
        case 'tool_group':
          {
            // Mark that current turn has content output
            hasContentInTurnRef.current = true;
            // Successful output after an error means that error was transient.
            turnEndedInErrorRef.current = false;

            // Auto-recover streamRunning if tool_group arrives after finish
            if (!streamRunningRef.current) {
              setStreamRunning(true);
              streamRunningRef.current = true;
            }

            // Check if any tools are executing or awaiting confirmation
            const tools = message.data as Array<{ status: string; name?: string; callId?: string }>;
            const activeStatuses = new Set(['Executing', 'Confirming', 'Pending']);
            const hasActive = tools.some((tool) => activeStatuses.has(tool.status));
            const wasActive = hasActiveToolsRef.current;

            // #486: maintain the per-callId active set (callId -> its current
            // active status) so stream_end can terminalize any card the engine
            // never completed. Terminal frames (Success/Error/Canceled) drop the
            // card from the set.
            for (const tool of tools) {
              if (!tool.callId) continue;
              if (activeStatuses.has(tool.status)) {
                activeToolCallsRef.current.set(tool.callId, tool.status);
              } else {
                activeToolCallsRef.current.delete(tool.callId);
              }
            }

            setHasActiveTools(hasActive);
            hasActiveToolsRef.current = hasActive; // Sync update ref immediately

            // When tools transition from active to inactive, set waitingResponse=true
            // because backend needs to continue sending requests to model
            if (wasActive && !hasActive && tools.length > 0) {
              setWaitingResponse(true);
              waitingResponseRef.current = true;
            }

            // If tools are awaiting confirmation, update thought hint
            const confirmingTool = tools.find((tool) => tool.status === 'Confirming');
            if (confirmingTool) {
              setThought({
                subject: 'Awaiting Confirmation',
                description: confirmingTool.name || 'Tool execution',
              });
            } else if (hasActive) {
              const executingTool = tools.find((tool) => tool.status === 'Executing');
              if (executingTool) {
                setThought({
                  subject: 'Executing',
                  description: executingTool.name || 'Tool',
                });
              }
            } else if (!streamRunningRef.current) {
              // All tools completed and stream stopped, clear thought
              setThought({ subject: '', description: '' });
            }

            // Continue passing message to message list update
            addOrUpdateMessage(transformMessage(message));
          }
          break;
        case 'config_changed':
          onConfigChangedRef.current?.(message.data as Record<string, unknown>);
          break;
        case 'sub_agent_event':
          // v0.9.4 sub-agent activity card - create or update keyed by parentCallId.
          // transformMessage handles the status+body merge; composeMessage/hooks.ts
          // merges updates into the same card via msg_id = parentCallId.
          addOrUpdateMessage(transformMessage(message));
          break;
        default: {
          if (message.type === 'error') {
            // An error frame ends the turn. Clear ALL running contributors so the
            // "Processing/Working" spinner stops and the composer unlocks — a fatal
            // provider error (e.g. Compound's "tool calling is not supported") used
            // to leave the chat stuck running with no way to send again.
            setWaitingResponse(false);
            waitingResponseRef.current = false;
            setStreamRunning(false);
            streamRunningRef.current = false;
            setHasActiveTools(false);
            hasActiveToolsRef.current = false;
            setThought({ subject: '', description: '' });
            // Mark the turn as currently ended-in-error; a later content/tool_group
            // frame clears this if the turn actually continues and succeeds.
            turnEndedInErrorRef.current = true;
            // Tool-incapable models (e.g. OpenRouter's Aion-1.0) hard-fail because the
            // engine always attaches its built-in tools. Replace the opaque provider
            // 404 with a clean, actionable message before it is rendered as a tip.
            if (isToolUnsupportedErrorMessage(message.data)) {
              message.data = i18n.t('conversation.chat.toolUnsupported');
            }
            onError?.(message as IResponseMessage);
          } else {
            // Mark that current turn has content output (exclude error type)
            hasContentInTurnRef.current = true;
            // Successful content after an error means that error was transient.
            turnEndedInErrorRef.current = false;
            // Reset waitingResponse when actual content arrives
            if (message.type === 'content') {
              setWaitingResponse(false);
              waitingResponseRef.current = false;
            }
            // Auto-recover streamRunning if content arrives after finish
            if (!streamRunningRef.current) {
              setStreamRunning(true);
              streamRunningRef.current = true;
            }
          }
          // Backend handles persistence, Frontend only updates UI
          addOrUpdateMessage(transformMessage(message));
          break;
        }
      }
    });
    // Note: hasActiveTools and streamRunning are accessed via refs to avoid re-subscription
  }, [conversation_id, addOrUpdateMessage, onError, clearErrorTips]);

  useEffect(() => {
    let cancelled = false;

    setThought({ subject: '', description: '' });
    setTokenUsage(null);
    hasContentInTurnRef.current = false;
    turnEndedInErrorRef.current = false;
    activeToolCallsRef.current.clear();
    setHasHydratedRunningState(false);

    // Check actual conversation status from backend before resetting all running states
    // to avoid flicker when switching to a running conversation
    void ipcBridge.conversation.get.invoke({ id: conversation_id }).then((res) => {
      if (cancelled) {
        return;
      }

      if (!res) {
        setStreamRunning(false);
        streamRunningRef.current = false;
        setHasActiveTools(false);
        hasActiveToolsRef.current = false;
        setWaitingResponse(false);
        waitingResponseRef.current = false;
        setHasHydratedRunningState(true);
        return;
      }
      const isRunning = res.status === 'running';
      setStreamRunning(isRunning);
      streamRunningRef.current = isRunning;
      // Reset tool states - they will be restored by incoming messages if still active
      setHasActiveTools(false);
      hasActiveToolsRef.current = false;
      setWaitingResponse(isRunning);
      waitingResponseRef.current = isRunning;
      // Load persisted token usage stats
      if (res.type === 'wcore' && res.extra?.lastTokenUsage) {
        const { lastTokenUsage } = res.extra;
        if (lastTokenUsage.totalTokens > 0) {
          setTokenUsage(lastTokenUsage);
        }
      }
      setHasHydratedRunningState(true);
    });

    return () => {
      cancelled = true;
    };
  }, [conversation_id]);

  // Mobile web: the mount hydration above only runs on conversation change, so a
  // tab that was backgrounded while a turn finished comes back showing a stale
  // running state. On resume, re-check the backend status and reconcile. (#57)
  const reconcileRunningOnResume = useCallback(() => {
    void ipcBridge.conversation.get.invoke({ id: conversation_id }).then((res) => {
      if (!res) return;
      const isRunning = res.status === 'running';
      if (!isRunning && (streamRunningRef.current || waitingResponseRef.current)) {
        setStreamRunning(false);
        streamRunningRef.current = false;
        setWaitingResponse(false);
        waitingResponseRef.current = false;
        setHasActiveTools(false);
        hasActiveToolsRef.current = false;
      } else if (isRunning && !streamRunningRef.current) {
        setStreamRunning(true);
        streamRunningRef.current = true;
        setWaitingResponse(true);
        waitingResponseRef.current = true;
      }
    });
  }, [conversation_id, setStreamRunning, setWaitingResponse, setHasActiveTools]);

  useTabResumeEffect(reconcileRunningOnResume, [conversation_id]);

  const resetState = useCallback(() => {
    setWaitingResponse(false);
    waitingResponseRef.current = false;
    setStreamRunning(false);
    streamRunningRef.current = false;
    setHasActiveTools(false);
    hasActiveToolsRef.current = false;
    setThought({ subject: '', description: '' });
    hasContentInTurnRef.current = false;
    turnEndedInErrorRef.current = false;
    activeToolCallsRef.current.clear();
    // Clear active message ID to prevent filtering events from new messages after stop
    activeMsgIdRef.current = null;
  }, []);

  return {
    thought,
    setThought,
    running,
    hasHydratedRunningState,
    tokenUsage,
    setActiveMsgId,
    setWaitingResponse,
    resetState,
  };
};
