/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ArrowRight,
  Building2,
  Check,
  Info,
  KeyRound,
  Landmark,
  Loader2,
  PenLine,
  Search,
  Sparkles,
  Terminal,
  TrendingUp,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import { FLUX_AUTO_MODEL, FLUX_PROVIDER_ID } from '@/common/config/flux';
import { ConfigStorage } from '@/common/config/storage';
import type { DetectionResult } from '@/common/types/onboarding';
import type { ProviderId } from '@process/providers/types';
import wordmark from '@renderer/assets/logos/wayland-wordmark-white.png';
import anthropicLogo from '@renderer/assets/logos/anthropic.svg';
import claudeLogo from '@renderer/assets/logos/claude.svg';
import codexLogo from '@renderer/assets/logos/codex.svg';
import cursorLogo from '@renderer/assets/logos/cursor.png';
import geminiLogo from '@renderer/assets/logos/gemini.svg';
import groqLogo from '@renderer/assets/logos/groq.svg';
import ollamaLogo from '@renderer/assets/logos/ollama.svg';
import openaiLogo from '@renderer/assets/logos/openai.svg';
import openrouterLogo from '@renderer/assets/logos/openrouter.svg';
import { resolveFocusSelection, type FocusPersonaId } from './focusMap';
import { providerLabel } from './providerLabel';
import { openExternalUrl } from '@renderer/utils/platform';
import styles from './Onboarding.module.css';

/** Where to grab a Flux key by hand when the one-click OAuth handoff can't start. */
const FLUX_KEY_URL = 'https://fluxrouter.ai/home/api-keys';

type OnboardingFlowProps = {
  detection: DetectionResult;
  /** Onboarding is complete - close the overlay and drop the user into the app. */
  onFinish: () => void;
};

type Screen = 'quickstart' | 'scan' | 'outcome' | 'interests' | 'allset';

/** Provider id → real brand logo (rendered on a white tile). */
const PROVIDER_LOGO: Record<string, string> = {
  openai: openaiLogo,
  anthropic: anthropicLogo,
  'google-gemini': geminiLogo,
  groq: groqLogo,
  openrouter: openrouterLogo,
  ollama: ollamaLogo,
};
/** Detected CLI id → brand logo. */
const CLI_LOGO: Record<string, string> = {
  claude: claudeLogo,
  codex: codexLogo,
  cursor: cursorLogo,
};

type Persona = { id: FocusPersonaId; labelKey: string; accent: string; Icon: LucideIcon };
const PERSONAS: Persona[] = [
  { id: 'content', labelKey: 'onboarding.flow.personas.content', accent: '139,92,246', Icon: PenLine },
  { id: 'sales', labelKey: 'onboarding.flow.personas.sales', accent: '16,185,129', Icon: TrendingUp },
  { id: 'business', labelKey: 'onboarding.flow.personas.business', accent: '244,114,182', Icon: Building2 },
  { id: 'dev', labelKey: 'onboarding.flow.personas.dev', accent: '99,102,241', Icon: Wrench },
  { id: 'finance', labelKey: 'onboarding.flow.personas.finance', accent: '245,158,11', Icon: Landmark },
  { id: 'general', labelKey: 'onboarding.flow.personas.general', accent: '56,189,248', Icon: Sparkles },
];

// Scan animation lines - keyed so the narration is localized. The order here is
// the on-screen sequence; `scanLog` indexes into this array.
const SCAN_LINE_KEYS = [
  'onboarding.flow.scanLines.path',
  'onboarding.flow.scanLines.env',
  'onboarding.flow.scanLines.models',
  'onboarding.flow.scanLines.almost',
];

/**
 * Flux Router brand mark - the official routing glyph (two endpoints joined by a
 * routed path). Strokes `currentColor` so it inherits the tile's brand orange.
 * Source: brand/svg/marks/flux-mark.svg.
 */
const FluxMark: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg
    viewBox='0 0 24 24'
    width={size}
    height={size}
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden
    focusable='false'
  >
    <circle cx='6' cy='19' r='3' />
    <path d='M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15' />
    <circle cx='18' cy='5' r='3' />
  </svg>
);

