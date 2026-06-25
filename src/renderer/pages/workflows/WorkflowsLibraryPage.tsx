/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WorkflowsLibraryPage - step #5 of the Skills/Workflows/Assistants split.
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

import { Button } from '@arco-design/web-react';
import { Download, Sparkles, Workflow } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { ipcBridge } from '@/common';
import {
  LibraryFilterRail,
  LibraryFilterRow,
  LibrarySectionHeader,
} from '@/renderer/components/layout/library';
import PageShell from '@/renderer/components/layout/PageShell';
import ImportModal from '@/renderer/components/import/ImportModal';
import type { SkillIndexEntry } from '@/common/types/skillTypes';
import BuildWorkflowModal from './BuildWorkflowModal';
import WorkflowCard from './WorkflowCard';
import WorkflowDetailModal from './WorkflowDetailModal';

// Display ordering + labels for the 7 categories shipped by the vendored
// FoundrySkills bundle. Sean's feedback was specifically that "Build A
// Garden" should fall under "Lifestyle" - the bundle tags it as
// `life-event` already, we just needed a friendlier label and to lead
// with the lifestyle bucket. The list also covers what to do with
// unknown future categories (fall through to the bottom under "Other").
type CategoryDef = { slug: string; label: string };
// Alphabetical by display label (Sean's directive 2026-05-21). Keeps the
// rail predictable when categories expand - no implicit ranking, no
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
// time - writing, marketing, shipping, recurring automation - rather
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
  const [buildOpen, setBuildOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const refreshWorkflows = useCallback(() => {
    void ipcBridge.skills.list.invoke({ type: 'workflow' }).then((list) => setWorkflows(list));
  }, []);

  useEffect(() => {
    refreshWorkflows();
  }, [refreshWorkflows]);

  // Open the launcher pre-targeted to a workflow when navigated via
  // `/workflows?workflow=<name>` - the Complete-card "Run again" / "Up next"
  // CTAs route here (issue #82, mirrors `/scheduled?workflow=`). Wait for the
  // entry list to load, resolve the entry by name, open the detail modal,
  // then clear the param so a manual reload doesn't re-fire it.
  useEffect(() => {
    const name = searchParams.get('workflow');
    if (!name) return;
    if (workflows.length === 0) return; // entries still loading - retry on next load
    const entry = workflows.find((w) => w.name === name);
    if (entry) setSelected(entry);
    const next = new URLSearchParams(searchParams);
    next.delete('workflow');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, workflows]);

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
    <PageShell
      title={t('title', 'Workflows')}
      icon={<Workflow size={20} />}
      countLabel={t('count', '{{count}} workflow', { count: workflows.length })}
      width='full'
      actions={
        <>
          <Button
            type='secondary'
            icon={<Download size={14} />}
            onClick={() => setImportOpen(true)}
          >
            {t('actions.import', 'Import workflow')}
          </Button>
          <Button
            type='primary'
            icon={<Sparkles size={14} />}
            onClick={() => setBuildOpen(true)}
          >
            {t('actions.build', 'Build a workflow')}
          </Button>
        </>
      }
      filterRail={
        <LibraryFilterRail
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder={t('search.placeholder', 'Search workflows…')}
          ariaLabel={t('filterRail.aria', 'Workflow filters')}
        >
          {!searching ? (
            <div className='flex flex-col gap-2px'>
              <LibraryFilterRow
                label={t('allCategories', 'All workflows')}
                count={workflows.length}
                active={activeCategory === null}
                onClick={() => setActiveCategory(null)}
              />
              {sections.map((s) => (
                <LibraryFilterRow
                  key={s.slug}
                  label={s.label}
                  count={s.entries.length}
                  active={activeCategory === s.slug}
                  onClick={() => setActiveCategory(s.slug)}
                />
              ))}
            </div>
          ) : (
            <div className='text-12px px-10px' style={{ color: 'var(--color-text-3)' }}>
              {t('count', '{{count}} workflows', { count: searchFiltered.length })}
            </div>
          )}
        </LibraryFilterRail>
      }
    >
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
            {activeCategory === null && featured.length > 0 ? (
              <section>
                <LibrarySectionHeader
                  label={t('section.featured', 'Featured workflows')}
                  count={featured.length}
                  variant='tier'
                />
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

            {activeCategory === null && featured.length > 0 ? (
              <LibrarySectionHeader
                label={t('section.all', 'All workflows')}
                count={workflows.length - featured.length}
                variant='primary'
                divider
              />
            ) : null}

            {visibleSections.map((s) => (
              <section key={s.slug}>
                <LibrarySectionHeader label={s.label} count={s.entries.length} />
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

      <WorkflowDetailModal entry={selected} onClose={() => setSelected(null)} />
      <BuildWorkflowModal
        visible={buildOpen}
        onClose={() => setBuildOpen(false)}
        onSaved={refreshWorkflows}
      />
      <ImportModal
        visible={importOpen}
        kind='workflow'
        onCancel={() => setImportOpen(false)}
        onDone={refreshWorkflows}
      />
    </PageShell>
  );
};

export default WorkflowsLibraryPage;
