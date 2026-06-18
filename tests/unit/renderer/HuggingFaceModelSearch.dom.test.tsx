/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string; count?: number }) => {
      const dv = options?.defaultValue ?? key;
      return typeof options?.count === 'number' ? dv.replace('{{count}}', String(options.count)) : dv;
    },
  }),
}));

vi.mock('@arco-design/web-react', () => ({
  Input: Object.assign(({ children }: React.PropsWithChildren) => <>{children}</>, {
    Search: ({
      value,
      onChange,
      placeholder,
    }: {
      value: string;
      onChange: (v: string) => void;
      placeholder?: string;
    }) => (
      <input
        aria-label='hf-search-input'
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    ),
  }),
  Button: ({ children, onClick }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button onClick={onClick}>{children}</button>
  ),
  Spin: () => <div data-testid='spin'>loading</div>,
  Empty: ({ description }: { description?: React.ReactNode }) => <div>{description}</div>,
  Tag: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
  List: Object.assign(
    ({ dataSource, render: renderItem }: { dataSource: unknown[]; render: (item: unknown) => React.ReactNode }) => (
      <ul>{dataSource.map((item, i) => <React.Fragment key={i}>{renderItem(item)}</React.Fragment>)}</ul>
    ),
    {
      Item: ({ children, actions }: React.PropsWithChildren<{ actions?: React.ReactNode[] }>) => (
        <li>
          {children}
          {actions}
        </li>
      ),
    },
  ),
}));

const searchVoiceModels = vi.fn();
vi.mock('@/renderer/services/huggingFaceVoiceSearch', () => ({
  searchVoiceModels: (...args: unknown[]) => searchVoiceModels(...args),
}));

import HuggingFaceModelSearch from '@/renderer/components/voice/HuggingFaceModelSearch';

describe('HuggingFaceModelSearch', () => {
  beforeEach(() => {
    searchVoiceModels.mockReset();
  });

  it('debounces typing into a search call and renders results', async () => {
    searchVoiceModels.mockResolvedValue([
      {
        kind: 'tts',
        engineId: 'mlx-audio-local',
        modelId: 'mlx-community/Kokoro-82M-mlx',
        label: 'Kokoro-82M-mlx',
        hfId: 'mlx-community/Kokoro-82M-mlx',
        sizeLabel: '',
        blurb: 'mlx-community · 12,345 downloads',
        platform: 'darwin-arm64',
        local: true,
        trust: 'community',
        downloads: 12345,
      },
    ]);

    render(<HuggingFaceModelSearch kind='tts' onSelect={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('hf-search-input'), { target: { value: 'kokoro' } });
    expect(searchVoiceModels).not.toHaveBeenCalled();

    expect(await screen.findByText('Kokoro-82M-mlx')).toBeTruthy();
    expect(searchVoiceModels).toHaveBeenCalledWith('kokoro', 'tts', expect.any(Number));
    expect(screen.getByText('Community')).toBeTruthy();
  });

  it('calls onSelect with the entry when the Add button is clicked', async () => {
    const entry = {
      kind: 'tts' as const,
      engineId: 'mlx-audio-local',
      modelId: 'someone/f5-tts',
      label: 'f5-tts',
      hfId: 'someone/f5-tts',
      sizeLabel: '',
      blurb: 'someone · 5 downloads',
      platform: 'darwin-arm64' as const,
      local: true,
      trust: 'community' as const,
      downloads: 5,
    };
    searchVoiceModels.mockResolvedValue([entry]);
    const onSelect = vi.fn();

    render(<HuggingFaceModelSearch kind='tts' onSelect={onSelect} />);

    fireEvent.change(screen.getByLabelText('hf-search-input'), { target: { value: 'f5' } });
    expect(await screen.findByText('f5-tts')).toBeTruthy();

    fireEvent.click(screen.getByText('Add'));
    expect(onSelect).toHaveBeenCalledWith(entry);
  });
});
