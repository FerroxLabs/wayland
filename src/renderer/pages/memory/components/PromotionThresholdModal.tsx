/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * PromotionThresholdModal - tune wiki auto-promotion settings.
 * Lazy-imported by W2's MemoryArchivePage via:
 *   lazy(() => import('@renderer/pages/memory/components/PromotionThresholdModal'))
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Message, Modal, Slider, Switch } from '@arco-design/web-react';
import { ipcBridge } from '@/common';
import styles from './PromotionThresholdModal.module.css';

// ===== Types =====

type Props = {
  onClose: () => void;
};

const SCORE_FORMULA = `+30 if type=decision or pattern
+10 per project referencing this entry
+5 per referencedBy hit
+20 if tagged decision/pattern/global/design/architecture
+15 if stored < 24h ago (decays over 30 days)`;

// ===== Component =====

const PromotionThresholdModal: React.FC<Props> = ({ onClose }) => {
  const [threshold, setThreshold] = useState<number>(90);
  const [autoPromote, setAutoPromote] = useState<boolean>(true);
  const [candidateCount, setCandidateCount] = useState<number>(0);
  const [formulaOpen, setFormulaOpen] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load initial state from IPC.
  useEffect(() => {
    void ipcBridge.memory.getPromotionCandidates.invoke().then((result) => {
      if (!result) return;
      setThreshold(result.threshold);
      setCandidateCount(result.candidates.length);
      if (typeof result.autoPromoteEnabled === 'boolean') {
        setAutoPromote(result.autoPromoteEnabled);
      }
    });
  }, []);

  // Debounced candidate refresh when slider changes.
  const refreshCandidates = useCallback((value: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void ipcBridge.memory.getPromotionCandidates.invoke().then((result) => {
        if (!result) return;
        // Count candidates that would qualify at the pending threshold.
        const count = result.candidates.filter((c) => c.score !== undefined ? c.score >= value : true).length;
        setCandidateCount(count);
      });
    }, 200);
  }, []);

  const handleSliderChange = useCallback(
    (value: number | number[]) => {
      const v = Array.isArray(value) ? value[0] ?? 90 : value;
      setThreshold(v);
      refreshCandidates(v);
    },
    [refreshCandidates],
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await ipcBridge.memory.setPromotionThreshold.invoke({ threshold });
      await ipcBridge.memory.setAutoPromoteEnabled.invoke({ enabled: autoPromote });
      Message.success('Saved');
      onClose();
    } catch {
      Message.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, [threshold, autoPromote, onClose]);

  return (
    <Modal
      visible
      title='Auto-Wiki Settings'
      onCancel={onClose}
      footer={null}
      className={styles.modal}
      data-testid='promotion-threshold-modal'
    >
      <div className={styles.body}>
        {/* Threshold slider */}
        <div className={styles.field} data-testid='threshold-field'>
          <div className={styles.labelRow}>
            <span className={styles.label}>Promotion threshold</span>
            <span className={styles.value} data-testid='threshold-value'>
              {threshold}
            </span>
          </div>
          <Slider
            min={0}
            max={100}
            value={threshold}
            onChange={handleSliderChange}
            data-testid='threshold-slider'
          />
          <p className={styles.hint} data-testid='candidate-hint'>
            {candidateCount} candidate{candidateCount !== 1 ? 's' : ''} at threshold {threshold}
          </p>
        </div>

        {/* Auto-promote toggle */}
        <div className={styles.field} data-testid='auto-promote-field'>
          <div className={styles.switchRow}>
            <span className={styles.label}>Auto-promote on schedule</span>
            <Switch
              checked={autoPromote}
              onChange={setAutoPromote}
              data-testid='auto-promote-switch'
            />
          </div>
        </div>

        {/* Score formula disclosure */}
        <div className={styles.field}>
          <Button
            type='text'
            size='small'
            onClick={() => setFormulaOpen((o) => !o)}
            data-testid='formula-disclosure-btn'
          >
            {formulaOpen ? 'Hide' : 'Show'} score formula
          </Button>
          {formulaOpen && (
            <pre className={styles.formula} data-testid='score-formula'>
              {SCORE_FORMULA}
            </pre>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Button
            onClick={onClose}
            data-testid='cancel-btn'
          >
            Cancel
          </Button>
          <Button
            type='primary'
            loading={saving}
            onClick={() => void handleSave()}
            data-testid='save-btn'
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PromotionThresholdModal;
