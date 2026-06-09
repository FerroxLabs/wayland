/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Tooltip } from '@arco-design/web-react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import type { DetectionResult, FluxMetrics } from '@/common/types/onboarding';
import FluxRouterMark from '@renderer/components/icons/FluxRouterMark';
import { openExternalUrl } from '@renderer/utils/platform';
import { useOnboardingDetection } from '@renderer/hooks/useOnboardingDetection';
import type { SiderTooltipProps } from '@renderer/utils/ui/siderTooltip';

const FLUX_DOWNLOADS_URL = 'https://fluxrouter.ai/download';

/** Minimum routed turns before the data-driven states surface (per V4 mockup). */
const MIN_TURNS_FOR_DATA = 10;

/**
 * The single visual state the widget resolves to. Each maps to one TopZone
 * variant in the V4 mockup. `null` (no state) means the widget renders nothing.
 */
type FluxState =
  | { kind: 'connect'; tone: 'alert' }
  | { kind: 'install'; tone: 'warning' }
  | { kind: 'ollama'; tone: 'warning'; pct: number }
  | { kind: 'wired'; tone: 'ok'; metrics: FluxMetrics };

/** Narrow an arbitrary IPC payload into a `FluxMetrics`, or `null` if invalid. */
function parseFluxMetrics(raw: unknown): FluxMetrics | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const totalTurns = typeof obj.totalTurns === 'number' ? obj.totalTurns : null;
  const hist = obj.histogram as Record<string, unknown> | undefined;
  if (totalTurns === null || !hist || typeof hist !== 'object') return null;
  const { h, s, o } = hist;
  if (typeof h !== 'number' || typeof s !== 'number' || typeof o !== 'number') return null;
  return {
    totalTurns,
    histogram: { h, s, o },
    savings: typeof obj.savings === 'string' ? obj.savings : undefined,
    ollamaSharePct: typeof obj.ollamaSharePct === 'number' ? obj.ollamaSharePct : undefined,
  };
}

/**
 * Resolve the widget state from detection + metrics. Returns `null` when
 * nothing is actionable and there is no data to show (the widget then hides).
 *
 * Precedence mirrors the V4 mockup:
 *  1. Flux not connected, but the user has keys/CLIs  → connect nudge (t=0).
 *  2. Flux connected, but no Flux Desktop daemon      → install nudge (t=0).
 *  3. Ollama running and carrying most turns           → fallback nudge (data-gated).
 *  4. Flux connected + daemon + metrics               → wired stat line (data-gated).
 */
function resolveState(detection: DetectionResult | null, metrics: FluxMetrics | null): FluxState | null {
  if (!detection) return null;

  const hasLeverage = detection.envKeys.length > 0 || detection.clis.length > 0;

  // 1. Not connected, but there is something worth routing → connect.
  if (!detection.fluxConnected) {
    return hasLeverage ? { kind: 'connect', tone: 'alert' } : null;
  }

  // 2. Connected but the desktop daemon is not wiring the CLIs → install.
  if (!detection.fluxDesktop.running) {
    return { kind: 'install', tone: 'warning' };
  }

  // From here Flux is connected AND the daemon is running. Data-gated states
  // only surface once there are real metrics with >= MIN_TURNS_FOR_DATA turns.
  if (!metrics || metrics.totalTurns < MIN_TURNS_FOR_DATA) return null;

  // 3. Local Ollama is carrying most of the load → offer a fallback config.
  if (detection.ollama.running && typeof metrics.ollamaSharePct === 'number' && metrics.ollamaSharePct >= 50) {
    return { kind: 'ollama', tone: 'warning', pct: metrics.ollamaSharePct };
  }

  // 4. Fully wired → live stat line.
  return { kind: 'wired', tone: 'ok', metrics };
}

type SiderFluxRouterEntryProps = {
  isMobile: boolean;
  collapsed: boolean;
  siderTooltipProps: SiderTooltipProps;
  onClick?: () => void;
};

/**
 * Flux Router status widget for the sidebar TopZone.
 *
 * One element, four states (connect / install / ollama / wired). Reads live
 * detection + the Flux Desktop daemon metrics, shows ONE next action, and a
 * coloured pulse dot signalling urgency (orange = action, yellow = nudge,
 * green = wired). Renders `null` when nothing is actionable and no data exists.
 *
 * Matches the SiderMemoryEntry / SiderScheduledEntry TopZone pattern.
 */
