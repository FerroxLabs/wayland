/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WorkflowTranscript - the step-panel run surface (the "Workflow view").
 *
 * This is NOT a chat. It segments the underlying TMessage[] into the
 * workflow's steps and renders each step as a bordered panel driven by the
 * live session state (status / current_step / run_mode), matching the
 * collaborative mockup:
 *
 *   ┌─ ✓ STEP 1 · CONTENT AUDIT ─────────── 0:48 ─┐
 *   │  <the step's prose, flowing directly>        │
 *   │  ▸ Activity · 3 actions                       │
 *   └───────────────────────────────────────────────┘
 *   ┌─ ◴ STEP 2 · AUDIENCE ANALYSIS · live ────────┐   ← accent border + spinner
 *   │  …streaming…                                  │
 *   └───────────────────────────────────────────────┘
 *
 * Step boundaries come from `<step n="N" status="...">` markers when the
 * model emits them, but the panel CHROME (title, status, elapsed, live state)
 * comes from the session - so the surface looks like a workflow even when the
 * model is mid-reasoning and has emitted no markers yet (everything groups
 * under the current step's panel).
 *
 * User turns render as a distinct inset between panels, never as a chat bubble.
 * acp_permission renders verbatim (fully functional). agent_status is dropped.
 */

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Edit2,
  HelpCircle,
  Loader2,
  MinusCircle,
} from 'lucide-react';
import type {
  IMessageAcpToolCall,
  IMessageAcpPermission,
  IMessageToolGroup,
  IMessageText,
  IMessageThinking,
} from '@/common/chat/chatLib';
import type { StepState, WorkflowSession } from '@/common/types/workflowTypes';
import { WAYLAND_FILES_MARKER } from '@/common/config/constants';
import { redactCommandSecrets } from '@/common/utils/redactCommandSecrets';
import { useConversationContextSafe } from '@/renderer/hooks/context/ConversationContext';
import { useWorkflowViewMode } from '@/renderer/pages/guid/components/workflow/workflowViewMode';
import { WorkflowMessageBody } from '@renderer/pages/conversation/Messages/components/WorkflowMessageBody';
import MessageAcpPermission from '@renderer/pages/conversation/Messages/acp/MessageAcpPermission';
import MarkdownView from '@renderer/components/Markdown';
import { useMessageList } from '@renderer/pages/conversation/Messages/hooks';
import { stripThinkTags, hasThinkTags } from '@renderer/utils/chat/thinkTagFilter';
import { stripSkillSuggest, hasSkillSuggest } from '@renderer/utils/chat/skillSuggestParser';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './WorkflowTranscript.module.css';

