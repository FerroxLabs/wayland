import { describe, it, expect } from 'vitest';
import { detectCronCommands, hasCronCommands, stripCronCommands } from '../../../src/process/task/CronCommandDetector';

describe('CronCommandDetector - [CRON_PROPOSE] (v0.6.2.6)', () => {
  it('parses a well-formed [CRON_PROPOSE] block into a propose command', () => {
    const content = `I'll set that up.

[CRON_PROPOSE]
name: Daily AI News
schedule: 0 9 * * *
schedule_description: Every day at 9:00 AM
message: Go find the latest AI news and write a newsletter.
[/CRON_PROPOSE]`;

    const cmds = detectCronCommands(content);
    expect(cmds).toHaveLength(1);
    const cmd = cmds[0];
    expect(cmd.kind).toBe('propose');
    if (cmd.kind !== 'propose') return;
    expect(cmd.name).toBe('Daily AI News');
    expect(cmd.schedule).toBe('0 9 * * *');
    expect(cmd.scheduleDescription).toBe('Every day at 9:00 AM');
    expect(cmd.prompt).toBe('Go find the latest AI news and write a newsletter.');
  });

  it('renames `message` field to `prompt` on the surfaced command (cleaner UI naming)', () => {
    const content = `[CRON_PROPOSE]
name: X
schedule: 0 9 * * *
schedule_description: Daily at 9am
message: Do thing
[/CRON_PROPOSE]`;
    const cmd = detectCronCommands(content)[0];
    expect(cmd.kind).toBe('propose');
    if (cmd.kind === 'propose') {
      expect(cmd.prompt).toBe('Do thing');
      expect((cmd as unknown as { message?: string }).message).toBeUndefined();
    }
  });

  it('ignores [CRON_PROPOSE] inside markdown code blocks (no false-fire from docs)', () => {
    const content =
      '```\n[CRON_PROPOSE]\nname: docs example\nschedule: 0 9 * * *\nschedule_description: Daily at 9am\nmessage: example\n[/CRON_PROPOSE]\n```';
    const cmds = detectCronCommands(content);
    expect(cmds).toHaveLength(0);
  });

  it('rejects [CRON_PROPOSE] missing required fields (returns no command)', () => {
    const content = `[CRON_PROPOSE]
name: Missing schedule
message: Do thing
[/CRON_PROPOSE]`;
    expect(detectCronCommands(content)).toHaveLength(0);
  });

  it('detects unclosed [CRON_PROPOSE] block via fallback parser (agent forgot closing tag)', () => {
    const content = `[CRON_PROPOSE]
name: Forgot to close
schedule: 0 9 * * *
schedule_description: Daily at 9am
message: Do thing`;
    const cmds = detectCronCommands(content);
    expect(cmds).toHaveLength(1);
    expect(cmds[0].kind).toBe('propose');
  });

  it('handles multiple PROPOSE + CREATE blocks in one response', () => {
    const content = `[CRON_PROPOSE]
name: One
schedule: 0 9 * * *
schedule_description: D
message: m1
[/CRON_PROPOSE]

Some text.

[CRON_CREATE]
name: Two
schedule: 0 10 * * *
schedule_description: D2
message: m2
[/CRON_CREATE]`;
    const cmds = detectCronCommands(content);
    expect(cmds).toHaveLength(2);
    expect(cmds.filter((c) => c.kind === 'propose')).toHaveLength(1);
    expect(cmds.filter((c) => c.kind === 'create')).toHaveLength(1);
  });

  it('hasCronCommands returns true for content with [CRON_PROPOSE]', () => {
    expect(hasCronCommands('[CRON_PROPOSE]')).toBe(true);
    expect(hasCronCommands('plain text')).toBe(false);
  });

  it('stripCronCommands removes [CRON_PROPOSE] block from display content', () => {
    const content = `Before.

[CRON_PROPOSE]
name: X
schedule: 0 9 * * *
schedule_description: D
message: m
[/CRON_PROPOSE]

After.`;
    const stripped = stripCronCommands(content);
    expect(stripped).toBe('Before.\n\nAfter.');
  });
});
