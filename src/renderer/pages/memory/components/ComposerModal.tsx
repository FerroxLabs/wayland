/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ComposerModal - centered modal for creating new memory entries.
 *
 * Replaces the "janky" QuickAddFoot footer strip (Wave 2 will wire in + Add).
 * Tags are stored in local state but are NOT forwarded to setQuickAdd (IPC only
 * accepts { content, scope, type? }). See DEVIATION note below.
 *
 * DEVIATION: `tags` and `scope` are UI-only in v1. `setQuickAdd` only accepts
 * `{ content, scope }` - tags are rendered but not persisted to the IPC call.
 * When the IPC is extended (add `tags?: string[]` to its payload type) Wire 3
 * should pass them through. Scope IS forwarded.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Input, Message, Modal } from '@arco-design/web-react';
import { X } from 'lucide-react';
import { memory as memoryBridge } from '@/common/adapter/ipcBridge';
import { useTranslation } from 'react-i18next';
import styles from './ComposerModal.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ComposerModalProps = {
  open: boolean;
  onClose: () => void;
  /**
   * Projects the archive has indexed, as {path, basename}. A `project`-scoped
   * save must name exactly one of these (#924): the Memory page is a standalone
   * route with no conversation context, so there is nothing to infer the
   * project FROM and the destination has to be chosen explicitly. An empty list
   * means project scope is unavailable and the toggle is disabled.
   */
  projects?: ReadonlyArray<{ path: string; basename: string }>;
  /** Project pre-selected on open - the Memory page's project filter, when set. */
  defaultProjectPath?: string;
  onSubmit?: (entry: { content: string; scope: 'project' | 'global'; tags: string[] }) => void | Promise<void>;
};

