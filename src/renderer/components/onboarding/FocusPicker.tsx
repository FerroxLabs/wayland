/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Building2, Check, Landmark, PenLine, Sparkles, TrendingUp, Wrench, type LucideIcon } from 'lucide-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FOCUS_PERSONAS, resolveFocusSelection, type FocusPersonaId } from './focusMap';
import styles from './OnboardingFlow.module.css';

const ICONS: Record<string, LucideIcon> = {
  'pen-line': PenLine,
  'trending-up': TrendingUp,
  'building-2': Building2,
  wrench: Wrench,
  landmark: Landmark,
  sparkles: Sparkles,
};

/** Copy lives here as i18n defaultValue so Sean can wordsmith without a parity pass. */
const PERSONA_COPY: Record<FocusPersonaId, { label: string; blurb: string }> = {
  content: { label: 'Content & Creative', blurb: 'Copy, brand, scripts, editorial' },
  sales: { label: 'Sales & Growth', blurb: 'Outreach, funnels, offers, pipeline' },
  business: { label: 'Running a Business', blurb: 'Ops, support, hiring, the day-to-day' },
  dev: { label: 'Building / Dev', blurb: 'Code, ship, QA, validation' },
  finance: { label: 'Finance & Money', blurb: 'Cashflow, runway, wealth, planning' },
  general: { label: 'A bit of everything', blurb: 'A balanced starting crew' },
};

const MAX_PICKS = 3;

type FocusPickerProps = {
  selected: FocusPersonaId[];
  onChange: (next: FocusPersonaId[]) => void;
};

/**
 * "What do you want to get done?" - pick 1–3 identity personas. Each toggles
 * a curated crew; the live hint shows how much gets tailored. Pure curation,
 * nothing to fail: the wow with the least engineering risk.
 */
const FocusPicker: React.FC<FocusPickerProps> = ({ selected, onChange }) => {
  const { t } = useTranslation();

  const toggle = (id: FocusPersonaId) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else if (selected.length < MAX_PICKS) {
      onChange([...selected, id]);
    }
  };

  const hint = useMemo(() => {
    if (selected.length === 0) return null;
    const { launchpadIds, teamIds, workflowIds } = resolveFocusSelection(selected);
    // launchpadIds includes the always-on Cowork card; specialists = the rest.
    const specialists = Math.max(0, launchpadIds.length - 1);
    return { specialists, teams: teamIds.length, workflows: workflowIds.length };
  }, [selected]);

  return (
    <div className='flex flex-col gap-12px'>
      <div className={styles.chipGrid}>
        {FOCUS_PERSONAS.map((p) => {
          const Icon = ICONS[p.icon] ?? Sparkles;
          const isSel = selected.includes(p.id);
          const copy = PERSONA_COPY[p.id];
          const atCap = !isSel && selected.length >= MAX_PICKS;
          return (
            <button
              key={p.id}
              type='button'
              data-testid={`focus-persona-${p.id}`}
              aria-pressed={isSel}
              disabled={atCap}
              className={`${styles.personaChip} ${isSel ? styles.personaChipSelected : ''}`}
              style={atCap ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
              onClick={() => toggle(p.id)}
            >
              <span className={styles.personaGlyph}>
                <Icon size={17} />
              </span>
              <span className='flex flex-col gap-1px min-w-0'>
                <span className={styles.personaLabel}>
                  {t(`onboarding.focus.${p.id}.label`, { defaultValue: copy.label })}
                </span>
                <span className={styles.personaBlurb}>
                  {t(`onboarding.focus.${p.id}.blurb`, { defaultValue: copy.blurb })}
                </span>
              </span>
              {isSel && <Check size={16} className={styles.personaCheck} />}
            </button>
          );
        })}
      </div>

      <div className={styles.matchHint} aria-live='polite'>
        {hint ? (
          t('onboarding.focus.hint', {
            defaultValue: '{{specialists}} specialists · {{teams}} teams · {{workflows}} workflows lined up for you',
            specialists: hint.specialists,
            teams: hint.teams,
            workflows: hint.workflows,
          })
        ) : (
          <span className='text-t-tertiary'>
            {t('onboarding.focus.empty', { defaultValue: 'Pick what you do - your workspace tailors itself.' })}
          </span>
        )}
      </div>
    </div>
  );
};

export default FocusPicker;
