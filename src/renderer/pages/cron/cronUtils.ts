/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ICronJob } from '@/common/adapter/ipcBridge';
import type { TFunction } from 'i18next';

// Resolve a single day-of-week token to a weekday label key. Handles both the
// named form (MON..SUN) and the numeric cron form (0-7, where both 0 and 7 are
// Sunday). Returns null for ranges, lists, or anything we cannot name simply.
const WEEKDAY_LABEL_KEY_BY_TOKEN: Record<string, string> = {
  MON: 'monday',
  TUE: 'tuesday',
  WED: 'wednesday',
  THU: 'thursday',
  FRI: 'friday',
  SAT: 'saturday',
  SUN: 'sunday',
  '0': 'sunday',
  '1': 'monday',
  '2': 'tuesday',
  '3': 'wednesday',
  '4': 'thursday',
  '5': 'friday',
  '6': 'saturday',
  '7': 'sunday',
};

function formatTime(hour: string, minute: string): string {
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

// Parse a `*/N` step expression, returning N when the field is a step over the
// full wildcard range (e.g. `*/4`). Returns null for anything else.
function parseStep(field: string): number | null {
  const match = /^\*\/(\d+)$/.exec(field);
  if (!match) return null;
  const step = Number(match[1]);
  return step > 0 ? step : null;
}

function formatCronExpr(expr: string, t: TFunction): string | null {
  if (!expr) return t('cron.page.scheduleDesc.manual');

  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5) return null;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  const normalizedDayOfWeek = dayOfWeek.toUpperCase();
  const normalizedDayOfMonth = dayOfMonth.toUpperCase();

  // Step-value schedules (`*/N`) with no day/month/weekday constraint.
  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    // Step over the hour field (e.g. `*/4`): every N hours, optionally at a fixed minute.
    const hourStep = parseStep(hour);
    if (hourStep !== null) {
      if (/^\d{1,2}$/.test(minute)) {
        return t('cron.page.scheduleDesc.everyNHoursAtMinute', {
          count: hourStep,
          minute: minute.padStart(2, '0'),
        });
      }
      return t('cron.page.scheduleDesc.everyNHours', { count: hourStep });
    }

    // Step over the minute field (e.g. `*/15`) with a wildcard hour: every N minutes.
    if (hour === '*') {
      const minuteStep = parseStep(minute);
      if (minuteStep !== null) {
        return t('cron.page.scheduleDesc.everyNMinutes', { count: minuteStep });
      }
    }
  }

  // Every hour: minute fixed, hour wildcard.
  if (hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return t('cron.page.scheduleDesc.hourly');
  }

  // The remaining shapes need a concrete time of day.
  if (hour === '*' || minute === '*') return null;
  const time = formatTime(hour, minute);

  // Daily.
  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return t('cron.page.scheduleDesc.dailyAt', { time });
  }

  // Weekdays (Monday through Friday), named or numeric range.
  if (dayOfMonth === '*' && month === '*' && (normalizedDayOfWeek === 'MON-FRI' || dayOfWeek === '1-5')) {
    return t('cron.page.scheduleDesc.weekdaysAt', { time });
  }

  // Weekly on a single named or numeric weekday.
  if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
    const weekdayKey = WEEKDAY_LABEL_KEY_BY_TOKEN[normalizedDayOfWeek];
    if (weekdayKey) {
      return t('cron.page.scheduleDesc.weeklyAt', {
        day: t(`cron.page.weekday.${weekdayKey}`),
        time,
      });
    }
    return null;
  }

  // Monthly schedules (no weekday constraint).
  if (month === '*' && dayOfWeek === '*') {
    if (normalizedDayOfMonth === 'L') {
      return t('cron.page.scheduleDesc.monthlyLastDayAt', { time });
    }
    if (/^\d{1,2}$/.test(dayOfMonth)) {
      return t('cron.page.scheduleDesc.monthlyOnDayAt', { day: dayOfMonth, time });
    }
  }

  return null;
}

/**
 * Format schedule for display - use human-readable description
 */
export function formatSchedule(job: ICronJob, t: TFunction): string {
  if (job.schedule.kind === 'cron') {
    return formatCronExpr(job.schedule.expr, t) ?? job.schedule.description;
  }

  if (job.schedule.kind === 'every' && job.schedule.everyMs === 3600000) {
    return t('cron.page.scheduleDesc.hourly');
  }

  return job.schedule.description;
}

/**
 * Format next run time for display
 */
export function formatNextRun(nextRunAtMs?: number): string {
  if (!nextRunAtMs) return '-';
  const date = new Date(nextRunAtMs);
  return date.toLocaleString();
}

/**
 * Get job status flags
 */
export function getJobStatusFlags(job: ICronJob): { hasError: boolean; isPaused: boolean } {
  return {
    hasError: job.state.lastStatus === 'error',
    isPaused: !job.enabled,
  };
}
