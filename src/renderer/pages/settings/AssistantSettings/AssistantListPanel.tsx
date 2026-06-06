/**
 * AssistantListPanel - Renders the collapsible list of assistants
 * with avatar, name, enabled switch, and edit/duplicate actions.
 */
import { Plus, Search, Settings, X } from 'lucide-react';
import {
  filterAssistants,
  getAssistantSource,
  groupAssistantsByEnabled,
  type AssistantListFilter,
} from './assistantUtils';
import { useLayoutContext } from '@/renderer/hooks/context/LayoutContext';
import type { AssistantListItem } from './types';
import AssistantAvatar from './AssistantAvatar';
import { Button, Input, Switch, Tabs, Tag } from '@arco-design/web-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type AssistantListPanelProps = {
  assistants: AssistantListItem[];
  localeKey: string;
  avatarImageMap: Record<string, string>;
  isExtensionAssistant: (assistant: AssistantListItem | null | undefined) => boolean;
  onEdit: (assistant: AssistantListItem) => void;
  onDuplicate: (assistant: AssistantListItem) => void;
  onCreate: () => void;
  onToggleEnabled: (assistant: AssistantListItem, checked: boolean) => void;
  setActiveAssistantId: (id: string) => void;
  /** When set, scroll to and highlight the matching assistant card */
  highlightId?: string | null;
  /** Called after the highlight animation completes so the parent can clear the param */
  onHighlightConsumed?: () => void;
};

