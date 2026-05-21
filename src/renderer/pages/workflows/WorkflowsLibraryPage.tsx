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

import { Button, Input } from '@arco-design/web-react';
import { Download, Sparkles } from 'lucide-react';
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
// Alphabetical by display label (Sean's directive 2026-05-21). Keeps the
// rail predictable when categories expand — no implicit ranking, no
// remembering 'is Lifestyle before or after Career?' Scanning a-z is
// always the answer.
const CATEGORY_ORDER: CategoryDef[] = [
  { slug: 'business-operations', label: 'Business Operations' },
  { slug: 'career', label: 'Career' },
  { slug: 'content-creation', label: 'Content Creation' },
  { slug: 'creative-project', label: 'Creative Projects' },
  { slug: 'cross-domain', label: 'Cross-Domain' },
  { slug: 'life-event', label: 'Lifestyle' },
  { slug: 'software-project', label: 'Software & Engineering' },
];

// Six workflows that map to what AI-agent users actually do 95% of the
// time — writing, marketing, shipping, recurring automation — rather
// than the prior list that over-indexed on once-in-a-lifetime events
// (buy a home), narrow technical paths (mobile app, system design
// interviews) and multi-year aspirations (speaking career, thought
// leadership). Order is roughly: meta → content frequency → campaigns
// → planning → shipping → creator-economy.
//
// When a slug doesn't exist in the loaded set we skip it silently
// rather than showing a placeholder.
const FEATURED_SLUGS = [
  'automate-business-workflows',
  'publish-blog-post',
  'create-marketing-campaign',
  'create-content-calendar',
  'launch-product',
  'launch-newsletter',
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
      className='size-full overflow-hidden flex flex-col'
      style={{ background: 'var(--color-bg-1)' }}
    >
      <div className='flex-1 min-h-0 overflow-y-auto px-24px py-20px'>
        <div className='flex flex-col gap-16px min-w-0'>
        <header className='flex items-center justify-between gap-16px'>
          <div className='flex items-baseline gap-12px min-w-0'>
            <h1
              className='text-20px font-semibold m-0 truncate'
              style={{ color: 'var(--color-text-1)' }}
            >
              {t('title', 'Workflows')}
            </h1>
            <span
              className='text-13px shrink-0'
              style={{ color: 'var(--color-text-3)' }}
            >
              {t('count', '{{count}} workflow', { count: workflows.length })}
            </span>
          </div>
          <div className='flex items-center gap-8px shrink-0'>
            <Button
              type='secondary'
              icon={<Download size={14} />}
              onClick={() => {
                // eslint-disable-next-line no-alert
                window.alert(
                  t(
                    'import.placeholder',
                    'Import wiring lands next: folder / git URL / SKILL.md with type:workflow auto-detected via frontmatter, scanned by Skill Guard, and registered as source:imported.',
                  ),
                );
              }}
            >
              {t('actions.import', 'Import workflow')}
            </Button>
            <Button
              type='primary'
              icon={<Sparkles size={14} />}
              onClick={() => {
                // eslint-disable-next-line no-alert
                window.alert(
                  t(
                    'build.placeholder',
                    'Workflow builder coming next: describe it in plain language → AI drafts a SKILL.md with category + depends inferred from the live skill library → review + save.',
                  ),
                );
              }}
            >
              {t('actions.build', 'Build a workflow')}
            </Button>
          </div>
        </header>

        <div className='flex gap-20px items-start'>
          {/* Category rail — search lifts in here (mirrors Assistants
              page pattern) so the user sees filter + categories as one
              control surface instead of a search bar floating above.
              Border-right divides the rail from the card grid, same
              treatment as Assistants FilterRail for visual parity. */}
          <aside
            className='shrink-0 w-200px sticky top-0 flex flex-col gap-8px py-2px pr-16px'
            style={{
              color: 'var(--color-text-2)',
              borderRight: '1px solid var(--color-border-2)',
              alignSelf: 'stretch',
            }}
          >
            <Input.Search
              placeholder={t('search.placeholder', 'Search workflows…')}
              value={query}
              onChange={(v) => setQuery(v)}
              allowClear
            />
            {!searching ? (
              <div className='flex flex-col gap-2px'>
                <button
                  type='button'
                  onClick={() => setActiveCategory(null)}
                  className='flex items-center justify-between gap-12px px-10px py-6px rd-6px text-13px cursor-pointer transition-colors'
                  style={{
                    background: activeCategory === null ? 'var(--color-fill-2)' : 'transparent',
                    color: activeCategory === null ? 'var(--color-text-1)' : 'var(--color-text-2)',
                    fontWeight: activeCategory === null ? 600 : 400,
                    border: 'none',
                  }}
                >
                  <span className='truncate'>{t('allCategories', 'All workflows')}</span>
                  <span className='text-11px shrink-0' style={{ color: 'var(--color-text-3)' }}>
                    {workflows.length}
                  </span>
                </button>
                {sections.map((s) => (
                  <button
                    key={s.slug}
                    type='button'
                    onClick={() => setActiveCategory(s.slug)}
                    className='flex items-center justify-between gap-12px px-10px py-6px rd-6px text-13px cursor-pointer transition-colors'
                    style={{
                      background: activeCategory === s.slug ? 'var(--color-fill-2)' : 'transparent',
                      color: activeCategory === s.slug ? 'var(--color-text-1)' : 'var(--color-text-2)',
                      fontWeight: activeCategory === s.slug ? 600 : 400,
                      border: 'none',
                    }}
                  >
                    <span className='truncate'>{s.label}</span>
                    <span className='text-11px shrink-0' style={{ color: 'var(--color-text-3)' }}>
                      {s.entries.length}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className='text-12px px-10px' style={{ color: 'var(--color-text-3)' }}>
                {t('count', '{{count}} workflows', { count: searchFiltered.length })}
              </div>
            )}
          </aside>

          <div className='flex-1 min-w-0 flex flex-col gap-20px'>
            {searching ? (
              searchFiltered.length === 0 ? (
                <div
                  className='text-center text-13px py-40px'
                  style={{ color: 'var(--color-text-2)' }}
                >
                  {t('search.empty', 'No workflows match your search')}
                </div>
              ) : (
                <div
                  className='grid gap-12px'
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', minWidth: 0 }}
                >
                  {searchFiltered.map((w) => (
                    <WorkflowCard key={w.name} entry={w} onClick={handleCardClick} />
                  ))}
                </div>
              )
            ) : (
              <>
                {/* Featured — Forge Orange header + accented cards so the
                    curated tier reads as a distinct emphasis without
                    leaving the page rhythm. Only shows on All-workflows. */}
                {activeCategory === null && featured.length > 0 ? (
                  <section>
                    <h2
                      className='text-13px font-semibold uppercase m-0 mb-10px flex items-center gap-8px'
                      style={{ color: 'rgb(var(--primary-6))', letterSpacing: '0.08em' }}
                    >
                      <span>{t('section.featured', 'Featured workflows')}</span>
                      <span style={{ color: 'var(--color-text-3)', fontWeight: 400 }}>
                        · {featured.length}
                      </span>
                    </h2>
                    <div
                      className='grid gap-12px'
                      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', minWidth: 0 }}
                    >
                      {featured.map((w) => (
                        <WorkflowCard key={w.name} entry={w} onClick={handleCardClick} featured />
                      ))}
                    </div>
                  </section>
                ) : null}

                {/* "All workflows" header — high-contrast prominent label
                    so it reads as a tier marker, not as muted body chrome
                    (Sean: 'all workflows is barely visible'). Tight 8px
                    gap below collapses the dead space between Featured
                    and Lifestyle that read as a layout error. */}
                {activeCategory === null && featured.length > 0 ? (
                  <div
                    className='flex items-center gap-12px'
                    style={{ color: 'var(--color-text-1)' }}
                  >
                    <h2
                      className='text-13px font-semibold uppercase m-0 shrink-0'
                      style={{ letterSpacing: '0.08em' }}
                    >
                      {t('section.all', 'All workflows')}
                    </h2>
                    <span
                      className='text-11px shrink-0'
                      style={{ color: 'var(--color-text-3)' }}
                    >
                      · {workflows.length - featured.length}
                    </span>
                    <div
                      className='flex-1 h-1px'
                      style={{ background: 'var(--color-border-2)' }}
                    />
                  </div>
                ) : null}

                {visibleSections.map((s) => (
                  <section key={s.slug}>
                    <h2
                      className='text-13px font-semibold uppercase m-0 mb-10px flex items-center gap-8px'
                      style={{ color: 'var(--color-text-3)', letterSpacing: '0.08em' }}
                    >
                      <span>{s.label}</span>
                      <span style={{ color: 'var(--color-text-3)', fontWeight: 400 }}>
                        · {s.entries.length}
                      </span>
                    </h2>
                    <div
                      className='grid gap-12px'
                      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', minWidth: 0 }}
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
    </div>
  );
};

export default WorkflowsLibraryPage;
