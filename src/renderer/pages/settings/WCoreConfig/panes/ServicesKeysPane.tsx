/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { AudioLines, ImageIcon, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { Message, Typography } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import { isElectronDesktop } from '@renderer/utils/platform';
import { deleteToolKeyHttp, setToolKeyHttp } from '@renderer/services/ToolKeyService';
import ToolKeyCard from '../components/ToolKeyCard';
import styles from './Panes.module.css';

/** A keyed tool backend, plus its free-key signup link. */
type ToolBackend = {
  /** Canonical tool id - must match `TOOL_KEY_ENV_MAP` in `toolKeyStore.ts`. */
  id: string;
  name: string;
  /** i18n key for the "what a key unlocks" line. */
  descriptionKey: string;
  descriptionDefault: string;
  signupUrl: string;
};

/** A capability group of keyed backends, rendered as a labelled section. */
type BackendGroup = {
  id: string;
  labelKey: string;
  labelDefault: string;
  icon: React.ReactNode;
  backends: readonly ToolBackend[];
};

/**
 * Capability groups, in priority order. Every id matches `TOOL_KEY_ENV_MAP`, so
 * a saved key is forwarded to the engine spawn automatically. Signup links are
 * each provider's API-key page.
 */
const BACKEND_GROUPS: readonly BackendGroup[] = [
  {
    id: 'web-search',
    labelKey: 'settings.wcoreConfig.services.webSearchGroup',
    labelDefault: 'Web Search',
    icon: <Search size={15} />,
    backends: [
      {
        id: 'brave',
        name: 'Brave Search',
        descriptionKey: 'settings.wcoreConfig.services.brave.desc',
        descriptionDefault: 'Independent search index, privacy-first, with a generous free tier.',
        signupUrl: 'https://brave.com/search/api/',
      },
      {
        id: 'tavily',
        name: 'Tavily',
        descriptionKey: 'settings.wcoreConfig.services.tavily.desc',
        descriptionDefault: 'Search built for agents: clean, ranked results for LLMs.',
        signupUrl: 'https://tavily.com/',
      },
      {
        id: 'exa',
        name: 'Exa',
        descriptionKey: 'settings.wcoreConfig.services.exa.desc',
        descriptionDefault: 'Neural search: find pages by meaning, not just keywords.',
        signupUrl: 'https://exa.ai/',
      },
      {
        id: 'firecrawl',
        name: 'Firecrawl',
        descriptionKey: 'settings.wcoreConfig.services.firecrawl.desc',
        descriptionDefault: 'Crawl and scrape any site into clean, LLM-ready content.',
        signupUrl: 'https://firecrawl.dev/',
      },
    ],
  },
  {
    id: 'voice-audio',
    labelKey: 'settings.wcoreConfig.services.voiceGroup',
    labelDefault: 'Voice & Audio',
    icon: <AudioLines size={15} />,
    backends: [
      {
        id: 'elevenlabs',
        name: 'ElevenLabs',
        descriptionKey: 'settings.wcoreConfig.services.elevenlabs.desc',
        descriptionDefault: 'Natural text-to-speech voices for spoken replies.',
        signupUrl: 'https://elevenlabs.io/app/settings/api-keys',
      },
      {
        id: 'groq',
        name: 'Groq',
        descriptionKey: 'settings.wcoreConfig.services.groq.desc',
        descriptionDefault: 'Fast speech-to-text (Whisper) and low-latency voice.',
        signupUrl: 'https://console.groq.com/keys',
      },
    ],
  },
  {
    id: 'image-gen',
    labelKey: 'settings.wcoreConfig.services.imageGroup',
    labelDefault: 'Image Generation',
    icon: <ImageIcon size={15} />,
    backends: [
      {
        id: 'fal',
        name: 'FAL',
        descriptionKey: 'settings.wcoreConfig.services.fal.desc',
        descriptionDefault: 'FLUX image generation, fast and low cost.',
        signupUrl: 'https://fal.ai/dashboard/keys',
      },
      {
        id: 'huggingface',
        name: 'Hugging Face',
        descriptionKey: 'settings.wcoreConfig.services.huggingface.desc',
        descriptionDefault: 'FLUX and open image models via Hugging Face.',
        signupUrl: 'https://huggingface.co/settings/tokens',
      },
    ],
  },
];

/**
 * The Services & Keys pane - the hero of the Wayland Core config surface.
 *
 * Surfaces the engine's keyed tool backends grouped by capability: Web Search
 * (DuckDuckGo is the smart default, already on), Voice & Audio (ElevenLabs TTS,
 * Groq STT) and Image Generation (FAL, Hugging Face). Vision needs no separate
 * key - it rides the connected model providers. Each key persists through the
 * encrypted `wcoreToolKeys` store and is forwarded to the engine spawn.
 */
const ServicesKeysPane: React.FC = () => {
  const { t } = useTranslation();
  const [presence, setPresence] = useState<Record<string, boolean>>({});
  // On desktop, tool-key writes go through Electron IPC (`wcoreToolKeys.*`). In a
  // remote WebUI that IPC is denied (it mutates credential material a remote
  // caller must not reach), so writes go through the write-only + status HTTP
  // route instead (remote-secure-config W1.B). The presence list read
  // (`wcoreToolKeys.list`) is presence-only and stays remote-allowed, so the
  // pane is now usable from a phone.
  const desktop = isElectronDesktop();

  const refresh = useCallback(async (): Promise<void> => {
    const list = await ipcBridge.wcoreToolKeys.list.invoke();
    setPresence(Object.fromEntries(list.map((p) => [p.id, p.hasKey])));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleSave = useCallback(
    async (id: string, key: string): Promise<void> => {
      const ok = desktop ? (await ipcBridge.wcoreToolKeys.set.invoke({ id, key })).ok : await setToolKeyHttp(id, key);
      if (ok) {
        await refresh();
      } else {
        Message.error(t('settings.wcoreConfig.services.saveFailed', { defaultValue: 'Could not save the key.' }));
      }
    },
    [desktop, refresh, t]
  );

  const handleRemove = useCallback(
    async (id: string): Promise<void> => {
      const ok = desktop ? (await ipcBridge.wcoreToolKeys.delete.invoke({ id })).ok : await deleteToolKeyHttp(id);
      if (ok) await refresh();
    },
    [desktop, refresh]
  );

  return (
    <div className={`${styles.pane} flex flex-col gap-24px`}>
      {/* Pane head */}
      <div className={styles.head}>
        <div className={styles.eyebrow}>Wayland Core</div>
        <h1 className={styles.title}>{t('settings.wcoreConfig.rail.services', { defaultValue: 'Services & Keys' })}</h1>
        <p className={styles.sub}>
          {t('settings.wcoreConfig.services.subtitle', {
            defaultValue:
              "The engine's tool backends: web search, vision, voice and image. Wayland ships working out of the box; plug in a key to unlock higher limits and better quality.",
          })}
        </p>
      </div>

      {BACKEND_GROUPS.map((group) => (
        <div key={group.id} className='flex flex-col gap-12px'>
          <div className='flex items-center gap-8px'>
            <span className='w-26px h-26px rd-6px shrink-0 flex items-center justify-center bg-2 text-t-secondary'>
              {group.icon}
            </span>
            <Typography.Text className='text-14px font-semibold'>
              {t(group.labelKey, { defaultValue: group.labelDefault })}
            </Typography.Text>
          </div>

          {/* DuckDuckGo: the smart default, already on, no key needed. */}
          {group.id === 'web-search' && (
            <div className='flex items-start gap-10px p-16px rd-12px bg-success-light-1 border border-solid border-success-6'>
              <ShieldCheck size={18} className='text-success shrink-0 mt-2px' />
              <div className='flex flex-col gap-2px'>
                <Typography.Text className='text-14px font-medium'>
                  {t('settings.wcoreConfig.services.ddgTitle', {
                    defaultValue: 'DuckDuckGo · active. Free web search is on.',
                  })}
                </Typography.Text>
                <Typography.Text type='secondary' className='text-12px'>
                  {t('settings.wcoreConfig.services.ddgBody', {
                    defaultValue:
                      'No key needed; Wayland searches the web right now. Add a key below only to go faster or run higher volume.',
                  })}
                </Typography.Text>
              </div>
            </div>
          )}

          {group.backends.map((backend) => (
            <ToolKeyCard
              key={backend.id}
              name={backend.name}
              description={t(backend.descriptionKey, { defaultValue: backend.descriptionDefault })}
              connected={presence[backend.id] === true}
              signupUrl={backend.signupUrl}
              onSave={(key) => handleSave(backend.id, key)}
              onRemove={() => handleRemove(backend.id)}
            />
          ))}
        </div>
      ))}

      {/* Vision rides the connected model providers, so it needs no separate key. */}
      <div className={styles.infonote}>
        <div className={styles.inTitle}>
          <Sparkles size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
          {t('settings.wcoreConfig.services.visionTitle', { defaultValue: 'Vision is already on' })}
        </div>
        <div className={styles.inBody}>
          {t('settings.wcoreConfig.services.visionBody', {
            defaultValue:
              'Connect a vision-capable model (Anthropic, Gemini or OpenAI) in Models and the engine can see images. No separate key needed.',
          })}
        </div>
      </div>
    </div>
  );
};

export default ServicesKeysPane;