const MAX_CHARS = 8000;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ComposerModal({
  open,
  onClose,
  projects = [],
  defaultProjectPath,
  onSubmit,
}: ComposerModalProps): React.ReactElement | null {
  const { t } = useTranslation();

  const [content, setContent] = useState('');
  const [scope, setScope] = useState<'project' | 'global'>('project');
  const [projectPath, setProjectPath] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const tagInputRef = useRef<HTMLInputElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);

  // The seed below reads exactly one thing out of `projects`: the first path.
  // Depend on THAT, never on the array identity - `projects` is a fresh array on
  // every parent render (the `= []` default included, and FullPanelShell builds
  // its list with `.map`). With the array in the effect's dependency list the
  // effect re-ran after every render, its close-branch `setTags([])` committed a
  // new array each time, and the two fed each other in an unbounded loop that
  // exhausted the heap.
  const firstProjectPath = projects[0]?.path ?? '';

  // #924: once the user has picked a destination it is authoritative for the
  // rest of this open cycle. `firstProjectPath` (and `defaultProjectPath`) move
  // whenever a BACKGROUND index refresh reorders the project list - the Memory
  // page re-fetches on `onIndexChanged`, which IJFW fires whenever an agent
  // writes memory - and re-seeding then rewrote the chosen destination out from
  // under the open picker, sending the note to a project the user never named.
  // Seeding stays live only while the user has not chosen, so a project list
  // that arrives after the modal opens still fills the destination in.
  const userPickedRef = useRef(false);

  // Auto-focus textarea when modal opens; reset state on close.
  useEffect(() => {
    if (open) {
      // Seed the destination from the page's project filter, else the first
      // indexed project. Never left blank while a project exists, so the
      // destination line below always names a real place (#924).
      if (!userPickedRef.current) setProjectPath(defaultProjectPath ?? firstProjectPath);
      // Defer focus so Arco has time to mount
      const id = window.setTimeout(() => {
        textareaRef.current?.focus();
      }, 60);
      return () => window.clearTimeout(id);
    } else {
      // Clear on close
      userPickedRef.current = false;
      setContent('');
      setScope('project');
      setProjectPath('');
      setTags([]);
      setTagInput('');
      setAddingTag(false);
      setError(null);
    }
  }, [open, defaultProjectPath, firstProjectPath]);

  // ESC already handled by Arco Modal's closable / onCancel - no extra listener needed.

  // #924: the Memory page keys its project filter on BASENAME, and this modal
  // turns that name into a WRITE destination. Two indexed projects can share a
  // basename (`~/dev/one/app` and `~/dev/two/app` are both "app"), and a bare
  // "app" then names an ambiguous place while the write always resolves to
  // whichever came first. Qualify a colliding name with its parent directory so
  // the label identifies exactly one project. Paths are compared as strings -
  // the renderer has no `path` module - and both separators are handled because
  // the same list is built from Windows paths too.
  const basenameCounts = new Map<string, number>();
  for (const p of projects) basenameCounts.set(p.basename, (basenameCounts.get(p.basename) ?? 0) + 1);
  const labelFor = (p: { path: string; basename: string }): string => {
    if ((basenameCounts.get(p.basename) ?? 0) < 2) return p.basename;
    const parent = p.path.split(/[/\\]/).filter(Boolean).at(-2);
    return parent ? `${p.basename} (${parent})` : p.path;
  };

  // #924: name the destination the save will actually reach. Main is the
  // authority - it refuses a project-scoped save it cannot place rather than
  // redirecting it to the global brain - so the renderer's job is to pick the
  // project explicitly and show which one, never to re-decide the scope.
  const selectedProject = projects.find((p) => p.path === projectPath);
  const destinationName =
    scope === 'global'
      ? t('archive.composer.destGlobal', 'Global memory (every chat)')
      : (selectedProject && labelFor(selectedProject)) || '';

  // ---- Submit ----
  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      setError(t('archive.composer.errorEmpty', 'Content cannot be empty.'));
      return;
    }
    if (trimmed.length > MAX_CHARS) {
      setError(
        t('archive.composer.errorTooLong', `Content exceeds ${MAX_CHARS} character limit.`, {
          max: MAX_CHARS,
        })
      );
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({ content: trimmed, scope, tags });
      } else {
        // DEVIATION: tags not in IPC payload - scope IS forwarded
        const result = await memoryBridge.setQuickAdd.invoke({
          content: trimmed,
          scope,
          ...(scope === 'project' && projectPath ? { projectPath } : {}),
        });
        if (result.ok === false && result.error) {
          // #924: main answers a project-scoped save it cannot place with the
          // internal code `unresolved_project_scope`, and that code was printed
          // straight at the user. It is reachable on the FIRST-RUN path - before
          // anything is indexed there is no project to name, so `projects` is
          // empty, no picker renders, and the save cannot resolve. Say what
          // happened and what to do instead of leaking the identifier.
          throw new Error(
            result.error === 'unresolved_project_scope'
              ? t(
                  'archive.composer.errorNoProject',
                  'No project is indexed yet, so this cannot be saved to a project. Switch to global to save it.'
                )
              : result.error
          );
        }
        // Fire archive refresh via the event emitter so MemoryList picks it up
        // (same pattern as FullPanelShell's handleQuickAdd → reload)
      }
      Message.success(t('archive.composer.toastSaved', 'Memory saved'));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('archive.composer.errorUnknown', 'Failed to save.'));
    } finally {
      setSubmitting(false);
    }
  }, [content, scope, tags, projectPath, onSubmit, onClose, t]);

  // ---- Cmd/Ctrl+Enter to submit ----
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        void handleSubmit();
      }
    },
    [handleSubmit]
  );

  // ---- Tag management ----
  const commitTag = useCallback(() => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
    setAddingTag(false);
  }, [tagInput, tags]);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitTag();
      }
      if (e.key === 'Escape') {
        setTagInput('');
        setAddingTag(false);
      }
    },
    [commitTag]
  );

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  // ---- Drag-drop ----
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result;
        if (typeof text === 'string') {
          const block = content.trim() ? `${content}\n\n\`\`\`\n${text}\n\`\`\`` : text;
          setContent(block);
        }
      };
      reader.readAsText(file);
    },
    [content]
  );

  if (!open) return null;

  const charCount = content.length;
  const charOverLimit = charCount > MAX_CHARS;

  return (
    <Modal
      visible={open}
      onCancel={onClose}
      title={null}
      footer={null}
      closable={false}
      maskClosable
      className={styles.modal}
      data-testid='composer-modal'
      getPopupContainer={() => document.body}
    >
      <div className={styles.inner}>
        {/* ---- Header ---- */}
        <div className={styles.header}>
          <h2 className={styles.title} data-testid='composer-title'>
            {t('archive.composer.title', 'Remember anything…')}
          </h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={t('common.close', 'Close')}
            data-testid='composer-close-btn'
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {/* ---- Textarea ---- */}
        <div className={styles.textareaWrap}>
          <Input.TextArea
            ref={(el) => {
              if (el) {
                const ta = (el as unknown as { dom?: HTMLTextAreaElement }).dom;
                if (ta) textareaRef.current = ta;
              }
            }}
            className={`${styles.textarea}${charOverLimit ? ` ${styles.textareaError}` : ''}`}
            placeholder={t('archive.composer.placeholder', 'Type your memory… (markdown OK)')}
            value={content}
            onChange={(val) => {
              setContent(val);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            disabled={submitting}
            autoSize={{ minRows: 8, maxRows: 14 }}
            data-testid='composer-textarea'
          />
          {/* char count + inline error */}
          <div className={styles.textareaFooter}>
            {error && (
              <span className={styles.errorMsg} role='alert' data-testid='composer-error'>
                {error}
              </span>
            )}
            <span
              className={`${styles.charCount}${charOverLimit ? ` ${styles.charCountOver}` : ''}`}
              aria-label={`${charCount} characters`}
            >
              {charCount.toLocaleString()}/{MAX_CHARS.toLocaleString()}
            </span>
          </div>
        </div>

        {/* ---- Scope toggle ---- */}
        <div className={styles.scopeRow} data-testid='composer-scope-row'>
          <button
            className={`${styles.scopePill}${scope === 'project' ? ` ${styles.scopePillActive}` : ''}`}
            onClick={() => setScope('project')}
            aria-pressed={scope === 'project'}
            data-testid='composer-scope-project'
          >
            📁 {t('archive.composer.scopeProject', 'project')}
          </button>
          <button
            className={`${styles.scopePill}${scope === 'global' ? ` ${styles.scopePillActive}` : ''}`}
            onClick={() => setScope('global')}
            aria-pressed={scope === 'global'}
            data-testid='composer-scope-global'
          >
            🌐 {t('archive.composer.scopeGlobal', 'global')}
          </button>
        </div>

        {/* ---- Destination (#924) ---- */}
        {/* The scope pill alone told the user "project" while the actual
            destination was resolved elsewhere and could differ. Name the real
            place, and let them change it, before they save. */}
        <div className={styles.scopeRow} data-testid='composer-destination-row'>
          <span data-testid='composer-destination'>
            {t('archive.composer.savingTo', 'Saving to')}:{' '}
            {destinationName || t('archive.composer.destNone', 'no project selected')}
          </span>
          {scope === 'project' && projects.length > 1 && (
            <select
              value={projectPath}
              onChange={(e) => {
                userPickedRef.current = true;
                setProjectPath(e.target.value);
              }}
              aria-label={t('archive.composer.projectPicker', 'Project to save to')}
              data-testid='composer-project-picker'
            >
              {projects.map((p) => (
                <option key={p.path} value={p.path}>
                  {labelFor(p)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* ---- Tag chip input ---- */}
        <div className={styles.tagRow} data-testid='composer-tag-row'>
          {tags.map((tag) => (
            <span key={tag} className={styles.tagChip} data-testid={`composer-tag-${tag}`}>
              {tag}
              <button className={styles.tagRemoveBtn} onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`}>
                <X size={10} aria-hidden />
              </button>
            </span>
          ))}
          {addingTag ? (
            <input
              ref={tagInputRef}
              className={styles.tagInput}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={commitTag}
              placeholder='tag…'
              data-testid='composer-tag-input'
              autoFocus
            />
          ) : (
            <button className={styles.addTagBtn} onClick={() => setAddingTag(true)} data-testid='composer-add-tag-btn'>
              + {t('archive.composer.addTag', 'Add tag')}
            </button>
          )}
        </div>

        {/* ---- Drop zone ---- */}
        <div
          ref={dropZoneRef}
          className={styles.dropZone}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-testid='composer-drop-zone'
          role='region'
          aria-label={t('archive.composer.dropZoneLabel', 'Drop a file to ingest')}
        >
          {t('archive.composer.dropZone', 'or drop a file to ingest')}
        </div>

        {/* ---- Footer ---- */}
        <div className={styles.footer}>
          <span className={styles.footerHint}>⌘↵ {t('archive.composer.hint', 'to Remember')}</span>
          <div className={styles.footerActions}>
            <Button onClick={onClose} disabled={submitting} data-testid='composer-cancel-btn'>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type='primary'
              loading={submitting}
              disabled={!content.trim() || charOverLimit}
              onClick={() => void handleSubmit()}
              data-testid='composer-submit-btn'
              className={styles.submitBtn}
            >
              {t('archive.composer.submit', 'Remember')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default ComposerModal;
