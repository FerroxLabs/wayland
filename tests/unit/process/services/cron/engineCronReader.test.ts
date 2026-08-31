import { describe, it, expect } from 'vitest';
import { mapEngineCronJobs, isEngineJobId, ENGINE_JOB_ID_PREFIX } from '@process/services/cron/EngineCronReader';

/**
 * The fixture is the ACTUAL file the engine wrote during a buyer run: the
 * assistant said "your brief will run weekdays at 07:00", that was true, and
 * Scheduled Tasks showed nothing because the job lived only here.
 */
const REAL_ENGINE_STORE = JSON.stringify({
  jobs: [
    {
      id: '48aab5dd-0699-4c9c-8838-a80f3449f2f9',
      expression: '0 7 * * 1-5',
      target: {
        kind: 'skill',
        name: 'wayland-morning-report',
        args: { prompt: 'run my morning brief', skills: ['wayland-morning-report'] },
      },
      enabled: true,
      created_at: '2026-08-31T00:51:45.360698Z',
      last_fired: null,
      retry_state: { attempts: 0, gave_up: false },
    },
  ],
  integrity: '6283c9939ee8bdb485ff0b6a42fd1924',
});

describe('the engine scheduler is visible in Scheduled Tasks', () => {
  it('surfaces the job the user was promised, with its real schedule', () => {
    const [job] = mapEngineCronJobs(REAL_ENGINE_STORE);
    expect(job).toBeDefined();
    expect(job.schedule).toEqual({ kind: 'cron', expr: '0 7 * * 1-5', description: '0 7 * * 1-5' });
    expect(job.enabled).toBe(true);
  });

  it('tags the origin so the UI can say which scheduler holds it', () => {
    expect(mapEngineCronJobs(REAL_ENGINE_STORE)[0].origin).toBe('engine');
  });

  it('namespaces the id so it can never collide with a Desktop row', () => {
    const [job] = mapEngineCronJobs(REAL_ENGINE_STORE);
    expect(job.id).toBe(`${ENGINE_JOB_ID_PREFIX}48aab5dd-0699-4c9c-8838-a80f3449f2f9`);
    expect(isEngineJobId(job.id)).toBe(true);
    expect(isEngineJobId('7f0c1e2a-desktop-row')).toBe(false);
  });

  it('carries the prompt through so the row is recognisable to a human', () => {
    const [job] = mapEngineCronJobs(REAL_ENGINE_STORE);
    expect(job.description).toBe('run my morning brief');
    expect(job.target.payload.text).toBe('run my morning brief');
  });

  it('returns [] on a malformed file instead of blanking the whole task list', () => {
    // this path runs on the Scheduled Tasks list; throwing here would take the
    // user's OWN jobs down with the engine's
    expect(mapEngineCronJobs('{ not json')).toEqual([]);
    expect(mapEngineCronJobs('')).toEqual([]);
    expect(mapEngineCronJobs('{"jobs":"nope"}')).toEqual([]);
    expect(mapEngineCronJobs('{}')).toEqual([]);
  });

  it('skips records with no id or no expression rather than inventing either', () => {
    const partial = JSON.stringify({
      jobs: [
        { expression: '0 7 * * 1-5', enabled: true },
        { id: 'abc', enabled: true },
        { id: 'ok', expression: '*/5 * * * *', enabled: false },
      ],
    });
    const jobs = mapEngineCronJobs(partial);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe(`${ENGINE_JOB_ID_PREFIX}ok`);
    expect(jobs[0].enabled).toBe(false);
  });

  it('treats a missing enabled flag as disabled, never as on', () => {
    const jobs = mapEngineCronJobs(JSON.stringify({ jobs: [{ id: 'x', expression: '0 7 * * *' }] }));
    expect(jobs[0].enabled).toBe(false);
  });
});
