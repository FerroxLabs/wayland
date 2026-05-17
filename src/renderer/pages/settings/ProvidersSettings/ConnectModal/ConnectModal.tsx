import React, { useState, useCallback } from 'react';
import { Modal } from '@arco-design/web-react';
import { ipcBridge } from '@/common';
import EntryState from './EntryState';
import LoadingState, { type LoadingStage } from './LoadingState';
import MoreInfoState from './MoreInfoState';
import PickerState, { type ProviderEntry } from './PickerState';
import ResultsState, { type ModelWithEnabled } from './ResultsState';
import ErrorState from './ErrorState';
import type { ProviderModel } from '@process/providers/types';

type ModalState =
  | { kind: 'entry' }
  | { kind: 'loading'; stage: LoadingStage }
  | { kind: 'moreInfo'; providerId: string; apiKey: string }
  | { kind: 'picker'; apiKey: string }
  | { kind: 'results'; providerDisplayName: string; models: ProviderModel[]; key: string; additionalFields?: Record<string, string> }
  | { kind: 'error'; msg: string; apiKey: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  onConnected: () => void;
};

const ConnectModal = ({ visible, onClose, onConnected }: Props) => {
  const [state, setState] = useState<ModalState>({ kind: 'entry' });

  const reset = useCallback(() => setState({ kind: 'entry' }), []);

  const handleDetect = useCallback(async (key: string, additionalFields?: Record<string, string>) => {
    setState({ kind: 'loading', stage: 'detecting' });

    // Stage 1: detect
    await new Promise((r) => setTimeout(r, 300));
    setState({ kind: 'loading', stage: 'verifying' });

    try {
      const res = await ipcBridge.providers.connect.invoke({ key, additionalFields });

      if (!res.success) {
        const msg = res.msg ?? 'unknown';
        // Check if multi-field required
        if (msg.includes('additional fields')) {
          // Extract provider from message prefix — the backend echoes it
          // Fall back to picker so user can choose
          setState({ kind: 'picker', apiKey: key });
          return;
        }
        setState({ kind: 'error', msg, apiKey: key });
        return;
      }

      setState({ kind: 'loading', stage: 'fetching' });
      await new Promise((r) => setTimeout(r, 200));
      setState({ kind: 'loading', stage: 'done' });
      await new Promise((r) => setTimeout(r, 300));

      onConnected();
      onClose();
      reset();
    } catch (err) {
      setState({ kind: 'error', msg: err instanceof Error ? err.message : String(err), apiKey: key });
    }
  }, [onConnected, onClose, reset]);

  const handlePickerSelect = useCallback((provider: ProviderEntry, apiKey: string) => {
    // Multi-field providers need the moreInfo form
    const multiFieldProviders = new Set(['aws-bedrock', 'vertex', 'openai-compatible']);
    if (multiFieldProviders.has(provider.id)) {
      setState({ kind: 'moreInfo', providerId: provider.id, apiKey });
    } else {
      void handleDetect(apiKey);
    }
  }, [handleDetect]);

  const handleMoreInfoSubmit = useCallback((fields: Record<string, string>) => {
    const { api_key, ...additionalFields } = fields;
    void handleDetect(api_key, additionalFields);
  }, [handleDetect]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleConnect = useCallback(async (_models: ModelWithEnabled[]) => {
    // Model selections already applied server-side during connect.
    // In a future iteration we'd send the toggle list here.
    onConnected();
    handleClose();
  }, [onConnected, handleClose]);

  const modalWidth = state.kind === 'picker' ? 520 : 440;

  return (
    <Modal
      visible={visible}
      onCancel={handleClose}
      footer={null}
      unmountOnExit
      style={{ width: modalWidth }}
    >
      {state.kind === 'entry' && (
        <EntryState
          onDetect={handleDetect}
          onBrowse={() => setState({ kind: 'picker', apiKey: '' })}
        />
      )}
      {state.kind === 'loading' && <LoadingState stage={state.stage} />}
      {state.kind === 'moreInfo' && (
        <MoreInfoState
          providerId={state.providerId as import('@process/providers/types').ProviderId}
          apiKey={state.apiKey}
          onSubmit={handleMoreInfoSubmit}
          onBack={reset}
        />
      )}
      {state.kind === 'picker' && (
        <PickerState
          onSelect={(p) => handlePickerSelect(p, state.apiKey)}
          onBack={reset}
        />
      )}
      {state.kind === 'results' && (
        <ResultsState
          providerDisplayName={state.providerDisplayName}
          models={state.models}
          onConnect={handleConnect}
          onBack={reset}
        />
      )}
      {state.kind === 'error' && (
        <ErrorState
          errorMsg={state.msg}
          onRetry={() => void handleDetect(state.apiKey)}
          onEditKey={reset}
        />
      )}
    </Modal>
  );
};

export default ConnectModal;