const SiderFluxRouterEntry: React.FC<SiderFluxRouterEntryProps> = ({
  isMobile,
  collapsed,
  siderTooltipProps,
  onClick,
}) => {
  const { t } = useTranslation();
  const { detection } = useOnboardingDetection();
  const [metrics, setMetrics] = useState<FluxMetrics | null>(null);

  // Fetch Flux Desktop metrics on mount once the daemon is known to be running.
  // Mirrors SiderMemoryEntry's IPC-fetch-on-mount + cancelled-guard pattern.
  useEffect(() => {
    if (!detection?.fluxDesktop.running) {
      setMetrics(null);
      return;
    }
    let cancelled = false;
    const api = (window as unknown as { electronAPI?: { onboardingFluxMetrics?: () => Promise<unknown | null> } })
      .electronAPI;
    if (!api?.onboardingFluxMetrics) return;
    void api
      .onboardingFluxMetrics()
      .then((raw) => {
        if (!cancelled) setMetrics(parseFluxMetrics(raw));
      })
      .catch(() => {
        if (!cancelled) setMetrics(null);
      });
    return () => {
      cancelled = true;
    };
  }, [detection?.fluxDesktop.running]);

  const state = resolveState(detection, metrics);
  if (!state) return null;

  // Pulse dot colour by tone: alert = orange (action), warning = yellow
  // (nudge), ok = green (wired). Uses semantic tokens with safe fallbacks.
  const pulseColor =
    state.tone === 'alert'
      ? 'var(--orange, #FF7A45)'
      : state.tone === 'warning'
        ? 'var(--warning, #FAAD14)'
        : 'var(--success, #00B42A)';

  const label = t('sider.fluxRouter.label');

  let body: string;
  let action: string;
  let sub: string | undefined;
  switch (state.kind) {
    case 'connect':
      body = t('sider.fluxRouter.connect.body');
      action = t('sider.fluxRouter.connect.action');
      break;
    case 'install':
      body = t('sider.fluxRouter.install.body');
      action = t('sider.fluxRouter.install.action');
      sub = t('sider.fluxRouter.install.sub');
      break;
    case 'ollama':
      body = t('sider.fluxRouter.ollama.body', { pct: state.pct });
      action = t('sider.fluxRouter.ollama.action');
      break;
    case 'wired': {
      const { h, s, o } = state.metrics.histogram;
      body = t('sider.fluxRouter.wired.body', { h, s, o });
      action = t('sider.fluxRouter.wired.action');
      sub = state.metrics.savings;
      break;
    }
  }

  const handleClick = (): void => {
    if (state.kind === 'install') {
      void openExternalUrl(FLUX_DOWNLOADS_URL);
      return;
    }
    // connect / ollama / wired all route into Settings → Models (Flux Router).
    onClick?.();
  };

  if (collapsed) {
    const tooltipContent = `${label}: ${body}`;
    return (
      <Tooltip {...siderTooltipProps} content={tooltipContent} position='right'>
        <div
          className={classNames(
            'w-full h-40px flex items-center justify-center cursor-pointer transition-colors rd-8px text-t-primary relative',
            'hover:bg-fill-3 active:bg-fill-4'
          )}
          onClick={handleClick}
          data-testid='sider-flux-router-entry'
        >
          <FluxRouterMark size={20} color='currentColor' className='block leading-none shrink-0' />
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: pulseColor,
            }}
            aria-label={action}
          />
        </div>
      </Tooltip>
    );
  }

  // The `connect` state is an always-on nudge (shows whenever Flux isn't
  // connected and the user has keys/CLIs). Rendered as a full status card it
  // "sits there rudely", so collapse it to a single quiet nav-style line - just
  // the icon + action. The data-driven states (install/ollama/wired) are
  // transient and keep the fuller treatment.
  if (state.kind === 'connect') {
    return (
      <div
        className={classNames(
          'box-border w-full flex items-center gap-8px px-10px py-8px rd-0.5rem cursor-pointer shrink-0 transition-all text-t-secondary',
          isMobile && 'sider-action-btn-mobile',
          'hover:bg-fill-3 active:bg-fill-4'
        )}
        onClick={handleClick}
        data-testid='sider-flux-router-entry'
      >
        <FluxRouterMark size={18} color='currentColor' className='block leading-none shrink-0' />
        <span className='collapsed-hidden text-t-secondary text-13px leading-20px'>{action} →</span>
      </div>
    );
  }

  return (
    <div
      className={classNames(
        'box-border w-full flex flex-col gap-4px px-10px py-8px rd-0.5rem cursor-pointer shrink-0 transition-all text-t-primary',
        isMobile && 'sider-action-btn-mobile',
        'hover:bg-fill-3 active:bg-fill-4'
      )}
      onClick={handleClick}
      data-testid='sider-flux-router-entry'
    >
      <div className='flex items-center gap-8px'>
        <span
          style={{ width: 8, height: 8, borderRadius: '50%', background: pulseColor }}
          className='shrink-0'
          aria-hidden='true'
        />
        <span className='collapsed-hidden text-t-primary text-13px font-semibold leading-20px'>{label}</span>
      </div>
      <span className='collapsed-hidden text-t-secondary text-12px leading-18px'>{body}</span>
      <span className='collapsed-hidden text-primary text-12px font-medium leading-18px'>{action} →</span>
      {sub && <span className='collapsed-hidden text-t-3 text-11px leading-16px'>{sub}</span>}
    </div>
  );
};

export default SiderFluxRouterEntry;
