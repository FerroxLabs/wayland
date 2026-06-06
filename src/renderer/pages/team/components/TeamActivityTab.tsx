// src/renderer/pages/team/components/TeamActivityTab.tsx
//
// W2c - Activity tab inside the team page. Polls `team_event_log` every
// 2 seconds via `ipcBridge.team.listEvents` (W1e) and renders a
// most-recent-first timeline. New events prepend.
//
// Polling vs subscription: W1e ships the listEvents reader but does NOT
// fire a renderer-side push when events are appended. Polling at 2s
// matches the cadence the spec asks for and keeps the implementation
// dead-simple - the interval is cleared on unmount so no leaked timers.
//
// Filtering: shows all event types. The cost meter (W2d) will use the
// dedicated `eventType: 'token_usage'` filter on the same provider.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  Coins,
  Inbox,
  Power,
  Sparkles,
  UserPlus,
  Wand2,
} from 'lucide-react';
import { ipcBridge } from '@/common';
import type { TeamEvent, TeamEventType } from '@process/team/types';

type Props = {
  teamId: string;
  /** Polling interval, ms. Spec-mandated default 2000; lowered in tests. */
  pollIntervalMs?: number;
};

const POLL_INTERVAL_MS = 2000;
const EVENTS_LIMIT = 100;

const EVENT_ICON: Record<TeamEventType, React.ReactNode> = {
  mailbox: <Inbox size={14} />,
  task: <ClipboardList size={14} />,
  spawn: <UserPlus size={14} />,
  decision: <Wand2 size={14} />,
  wake: <Sparkles size={14} />,
  shutdown: <Power size={14} />,
  token_usage: <Coins size={14} />,
};