const AssistantListPanel: React.FC<AssistantListPanelProps> = ({
  assistants,
  localeKey,
  avatarImageMap,
  isExtensionAssistant,
  onEdit,
  onDuplicate,
  onCreate,
  onToggleEnabled,
  setActiveAssistantId,
  highlightId,
  onHighlightConsumed,
}) => {
  const { t } = useTranslation();
  const layout = useLayoutContext();
  const isMobile = layout?.isMobile ?? false;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<AssistantListFilter>('all');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const cardRefSetter = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      cardRefs.current[id] = el;
    },
    []
  );

  // Scroll to and highlight an assistant card when navigated with ?highlight=id
  // Depends on `assistants` so it re-runs after async data loads and refs are populated.
  // Uses a short delay to ensure the page layout is fully settled on first mount.
  useEffect(() => {
    if (!highlightId || assistants.length === 0) return;
    const el = cardRefs.current[highlightId];
    if (!el) return;

    const timer = setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedId(highlightId);
      setTimeout(() => {
        setHighlightedId(null);
        onHighlightConsumed?.();
      }, 2000);
    }, 150);

    return () => clearTimeout(timer);
  }, [highlightId, assistants, onHighlightConsumed]);

  const filteredAssistants = useMemo(
    () => filterAssistants(assistants, searchQuery, activeFilter, localeKey),
    [activeFilter, assistants, localeKey, searchQuery]
  );
  const { enabledAssistants, disabledAssistants } = useMemo(
    () => groupAssistantsByEnabled(filteredAssistants),
    [filteredAssistants]
  );

  const filterOptions: Array<{ key: AssistantListFilter; label: string }> = [
    { key: 'all', label: t('settings.assistantFilterAll', { defaultValue: 'All' }) },
    { key: 'builtin', label: t('settings.assistantFilterBuiltin', { defaultValue: 'System' }) },
    { key: 'custom', label: t('settings.assistantFilterCustom', { defaultValue: 'Custom' }) },
  ];

  const renderSourceTag = (assistant: AssistantListItem) => {
    const source = getAssistantSource(assistant);

    if (source === 'builtin') {
      return null;
    }

    if (source === 'extension') {
      // Extension assistants are always-on (the toggle is disabled). Surface
      // that explicitly so the dim toggle reads as 'managed by extension'
      // rather than 'broken color'.
      return (
        <Tag
          size='small'
          bordered={false}
          className='!text-11px !leading-16px !px-8px !py-1px !rounded-8px !bg-[var(--color-fill-2)] !text-t-tertiary uppercase tracking-wider'
        >
          {t('settings.assistantSourceExtension', { defaultValue: 'From extension' })}
        </Tag>
      );
    }

    return (
      <Tag
        size='small'
        color='green'
        bordered={false}
        className='!text-11px !leading-16px !px-8px !py-1px !rounded-8px !bg-primary-1 !text-primary-6'
      >
        {t('settings.assistantSourceCustom', { defaultValue: 'Custom' })}
      </Tag>
    );
  };

  const renderAssistantCard = (assistant: AssistantListItem) => {
    const assistantIsExtension = isExtensionAssistant(assistant);

    return (
      <div
        key={assistant.id}
        ref={cardRefSetter(assistant.id)}
        data-testid={`assistant-card-${assistant.id}`}
        className={`group border border-solid rounded-12px px-16px py-14px flex items-center justify-between cursor-pointer transition-all duration-180 hover:border-[var(--color-primary-light-4)] hover:bg-bg-1 ${highlightedId === assistant.id ? 'border-primary-5 bg-primary-1' : 'border-[var(--color-border-2)] bg-[var(--color-bg-2)]'}`}
        onClick={() => {
          setActiveAssistantId(assistant.id);
          onEdit(assistant);
        }}
      >
        <div className='flex items-center gap-12px min-w-0 flex-1'>
          <AssistantAvatar assistant={assistant} size={28} avatarImageMap={avatarImageMap} />
          <div className='min-w-0 flex-1'>
            <div className='font-medium text-t-primary min-w-0 flex items-center gap-10px'>
              <span className='truncate'>{assistant.nameI18n?.[localeKey] || assistant.name}</span>
              <div className='flex items-center gap-6px flex-shrink-0'>{renderSourceTag(assistant)}</div>
            </div>
            <div className='text-12px text-t-secondary truncate'>
              {assistant.descriptionI18n?.[localeKey] || assistant.description || ''}
            </div>
          </div>
        </div>
        <div
          className='flex items-center gap-10px text-t-secondary ml-12px flex-shrink-0'
          onClick={(e) => e.stopPropagation()}
        >
          <span
            className='invisible group-hover:visible text-12px text-primary cursor-pointer hover:underline transition-all'
            data-testid={`btn-duplicate-${assistant.id}`}
            onClick={() => {
              onDuplicate(assistant);
            }}
          >
            {t('settings.duplicateAssistant', { defaultValue: 'Duplicate' })}
          </span>
          <Switch
            size='small'
            data-testid={`switch-enabled-${assistant.id}`}
            checked={assistantIsExtension ? true : assistant.enabled !== false}
            disabled={assistantIsExtension}
            onChange={(checked) => {
              onToggleEnabled(assistant, checked);
            }}
          />
          <Button
            type='text'
            size='small'
            icon={<Settings size={16} />}
            className='!rounded-10px'
            data-testid={`btn-edit-${assistant.id}`}
            onClick={() => {
              onEdit(assistant);
            }}
          />
        </div>
      </div>
    );
  };

  const renderSection = (title: string, sectionAssistants: AssistantListItem[]) => {
    if (sectionAssistants.length === 0) return null;

    return (
      <div className='space-y-12px'>
        <div className='flex items-center gap-8px text-13px font-medium text-t-secondary px-4px'>
          {title}
          <span className='text-t-tertiary'>({sectionAssistants.length})</span>
        </div>
        <div className='space-y-12px'>{sectionAssistants.map(renderAssistantCard)}</div>
      </div>
    );
  };

  const isSearchVisible = searchExpanded || searchQuery.length > 0;

  return (
    <div className='py-2'>
      <div className={`bg-[var(--color-fill-2)] rounded-16px ${isMobile ? 'p-16px' : 'p-20px'}`}>
        <div className='flex flex-col gap-14px mb-20px'>
          <div className={`flex gap-12px ${isMobile ? 'flex-col' : 'items-start justify-between'}`}>
            <div className='min-w-0'>
              <h2 className='m-0 text-28px font-700 leading-[1.1] text-t-primary'>
                {t('settings.assistants', { defaultValue: 'Assistants' })}
              </h2>
            </div>
            <div className={`${isMobile ? 'w-full' : 'flex-shrink-0'}`}>
              <Button
                type='primary'
                size='small'
                className={`${isMobile ? '!w-full !h-36px' : '!px-16px !h-32px'}`}
                icon={<Plus size={14} />}
                onClick={onCreate}
                data-testid='btn-create-assistant'
              >
                {t('settings.createAssistant', { defaultValue: 'Create Assistant' })}
              </Button>
            </div>
          </div>
          <div className={`flex gap-12px ${isMobile ? 'flex-col' : 'items-end justify-between'}`}>
            <div className='min-w-0 max-w-[760px] space-y-6px'>
              <p className='m-0 text-14px text-t-secondary leading-relaxed'>
                {t('settings.assistantsListDescription', {
                  defaultValue: 'Build task-specific assistants by combining an AI agent with custom rules and skills.',
                })}
              </p>
            </div>
            <div
              className={`flex ${isMobile ? 'items-center justify-between' : 'items-center'} gap-10px text-12px text-t-tertiary`}
            >
              <Button
                type={isSearchVisible ? 'secondary' : 'text'}
                size='small'
                data-testid='btn-search-toggle'
                className='!rounded-10px !h-34px !w-34px !p-0 flex items-center justify-center !text-t-secondary hover:!bg-fill-1 hover:!text-t-primary'
                icon={
                  isSearchVisible ? (
                    <X size={16} />
                  ) : (
                    <Search size={16} />
                  )
                }
                onClick={() => {
                  if (isSearchVisible) {
                    setSearchExpanded(false);
                    setSearchQuery('');
                    return;
                  }
                  setSearchExpanded(true);
                }}
              />
            </div>
          </div>
          {isSearchVisible && (
            <Input
              allowClear
              autoFocus
              value={searchQuery}
              onChange={setSearchQuery}
              data-testid='input-search-assistant'
              className='!bg-[var(--color-bg-2)]'
              placeholder={t('settings.searchAssistants', {
                defaultValue: 'Search assistants by name or description',
              })}
              prefix={<Search size={14} />}
            />
          )}
          <Tabs
            activeTab={activeFilter}
            onChange={(key) => setActiveFilter((key as AssistantListFilter) || 'all')}
            type='line'
            className='assistant-filter-tabs w-full'
          >
            {filterOptions.map((filterOption) => (
              <Tabs.TabPane key={filterOption.key} title={filterOption.label} />
            ))}
          </Tabs>
        </div>

        {filteredAssistants.length > 0 ? (
          <div className='space-y-16px'>
            {renderSection(t('settings.assistantSectionEnabled', { defaultValue: 'Enabled' }), enabledAssistants)}
            {renderSection(t('settings.assistantSectionDisabled', { defaultValue: 'Disabled' }), disabledAssistants)}
          </div>
        ) : (
          <div className='text-center text-t-secondary py-12px'>
            {t('settings.assistantNoMatch', {
              defaultValue: 'No assistants match the current filters.',
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssistantListPanel;
