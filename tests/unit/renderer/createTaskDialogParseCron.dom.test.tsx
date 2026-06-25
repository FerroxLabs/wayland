import { describe, expect, it } from 'vitest';
import { parseCronExpr } from '@renderer/pages/cron/ScheduledTasksPage/CreateTaskDialog';

/**
 * S7: bundled routines.json schedules use NUMERIC day-of-week (e.g. '0 10 * * 3').
 * Before the fix, parseCronExpr only matched NAMED weekdays (MON..SUN) so numeric
 * DOW fell through to the default { frequency: 'daily', time: '09:00', weekday: 'MON' }.
 * Opening a bundled routine in the edit dialog and saving any field then silently
 * rewrote its weekly schedule to daily 09:00. These cases assert numeric DOW now
 * round-trips to the correct weekly weekday/time.
 */
describe('parseCronExpr numeric day-of-week (S7)', () => {
  it("parses '0 10 * * 3' as weekly Wednesday 10:00", () => {
    expect(parseCronExpr('0 10 * * 3')).toEqual({
      frequency: 'weekly',
      time: '10:00',
      weekday: 'WED',
    });
  });

  it("parses '0 18 * * 0' as weekly Sunday 18:00 (0 = Sunday)", () => {
    expect(parseCronExpr('0 18 * * 0')).toEqual({
      frequency: 'weekly',
      time: '18:00',
      weekday: 'SUN',
    });
  });

  it("parses '0 9 * * 1' as weekly Monday 09:00", () => {
    expect(parseCronExpr('0 9 * * 1')).toEqual({
      frequency: 'weekly',
      time: '09:00',
      weekday: 'MON',
    });
  });

  it("parses '0 16 * * 5' as weekly Friday 16:00", () => {
    expect(parseCronExpr('0 16 * * 5')).toEqual({
      frequency: 'weekly',
      time: '16:00',
      weekday: 'FRI',
    });
  });

  it("treats DOW 7 as Sunday ('0 8 * * 7')", () => {
    expect(parseCronExpr('0 8 * * 7')).toEqual({
      frequency: 'weekly',
      time: '08:00',
      weekday: 'SUN',
    });
  });

  it('still parses NAMED weekdays', () => {
    expect(parseCronExpr('0 10 * * WED')).toEqual({
      frequency: 'weekly',
      time: '10:00',
      weekday: 'WED',
    });
  });

  it("keeps weekdays handling for 'MON-FRI'", () => {
    expect(parseCronExpr('30 8 * * MON-FRI')).toEqual({
      frequency: 'weekdays',
      time: '08:30',
      weekday: 'MON',
    });
  });

  it("keeps 'L' last-day expressions out of the weekly branch", () => {
    // '0 17 L * *' has day='L', dow='*' -> not weekly; falls through to custom.
    expect(parseCronExpr('0 17 L * *').frequency).toBe('custom');
  });
});
