import { Check, CheckCircle2, Pencil, Plus, Shield, Trash2, XCircle } from 'lucide-react';
import { Button, Input, Modal, Spin, Tooltip } from '@arco-design/web-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * API Key status
 */
type KeyStatus = 'pending' | 'testing' | 'valid' | 'invalid';

/**
 * API Key item
 */
interface ApiKeyItem {
  id: string;
  value: string;
  status: KeyStatus;
  editing: boolean;
}

interface ApiKeyEditorModalProps {
  visible: boolean;
  apiKeys: string; // Comma-separated API Keys
  onClose: () => void;
  onSave: (apiKeys: string) => void;
  onTestKey?: (key: string) => Promise<boolean>; // Callback to test a single key
}

/**
 * API Key Editor Modal
 */
const ApiKeyEditorModal: React.FC<ApiKeyEditorModalProps> = ({ visible, apiKeys, onClose, onSave, onTestKey }) => {
  const { t } = useTranslation();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);

  // Initialize keys
  useEffect(() => {
    if (visible) {
      const keyList = apiKeys
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
      if (keyList.length === 0) {
        // Add an empty input by default
        setKeys([{ id: crypto.randomUUID(), value: '', status: 'pending', editing: true }]);
      } else {
        setKeys(keyList.map((k) => ({ id: crypto.randomUUID(), value: k, status: 'pending', editing: false })));
      }
    }
  }, [visible, apiKeys]);

  // Update value of a single key
  const updateKeyValue = useCallback((id: string, value: string) => {
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, value, status: 'pending' } : k)));
  }, []);

  // Toggle editing state
  const toggleEditing = useCallback((id: string) => {
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, editing: !k.editing } : k)));
  }, []);

  // Delete a single key
  const deleteKey = useCallback((id: string) => {
    setKeys((prev) => {
      const filtered = prev.filter((k) => k.id !== id);
      // If none left after deletion, keep an empty one
      if (filtered.length === 0) {
        return [{ id: crypto.randomUUID(), value: '', status: 'pending', editing: true }];
      }
      return filtered;
    });
  }, []);

  // Core logic for testing a single key
  const executeKeyTest = useCallback(
    async (id: string, value: string) => {
      if (!onTestKey) return;

      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, status: 'testing' } : k)));

      try {
        const isValid = await onTestKey(value);
        setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, status: isValid ? 'valid' : 'invalid' } : k)));
      } catch {
        setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, status: 'invalid' } : k)));
      }
    },
    [onTestKey]
  );

  // Test a single key
  const testKey = useCallback(
    async (id: string) => {
      const key = keys.find((k) => k.id === id);
      if (!key || !key.value.trim()) return;
      await executeKeyTest(id, key.value.trim());
    },
    [keys, executeKeyTest]
  );

  // Add a new key input
  const addKey = useCallback(() => {
    setKeys((prev) => [...prev, { id: crypto.randomUUID(), value: '', status: 'pending', editing: true }]);
  }, []);

  // Test all keys
  const testAllKeys = useCallback(async () => {
    const keysToTest = keys.filter((k) => k.value.trim());
    for (const key of keysToTest) {
      await executeKeyTest(key.id, key.value.trim());
    }
  }, [keys, executeKeyTest]);

  // Delete invalid keys
  const deleteInvalidKeys = useCallback(() => {
    setKeys((prev) => {
      const filtered = prev.filter((k) => k.status !== 'invalid');
      if (filtered.length === 0) {
        return [{ id: crypto.randomUUID(), value: '', status: 'pending', editing: true }];
      }
      return filtered;
    });
  }, []);

  // Save
  const handleSave = useCallback(() => {
    const validKeys = keys
      .map((k) => k.value.trim())
      .filter(Boolean)
      .join(',');
    onSave(validKeys);
    onClose();
  }, [keys, onSave, onClose]);

  // Whether there are multiple keys
  const hasMultipleKeys = keys.filter((k) => k.value.trim()).length > 1;
  // Whether any keys have been tested
  const hasTestedKeys = keys.some((k) => k.status === 'valid' || k.status === 'invalid');
  // Whether any keys are invalid
  const hasInvalidKeys = keys.some((k) => k.status === 'invalid');

  // Get status icon
  const getStatusIcon = (status: KeyStatus) => {
    switch (status) {
      case 'testing':
        return <Spin size={14} />;
      case 'valid':
        return <CheckCircle2 size={16} className='text-green-500 flex' />;
      case 'invalid':
        return <XCircle size={16} className='text-red-500 flex' />;
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      title={t('settings.editApiKey')}
      footer={null}
      style={{ maxWidth: '500px', width: '90vw' }}
      unmountOnExit
    >
      <div className='flex flex-col gap-12px'>
        {/* Key list */}
        <div className='flex flex-col gap-8px max-h-300px overflow-y-auto'>
          {keys.map((key) => (
            <div key={key.id} className='flex items-center gap-8px'>
              <div className='flex-1'>
                <Input
                  value={key.value}
                  onChange={(v) => updateKeyValue(key.id, v)}
                  disabled={!key.editing}
                  placeholder={t('settings.apiKeyPlaceholder')}
                />
              </div>
              {/* Action buttons - in editing state only the save button shows */}
              {key.value.trim() && (
                <div className='flex items-center gap-4px shrink-0'>
                  {key.editing ? (
                    // Editing state: show only the save button
                    <Tooltip content={t('common.save')}>
                      <Button
                        type='text'
                        size='mini'
                        icon={<Check size={16} className='flex' />}
                        onClick={() => toggleEditing(key.id)}
                        status='success'
                      />
                    </Tooltip>
                  ) : (
                    // Non-editing state: show status icon + test + edit + delete
                    <>
                      {/* Status icon - to the left of the test button */}
                      {key.status !== 'pending' && <div className='flex items-center'>{getStatusIcon(key.status)}</div>}
                      <Tooltip content={t('settings.testKey')}>
                        <Button
                          type='text'
                          size='mini'
                          icon={<Shield size={16} className='flex' />}
                          onClick={() => testKey(key.id)}
                          loading={key.status === 'testing'}
                        />
                      </Tooltip>
                      <Tooltip content={t('common.edit')}>
                        <Button
                          type='text'
                          size='mini'
                          icon={<Pencil size={16} className='flex' />}
                          onClick={() => toggleEditing(key.id)}
                        />
                      </Tooltip>
                      <Tooltip content={t('common.delete')}>
                        <Button
                          type='text'
                          size='mini'
                          icon={<Trash2 size={16} className='flex' />}
                          onClick={() => deleteKey(key.id)}
                          status='danger'
                        />
                      </Tooltip>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom action bar */}
        <div className='flex items-center justify-between pt-12px border-t border-line-2'>
          <span className='text-11px text-t-secondary'>{t('settings.multiKeyTip')}</span>
          <div className='flex items-center gap-8px'>
            {hasMultipleKeys && (
              <>
                {hasTestedKeys && hasInvalidKeys && (
                  <Tooltip content={t('settings.deleteInvalidKeys')}>
                    <Button
                      type='text'
                      size='small'
                      icon={<Trash2 size={16} className='flex' />}
                      onClick={deleteInvalidKeys}
                      status='danger'
                    />
                  </Tooltip>
                )}
                <Tooltip content={t('settings.testAllKeys')}>
                  <Button
                    type='text'
                    size='small'
                    icon={<Shield size={16} className='flex' />}
                    onClick={testAllKeys}
                  />
                </Tooltip>
              </>
            )}
            <Button
              className='flex'
              type='outline'
              size='small'
              icon={<Plus size={14} className='' />}
              onClick={addKey}
              style={{ minWidth: 70 }}
            >
              {t('common.add')}
            </Button>
          </div>
        </div>

        {/* Confirm button */}
        <div className='flex justify-end gap-12px pt-8px'>
          <Button
            type='primary'
            onClick={handleSave}
            className=''
          >
            {t('common.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ApiKeyEditorModal;