/** "a, b and c". */
const joinList = (arr: string[]): string =>
  arr.length <= 1 ? (arr[0] ?? '') : `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`;

const accentStyle = (accent: string): React.CSSProperties =>
  ({ ['--accent' as string]: accent }) as React.CSSProperties;

/**
 * First-run onboarding. Google-first quick start (the universal floor: even a
 * single click wires Google + Gemini + Wayland Core and tells us their name),
 * then a narrated local scan that auto-wires detected keys, an adaptive outcome
 * (loaded / ready / pick-a-model), a focus pick that seeds the launchpad, and a
 * one-line "you're all set". Matches the approved walkable simulation.
 */
const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ detection, onFinish }) => {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>('quickstart');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  // Set true once the Flux one-click sign-in fails to start (e.g. the fluxrouter.ai
  // handoff is down). Surfaces the manual key-paste path so onboarding never dead-ends.
  const [fluxFallback, setFluxFallback] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [scanLog, setScanLog] = useState(0);
  const [picks, setPicks] = useState<FocusPersonaId[]>([]);
  const [work, setWork] = useState('');
  const [coldKey, setColdKey] = useState('');
  // Providers connected via the paste field this session - appended to the
  // reveal so a freshly-added key visibly lands "in the pool".
  const [addedProviders, setAddedProviders] = useState<string[]>([]);
  // Detected keys that ACTUALLY connected during the scan auto-wire (and the
  // ones that failed). Detection is a claim; connection is the truth. The
  // "wired and tested" outcome is driven by these, never by the detected list.
  const [wiredProviders, setWiredProviders] = useState<string[]>([]);
  const [wireFailed, setWireFailed] = useState<string[]>([]);

  // Detection-derived shape (the warm/cold fork is decided by the real machine).
  const hasKeys = detection.envKeys.length > 0;
  const hasOllama = detection.ollama.running && detection.ollama.models.length > 0;
  const fluxConnected = detection.fluxConnected;
  const warm = hasKeys || hasOllama || fluxConnected;
  // Installed execution engines beyond the always-present bundled ones (Wayland
  // Core, Gemini CLI) - a detected Claude Code / Qwen / Kimi / OpenClaw / … means
  // the user can chat now, so it counts toward the ready (cli-only) fork.
  const discoveredAgents = detection.agents.filter((a) => a.kind !== 'wcore' && a.kind !== 'gemini');
  const cliOnly = !warm && (discoveredAgents.length > 0 || detection.clis.length > 0 || detection.claudePro);
  const trueCold = !warm && !cliOnly;

  // Narrated scan + fail-safe auto-wire of detected keys, on entering the scan.
  //
  // The auto-wire is SETTLED, not fire-and-forget: we record which keys actually
  // connected so the outcome can only claim "wired and tested" for those. The
  // scan completes when BOTH a minimum narration beat AND the wiring have
  // resolved - so it can never declare ready before the connects finish (the old
  // fixed 1750ms timer could fire mid-connect and present a false green).
  useEffect(() => {
    if (screen !== 'scan') return;
    setScanDone(false);
    setScanLog(0);
    let cancelled = false;

    const logTimer = setInterval(() => setScanLog((i) => Math.min(i + 1, SCAN_LINE_KEYS.length - 1)), 430);

    const minBeat = new Promise<void>((resolve) => setTimeout(resolve, 1750));
    const wiring = Promise.all(
      detection.envKeys.map((pid) =>
        ipcBridge.modelRegistry.connect
          .invoke({ providerId: pid as ProviderId, creds: { useDiscovered: true } })
          .then((res) => ({ pid, ok: res.ok === true }))
          .catch(() => ({ pid, ok: false }))
      )
    );

    void Promise.all([minBeat, wiring]).then(async ([, results]) => {
      if (cancelled) return;
      clearInterval(logTimer);
      setWiredProviders(results.filter((r) => r.ok).map((r) => r.pid));
      setWireFailed(results.filter((r) => !r.ok).map((r) => r.pid));
      // Flux detected already-connected: pin Flux Auto as the default so the
      // first-run user lands on the best model (the smart router), not whatever
      // local model happens to sort first (e.g. a tiny Ollama smollm2:135m).
      // Mirrors the manual connectFlux pin; non-fatal.
      if (detection.fluxConnected) {
        try {
          const pin = { id: FLUX_PROVIDER_ID, useModel: FLUX_AUTO_MODEL };
          await ConfigStorage.set('wcore.defaultModel', pin);
          await ConfigStorage.set('gemini.defaultModel', pin);
          await ipcBridge.systemSettings.setRouteThroughFlux.invoke({ enabled: true });
        } catch (err) {
          console.warn('[OnboardingFlow] flux auto-detect default pin failed', err);
        }
      }
      if (!cancelled) setScanDone(true);
    });

    return () => {
      cancelled = true;
      clearInterval(logTimer);
    };
  }, [screen, detection.envKeys, detection.fluxConnected]);

  const connectFlux = useCallback(async () => {
    if (busy) return;
    setBusy('flux');
    setErrorMsg(null);
    try {
      const res = await ipcBridge.onboarding.connectFlux.invoke();
      if (res.ok) {
        // First-run "just works": pin Flux Auto as the default for provider-backed
        // agents and turn the global routing toggle ON. Both writes hit the shared
        // wayland-config store the model resolver reads. Failures here are
        // non-fatal: the connection already succeeded, so never block onboarding.
        try {
          const pin = { id: FLUX_PROVIDER_ID, useModel: FLUX_AUTO_MODEL };
          await ConfigStorage.set('wcore.defaultModel', pin);
          await ConfigStorage.set('gemini.defaultModel', pin);
          await ipcBridge.systemSettings.setRouteThroughFlux.invoke({ enabled: true });
        } catch (err) {
          console.warn('[OnboardingFlow] flux first-run pin failed', err);
        }
        setBusy(null);
        setScreen('interests');
        return;
      }
      // A non-cancel failure means the one-click handoff couldn't complete (the
      // fluxrouter.ai sign-in is the usual culprit). Don't dead-end - reveal the
      // manual key-paste fallback alongside an actionable message.
      if ('error' in res && res.error !== 'cancelled') {
        setFluxFallback(true);
        setErrorMsg(t('onboarding.flow.errors.fluxFallback'));
      }
      setBusy(null);
    } catch {
      setFluxFallback(true);
      setErrorMsg(t('onboarding.flow.errors.fluxFallback'));
      setBusy(null);
    }
  }, [busy, t]);

  /**
   * Connect a pasted key. The provider is auto-detected in the main process via
   * the real `ProviderDetector` + `SkRaceResolver`, so a bare `sk-` key shared
   * by OpenAI/DeepSeek/Moonshot/Qwen is probed live and connected to its true
   * owner (not blindly assumed to be OpenAI). Returns whether it stuck.
   */
  const connectKey = useCallback(
    async (raw: string): Promise<boolean> => {
      // API keys never contain whitespace - strip everything so a stray newline or
      // leading space from a paste never trips the connect.
      const key = raw.replace(/\s+/g, '');
      if (!key) {
        setErrorMsg(t('onboarding.flow.key.notRecognized'));
        return false;
      }
      setBusy('key');
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await ipcBridge.onboarding.connectPastedKey
        .invoke({ key })
        .catch(() => ({ ok: false as const, error: 'failed' as const }));
      setBusy(null);
      if (res.ok) {
        setSuccessMsg(t('onboarding.flow.key.detected', { label: providerLabel(res.providerId) }));
        setAddedProviders((prev) => (prev.includes(res.providerId) ? prev : [...prev, res.providerId]));
        // A pasted Flux Router key is intent to route through Flux - pin Flux Auto
        // as the default and turn routing on, exactly like the detected-at-scan
        // and one-click Flux-door paths above. Without this the home default
        // chain lands on whatever local model sorts first (a tiny Ollama
        // smollm2:135m), because Ollama populates the curated list instantly
        // while the Flux virtual models arrive a beat later (#129). Non-fatal.
        if (res.providerId === FLUX_PROVIDER_ID) {
          try {
            const pin = { id: FLUX_PROVIDER_ID, useModel: FLUX_AUTO_MODEL };
            await ConfigStorage.set('wcore.defaultModel', pin);
            await ConfigStorage.set('gemini.defaultModel', pin);
            await ipcBridge.systemSettings.setRouteThroughFlux.invoke({ enabled: true });
          } catch (err) {
            console.warn('[OnboardingFlow] flux pasted-key pin failed', err);
          }
        }
        return true;
      }
      setErrorMsg(
        'error' in res && res.error === 'needs-fields'
          ? t('onboarding.flow.key.needsFields')
          : t('onboarding.flow.key.didNotConnect')
      );
      return false;
    },
    [t]
  );

  const togglePick = useCallback((id: FocusPersonaId) => {
    setPicks((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const finishInterests = useCallback(async () => {
    const w = work.trim();
    let focus: FocusPersonaId[] = [...picks];
    if (w) {
      void ConfigStorage.set('onboarding.workDescription', w);
      // Extract intent from the free text (cheap fast model, e.g. Gemini Flash,
      // with a keyword fallback) and merge it with any cards the user tapped.
      setBusy('infer');
      const inferred = await ipcBridge.onboarding.inferFocus.invoke({ work: w }).catch(() => [] as string[]);
      setBusy(null);
      const valid = new Set<string>(PERSONAS.map((p) => p.id));
      const add = inferred.filter((id): id is FocusPersonaId => valid.has(id));
      focus = [...new Set([...focus, ...add])];
    }
    if (focus.length > 0) {
      const { launchpadIds } = resolveFocusSelection(focus);
      void ConfigStorage.set('launchpad.barOrder', launchpadIds);
      void ConfigStorage.set('onboarding.focusArea', focus);
    }
    setScreen('allset');
  }, [picks, work]);

  const finishAll = useCallback(() => {
    const n = name.trim();
    if (n) void ConfigStorage.set('user.displayName', n);
    onFinish();
  }, [name, onFinish]);

  const wiredLabel = useMemo(() => {
    const list = [...wiredProviders.map((p) => providerLabel(p)), ...(hasOllama ? ['Ollama'] : [])];
    return joinList(list);
  }, [wiredProviders, hasOllama]);

  // A soft note for keys that were detected but failed to verify - shown in the
  // outcome so a partial failure is honest, not hidden.
  const failedLabel = useMemo(() => joinList(wireFailed.map((p) => providerLabel(p))), [wireFailed]);

  // The outcome may claim "wired up" only when something genuinely connected -
  // a real provider, Ollama, or Flux. Detected-but-unverified keys do NOT count,
  // so an all-failed auto-wire falls through to an honest recovery branch instead
  // of a false "you're all wired up".
  const wiredWarm = wiredProviders.length > 0 || hasOllama || fluxConnected;

  const hi = (base: string) => (name ? `${name}, ${base}` : base.charAt(0).toUpperCase() + base.slice(1));

  // --- reveal chips (agents / models) ---
  const agentChips = useMemo(() => {
    // Map a registry agent to a brand logo where we have one; everything else
    // falls back to the generic terminal tile in renderChip.
    const logoFor = (name: string): string | undefined => {
      const n = name.toLowerCase();
      if (n.includes('claude')) return claudeLogo;
      if (n.includes('codex')) return codexLogo;
      if (n.includes('gemini')) return geminiLogo;
      if (n.includes('cursor')) return cursorLogo;
      return undefined;
    };
    const out: { key: string; label: string; logo?: string }[] = [];
    // Primary source: the app's unified AgentRegistry (finds every backend).
    for (const a of detection.agents) out.push({ key: `agent-${a.id}`, label: a.name, logo: logoFor(a.name) });
    // Defensive fallback to the raw CLI probe if the registry returned nothing.
    if (out.length === 0)
      for (const cli of detection.clis) out.push({ key: `cli-${cli}`, label: providerLabel(cli), logo: CLI_LOGO[cli] });
    // Surface a Claude Pro subscription even when no `claude` engine is listed.
    if (
      detection.claudePro &&
      !detection.agents.some((a) => /claude/i.test(a.name)) &&
      !detection.clis.includes('claude')
    )
      out.push({ key: 'claude-pro', label: t('onboarding.flow.chips.claudePro'), logo: claudeLogo });
    return out;
  }, [detection.agents, detection.clis, detection.claudePro, t]);
  const modelChips = useMemo(() => {
    const out: { key: string; label: string; logo?: string }[] = [];
    const seen = new Set<string>();
    for (const k of wiredProviders) {
      out.push({
        key: `env-${k}`,
        label: t('onboarding.flow.chips.envKey', { label: providerLabel(k) }),
        logo: PROVIDER_LOGO[k],
      });
      seen.add(k);
    }
    // Keys the user pasted in this session that weren't already detected.
    for (const p of addedProviders) {
      if (seen.has(p)) continue;
      out.push({
        key: `added-${p}`,
        label: t('onboarding.flow.chips.envKey', { label: providerLabel(p) }),
        logo: PROVIDER_LOGO[p],
      });
      seen.add(p);
    }
    if (hasOllama)
      out.push({
        key: 'ollama',
        label: t('onboarding.flow.chips.ollama', { count: detection.ollama.models.length }),
        logo: ollamaLogo,
      });
    if (fluxConnected)
      out.push({ key: 'flux', label: t('onboarding.flow.chips.flux'), logo: PROVIDER_LOGO['flux-router'] });
    return out;
  }, [wiredProviders, detection.ollama.models.length, hasOllama, fluxConnected, addedProviders, t]);

  const Header: React.FC<{ step: 0 | 1 | 2 }> = ({ step }) => (
    <div className={styles.top}>
      <img className={styles.wordmark} src={wordmark} alt={t('onboarding.flow.logoAlt.wordmark')} />
      <div className={styles.dots}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={`${styles.dot} ${i === step ? styles.dotOn : i < step ? styles.dotDone : ''}`} />
        ))}
      </div>
    </div>
  );

  const renderChip = (c: { key: string; label: string; logo?: string }) => (
    <span key={c.key} className={styles.chip}>
      <span className={styles.tile}>
        {c.logo ? <img src={c.logo} alt='' /> : <Terminal size={18} color='#1a1a1a' />}
      </span>
      <span className={styles.chipName}>{c.label}</span>
      <span className={styles.ok}>
        <Check size={15} strokeWidth={2.6} />
      </span>
    </span>
  );

  const keyField = (onSubmit: (v: string) => void, value: string, setValue: (v: string) => void) => {
    const clean = value.replace(/\s+/g, '');
    const submit = () => {
      if (clean && busy !== 'key') void onSubmit(clean);
    };
    return (
      <div className={styles.keyfield}>
        <span className={styles.kfIc}>
          {busy === 'key' ? <Loader2 size={18} className={styles.spinDark} /> : <KeyRound size={18} />}
        </span>
        <input
          type='password'
          autoComplete='off'
          spellCheck={false}
          value={value}
          placeholder={t('onboarding.flow.key.placeholder')}
          // Strip whitespace as it arrives so a pasted key with a trailing
          // newline or stray spaces is always clean.
          onChange={(e) => {
            setValue(e.target.value.replace(/\s+/g, ''));
            if (errorMsg) setErrorMsg(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          disabled={busy === 'key'}
        />
        <button
          type='button'
          className={styles.kfBtn}
          onClick={submit}
          disabled={!clean || busy === 'key'}
          aria-label={t('onboarding.flow.key.ariaConnect')}
        >
          {busy === 'key' ? <Loader2 size={16} className={styles.spinDark} /> : <ArrowRight size={16} />}
        </button>
      </div>
    );
  };

  /** Inline result line under the paste field: green success or red error. */
  const keyStatus = () =>
    successMsg ? (
      <p className={styles.keyOk}>
        <Check size={15} strokeWidth={2.8} /> {successMsg}
      </p>
    ) : errorMsg ? (
      <p className={styles.keyErr}>{errorMsg}</p>
    ) : null;

  const fluxBanner = (title: string, body: string) => (
    <>
      <div className={styles.fluxbig}>
        <span className={styles.fbIc}>
          {busy === 'flux' ? <Loader2 size={22} className={styles.spinDark} /> : <FluxMark />}
        </span>
        <span className={styles.fbMain}>
          <span className={styles.fbTitle}>{title}</span> <span className={styles.fbBody}>{body}</span>
        </span>
        <button type='button' className={styles.fbCta} onClick={() => void connectFlux()} disabled={busy !== null}>
          {t(fluxFallback ? 'onboarding.flow.flux.retryCta' : 'onboarding.flow.flux.cta')}
        </button>
      </div>
      {fluxFallback && (
        <button type='button' className={styles.fluxGetKey} onClick={() => void openExternalUrl(FLUX_KEY_URL)}>
          {t('onboarding.flow.flux.getKeyCta')} <ArrowRight size={14} />
        </button>
      )}
    </>
  );

  const FLUX_TITLE = t('onboarding.flow.flux.title');
  const FLUX_BODY = t('onboarding.flow.flux.body');

  // ---------------- screens ----------------

  if (screen === 'quickstart') {
    const goScan = () => {
      const n = name.trim();
      if (n) void ConfigStorage.set('user.displayName', n);
      setScreen('scan');
    };
    return (
      <div className={styles.shell}>
        <Header step={0} />
        <h1 className={styles.headline}>
          {t('onboarding.flow.quickstart.headline')}
          <span className={styles.pt}>?</span>
        </h1>
        <p className={styles.sub}>{t('onboarding.flow.quickstart.sub')}</p>
        <div
          className={styles.grow}
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, maxWidth: 460 }}
        >
          <input
            className={styles.bigfield}
            value={name}
            autoFocus
            placeholder={t('onboarding.flow.quickstart.namePlaceholder')}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') goScan();
            }}
          />
        </div>
        <div className={styles.actions}>
          <span className={styles.ghost}>{t('onboarding.flow.quickstart.changeLater')}</span>
          <button type='button' className={styles.btn} onClick={goScan}>
            {t('onboarding.flow.quickstart.continue')} <ArrowRight size={15} />
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'scan') {
    const noFindings = agentChips.length === 0 && modelChips.length === 0;
    return (
      <div className={`${styles.shell} ${styles.shellScan}`}>
        <Header step={1} />
        {/* Scrollable body so a long detected-tools list never pushes the
            Continue action below the fold - the footer stays pinned + visible. */}
        <div className={styles.scanScroll}>
          <h1 className={styles.headline}>
            {scanDone
              ? noFindings
                ? t('onboarding.flow.scan.headlineCleanSlate')
                : name
                  ? t('onboarding.flow.scan.headlineFoundNamed', { name })
                  : t('onboarding.flow.scan.headlineFound')
              : name
                ? t('onboarding.flow.scan.headlineScanningNamed', { name })
                : t('onboarding.flow.scan.headlineScanning')}
            <span className={styles.pt}>{scanDone ? '.' : '…'}</span>
          </h1>
          <p className={styles.sub}>
            {scanDone
              ? noFindings
                ? t('onboarding.flow.scan.subCleanSlate')
                : t('onboarding.flow.scan.subFound')
              : t('onboarding.flow.scan.subScanning')}
          </p>

        {!scanDone && (
          <div className={styles.scanwrap}>
            <div className={styles.radar}>
              <span className={styles.radarCore}>
                <Search size={26} />
              </span>
            </div>
            <div className={styles.scanlog}>{t(SCAN_LINE_KEYS[scanLog])}</div>
          </div>
        )}

        {scanDone && !noFindings && (
          <div className={`${styles.block} ${styles.twocol}`}>
            {agentChips.length > 0 && (
              <div className={styles.col}>
                <p className={styles.groupLabel}>{t('onboarding.flow.scan.groupAgents')}</p>
                <div className={styles.chips}>{agentChips.map(renderChip)}</div>
              </div>
            )}
            {modelChips.length > 0 && (
              <div className={styles.col}>
                <p className={styles.groupLabel}>{t('onboarding.flow.scan.groupModels')}</p>
                <div className={styles.chips}>{modelChips.map(renderChip)}</div>
              </div>
            )}
          </div>
        )}

        </div>

        {scanDone && (
          <div className={`${styles.actions} ${styles.actionsPinned}`}>
            <span className={styles.ghost}>{t('onboarding.flow.scan.timeNote')}</span>
            <button type='button' className={styles.btn} onClick={() => setScreen('outcome')}>
              {t('onboarding.flow.scan.continue')} <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>
    );
  }

  if (screen === 'outcome') {
    return (
      <div className={styles.shell}>
        <Header step={1} />
        {wiredWarm ? (
          <>
            <h1 className={styles.headline}>
              {hi(t('onboarding.flow.outcome.wiredHeadline'))}
              <span className={styles.pt}>.</span>
            </h1>
            <p className={styles.sub}>
              {wiredLabel ? t('onboarding.flow.outcome.wired', { label: wiredLabel }) : ''}
              {t('onboarding.flow.outcome.wiredSubTail')}
            </p>
            {wireFailed.length > 0 && (
              <p className={styles.sub}>
                {t('onboarding.flow.outcome.failedNote', {
                  label: failedLabel,
                  was:
                    wireFailed.length === 1
                      ? t('onboarding.flow.outcome.failedWas')
                      : t('onboarding.flow.outcome.failedWere'),
                  them:
                    wireFailed.length === 1
                      ? t('onboarding.flow.outcome.failedIt')
                      : t('onboarding.flow.outcome.failedThem'),
                })}
              </p>
            )}
            <div className={styles.block}>
              <p className={styles.addlabel}>{t('onboarding.flow.outcome.addMore')}</p>
              {keyField(
                async (v) => {
                  if (await connectKey(v)) setColdKey('');
                },
                coldKey,
                setColdKey
              )}
              {keyStatus()}
            </div>
            <div style={{ marginTop: 16 }}>{fluxBanner(FLUX_TITLE, FLUX_BODY)}</div>
          </>
        ) : cliOnly ? (
          <>
            <h1 className={styles.headline}>
              {hi(t('onboarding.flow.outcome.cliHeadline'))}
              <span className={styles.pt}>.</span>
            </h1>
            <p className={styles.sub}>{t('onboarding.flow.outcome.cliSub')}</p>
            <div className={`${styles.block} ${styles.note}`}>
              <span className={styles.nIc}>
                <Info size={17} />
              </span>
              <span>{t('onboarding.flow.outcome.cliNote')}</span>
            </div>
            <div style={{ marginTop: 14 }}>{fluxBanner(FLUX_TITLE, FLUX_BODY)}</div>
          </>
        ) : (
          // no provider connected yet → pick a model
          <>
            <h1 className={styles.headline}>
              {t('onboarding.flow.outcome.coldHeadline')}
              <span className={styles.pt}>.</span>
            </h1>
            <p className={styles.sub}>
              {wireFailed.length > 0
                ? t('onboarding.flow.outcome.coldSubFailed', {
                    label: failedLabel,
                    them:
                      wireFailed.length === 1
                        ? t('onboarding.flow.outcome.failedIt')
                        : t('onboarding.flow.outcome.failedThem'),
                  })
                : t('onboarding.flow.outcome.coldSub')}
            </p>
            <div className={`${styles.block} ${styles.doors}`}>
              <button
                type='button'
                className={`${styles.door} ${styles.doorHero}`}
                onClick={() => void connectFlux()}
                disabled={busy !== null}
              >
                <span className={styles.dIc}>
                  {busy === 'flux' ? <Loader2 size={20} className={styles.spinDark} /> : <FluxMark size={20} />}
                </span>
                <span className={styles.dMain}>
                  <span className={styles.dTitleRow}>
                    <span className={styles.dTitle}>{t('onboarding.flow.outcome.doorFluxTitle')}</span>
                    <span className={styles.rec}>{t('onboarding.flow.outcome.doorFluxRecommended')}</span>
                  </span>
                  <span className={styles.dBody}>{t('onboarding.flow.outcome.doorFluxBody')}</span>
                  <span className={styles.dFoot}>{t('onboarding.flow.outcome.doorFluxFoot')}</span>
                </span>
                <ArrowRight size={18} className={styles.dArrow} />
              </button>
              <div style={{ marginTop: 2 }}>
                {keyField(
                  async (v) => {
                    if (await connectKey(v)) {
                      setColdKey('');
                      setScreen('interests');
                    }
                  },
                  coldKey,
                  setColdKey
                )}
                {keyStatus()}
                <p className={styles.keyhint}>
                  {t('onboarding.flow.outcome.geminiKeyHint')}{' '}
                  <a
                    href='https://aistudio.google.com/apikey'
                    rel='noreferrer'
                    onClick={(e) => {
                      // In the Electron renderer a bare target=_blank anchor opens
                      // nothing (no system browser, no new window), so the link was
                      // dead on desktop (#202). Route through openExternalUrl, which
                      // uses shell.openExternal on desktop and window.open in the
                      // WebUI. href stays for right-click-copy / accessibility.
                      e.preventDefault();
                      void openExternalUrl('https://aistudio.google.com/apikey');
                    }}
                  >
                    {t('onboarding.flow.outcome.geminiKeyLink')}
                  </a>
                </p>
              </div>
            </div>
          </>
        )}

        {errorMsg && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 12 }}>{errorMsg}</p>}
        <div className={styles.grow} />
        <div className={styles.actions}>
          {trueCold ? (
            <button type='button' className={styles.ghost} onClick={() => setScreen('interests')}>
              {t('onboarding.flow.outcome.doLater')}
            </button>
          ) : (
            <span className={styles.ghost}>{t('onboarding.flow.outcome.editableLater')}</span>
          )}
          {!trueCold && (
            <button
              type='button'
              className={styles.btn}
              onClick={() => setScreen('interests')}
              disabled={busy !== null}
            >
              {t('onboarding.flow.outcome.continue')} <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (screen === 'interests') {
    return (
      <div className={styles.shell}>
        <Header step={2} />
        <h1 className={styles.headline}>
          {name ? t('onboarding.flow.interests.headlineNamed', { name }) : t('onboarding.flow.interests.headline')}
          <span className={styles.pt}>?</span>
        </h1>
        <p className={styles.sub}>{t('onboarding.flow.interests.sub')}</p>
        <div className={`${styles.block} ${styles.pgrid}`}>
          {PERSONAS.map((p) => {
            const sel = picks.includes(p.id);
            return (
              <button
                key={p.id}
                type='button'
                className={`${styles.persona} ${sel ? styles.personaSel : ''}`}
                style={accentStyle(p.accent)}
                aria-pressed={sel}
                onClick={() => togglePick(p.id)}
              >
                <span className={styles.pIc}>
                  <p.Icon size={20} />
                </span>
                <span className={styles.pName}>{t(p.labelKey)}</span>
              </button>
            );
          })}
        </div>
        <div className={styles.block}>
          <input
            className={styles.bigfield}
            value={work}
            placeholder={t('onboarding.flow.interests.workPlaceholder')}
            onChange={(e) => setWork(e.target.value)}
          />
        </div>
        <div className={styles.grow} />
        <div className={styles.actions}>
          <button
            type='button'
            className={styles.ghost}
            onClick={() => setScreen('allset')}
            disabled={busy === 'infer'}
          >
            {t('onboarding.flow.interests.skip')}
          </button>
          <button
            type='button'
            className={styles.btn}
            onClick={() => void finishInterests()}
            disabled={busy === 'infer'}
          >
            {busy === 'infer' ? (
              <>
                {t('onboarding.flow.interests.settingUp')} <Loader2 size={15} className={styles.spinDark} />
              </>
            ) : (
              <>
                {t('onboarding.flow.interests.startInChat')} <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // allset
  return (
    <div className={styles.shell}>
      <Header step={2} />
      <div
        className={styles.grow}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <h1 className={styles.headline}>
          {hi(t('onboarding.flow.allset.headline'))}
          <span className={styles.pt}>.</span>
        </h1>
        <p className={styles.sub} style={{ margin: 0 }}>
          {t('onboarding.flow.allset.sub')}
        </p>
        <button
          type='button'
          className={styles.btn}
          style={{ padding: '14px 28px', fontSize: 15, marginTop: 6 }}
          onClick={finishAll}
        >
          {t('onboarding.flow.allset.go')} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default OnboardingFlow;
