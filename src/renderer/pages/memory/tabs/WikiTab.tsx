/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Wave 5 — WikiTab. 2-pane surface that lists promoted wiki entries (left)
 * and renders the compiled markdown of the active entry (right).
 *
 * Markdown sanitization: every byte of compiled wiki markdown is run through
 * a minimal markdown-to-HTML converter and then DOMPurify with a strict
 * tag/attr allowlist before being injected via dangerouslySetInnerHTML.
 * DOMPurify is the security boundary; the markdown converter is intentionally
 * tiny and `marked` is not in the dep tree, so DOMPurify also catches anything
 * the converter accidentally passes through.
 */

import { Button, Message } from '@arco-design/web-react';
import DOMPurify from 'dompurify';
import { BookOpen, Download, Share2, Upload } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { ipcBridge } from '@/common';
import MCPVerbCard from '../components/MCPVerbCard';
import { useIjfwBrain } from '../hooks/useIjfwBrain';
import styles from './WikiTab.module.css';

type WikiEntry = {
  slug: string;
  title: string;
  updatedAt: number;
};

type WikiList = {
  entries: WikiEntry[];
};

type WikiCompiled = {
  markdown: string;
  meta: {
    compiled: boolean;
    promotedAt: number;
  };
};

const ALLOWED_TAGS = ['p', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'code', 'pre', 'blockquote', 'a', 'br'];
const ALLOWED_ATTR = ['href'];

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const inlineFormat = (s: string): string => {
  let escaped = escapeHtml(s);
  escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  escaped = escaped.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return escaped;
};

/**
 * Minimal markdown to HTML converter. Handles the subset matching ALLOWED_TAGS.
 * Anything outside this subset, or anything malicious, is caught by the
 * DOMPurify pass after this returns.
 */
const markdownToHtml = (md: string): string => {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inCode = false;
  let codeBuf: string[] = [];
  let inList: 'ul' | 'ol' | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length === 0) return;
    const text = para.join(' ');
    out.push(`<p>${inlineFormat(text)}</p>`);
    para = [];
  };

  const closeList = () => {
    if (inList !== null) {
      out.push(`</${inList}>`);
      inList = null;
    }
  };

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      if (inCode === true) {
        out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
        codeBuf = [];
        inCode = false;
      } else {
        flushPara();
        closeList();
        inCode = true;
      }
      continue;
    }
    if (inCode === true) {
      codeBuf.push(line);
      continue;
    }

    const headerMatch = /^(#{1,4})\s+(.*)$/.exec(line);
    if (headerMatch !== null) {
      flushPara();
      closeList();
      const level = headerMatch[1].length;
      out.push(`<h${level}>${inlineFormat(headerMatch[2])}</h${level}>`);
      continue;
    }

    const ulMatch = /^[-*]\s+(.*)$/.exec(line);
    const olMatch = /^\d+\.\s+(.*)$/.exec(line);
    if (ulMatch !== null) {
      flushPara();
      if (inList !== 'ul') {
        closeList();
        out.push('<ul>');
        inList = 'ul';
      }
      out.push(`<li>${inlineFormat(ulMatch[1])}</li>`);
      continue;
    }
    if (olMatch !== null) {
      flushPara();
      if (inList !== 'ol') {
        closeList();
        out.push('<ol>');
        inList = 'ol';
      }
      out.push(`<li>${inlineFormat(olMatch[1])}</li>`);
      continue;
    }

    if (line.trim().startsWith('>')) {
      flushPara();
      closeList();
      out.push(`<blockquote>${inlineFormat(line.replace(/^>\s?/, ''))}</blockquote>`);
      continue;
    }

    if (line.trim() === '') {
      flushPara();
      closeList();
      continue;
    }

    para.push(line);
  }

  if (inCode === true) {
    out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
  }
  flushPara();
  closeList();

  return out.join('\n');
};

const renderMarkdown = (md: string): string => {
  const html = markdownToHtml(md);
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  }) as unknown as string;
};