const formatRelative = (timestamp: number, now: number): string => {
  const diff = Math.max(0, now - timestamp);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const truncate = (s: string, n: number): string => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/**
 * Derive a human-readable summary from the event payload. The exact shape
 * depends on event_type (see process/team/types.ts + EventLogger
 * call-sites). Anything unknown falls back to a stringified key dump.
 */
const summarizeEvent = (event: TeamEvent): string => {
  const p = event.payload ?? {};
  switch (event.eventType) {
    case 'mailbox': {
      const summary = typeof p.summary === 'string' ? p.summary : undefined;
      const type = typeof p.type === 'string' ? p.type : 'message';
      if (summary) return `${type}: ${truncate(summary, 80)}`;
      return type;
    }
    case 'task': {
      const action = typeof p.action === 'string' ? p.action : 'change';
      const subject = typeof p.subject === 'string' ? p.subject : undefined;
      const status = typeof p.status === 'string' ? p.status : undefined;
      if (subject) return `${action} - ${truncate(subject, 70)}${status ? ` (${status})` : ''}`;
      if (status) return `${action} (${status})`;
      return action;
    }
    case 'spawn': {
      const name = typeof p.agent_name === 'string' ? p.agent_name : undefined;
      const role = typeof p.role === 'string' ? p.role : undefined;
      const backend = typeof p.agent_type === 'string' ? p.agent_type : undefined;
      if (name && role && backend) return `${name} joined as ${role} (${backend})`;
      if (name) return `${name} joined`;
      return 'agent joined';
    }
    case 'wake': {
      const success = p.success === true;
      const duration = typeof p.duration_ms === 'number' ? `${p.duration_ms}ms` : undefined;
      const label = success ? 'wake ok' : 'wake failed';
      return duration ? `${label} (${duration})` : label;
    }
    case 'token_usage': {
      const total = typeof p.total_tokens === 'number' ? p.total_tokens : undefined;
      const cost = typeof p.cost_estimate_usd === 'number' ? p.cost_estimate_usd : undefined;
      const backend = typeof p.backend === 'string' ? p.backend : undefined;
      const parts: string[] = [];
      if (total !== undefined) parts.push(`${total.toLocaleString()} tokens`);
      if (cost !== undefined) parts.push(`$${cost.toFixed(4)}`);
      if (backend) parts.push(backend);
      return parts.length > 0 ? parts.join(' · ') : 'token usage';
    }
    case 'decision': {
      const description = typeof p.description === 'string' ? p.description : undefined;
      return description ? truncate(description, 100) : 'decision';
    }
    case 'shutdown':
      return 'session disposed';
    default:
      return event.eventType;
  }
};

const TeamActivityTab: React.FC<Props> = ({ teamId, pollIntervalMs = POLL_INTERVAL_MS }) => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [now, setNow] = useState<number>(() => Date.now());
  const seenIdsRef = useRef<Set<string>>(new Set());
  const lastPollRef = useRef<number>(0);

  const poll = useCallback(async () => {
    try {
      // First call: no `since` so we pull the most recent EVENTS_LIMIT rows.
      // Subsequent calls: `since` = last seen createdAt so we only fetch new
      // rows. listEvents returns newest-first per the W1e contract.
      const since = lastPollRef.current > 0 ? lastPollRef.current : undefined;
      const fetched = await ipcBridge.team.listEvents.invoke({
        teamId,
        limit: EVENTS_LIMIT,
        ...(since !== undefined ? { since } : {}),
      });
      if (!Array.isArray(fetched) || fetched.length === 0) return;

      // Dedupe (defensive - the `since` filter should already exclude these)
      const fresh = fetched.filter((e) => !seenIdsRef.current.has(e.id));
      if (fresh.length === 0) return;
      for (const e of fresh) seenIdsRef.current.add(e.id);

      // Track the highest createdAt seen so the next poll starts from there.
      const maxCreatedAt = fresh.reduce((m, e) => (e.createdAt > m ? e.createdAt : m), lastPollRef.current);
      lastPollRef.current = maxCreatedAt;

      // Prepend fresh events (already newest-first within `fresh`).
      setEvents((prev) => [...fresh, ...prev]);
    } catch (error) {
      // Polling errors are swallowed - a single failed poll shouldn't take
      // the activity tab offline. The next tick retries.
      console.warn('[TeamActivityTab] poll failed', error);
    }
  }, [teamId]);

  useEffect(() => {
    // Initial fetch fires immediately; interval handles the steady-state
    // cadence. We reset the seen-set + lastPoll on teamId change so a
    // navigation between teams doesn't blend timelines.
    seenIdsRef.current = new Set();
    lastPollRef.current = 0;
    setEvents([]);
    void poll();
    const id = setInterval(poll, pollIntervalMs);
    return () => clearInterval(id);
  }, [poll, pollIntervalMs, teamId]);

  // Periodic re-render so the relative timestamps refresh even when the
  // event list itself is quiet.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  if (events.length === 0) {
    return (
      <div
        data-testid='team-activity-tab'
        className='flex-1 flex items-center justify-center text-[color:var(--color-text-4)] text-13px'
      >
        <div className='flex flex-col items-center gap-8px'>
          <AlertTriangle size={20} className='opacity-50' />
          <span>{t('teams.activity.empty', { defaultValue: 'No team activity yet.' })}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid='team-activity-tab'
      className='flex-1 overflow-y-auto px-20px py-16px bg-[color:var(--color-bg-1)]'
    >
      <ol className='flex flex-col gap-12px m-0 p-0 list-none max-w-720px mx-auto'>
        {events.map((event) => {
          const icon = EVENT_ICON[event.eventType] ?? <Sparkles size={14} />;
          const actor = event.actorSlotId;
          const target = event.targetSlotId;
          const summary = summarizeEvent(event);
          return (
            <li
              key={event.id}
              data-testid='team-activity-event'
              data-event-type={event.eventType}
              data-event-id={event.id}
              className='flex items-start gap-12px p-12px rd-8px bg-[color:var(--color-bg-2)] border border-solid border-[color:var(--border-base)]'
            >
              <span
                className='shrink-0 w-28px h-28px rd-full flex items-center justify-center bg-[color:var(--color-fill-2)] text-[color:var(--color-text-2)]'
                aria-hidden='true'
              >
                {icon}
              </span>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-6px flex-wrap text-12px text-[color:var(--color-text-2)]'>
                  <span className='font-medium text-[color:var(--color-text-1)] uppercase tracking-wide text-10px'>
                    {event.eventType}
                  </span>
                  {actor && (
                    <span className='inline-flex items-center gap-4px text-[color:var(--color-text-3)]'>
                      <span className='font-medium text-[color:var(--color-text-2)]'>{actor}</span>
                      {target && <ArrowRight size={11} className='text-[color:var(--color-text-4)]' />}
                      {target && <span className='font-medium text-[color:var(--color-text-2)]'>{target}</span>}
                    </span>
                  )}
                </div>
                <div className='text-13px text-[color:var(--color-text-1)] mt-2px break-words'>{summary}</div>
              </div>
              <span className='shrink-0 text-11px text-[color:var(--color-text-4)] whitespace-nowrap'>
                {formatRelative(event.createdAt, now)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default TeamActivityTab;
