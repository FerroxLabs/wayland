import React, { useState } from 'react';
import { Input } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import type { ProviderId } from '@process/providers/types';

type ProviderEntry = {
  id: ProviderId;
  displayName: string;
  category: string;
};

const PROVIDERS: ProviderEntry[] = [
  // Frontier
  { id: 'anthropic', displayName: 'Anthropic', category: 'frontier' },
  { id: 'openai', displayName: 'OpenAI', category: 'frontier' },
  { id: 'google-gemini', displayName: 'Google Gemini', category: 'frontier' },
  { id: 'xai', displayName: 'xAI Grok', category: 'frontier' },
  { id: 'mistral', displayName: 'Mistral', category: 'frontier' },
  // Open inference
  { id: 'openrouter', displayName: 'OpenRouter', category: 'openInference' },
  { id: 'together', displayName: 'Together AI', category: 'openInference' },
  { id: 'fireworks', displayName: 'Fireworks AI', category: 'openInference' },
  { id: 'groq', displayName: 'Groq', category: 'openInference' },
  { id: 'cerebras', displayName: 'Cerebras', category: 'openInference' },
  { id: 'nvidia', displayName: 'NVIDIA NIM', category: 'openInference' },
  { id: 'replicate', displayName: 'Replicate', category: 'openInference' },
  { id: 'huggingface', displayName: 'Hugging Face', category: 'openInference' },
  { id: 'anyscale', displayName: 'Anyscale', category: 'openInference' },
  // Cloud
  { id: 'aws-bedrock', displayName: 'AWS Bedrock', category: 'cloud' },
  { id: 'vertex', displayName: 'Google Vertex AI', category: 'cloud' },
  { id: 'cohere', displayName: 'Cohere', category: 'cloud' },
  { id: 'perplexity', displayName: 'Perplexity', category: 'cloud' },
  // Chinese frontier
  { id: 'deepseek', displayName: 'DeepSeek', category: 'chineseFrontier' },
  { id: 'qwen', displayName: '通义千问 (Qwen)', category: 'chineseFrontier' },
  { id: 'moonshot', displayName: '月之暗面 (Moonshot)', category: 'chineseFrontier' },
  { id: 'zhipu-glm', displayName: '智谱 GLM', category: 'chineseFrontier' },
  { id: 'baichuan', displayName: '百川 (Baichuan)', category: 'chineseFrontier' },
  { id: 'minimax', displayName: 'MiniMax', category: 'chineseFrontier' },
  { id: 'lingyiwanwu', displayName: '零一万物 (Yi)', category: 'chineseFrontier' },
  // Specialised
  { id: 'stability', displayName: 'Stability AI', category: 'specialised' },
  // Voice
  { id: 'deepgram', displayName: 'Deepgram', category: 'voice' },
  { id: 'assemblyai', displayName: 'AssemblyAI', category: 'voice' },
  { id: 'elevenlabs', displayName: 'ElevenLabs', category: 'voice' },
  // Custom
  { id: 'openai-compatible', displayName: 'OpenAI-compatible endpoint', category: 'custom' },
];

const CATEGORY_ORDER = ['frontier', 'openInference', 'cloud', 'chineseFrontier', 'specialised', 'voice', 'custom'];

type Props = {
  onSelect: (provider: ProviderEntry) => void;
  onBack: () => void;
};

const PickerState = ({ onSelect, onBack }: Props) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filtered = PROVIDERS.filter(
    (p) =>
      !search ||
      p.displayName.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = CATEGORY_ORDER.reduce<Record<string, ProviderEntry[]>>((acc, cat) => {
    const items = filtered.filter((p) => p.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-3 p-4" style={{ maxHeight: 440, overflowY: 'auto' }}>
      <h2 className="text-base font-semibold text-[var(--color-text-1)]">
        {t('settings.providers.connect.pickerTitle')}
      </h2>
      <Input
        placeholder={t('settings.providers.connect.pickerSearch')}
        value={search}
        onChange={setSearch}
        allowClear
      />
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <div className="text-xs font-medium text-[var(--color-text-3)] uppercase tracking-wide mb-2 mt-3">
            {t(`settings.providers.categories.${cat}`)}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {items.map((p) => (
              <button
                key={p.id}
                className="text-left px-3 py-2 rounded-lg border border-[var(--color-border-2)] hover:border-[var(--color-primary-6)] hover:bg-[var(--color-primary-1)] text-sm text-[var(--color-text-1)] transition-colors"
                onClick={() => onSelect(p)}
              >
                {p.displayName}
              </button>
            ))}
          </div>
        </div>
      ))}
      {Object.keys(grouped).length === 0 && (
        <p className="text-sm text-[var(--color-text-3)] text-center py-4">{search}</p>
      )}
      <button
        className="mt-2 text-sm text-[var(--color-text-3)] hover:text-[var(--color-text-1)] self-start"
        onClick={onBack}
      >
        ← {t('settings.providers.connect.cancel')}
      </button>
    </div>
  );
};

export default PickerState;
export type { ProviderEntry };