const WikiTab: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSlug = searchParams.get('slug');
  const [activeSlug, setActiveSlug] = useState<string | null>(initialSlug);

  const listState = useIjfwBrain<WikiList>('wiki.get', {}, []);
  const compileState = useIjfwBrain<WikiCompiled>(
    'wiki.compile',
    activeSlug !== null ? { slug: activeSlug } : {},
    [activeSlug]
  );

  // Re-sync slug from URL on browser navigation.
  useEffect(() => {
    const slugParam = searchParams.get('slug');
    if (slugParam !== activeSlug) {
      setActiveSlug(slugParam);
    }
  }, [searchParams, activeSlug]);

  const selectEntry = useCallback(
    (slug: string) => {
      setActiveSlug(slug);
      const next = new URLSearchParams(searchParams);
      next.set('tab', 'wiki');
      next.set('slug', slug);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handlePromote = useCallback(async () => {
    if (activeSlug === null) return;
    try {
      const result = await ipcBridge.ijfw.brainInvoke.invoke({
        verb: 'wiki.promote',
        args: { slug: activeSlug },
      });
      if (result.ok === true) {
        Message.success(t('memory.wiki.promote_ok'));
      } else {
        Message.error(t('memory.wiki.promote_err'));
      }
    } catch {
      Message.error(t('memory.wiki.promote_err'));
    }
  }, [activeSlug, t]);

  const handleExport = useCallback(async () => {
    if (activeSlug === null) return;
    try {
      const result = await ipcBridge.ijfw.brainInvoke.invoke({
        verb: 'wiki.export',
        args: { slug: activeSlug },
      });
      if (result.ok === true) {
        Message.success(t('memory.wiki.export_queued'));
      } else {
        Message.error(t('memory.wiki.export_err'));
      }
    } catch {
      Message.error(t('memory.wiki.export_err'));
    }
  }, [activeSlug, t]);

  const handleShareReadme = useCallback(async () => {
    if (activeSlug === null) return;
    try {
      const result = await ipcBridge.ijfw.brainInvoke.invoke({
        verb: 'wiki.shareReadme',
        args: { slug: activeSlug },
      });
      if (result.ok === true) {
        Message.success(t('memory.wiki.share_ok'));
      } else {
        Message.error(t('memory.wiki.share_err'));
      }
    } catch {
      Message.error(t('memory.wiki.share_err'));
    }
  }, [activeSlug, t]);

  const sanitizedHtml = useMemo(() => {
    if (compileState.loading === true) return null;
    if (compileState.ok === false) return null;
    return renderMarkdown(compileState.data.markdown ?? '');
  }, [compileState]);

  return (
    <div className={styles.wiki} data-testid='memory-tab-wiki'>
      <div className={styles.list} data-testid='wiki-list'>
        <MCPVerbCard
          state={listState}
          empty={<div className={styles.empty}>{t('memory.wiki.list_empty')}</div>}
          render={(data) => (
            <>
              {data.entries.map((entry) => {
                const isActive = entry.slug === activeSlug;
                return (
                  <button
                    type='button'
                    key={entry.slug}
                    onClick={() => selectEntry(entry.slug)}
                    className={`${styles.listRow} ${isActive === true ? styles.listRowActive : ''}`}
                    data-testid={`wiki-list-row-${entry.slug}`}
                    data-active={isActive === true ? 'true' : 'false'}
                  >
                    <span className={styles.listRowTitle}>
                      <BookOpen size={12} aria-hidden style={{ marginRight: 6, verticalAlign: 'middle' }} />
                      {entry.title}
                    </span>
                  </button>
                );
              })}
            </>
          )}
        />
      </div>

      <div className={styles.pane}>
        <div className={styles.toolbar} data-testid='wiki-toolbar'>
          <Button
            type='primary'
            size='small'
            icon={<Upload size={14} aria-hidden />}
            disabled={activeSlug === null}
            onClick={handlePromote}
            data-testid='wiki-button-promote'
          >
            {t('memory.wiki.promote')}
          </Button>
          <Button
            size='small'
            icon={<Download size={14} aria-hidden />}
            disabled={activeSlug === null}
            onClick={handleExport}
            data-testid='wiki-button-export'
          >
            {t('memory.wiki.export')}
          </Button>
          <Button
            size='small'
            icon={<Share2 size={14} aria-hidden />}
            disabled={activeSlug === null}
            onClick={handleShareReadme}
            data-testid='wiki-button-share'
          >
            {t('memory.wiki.share_readme')}
          </Button>
        </div>

        {activeSlug === null ? (
          <div className={styles.placeholder} data-testid='wiki-placeholder'>
            {t('memory.wiki.select_prompt')}
          </div>
        ) : (
          <MCPVerbCard
            state={compileState}
            render={() =>
              sanitizedHtml === null ? (
                <div className={styles.placeholder}>{t('memory.wiki.select_prompt')}</div>
              ) : (
                <div
                  className={styles.content}
                  data-testid='wiki-content'
                  // DOMPurify sanitization happens in renderMarkdown above.
                  // ALLOWED_TAGS/ALLOWED_ATTR is the source of truth for what
                  // survives. Anything outside the list (script, iframe, on*)
                  // is dropped before this string reaches the DOM.
                  dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                />
              )
            }
          />
        )}
      </div>
    </div>
  );
};

export default WikiTab;
