/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WorkflowsLibraryPage — step #5 of the Skills/Workflows/Assistants split.
 *
 * Workflows used to live on the Skills page tagged `source:'wayland-library'`,
 * which made the page feel like a soup of "things the agent does" and
 * "recipes the user picks." This page is the new home for procedure-shaped,
 * user-invoked automation: the 107 vendored `type:'workflow'` entries from
 * the FoundrySkills bundle, plus any future imported or team-contributed
 * workflows.
 *
 * Layout: category-grouped sections (Featured first, then Lifestyle,
 * Career, Creative Projects, Software & Engineering, Business Operations,
 * Content Creation, Cross-Domain). Search collapses everything into a
 * flat filtered grid so a needle-in-haystack lookup short-circuits the
 * IA. Each card click opens WorkflowDetailModal with the workflow body
 * plus a list of skill dependencies it activates.
 */

import { Input } from '@arco-design/web-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import type { SkillIndexEntry } from '@/common/types/skillTypes';
import WorkflowCard from './WorkflowCard';
import WorkflowDetailModal from './WorkflowDetailModal';

// Display ordering + labels for the 7 categories shipped by the vendored
// FoundrySkills bundle. Sean's feedback was specifically that "Build A
// Garden" should fall under "Lifestyle" — the bundle tags it as
// `life-event` already, we just needed a friendlier label and to lead
// with the lifestyle bucket. The list also covers what to do with
// unknown future categories (fall through to the bottom under "Other").
type CategoryDef = { slug: string; label: string };
const CATEGORY_ORDER: CategoryDef[] = [
  { slug: 'life-event', label: 'Lifestyle' },
  { slug: 'career', label: 'Career' },
  { slug: 'creative-project', label: 'Creative Projects' },
  { slug: 'software-project', label: 'Software & Engineering' },
  { slug: 'business-operations', label: 'Business Operations' },
  { slug: 'content-creation', label: 'Content Creation' },
  { slug: 'cross-domain', label: 'Cross-Domain' },
];

// Eight workflows that read as broadly applicable AND high-leverage —
// hand-curated so the page doesn't lead with "Build A Garden" or
// "Adopt A Pet" (per Sean's feedback). When a slug here doesn't exist
// in the loaded set (e.g. a future bundle reshuffle) we skip it silently
// rather than showing a placeholder card.
const FEATURED_SLUGS = [
  'automate-business-workflows',
  'build-personal-brand',
  'ace-system-design-interviews',
  'build-saas-landing-page',
  'buy-a-home',
  'build-mobile-app',
  'build-speaking-career',
  'build-thought-leadership',
];