// Mirror MessageText's envelope handling so the transcript shows the same clean
// prose the raw view does. The per-turn WORKFLOW_STEP_CONTEXT and the
// [workflow_answer] wrapper ride the user channel for cache safety but must be
// stripped before display; the hidden `begin <slug>` kickoff is hidden entirely.
const WORKFLOW_STEP_CONTEXT_RE = /\[workflow_step_context [^\]]*\][\s\S]*?\[\/workflow_step_context\]\s*/g;
const WORKFLOW_ANSWER_RE = /\[workflow_answer [^\]]*\]\s*<answer>([\s\S]*?)<\/answer>\s*\[\/workflow_answer\]\s*/g;
const BEGIN_COMMAND_RE = /^begin\s+[a-z0-9][a-z0-9-]*\s*$/i;
// First `<step n="N" status="...">` marker in an assistant body - drives segmentation.
const STEP_MARKER_RE = /<step\s+n=["']?(\d+)["']?(?:\s+status=["']?([a-z_]+)["']?)?/i;

const stripWorkflowEnvelopes = (text: string): string =>
  text
    .replace(WORKFLOW_STEP_CONTEXT_RE, '')
    .replace(WORKFLOW_ANSWER_RE, (_m, answer: string) => answer)
    .trimStart();

/** The raw string content of a text message, or '' when absent. */
const textOf = (m: IMessageText): string => {
  const c = (m.content as { content?: unknown } | undefined)?.content;
  return typeof c === 'string' ? c : '';
};

/**
 * Extract the displayable assistant prose, mirroring MessageText's pipeline so
 * the transcript shows exactly what the conversation view shows. Without this,
 * raw `<think>` reasoning tags reach MarkdownView, which swallows the unknown
 * HTML element (and the real prose inside it) - rendering an empty body.
 */
const extractAssistantBody = (m: IMessageText): string => {
  let content = textOf(m);
  if (hasThinkTags(content)) content = stripThinkTags(content);
  if (hasSkillSuggest(content)) content = stripSkillSuggest(content);
  const markerIndex = content.indexOf(WAYLAND_FILES_MARKER);
  if (markerIndex !== -1) content = content.slice(0, markerIndex).trimEnd();
  return content;
};

// ---------------------------------------------------------------------------
// Block model
// ---------------------------------------------------------------------------

type ActivityItem = {
  kind: 'activity';
  id: string;
  messages: Array<IMessageToolGroup | IMessageAcpToolCall | IMessageThinking>;
};
type AssistantItem = { kind: 'assistant'; id: string; body: string };
type PermissionItem = { kind: 'permission'; id: string; message: IMessageAcpPermission };
type StepItem = ActivityItem | AssistantItem | PermissionItem;

type StepBlock = {
  kind: 'step';
  id: string;
  stepN: number;
  /** Header shown only the first time a step appears (continuations are headerless). */
  showHeader: boolean;
  /** A `status="done"` (or skipped/errored) marker closed this step in this block. */
  doneMarker: boolean;
  items: StepItem[];
};
type UserBlock = { kind: 'user'; id: string; text: string };
type Block = StepBlock | UserBlock;

type PanelStatus = 'done' | 'now' | 'review' | 'ask' | 'todo' | 'errored' | 'skipped';

// ---------------------------------------------------------------------------
// Status derivation - panel chrome comes from the session, not the markers
// ---------------------------------------------------------------------------

const panelStatusFor = (block: StepBlock, session: WorkflowSession | undefined, needsInput: boolean): PanelStatus => {
  const st: StepState | undefined = session?.steps.find((s) => s.n === block.stepN);
  if (block.doneMarker || st?.status === 'done') return 'done';
  if (st?.status === 'errored') return 'errored';
  if (st?.status === 'skipped') return 'skipped';
  if (session && block.stepN === session.current_step) {
    // Waiting on the user wins over "working": the live step reads as a question.
    if (needsInput) return 'ask';
    if (session.run_mode === 'awaiting_input') return 'review';
    return 'now';
  }
  return st?.status ?? 'todo';
};

const StatusIcon: React.FC<{ status: PanelStatus; live: boolean }> = ({ status, live }) => {
  const size = 15;
  if (live) return <Loader2 size={size} className={styles.spin} aria-hidden='true' />;
  switch (status) {
    case 'done':
      return <CheckCircle2 size={size} aria-hidden='true' />;
    case 'now':
      return <Loader2 size={size} className={styles.spin} aria-hidden='true' />;
    case 'review':
      return <Edit2 size={size} aria-hidden='true' />;
    case 'ask':
      return <HelpCircle size={size} aria-hidden='true' />;
    case 'errored':
      return <AlertCircle size={size} aria-hidden='true' />;
    case 'skipped':
      return <MinusCircle size={size} aria-hidden='true' />;
    default:
      return <Circle size={size} aria-hidden='true' />;
  }
};

const formatMmSs = (totalSeconds: number): string => {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.max(0, totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const subLineFor = (block: StepBlock, status: PanelStatus, session: WorkflowSession | undefined): string | null => {
  const st = session?.steps.find((s) => s.n === block.stepN);
  if (status === 'done' && st?.started_at != null && st?.completed_at != null) {
    return formatMmSs(Math.floor((st.completed_at - st.started_at) / 1000));
  }
  return null;
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const ActivityBlock: React.FC<{ item: ActivityItem }> = ({ item }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const count = item.messages.length;

  const titles = item.messages.map((m) => {
    if (m.type === 'thinking') return t('workflow.transcript.thinking');
    if (m.type === 'tool_group') return m.content?.[0]?.name ?? 'Tool';
    const acpTitle = (m as IMessageAcpToolCall).content?.update?.title;
    return acpTitle ? redactCommandSecrets(acpTitle) : 'Action';
  });

  return (
    <div className={styles.activity}>
      <button className={styles.activityHeader} onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
        <span className={styles.activityIcon}>{expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</span>
        <span className={styles.activityLabel}>{t('workflow.transcript.activity', { count })}</span>
      </button>
      {expanded && (
        <ul className={styles.activityList}>
          {titles.map((title, i) => (
            <li key={i} className={styles.activityItem}>
              {title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const StepPanel: React.FC<{
  block: StepBlock;
  session: WorkflowSession | undefined;
  stepTitles: string[];
  workflowSessionId: string | undefined;
  needsInput: boolean;
}> = ({ block, session, stepTitles, workflowSessionId, needsInput }) => {
  const { t } = useTranslation();
  const status = panelStatusFor(block, session, needsInput);
  const live = status === 'now' && session?.run_mode === 'running';
  const isActive = status === 'now' || status === 'review' || status === 'ask';
  const title =
    session?.steps.find((s) => s.n === block.stepN)?.title || stepTitles[block.stepN - 1] || `Step ${block.stepN}`;
  const sub = subLineFor(block, status, session);

  const panelClass = [
    styles.panel,
    isActive ? styles.panelActive : '',
    status === 'done' ? styles.panelDone : '',
    status === 'errored' ? styles.panelErrored : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={panelClass} data-step={block.stepN} data-status={status}>
      {block.showHeader && (
        <header className={styles.panelHeader} data-status={status}>
          <span className={styles.panelIcon}>
            <StatusIcon status={status} live={!!live} />
          </span>
          <span className={styles.panelLabel}>
            {t('workflow.transcript.stepLabel', {
              defaultValue: 'Step {{n}} · {{title}}',
              n: block.stepN,
              title,
            })}
          </span>
          {sub && <span className={styles.panelSub}>{sub}</span>}
          {live && (
            <span className={styles.panelLive}>{t('workflow.transcript.working', { defaultValue: 'working' })}</span>
          )}
          {status === 'ask' && (
            <span className={styles.panelNeedsYou}>
              {t('workflow.transcript.needsYou', { defaultValue: 'needs you' })}
            </span>
          )}
        </header>
      )}
      <div className={styles.panelBody}>
        {block.items.map((item) => {
          if (item.kind === 'activity') return <ActivityBlock key={item.id} item={item} />;
          if (item.kind === 'permission') {
            return (
              <div key={item.id} className={styles.permission}>
                <MessageAcpPermission message={item.message} />
              </div>
            );
          }
          // assistant prose - WorkflowMessageBody strips step markers + routes
          // them to the session, then hands clean markdown to MarkdownView.
          return (
            <div key={item.id} className={styles.prose}>
              <WorkflowMessageBody workflowSessionId={workflowSessionId} body={item.body}>
                {(cleanedBody) => <MarkdownView>{cleanedBody}</MarkdownView>}
              </WorkflowMessageBody>
            </div>
          );
        })}
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const WorkflowTranscript: React.FC = () => {
  const { t } = useTranslation();
  const messages = useMessageList();
  const conversationContext = useConversationContextSafe();
  const workflowSessionId = conversationContext?.workflowSessionId;
  const { stepTitles = [], session, needsInput = false } = useWorkflowViewMode();

  // Segment the message stream into step blocks (+ user insets between them).
  const blocks = React.useMemo<Block[]>(() => {
    const result: Block[] = [];
    let currentStepN = session?.current_step && session.current_step > 0 ? 1 : 1; // segments seed at step 1
    const headerShown = new Set<number>();
    let step: StepBlock | null = null;
    let activity: ActivityItem | null = null;

    const flushActivity = () => {
      if (activity && step) step.items.push(activity);
      activity = null;
    };
    const flushStep = () => {
      flushActivity();
      if (step && step.items.length > 0) result.push(step);
      step = null;
    };
    const ensureStep = (n: number) => {
      if (!step || step.stepN !== n) {
        flushStep();
        const showHeader = !headerShown.has(n);
        headerShown.add(n);
        step = { kind: 'step', id: `step-${n}-${result.length}`, stepN: n, showHeader, doneMarker: false, items: [] };
      }
      return step;
    };

    for (const msg of messages) {
      if (msg.hidden) continue;
      if (msg.type === 'available_commands') continue;
      if (msg.type === 'agent_status') continue;

      if (msg.type === 'tool_group' || msg.type === 'acp_tool_call' || msg.type === 'thinking') {
        ensureStep(currentStepN);
        if (!activity) activity = { kind: 'activity', id: `activity-${msg.id}`, messages: [] };
        activity.messages.push(msg as IMessageToolGroup | IMessageAcpToolCall | IMessageThinking);
        continue;
      }

      flushActivity();

      if (msg.type === 'acp_permission') {
        ensureStep(currentStepN).items.push({ kind: 'permission', id: msg.id, message: msg as IMessageAcpPermission });
        continue;
      }

      if (msg.type === 'text') {
        const textMsg = msg as IMessageText;
        if (textMsg.position === 'right') {
          const userText = stripWorkflowEnvelopes(textOf(textMsg));
          if (!userText.trim() || BEGIN_COMMAND_RE.test(userText.trim())) continue;
          flushStep();
          result.push({ kind: 'user', id: msg.id, text: userText });
          continue;
        }
        const rawBody = extractAssistantBody(textMsg);
        if (!rawBody.trim()) continue;
        const marker = STEP_MARKER_RE.exec(rawBody);
        if (marker) {
          currentStepN = Number(marker[1]);
        }
        const blk = ensureStep(currentStepN);
        if (marker?.[2] && ['done', 'skipped', 'errored'].includes(marker[2].toLowerCase())) {
          blk.doneMarker = true;
        }
        blk.items.push({ kind: 'assistant', id: msg.id, body: rawBody });
        continue;
      }
    }

    flushStep();
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, session?.current_step]);

  if (blocks.length === 0) {
    return (
      <div className={styles.root}>
        <div className={styles.scroll}>
          <div className={styles.starting}>
            <Loader2 size={16} className={styles.spin} aria-hidden='true' />
            <span>{t('workflow.transcript.starting')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.scroll}>
        <div className={styles.column}>
          {blocks.map((block) => {
            if (block.kind === 'user') {
              return (
                <div key={block.id} className={styles.userInset}>
                  <div className={styles.userLabel}>{t('workflow.transcript.you')}</div>
                  <div className={styles.userBody}>
                    <MarkdownView>{block.text}</MarkdownView>
                  </div>
                </div>
              );
            }
            return (
              <StepPanel
                key={block.id}
                block={block}
                session={session}
                stepTitles={stepTitles}
                workflowSessionId={workflowSessionId}
                needsInput={needsInput}
              />
            );
          })}
          <div className={styles.spacer} />
        </div>
      </div>
    </div>
  );
};
