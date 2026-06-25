import { describe, expect, it } from 'vitest';
import {
  createCommand,
  deleteCommand,
  expandTemplate,
  extractTemplatePlaceholders,
  updateCommand,
  validateCommandName,
  MAX_COMMAND_NAME_LENGTH,
  type UserSlashCommand,
} from '@/common/chat/slash/userCommands';

const make = (overrides: Partial<UserSlashCommand> = {}): UserSlashCommand => ({
  id: overrides.id ?? 'id-1',
  name: overrides.name ?? 'standup',
  description: overrides.description ?? 'Daily standup',
  template: overrides.template ?? 'Write a standup for {topic}',
  args: overrides.args,
  createdAt: overrides.createdAt ?? 1,
  updatedAt: overrides.updatedAt ?? 1,
});

describe('validateCommandName', () => {
  it('rejects empty / whitespace names', () => {
    expect(validateCommandName('', [])).toEqual({ valid: false, reason: 'empty' });
    expect(validateCommandName('   ', [])).toEqual({ valid: false, reason: 'empty' });
  });

  it('rejects names over the length cap', () => {
    const long = 'a'.repeat(MAX_COMMAND_NAME_LENGTH + 1);
    expect(validateCommandName(long, [])).toEqual({ valid: false, reason: 'tooLong' });
  });

  it('rejects invalid characters and non-letter starts', () => {
    expect(validateCommandName('has space', [])).toEqual({ valid: false, reason: 'invalidChars' });
    expect(validateCommandName('1abc', [])).toEqual({ valid: false, reason: 'invalidChars' });
    expect(validateCommandName('-abc', [])).toEqual({ valid: false, reason: 'invalidChars' });
    expect(validateCommandName('emoji😀', [])).toEqual({ valid: false, reason: 'invalidChars' });
  });

  it('accepts slug-like names', () => {
    expect(validateCommandName('standup', [])).toEqual({ valid: true });
    expect(validateCommandName('my-cmd_2', [])).toEqual({ valid: true });
  });

  it('rejects reserved builtin names case-insensitively', () => {
    expect(validateCommandName('open', [])).toEqual({ valid: false, reason: 'reserved' });
    expect(validateCommandName('COPY', [])).toEqual({ valid: false, reason: 'reserved' });
  });

  it('rejects duplicates case-insensitively but allows the edited command to keep its name', () => {
    const existing = [make({ id: 'id-1', name: 'standup' })];
    expect(validateCommandName('Standup', existing)).toEqual({ valid: false, reason: 'duplicate' });
    expect(validateCommandName('standup', existing, 'id-1')).toEqual({ valid: true });
  });
});

describe('extractTemplatePlaceholders', () => {
  it('extracts single and double brace placeholders in order, deduped', () => {
    expect(extractTemplatePlaceholders('Hi {name}, about {{topic}} and {name} again')).toEqual(['name', 'topic']);
  });

  it('returns empty for templates without placeholders', () => {
    expect(extractTemplatePlaceholders('no placeholders here')).toEqual([]);
  });
});

describe('expandTemplate', () => {
  it('returns the template verbatim when no values are given', () => {
    expect(expandTemplate('Write a standup for {topic}')).toBe('Write a standup for {topic}');
  });

  it('substitutes provided values and leaves missing placeholders in place', () => {
    expect(expandTemplate('Hi {name}, about {{topic}}', { name: 'Sam' })).toBe('Hi Sam, about {{topic}}');
    expect(expandTemplate('Hi {name}, about {{topic}}', { name: 'Sam', topic: 'sprint' })).toBe('Hi Sam, about sprint');
  });
});

describe('createCommand', () => {
  it('appends a normalized command with timestamps and an id', () => {
    const next = createCommand([], { name: '  standup ', description: '  Daily  ', template: 'Body {x}' });
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ name: 'standup', description: 'Daily', template: 'Body {x}' });
    expect(next[0].id).toBeTruthy();
    expect(next[0].createdAt).toBeGreaterThan(0);
    expect(next[0].updatedAt).toBe(next[0].createdAt);
  });

  it('drops blank args and keeps non-empty ones', () => {
    const next = createCommand([], {
      name: 'cmd',
      description: '',
      template: 'Body',
      args: [' a ', '', '  ', 'b'],
    });
    expect(next[0].args).toEqual(['a', 'b']);
  });

  it('throws on invalid name or empty template', () => {
    expect(() => createCommand([], { name: 'open', description: '', template: 'x' })).toThrow();
    expect(() => createCommand([], { name: 'ok', description: '', template: '   ' })).toThrow();
  });

  it('does not mutate the input array', () => {
    const existing: UserSlashCommand[] = [make()];
    const snapshot = [...existing];
    createCommand(existing, { name: 'other', description: '', template: 'x' });
    expect(existing).toEqual(snapshot);
  });
});

describe('updateCommand', () => {
  it('updates fields and bumps updatedAt, keeps createdAt', () => {
    const existing = [make({ id: 'id-1', createdAt: 100, updatedAt: 100 })];
    const next = updateCommand(existing, 'id-1', {
      name: 'renamed',
      description: 'New',
      template: 'New body',
    });
    expect(next[0]).toMatchObject({ name: 'renamed', description: 'New', template: 'New body', createdAt: 100 });
    expect(next[0].updatedAt).toBeGreaterThanOrEqual(100);
  });

  it('is a no-op for unknown ids', () => {
    const existing = [make({ id: 'id-1' })];
    const next = updateCommand(existing, 'missing', { name: 'x', description: '', template: 'y' });
    expect(next).toEqual(existing);
  });

  it('throws when renaming to a reserved or duplicate name', () => {
    const existing = [make({ id: 'id-1', name: 'a' }), make({ id: 'id-2', name: 'b' })];
    expect(() => updateCommand(existing, 'id-1', { name: 'b', description: '', template: 'x' })).toThrow();
    expect(() => updateCommand(existing, 'id-1', { name: 'open', description: '', template: 'x' })).toThrow();
  });
});

describe('deleteCommand', () => {
  it('removes the matching id and is a no-op otherwise', () => {
    const existing = [make({ id: 'id-1' }), make({ id: 'id-2' })];
    expect(deleteCommand(existing, 'id-1').map((c) => c.id)).toEqual(['id-2']);
    expect(deleteCommand(existing, 'missing')).toHaveLength(2);
  });
});