const WorkflowsLibraryPage: React.FC = () => {
  const { t } = useTranslation(undefined, { keyPrefix: 'workflows' });

  const [workflows, setWorkflows] = useState<SkillIndexEntry[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<SkillIndexEntry | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    void ipcBridge.skills.list.invoke({ type: 'workflow' }).then((list) => setWorkflows(list));
  }, []);

  const searching = query.trim().length > 0;

  const searchFiltered = useMemo(() => {
    if (!searching) return workflows;
    const q = query.toLowerCase();
    return workflows.filter(
      (w) => w.name.toLowerCase().includes(q) || w.description.toLowerCase().includes(q),
    );
  }, [workflows, query, searching]);

  // Bucket workflows by category for the grouped layout. Featured is
  // computed off the unfiltered set so even when a user is browsing a
  // specific category the curated list still anchors the top of the page
  // (visible only when not searching).
  const grouped = useMemo(() => {
    const byCategory = new Map<string, SkillIndexEntry[]>();
    for (const w of workflows) {
      const cat = w.metadata.category ?? 'other';
      const arr = byCategory.get(cat) ?? [];
      arr.push(w);
      byCategory.set(cat, arr);
    }
    return byCategory;
  }, [workflows]);

  const featured = useMemo(() => {
    const known = new Map(workflows.map((w) => [w.name, w]));
    return FEATURED_SLUGS.map((slug) => known.get(slug)).filter(
      (w): w is SkillIndexEntry => w != null,
    );
  }, [workflows]);

  const handleCardClick = useCallback((entry: SkillIndexEntry) => setSelected(entry), []);

  // Build the section list once so we can render either a category-rail
  // selection or the full top-down view from one source of truth.
  const sections = useMemo(() => {
    const known = new Set(CATEGORY_ORDER.map((c) => c.slug));
    const out = CATEGORY_ORDER.map((c) => ({
      slug: c.slug,
      label: c.label,
      entries: grouped.get(c.slug) ?? [],
    })).filter((s) => s.entries.length > 0);
    // Append "Other" for any future categories we haven't named yet.
    const other: SkillIndexEntry[] = [];
    for (const [cat, list] of grouped) {
      if (!known.has(cat)) other.push(...list);
    }
    if (other.length > 0) {
      out.push({ slug: 'other', label: 'Other', entries: other });
    }
    return out;
  }, [grouped]);

  const visibleSections = useMemo(() => {
    if (!activeCategory) return sections;
    return sections.filter((s) => s.slug === activeCategory);
  }, [sections, activeCategory]);

  return (
    <div
      className='size-full overflow-y-auto px-32px py-24px'
      style={{ background: 'var(--bg)' }}
    >
      <div className='max-w-[1280px] mx-auto flex flex-col gap-20px'>
        <header>
          <h1
            className='text-24px font-semibold m-0'
            style={{ color: 'var(--text-primary)' }}
          >
            {t('title', 'Workflows')}
          </h1>
          <p
            className='text-14px mt-6px m-0'
            style={{ color: 'var(--text-secondary)' }}
          >
            {t(
              'subtitle',
              'Step-by-step recipes you can launch in one click or schedule to run automatically. Pick a workflow, choose your engine, and the agent will walk you through it.',
            )}
          </p>
        </header>

        <div className='flex items-center gap-12px'>
          <Input.Search
            placeholder={t('search.placeholder', 'Search workflows…')}
            value={query}
            onChange={(v) => setQuery(v)}
            style={{ flex: 1, maxWidth: 'unset' }}
            allowClear
          />
          <div className='text-12px shrink-0' style={{ color: 'var(--text-tertiary)' }}>
            {searching
              ? t('count', '{{count}} workflows', { count: searchFiltered.length })
              : t('count', '{{count}} workflows', { count: workflows.length })}
          </div>
        </div>

        <div className='flex gap-20px items-start'>
          {/* Category rail — only relevant when not searching. Click to
              focus a single section; click again (or "All") to reset. */}
          {!searching ? (
            <aside
              className='shrink-0 w-180px sticky top-0 flex flex-col gap-2px py-2px'
              style={{ color: 'var(--text-secondary)' }}
            >
              <button
                type='button'
                onClick={() => setActiveCategory(null)}
                className='text-left px-10px py-6px rd-6px text-13px cursor-pointer transition-colors'
                style={{
                  background: activeCategory === null ? 'var(--fill-2)' : 'transparent',
                  color: activeCategory === null ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: activeCategory === null ? 600 : 400,
                  border: 'none',
                }}
              >
                <span>{t('allCategories', 'All workflows')}</span>
                <span className='float-right text-11px' style={{ color: 'var(--text-tertiary)' }}>
                  {workflows.length}
                </span>
              </button>
              {sections.map((s) => (
                <button
                  key={s.slug}
                  type='button'
                  onClick={() => setActiveCategory(s.slug)}
                  className='text-left px-10px py-6px rd-6px text-13px cursor-pointer transition-colors'
                  style={{
                    background: activeCategory === s.slug ? 'var(--fill-2)' : 'transparent',
                    color: activeCategory === s.slug ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: activeCategory === s.slug ? 600 : 400,
                    border: 'none',
                  }}
                >
                  <span>{s.label}</span>
                  <span className='float-right text-11px' style={{ color: 'var(--text-tertiary)' }}>
                    {s.entries.length}
                  </span>
                </button>
              ))}
            </aside>
          ) : null}

          <div className='flex-1 min-w-0 flex flex-col gap-28px'>
            {searching ? (
              searchFiltered.length === 0 ? (
                <div
                  className='text-center text-13px py-40px'
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t('search.empty', 'No workflows match your search')}
                </div>
              ) : (
                <div
                  className='grid gap-12px'
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
                >
                  {searchFiltered.map((w) => (
                    <WorkflowCard key={w.name} entry={w} onClick={handleCardClick} />
                  ))}
                </div>
              )
            ) : (
              <>
                {/* Featured — only shows when viewing all categories. */}
                {activeCategory === null && featured.length > 0 ? (
                  <section>
                    <h2
                      className='text-13px font-semibold uppercase m-0 mb-10px'
                      style={{ color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}
                    >
                      {t('section.featured', 'Featured')}
                    </h2>
                    <div
                      className='grid gap-12px'
                      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
                    >
                      {featured.map((w) => (
                        <WorkflowCard key={w.name} entry={w} onClick={handleCardClick} />
                      ))}
                    </div>
                  </section>
                ) : null}

                {visibleSections.map((s) => (
                  <section key={s.slug}>
                    <h2
                      className='text-13px font-semibold uppercase m-0 mb-10px flex items-center gap-8px'
                      style={{ color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}
                    >
                      <span>{s.label}</span>
                      <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>
                        · {s.entries.length}
                      </span>
                    </h2>
                    <div
                      className='grid gap-12px'
                      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
                    >
                      {s.entries.map((w) => (
                        <WorkflowCard key={w.name} entry={w} onClick={handleCardClick} />
                      ))}
                    </div>
                  </section>
                ))}
              </>
            )}
          </div>
        </div>

        <WorkflowDetailModal entry={selected} onClose={() => setSelected(null)} />
      </div>
    </div>
  );
};

export default WorkflowsLibraryPage;
