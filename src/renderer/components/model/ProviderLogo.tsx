import React, { useState } from 'react';
import styles from './ProviderLogo.module.css';

/**
 * Vendored provider brand logos, bundled at build time. Real SVG/PNG art for the
 * providers users actually see; the long-tail engine catalog gateways fall back
 * to a monogram tile. Art is the LobeHub icon set (MIT) plus first-party marks,
 * vendored into `assets/logos/providers/` (no runtime CDN dependency).
 */
const LOGO_MODULES = {
  ...import.meta.glob('../../assets/logos/providers/*.svg', { eager: true, import: 'default' }),
  ...import.meta.glob('../../assets/logos/providers/*.png', { eager: true, import: 'default' }),
} as Record<string, string>;

/** Bundled-asset URL keyed by file basename (no extension). */
const LOGO_BY_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(LOGO_MODULES).map(([path, url]) => {
    const file = path.slice(path.lastIndexOf('/') + 1);
    return [file.slice(0, file.lastIndexOf('.')), url];
  })
);

/**
 * Engine-catalog gateway id -> the vendored logo basename it shares. The engine
 * catalog (~100 OpenAI-compatible gateways) uses ids that differ from our
 * curated provider ids; map the recognizable ones onto art we already ship.
 */
const CATALOG_LOGO_ALIAS: Record<string, string> = {
  // A ChatGPT subscription IS OpenAI (OAuth instead of an API key), so it must
  // render OpenAI's real brand logo — not a monogram tile that reads like a
  // different vendor. We ship `openai.svg`; alias the subscription id onto it.
  'chatgpt-subscription': 'openai',
  siliconflow: 'siliconflow',
  'siliconflow-cn': 'siliconflow',
  novita: 'novita',
  'novita-ai': 'novita',
  modelscope: 'modelscope',
  stepfun: 'stepfun',
  'stepfun-ai': 'stepfun',
  poe: 'poe',
  zhipuai: 'zhipu-glm',
  'zhipuai-coding-plan': 'zhipu-glm',
  zai: 'zhipu-glm',
  'zai-coding-plan': 'zhipu-glm',
  moonshotai: 'moonshot',
  'moonshotai-cn': 'moonshot',
  alibaba: 'qwen',
  'alibaba-cn': 'qwen',
  'alibaba-coding-plan': 'qwen',
  'alibaba-coding-plan-cn': 'qwen',
  'alibaba-token-plan': 'qwen',
  'fireworks-ai': 'fireworks',
  'perplexity-agent': 'perplexity',
  'github-copilot': 'github',
  'github-models': 'github',
  'ollama-cloud': 'ollama-local',
  opencode: 'opencode',
  'opencode-go': 'opencode',
};

/**
 * Resolve a provider's vendored brand-logo URL, or `null` when we ship no art
 * for it (the caller renders a monogram tile). Tries the id directly, then the
 * catalog-gateway alias map.
 */
export function providerLogo(id: string): string | null {
  return LOGO_BY_NAME[id] ?? LOGO_BY_NAME[CATALOG_LOGO_ALIAS[id] ?? ''] ?? null;
}

type Props = {
  /** Provider id (curated id or engine-catalog gateway id). */
  id: string;
  /** Monogram + brand colors for the fallback tile (from `providerMeta`). */
  mono: string;
  bg: string;
  darkText: boolean;
  /** Square tile edge in px. */
  size?: number;
};

/**
 * A provider's brand mark on a white rounded tile, with a colored monogram tile
 * as the fallback when no logo is vendored or the image fails to load.
 */
const ProviderLogo: React.FC<Props> = ({ id, mono, bg, darkText, size = 36 }) => {
  const src = providerLogo(id);
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <span className={styles.tile} style={{ width: size, height: size }} aria-hidden='true'>
        <img src={src} alt='' className={styles.img} onError={() => setFailed(true)} />
      </span>
    );
  }

  return (
    <span
      className={styles.mono}
      style={{ width: size, height: size, background: bg, color: darkText ? '#1a1a1a' : '#fff' }}
      aria-hidden='true'
    >
      {mono}
    </span>
  );
};

export default ProviderLogo;
