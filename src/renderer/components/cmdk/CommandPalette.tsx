/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Command } from 'cmdk';
import { BookOpen, Bot, Clock, Search, Sparkles, Users } from 'lucide-react';
import React, { useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { openExternalUrl } from '@/renderer/utils/platform';
import PaletteRow from './PaletteRow';
import {
  useCommandPaletteSources,
  type PaletteAction,
  type PaletteAssistant,
  type PaletteRecent,
  type PaletteStarterPrompt,
} from './useCommandPaletteSources';

export type CommandPaletteProps = {
  /** Whether the palette dialog is currently open. */
  open: boolean;
  /** Called when the user closes the palette (Esc, overlay click, or after selection). */
  onClose: () => void;
  /** Called when the user activates an assistant row. */
  onLaunchPreset: (preset: PaletteAssistant) => void;
  /** Called when the user activates a recent chat row. */
  onResumeChat: (conversationId: string) => void;
  /** Called when the user activates a starter prompt row. */
  onFillPrompt: (prompt: PaletteStarterPrompt) => void;
};

/**
 * Value scheme used by `cmdk` for filtering + keyboard selection.
 *
 * Every `Command.Item` needs a unique stable value. We prefix by kind so
 * the same id surfacing in two rows (theoretically) cannot collide, and so
 * the selection handler can route to the right callback without an extra
 * lookup map.
 */
const VALUE_PREFIX = {
  assistant: 'assistant:',
  recent: 'recent:',
  prompt: 'prompt:',
  action: 'action:',
} as const;

const makeValue = (kind: keyof typeof VALUE_PREFIX, id: string): string => `${VALUE_PREFIX[kind]}${id}`;

const parseValue = (value: string): { kind: keyof typeof VALUE_PREFIX | null; id: string } => {
  if (value.startsWith(VALUE_PREFIX.assistant)) {
    return { kind: 'assistant', id: value.slice(VALUE_PREFIX.assistant.length) };
  }
  if (value.startsWith(VALUE_PREFIX.recent)) {
    return { kind: 'recent', id: value.slice(VALUE_PREFIX.recent.length) };
  }
  if (value.startsWith(VALUE_PREFIX.prompt)) {
    return { kind: 'prompt', id: value.slice(VALUE_PREFIX.prompt.length) };
  }
  if (value.startsWith(VALUE_PREFIX.action)) {
    return { kind: 'action', id: value.slice(VALUE_PREFIX.action.length) };
  }
  return { kind: null, id: '' };
};

/**
 * Global ⌘K command palette.
 *
 * Renders a single dialog via React Portal so it overlays everything,
 * regardless of which page is mounted. Built on `cmdk`, which provides
 * fuzzy filtering, arrow-key navigation, Enter activation, and Esc
 * dismissal out of the box - we wire up only the data, layout, and the
 * three selection callbacks.
 *
 * The Rory rule (Phase 1) applies via `onLaunchPreset`: the caller wires
 * that to `useGuidAgentSelection.selectPresetAssistant`, which handles
 * backend defaulting automatically.
 */
const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  onLaunchPreset,
  onResumeChat,
  onFillPrompt,
}) => {
  const { t } = useTranslation();
  const { assistants, recents, prompts, actions = [] } = useCommandPaletteSources();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Maps for O(1) lookup in the unified selection handler. Recomputed only
  // when the source arrays change.
  const assistantById = useMemo(() => {
    const m = new Map<string, PaletteAssistant>();
    for (const a of assistants) m.set(a.id, a);
    return m;
  }, [assistants]);

  const recentById = useMemo(() => {
    const m = new Map<string, PaletteRecent>();
    for (const r of recents) m.set(r.id, r);
    return m;
  }, [recents]);

  const promptById = useMemo(() => {
    const m = new Map<string, PaletteStarterPrompt>();
    for (const p of prompts) m.set(p.id, p);
    return m;
  }, [prompts]);

  const actionById = useMemo(() => {
    const m = new Map<string, PaletteAction>();
    for (const a of actions ?? []) m.set(a.id, a);
    return m;
  }, [actions]);

  // Esc closes the palette. cmdk owns arrow + Enter, but Esc is on us so
  // the dialog can dismiss without competing with cmdk's vim bindings.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const handleSelect = (value: string) => {
    const { kind, id } = parseValue(value);
    if (kind === 'assistant') {
      const preset = assistantById.get(id);
      if (preset) {
        onLaunchPreset(preset);
        onClose();
      }
      return;
    }
    if (kind === 'recent') {
      const chat = recentById.get(id);
      if (chat) {
        onResumeChat(chat.id);
        onClose();
      }
      return;
    }
    if (kind === 'prompt') {
      const prompt = promptById.get(id);
      if (prompt) {
        onFillPrompt(prompt);
        onClose();
      }
      return;
    }
    if (kind === 'action') {
      const action = actionById.get(id);
      if (action?.url) {
        void openExternalUrl(action.url);
        onClose();
      }
    }
  };

  // Split assistants by category for grouped rendering.
  const teamAssistants = assistants.filter((a) => a.category === 'team');
  const specialistAssistants = assistants.filter((a) => a.category === 'specialist');
  const builtinAssistants = assistants.filter((a) => a.category === 'builtin');

  // Best match group: surface the top fuzzy hit above the categorized
  // groups. cmdk handles ranking inside each group; the Best-match group is
  // populated by cmdk's filter pass (we render all candidates and cmdk
  // hides the ones that don't match the query). It still ranks within the
  // group, so the top item there *is* the best match across the source.
  const bestMatchCandidates: Array<
    | { kind: 'assistant'; row: PaletteAssistant }
    | { kind: 'recent'; row: PaletteRecent }
    | { kind: 'prompt'; row: PaletteStarterPrompt }
    | { kind: 'action'; row: PaletteAction }
  > = [
    ...assistants.map((row) => ({ kind: 'assistant' as const, row })),
    ...recents.map((row) => ({ kind: 'recent' as const, row })),
    ...prompts.map((row) => ({ kind: 'prompt' as const, row })),
    ...actions.map((row) => ({ kind: 'action' as const, row })),
  ];

  const content = (
    <div
      ref={overlayRef}
      data-testid='cmdk-overlay'
      className='fixed inset-0 z-9999 flex items-start justify-center pt-[15vh] bg-[var(--bg-overlay)]'
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className='w-full max-w-640px mx-16px bg-[var(--bg-elevated)] rounded-16px shadow-2xl overflow-hidden'
        onClick={(e) => e.stopPropagation()}
        role='dialog'
        aria-modal
        aria-label={t('common.cmdk.label')}
      >
        <Command label={t('common.cmdk.label')} loop>
          <div className='flex items-center gap-10px px-16px py-12px border-b border-[var(--bg-3)]'>
            <Search size={16} className='text-[var(--text-muted)] shrink-0' />
            <Command.Input
              autoFocus
              placeholder={t('common.cmdk.placeholder')}
              className='flex-1 bg-transparent border-none outline-none text-14px text-[var(--text-primary)] placeholder-[var(--text-muted)]'
            />
            <kbd className='text-11px text-[var(--text-muted)] bg-[var(--bg-3)] rounded-4px px-6px py-2px'>
              Esc
            </kbd>
          </div>

          <Command.List className='max-h-400px overflow-y-auto py-8px'>
            <Command.Empty className='px-16px py-20px text-14px text-[var(--text-muted)] text-center'>
              {t('common.cmdk.noResults')}
            </Command.Empty>

            {bestMatchCandidates.length > 0 && (
              <Command.Group heading={t('common.cmdk.groups.bestMatch')}>
                {bestMatchCandidates.map((candidate) => {
                  if (candidate.kind === 'assistant') {
                    const a = candidate.row;
                    return (
                      <Command.Item
                        key={`best-${makeValue('assistant', a.id)}`}
                        value={`best-${makeValue('assistant', a.id)}`}
                        keywords={[a.name, a.presetAgentType ?? '']}
                        onSelect={() => handleSelect(makeValue('assistant', a.id))}
                        className='px-16px py-10px cursor-pointer data-[selected=true]:bg-[var(--brand-soft-bg)]'
                      >
                        <PaletteRow
                          icon={<Bot size={16} />}
                          title={a.name}
                          subtitle={a.presetAgentType}
                        />
                      </Command.Item>
                    );
                  }
                  if (candidate.kind === 'recent') {
                    const r = candidate.row;
                    return (
                      <Command.Item
                        key={`best-${makeValue('recent', r.id)}`}
                        value={`best-${makeValue('recent', r.id)}`}
                        keywords={[r.title]}
                        onSelect={() => handleSelect(makeValue('recent', r.id))}
                        className='px-16px py-10px cursor-pointer data-[selected=true]:bg-[var(--brand-soft-bg)]'
                      >
                        <PaletteRow icon={<Clock size={16} />} title={r.title} />
                      </Command.Item>
                    );
                  }
                  if (candidate.kind === 'prompt') {
                    const p = candidate.row;
                    return (
                      <Command.Item
                        key={`best-${makeValue('prompt', p.id)}`}
                        value={`best-${makeValue('prompt', p.id)}`}
                        keywords={[p.text]}
                        onSelect={() => handleSelect(makeValue('prompt', p.id))}
                        className='px-16px py-10px cursor-pointer data-[selected=true]:bg-[var(--brand-soft-bg)]'
                      >
                        <PaletteRow icon={<Sparkles size={16} />} title={t(p.label)} subtitle={p.text} />
                      </Command.Item>
                    );
                  }
                  const action = candidate.row;
                  return (
                    <Command.Item
                      key={`best-${makeValue('action', action.id)}`}
                      value={`best-${makeValue('action', action.id)}`}
                      keywords={[t(action.label)]}
                      onSelect={() => handleSelect(makeValue('action', action.id))}
                      className='px-16px py-10px cursor-pointer data-[selected=true]:bg-[var(--brand-soft-bg)]'
                    >
                      <PaletteRow icon={<BookOpen size={16} />} title={t(action.label)} />
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}

            {teamAssistants.length > 0 && (
              <Command.Group heading={t('common.cmdk.groups.teams')}>
                {teamAssistants.map((a) => (
                  <Command.Item
                    key={makeValue('assistant', a.id)}
                    value={makeValue('assistant', a.id)}
                    keywords={[a.name, a.presetAgentType ?? '']}
                    onSelect={handleSelect}
                    className='px-16px py-10px cursor-pointer data-[selected=true]:bg-[var(--brand-soft-bg)]'
                  >
                    <PaletteRow icon={<Users size={16} />} title={a.name} subtitle={a.presetAgentType} />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {specialistAssistants.length > 0 && (
              <Command.Group heading={t('common.cmdk.groups.specialists')}>
                {specialistAssistants.map((a) => (
                  <Command.Item
                    key={makeValue('assistant', a.id)}
                    value={makeValue('assistant', a.id)}
                    keywords={[a.name, a.presetAgentType ?? '']}
                    onSelect={handleSelect}
                    className='px-16px py-10px cursor-pointer data-[selected=true]:bg-[var(--brand-soft-bg)]'
                  >
                    <PaletteRow icon={<Bot size={16} />} title={a.name} subtitle={a.presetAgentType} />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {builtinAssistants.length > 0 && (
              <Command.Group heading={t('common.cmdk.groups.builtins')}>
                {builtinAssistants.map((a) => (
                  <Command.Item
                    key={makeValue('assistant', a.id)}
                    value={makeValue('assistant', a.id)}
                    keywords={[a.name, a.presetAgentType ?? '']}
                    onSelect={handleSelect}
                    className='px-16px py-10px cursor-pointer data-[selected=true]:bg-[var(--brand-soft-bg)]'
                  >
                    <PaletteRow icon={<Bot size={16} />} title={a.name} subtitle={a.presetAgentType} />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {recents.length > 0 && (
              <Command.Group heading={t('common.cmdk.groups.recents')}>
                {recents.map((r) => (
                  <Command.Item
                    key={makeValue('recent', r.id)}
                    value={makeValue('recent', r.id)}
                    keywords={[r.title]}
                    onSelect={handleSelect}
                    className='px-16px py-10px cursor-pointer data-[selected=true]:bg-[var(--brand-soft-bg)]'
                  >
                    <PaletteRow icon={<Clock size={16} />} title={r.title} />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {prompts.length > 0 && (
              <Command.Group heading={t('common.cmdk.groups.prompts')}>
                {prompts.map((p) => (
                  <Command.Item
                    key={makeValue('prompt', p.id)}
                    value={makeValue('prompt', p.id)}
                    keywords={[p.text]}
                    onSelect={handleSelect}
                    className='px-16px py-10px cursor-pointer data-[selected=true]:bg-[var(--brand-soft-bg)]'
                  >
                    <PaletteRow icon={<Sparkles size={16} />} title={t(p.label)} subtitle={p.text} />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {actions.length > 0 && (
              <Command.Group heading={t('common.cmdk.groups.actions')}>
                {actions.map((a) => (
                  <Command.Item
                    key={makeValue('action', a.id)}
                    value={makeValue('action', a.id)}
                    keywords={[t(a.label)]}
                    onSelect={handleSelect}
                    className='px-16px py-10px cursor-pointer data-[selected=true]:bg-[var(--brand-soft-bg)]'
                  >
                    <PaletteRow icon={<BookOpen size={16} />} title={t(a.label)} />
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default CommandPalette;
export { CommandPalette };
