/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared Tank connection form (URL + token). Used both by the Tank page's
 * not-configured state and by the standalone Settings > Tank page, so the
 * fields and persistence live in one place.
 *
 * ponytail: inline English to match the rest of this flag-gated feature; move
 * to i18n keys when Tank ships non-gated.
 */

import React, { useEffect, useState } from 'react';
import { Button, Input, Message, Space, Typography } from '@arco-design/web-react';
import { ipcBridge } from '@/common';

const DEFAULT_TANK_URL = 'http://127.0.0.1:7879';

type Props = {
  /** Text for the submit button. */
  saveLabel?: string;
  /** Called after the connection is saved and applied. */
  onSaved?: () => void;
};

const TankConnectionForm: React.FC<Props> = ({ saveLabel = 'Save', onSaved }) => {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    ipcBridge.autopilot.getTankConfig
      .invoke()
      .then((cfg) => {
        setUrl(cfg.url);
        setToken(cfg.token);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await ipcBridge.autopilot.setTankConfig.invoke({ url, token });
      Message.success('Tank connection saved');
      onSaved?.();
    } catch (e) {
      Message.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Space direction='vertical' size='medium' className='w-full'>
      <div>
        <Typography.Text type='secondary'>Tank URL</Typography.Text>
        <Input value={url} onChange={setUrl} placeholder={DEFAULT_TANK_URL} allowClear />
      </div>
      <div>
        <Typography.Text type='secondary'>Tank token</Typography.Text>
        <Input.Password value={token} onChange={setToken} placeholder='WAYLAND_TANK_TOKEN' allowClear />
      </div>
      <Button type='primary' long loading={saving} disabled={!token.trim()} onClick={handleSave}>
        {saveLabel}
      </Button>
      <Typography.Text type='secondary' className='text-12px'>
        The WAYLAND_TANK_URL / WAYLAND_TANK_TOKEN environment variables, when set, take precedence over this.
      </Typography.Text>
    </Space>
  );
};

export default TankConnectionForm;
