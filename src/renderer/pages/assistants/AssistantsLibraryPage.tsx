/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AssistantsLibraryPage - the chat-redesign "third door" to the assistant
 * universe. Renders all 64 assistants (21 built-in + 43 extension) grouped
 * Teams · Specialists · Built-ins with a left FilterRail (Type + Domain +
 * free-text search), URL-synced query params for shareable links, and a
 * dashed Build-my-own card that opens the lifted AssistantEditDrawer
 * (Phase 0) in creation mode.
 *
 * Cross-page selection: clicking a card persists the resolved agent key
 * via ConfigStorage.set('guid.lastSelectedAgent', ...) and navigates to
 * /guid. The in-page restoration path in useGuidAgentSelection picks it
 * up - same behavior as Phase 1's selectPresetAssistant, just initiated
 * from outside the guid hook scope.
 */

import { ipcBridge } from '@/common';
import coworkSvg from '@/renderer/assets/icons/cowork.svg';
import { LibraryPageHeader, LibrarySectionHeader } from '@/renderer/components/layout/library';
import {
  useAssistantEditor,
  useAssistantList,
  useAssistantSkills,
  useDetectedAgents,
} from '@/renderer/hooks/assistant';
import type { AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';
import AddCustomPathModal from '@/renderer/pages/settings/AssistantSettings/AddCustomPathModal';
import AddSkillsModal from '@/renderer/pages/settings/AssistantSettings/AddSkillsModal';
import AssistantEditDrawer from '@/renderer/pages/settings/AssistantSettings/AssistantEditDrawer';
import DeleteAssistantModal from '@/renderer/pages/settings/AssistantSettings/DeleteAssistantModal';
import SkillConfirmModals from '@/renderer/pages/settings/AssistantSettings/SkillConfirmModals';
import { resolveAvatarImageSrc } from '@/renderer/pages/settings/AssistantSettings/assistantUtils';
import { Button, Message } from '@arco-design/web-react';
import { Download, Plus } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import type { AssistantCategory } from '@/common/config/presets/assistantPresets';
import AssistantCard, { type AssistantCardType } from './components/AssistantCard';
import BuildMyOwnCard from './components/BuildMyOwnCard';
import FilterRail from './components/FilterRail';
import {
  ASSISTANT_CATEGORY_VALUES,
  buildExtensionCategoryMap,
  resolveAssistantCategory,
} from './utils/assistantCategory';
import { launchAssistant } from './utils/launchAssistant';
import LaunchpadBar from '@/renderer/pages/guid/components/newChatStarter/LaunchpadBar';
import type { QuickLaunchAnchor } from '@/renderer/pages/guid/quickLaunchAnchors';
import { ASSISTANT_PRESETS } from '@/common/config/presets/assistantPresets';
import styles from './AssistantsLibraryPage.module.css';

type CardEntry = {
  assistant: AssistantListItem;
  type: AssistantCardType;
  category: AssistantCategory;
};

/**
 * Classify a card. Order matters:
 *  1. Built-ins are always 'builtin' regardless of any other signal.
 *  2. Extension-contributed assistants prefer their bundle-declared `_kind`
 *     ('team' | 'specialist') - that comes from the bundle's `kind` field
 *     which the manifest schema accepts and normalizeExtensionAssistants
 *     carries through. The bundle is the source of truth for whether an
 *     assistant composes multiple roles (team) or is a single role (specialist).
 *  3. Older bundles without `kind` fall back to the heuristic that the team
 *     categories (sell, run) are most likely to be team-launchers.
 */
const TEAM_CATEGORIES: ReadonlySet<AssistantCategory> = new Set<AssistantCategory>(['sell', 'run']);

const classifyAssistant = (assistant: AssistantListItem, category: AssistantCategory): AssistantCardType => {
  if (assistant.isBuiltin) return 'builtin';
  if (assistant._kind === 'team') return 'team';
  if (assistant._kind === 'specialist') return 'specialist';
  // Legacy fallback for bundles that didn't declare `kind`.
  if (TEAM_CATEGORIES.has(category)) return 'team';
  return 'specialist';
};

const matchesQuery = (entry: CardEntry, localeKey: string, normalizedQuery: string): boolean => {
  if (!normalizedQuery) return true;
  const { assistant } = entry;
  const haystack = [
    assistant.nameI18n?.[localeKey] || assistant.name || '',
    assistant.nameI18n?.['en-US'] || '',
    assistant.descriptionI18n?.[localeKey] || assistant.description || '',
    assistant.descriptionI18n?.['en-US'] || '',
    assistant.id,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(normalizedQuery);
};

const AssistantsLibraryPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [message, messageContext] = Message.useMessage({ maxCount: 10 });
  const [searchParams, setSearchParams] = useSearchParams();

  // --- Standard assistant composition (mirrors AssistantSettings) ---
  const avatarImageMap: Record<string, string> = useMemo(
    () => ({
      'cowork.svg': coworkSvg,
      '\u{1F6E0}\u{FE0F}': coworkSvg,
    }),
    []
  );

  const {
    assistants,
    activeAssistantId,
    setActiveAssistantId,
    activeAssistant,
    isExtensionAssistant,
    loadAssistants,
    localeKey,
  } = useAssistantList();

  const { availableBackends, refreshAgentDetection } = useDetectedAgents();

  const editor = useAssistantEditor({
    localeKey,
    activeAssistant,
    isExtensionAssistant,
    setActiveAssistantId,
    loadAssistants,
    refreshAgentDetection,
    message,
  });

  const skills = useAssistantSkills({
    skillsModalVisible: editor.skillsModalVisible,
    customSkills: editor.customSkills,
    selectedSkills: editor.selectedSkills,
    pendingSkills: editor.pendingSkills,
    availableSkills: editor.availableSkills,
    setPendingSkills: editor.setPendingSkills,
    setCustomSkills: editor.setCustomSkills,
    setSelectedSkills: editor.setSelectedSkills,
    message,
  });

  const editAvatarImage = resolveAvatarImageSrc(editor.editAvatar, avatarImageMap);

  // --- Raw extension data for category extraction ---
  // (normalizeExtensionAssistants doesn't pass through `category`; load raw and merge here.)
  const { data: rawExtensions } = useSWR('extensions.assistants.raw', () =>
    ipcBridge.extensions.getAssistants.invoke().catch(() => [] as Record<string, unknown>[])
  );
  const extensionCategoryById = useMemo(() => buildExtensionCategoryMap(rawExtensions), [rawExtensions]);

  // --- Derive card entries ---
  // T2a.4 - /assistants no longer renders team launchers (kind === 'team');
  // those moved to /teams. We filter them out at the entry-derivation step
  // so all downstream filter/count logic naturally excludes them.
  const cardEntries = useMemo<CardEntry[]>(
    () =>
      assistants
        .filter((assistant) => assistant._kind !== 'team')
        .map((assistant) => {
          const category = resolveAssistantCategory(assistant, extensionCategoryById);
          const type = classifyAssistant(assistant, category);
          return { assistant, type, category };
        }),
    [assistants, extensionCategoryById]
  );

  // --- URL-synced filter state ---
  const query = searchParams.get('q') ?? '';
  const rawType = searchParams.get('type');
  // T2a.4 - 'team' is no longer a valid type on /assistants. A stale
  // ?type=team URL silently falls back to 'all' rather than 404ing.
  const selectedType: AssistantCardType | 'all' = rawType === 'specialist' || rawType === 'builtin' ? rawType : 'all';
  const rawDomain = searchParams.get('domain');
  const selectedDomain: AssistantCategory | 'all' =
    rawDomain && (ASSISTANT_CATEGORY_VALUES as readonly string[]).includes(rawDomain)
      ? (rawDomain as AssistantCategory)
      : 'all';

  const setParam = useCallback(
    (key: 'q' | 'type' | 'domain', value: string | null) => {
      const next = new URLSearchParams(searchParams);
      if (!value || value === 'all') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleQueryChange = useCallback((next: string) => setParam('q', next || null), [setParam]);
  const handleTypeChange = useCallback(
    (next: AssistantCardType | 'all') => setParam('type', next === 'all' ? null : next),
    [setParam]
  );
  const handleDomainChange = useCallback(
    (next: AssistantCategory | 'all') => setParam('domain', next === 'all' ? null : next),
    [setParam]
  );
  const handleReset = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);
  const hasActiveFilters = Boolean(query) || selectedType !== 'all' || selectedDomain !== 'all';

  // --- Counts (computed against the full set, not the filtered set, so the
  //     rail shows the canonical "what's in this universe" totals) ---
  const typeCounts = useMemo<Record<AssistantCardType | 'all', number>>(() => {
    const counts: Record<AssistantCardType | 'all', number> = { all: 0, team: 0, specialist: 0, builtin: 0 };
    for (const entry of cardEntries) {
      counts.all += 1;
      counts[entry.type] += 1;
    }
    return counts;
  }, [cardEntries]);

  const domainCounts = useMemo<Record<AssistantCategory | 'all', number>>(() => {
    const counts = { all: 0 } as Record<AssistantCategory | 'all', number>;
    for (const cat of ASSISTANT_CATEGORY_VALUES) counts[cat] = 0;
    for (const entry of cardEntries) {
      counts.all += 1;
      counts[entry.category] += 1;
    }
    return counts;
  }, [cardEntries]);

  // --- Apply filters ---
  const normalizedQuery = query.trim().toLowerCase();
  const filteredEntries = useMemo(() => {
    return cardEntries.filter((entry) => {
      if (selectedType !== 'all' && entry.type !== selectedType) return false;
      if (selectedDomain !== 'all' && entry.category !== selectedDomain) return false;
      if (!matchesQuery(entry, localeKey, normalizedQuery)) return false;
      return true;
    });
  }, [cardEntries, selectedType, selectedDomain, localeKey, normalizedQuery]);

  // --- Group ---
  // T2a.4 - Teams group removed; team launchers now render on /teams.
  // The 'team' branch can never fire because cardEntries filters them
  // out, but we keep the type narrowing exhaustive for the other two.
  const groups = useMemo(() => {
    const specialists: CardEntry[] = [];
    const builtins: CardEntry[] = [];
    for (const entry of filteredEntries) {
      if (entry.type === 'specialist') specialists.push(entry);
      else if (entry.type === 'builtin') builtins.push(entry);
    }
    return { specialists, builtins };
  }, [filteredEntries]);

  // --- Card handlers ---
  const handleLaunch = useCallback(
    (assistant: AssistantListItem) => {
      void launchAssistant({ id: assistant.id, presetAgentType: assistant.presetAgentType }, (path, options) =>
        navigate(path, options)
      );
    },
    [navigate]
  );

  const handleCardMenu = useCallback(
    (assistant: AssistantListItem) => {
      setActiveAssistantId(assistant.id);
      void editor.handleEdit(assistant);
    },
    [editor, setActiveAssistantId]
  );

  const handleBuildMyOwn = useCallback(() => {
    void editor.handleCreate();
  }, [editor]);

  // LaunchpadBar lives at the top of this page so the same widget that
  // edits the bar on the launchpad is reachable from /assistants. Click
  // semantics on this surface: route through launchAssistant (cross-page
  // launch) so the chat opens the picked assistant - the same path
  // AssistantCard takes. Strip the runtime 'builtin-' prefix when
  // looking up the preset so the helper sees the bare id it expects.
  const handleBarAnchorClick = useCallback(
    (anchor: QuickLaunchAnchor) => {
      const bareId = anchor.assistantId.startsWith('builtin-')
        ? anchor.assistantId.slice('builtin-'.length)
        : anchor.assistantId;
      const preset = ASSISTANT_PRESETS.find((p) => p.id === bareId);
      const found = assistants.find((a) => a.id === anchor.assistantId || a.id === bareId);
      void launchAssistant(
        {
          id: bareId,
          presetAgentType: found?.presetAgentType ?? preset?.presetAgentType,
        },
        (path, options) => navigate(path, options)
      );
    },
    [assistants, navigate]
  );

  const renderGroup = (label: string, entries: CardEntry[], testId: string, includeBuildCard = false) => {
    if (entries.length === 0 && !includeBuildCard) return null;
    return (
      <section data-testid={testId}>
        <LibrarySectionHeader label={label} count={includeBuildCard ? entries.length + 1 : entries.length} />
        <div className={styles.grid}>
          {entries.map((entry) => (
            <AssistantCard
              key={entry.assistant.id}
              assistant={entry.assistant}
              type={entry.type}
              localeKey={localeKey}
              onLaunch={handleLaunch}
              onMenuClick={handleCardMenu}
            />
          ))}
          {includeBuildCard && <BuildMyOwnCard onClick={handleBuildMyOwn} />}
        </div>
      </section>
    );
  };

  const isFullyEmpty = groups.specialists.length === 0 && groups.builtins.length === 0;
  // Built-ins group always renders because BuildMyOwnCard lives at its tail.
  const showBuildCardInBuiltins = selectedType === 'all' || selectedType === 'builtin';

  const handleImport = useCallback(() => {
    // Import wiring is paralleled in the Workflows page - the Skill Import
    // flow detects type via frontmatter, so a future pass reuses it for
    // assistants. Placeholder until that wire lands.
    // eslint-disable-next-line no-alert
    window.alert(
      t('assistants.import.placeholder', {
        defaultValue:
          'Import wiring lands next: folder / git URL / SKILL.md with type:agent-profile auto-detected via frontmatter, scanned by Skill Guard, and registered as an Assistant.',
      })
    );
  }, [t]);

  return (
    <div className={styles.page} data-testid='assistants-library-page'>
      {messageContext}
      <LibraryPageHeader
        title={t('assistants.title', { defaultValue: 'Assistants' })}
        countLabel={t('assistants.totalCount', {
          count: typeCounts.all,
          defaultValue: '{{count}} assistants',
        })}
        testId='assistants-action-bar'
        countTestId='assistants-total-count'
      >
        <Button
          type='secondary'
          icon={<Download size={14} />}
          onClick={handleImport}
          data-testid='assistants-import-cta'
        >
          {t('assistants.import.cta', { defaultValue: 'Import assistant' })}
        </Button>
        <Button
          type='primary'
          icon={<Plus size={14} />}
          onClick={handleBuildMyOwn}
          data-testid='assistants-build-my-own-cta'
        >
          {t('assistants.buildMyOwn.cta', { defaultValue: 'Build my own' })}
        </Button>
      </LibraryPageHeader>
      <div className={styles.layout}>
        <FilterRail
          query={query}
          onQueryChange={handleQueryChange}
          selectedType={selectedType}
          onTypeChange={handleTypeChange}
          selectedDomain={selectedDomain}
          onDomainChange={handleDomainChange}
          typeCounts={typeCounts}
          domainCounts={domainCounts}
          onReset={handleReset}
          hasActiveFilters={hasActiveFilters}
        />
        <div className={styles.scroll}>
          <section className={styles.launchpadSection} data-testid='assistants-launchpad-section'>
            <div className={styles.launchpadHead}>
              <span className={styles.launchpadTitle}>
                {t('assistants.launchpad.title', { defaultValue: 'Your launchpad bar' })}
              </span>
              <span className={styles.launchpadHint}>
                {t('assistants.launchpad.hint', {
                  defaultValue: 'drag to reorder, click × to remove. Cards below jump in.',
                })}
              </span>
            </div>
            <LaunchpadBar mode='expanded' onAnchorClick={handleBarAnchorClick} />
          </section>
          {isFullyEmpty && !showBuildCardInBuiltins && (
            <div className={styles.emptyState} data-testid='assistants-empty-state'>
              {t('assistants.emptyState', { defaultValue: 'No assistants match your filters.' })}
            </div>
          )}
          {renderGroup(
            t('assistants.group.specialists', { defaultValue: 'Specialists' }),
            groups.specialists,
            'assistants-group-specialists'
          )}
          {renderGroup(
            t('assistants.group.builtins', { defaultValue: 'Built-ins' }),
            groups.builtins,
            'assistants-group-builtins',
            showBuildCardInBuiltins
          )}
        </div>
      </div>

      <AssistantEditDrawer
        editor={editor}
        list={{ activeAssistant, activeAssistantId, isExtensionAssistant }}
        availableBackends={availableBackends}
        editAvatarImage={editAvatarImage}
      />

      <DeleteAssistantModal
        visible={editor.deleteConfirmVisible}
        onCancel={() => editor.setDeleteConfirmVisible(false)}
        onConfirm={editor.handleDeleteConfirm}
        activeAssistant={activeAssistant}
        avatarImageMap={avatarImageMap}
      />

      <AddSkillsModal
        visible={editor.skillsModalVisible}
        onCancel={() => {
          editor.setSkillsModalVisible(false);
          skills.setSearchExternalQuery('');
        }}
        externalSources={skills.externalSources}
        activeSourceTab={skills.activeSourceTab}
        setActiveSourceTab={skills.setActiveSourceTab}
        activeSource={skills.activeSource}
        filteredExternalSkills={skills.filteredExternalSkills}
        externalSkillsLoading={skills.externalSkillsLoading}
        searchExternalQuery={skills.searchExternalQuery}
        setSearchExternalQuery={skills.setSearchExternalQuery}
        refreshing={skills.refreshing}
        handleRefreshExternal={skills.handleRefreshExternal}
        setShowAddPathModal={skills.setShowAddPathModal}
        customSkills={editor.customSkills}
        handleAddFoundSkills={skills.handleAddFoundSkills}
      />

      <SkillConfirmModals
        deletePendingSkillName={editor.deletePendingSkillName}
        setDeletePendingSkillName={editor.setDeletePendingSkillName}
        pendingSkills={editor.pendingSkills}
        setPendingSkills={editor.setPendingSkills}
        deleteCustomSkillName={editor.deleteCustomSkillName}
        setDeleteCustomSkillName={editor.setDeleteCustomSkillName}
        customSkills={editor.customSkills}
        setCustomSkills={editor.setCustomSkills}
        selectedSkills={editor.selectedSkills}
        setSelectedSkills={editor.setSelectedSkills}
        message={message}
      />

      <AddCustomPathModal
        visible={skills.showAddPathModal}
        onCancel={() => {
          skills.setShowAddPathModal(false);
          skills.setCustomPathName('');
          skills.setCustomPathValue('');
        }}
        onOk={() => void skills.handleAddCustomPath()}
        customPathName={skills.customPathName}
        setCustomPathName={skills.setCustomPathName}
        customPathValue={skills.customPathValue}
        setCustomPathValue={skills.setCustomPathValue}
      />
    </div>
  );
};

export default AssistantsLibraryPage;
