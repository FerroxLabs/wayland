/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  consumeFluxRoutingEvidence,
  inspectFluxRoutingCapability,
  type FluxRoutingCorrelation,
  type FluxRoutingDecision,
} from '@/common/routingEvidence';

export type FluxRoutingEvidenceSurface = 'desktop' | 'web-cloud';

export type FluxRoutingClaimPermissions = {
  routeExplanations: boolean;
  providerAttempts: boolean;
  costClaims: boolean;
};

export type FluxRoutingEvidenceSnapshot = {
  surface: FluxRoutingEvidenceSurface;
  decision: FluxRoutingDecision;
  claims: FluxRoutingClaimPermissions;
};

export type FluxRoutingEvidenceReplay = {
  capability: unknown;
  events: unknown[];
  expectedCorrelation: FluxRoutingCorrelation;
  now?: Date;
};

const DISABLED_CLAIMS: FluxRoutingClaimPermissions = {
  routeExplanations: false,
  providerAttempts: false,
  costClaims: false,
};

function noFlux(reason: string): FluxRoutingDecision {
  return { profile: 'no_flux', reason, events: [], summary: null };
}

/**
 * Atomic process-side boundary for producer-owned Flux evidence.
 *
 * It intentionally does not fetch from a guessed endpoint. The merged v1
 * producer contract defines serialization/replay but no live transport. Until a
 * trusted backend supplies both a current capability response and one complete
 * correlated stream, every surface remains in the explicit no_flux profile.
 */
export class FluxRoutingEvidenceAdapter {
  private snapshot: FluxRoutingEvidenceSnapshot;

  constructor(readonly surface: FluxRoutingEvidenceSurface) {
    this.snapshot = {
      surface,
      decision: noFlux('capability_absent'),
      claims: { ...DISABLED_CLAIMS },
    };
  }

  current(): FluxRoutingEvidenceSnapshot {
    return structuredClone(this.snapshot);
  }

  replay(input: FluxRoutingEvidenceReplay): FluxRoutingEvidenceSnapshot {
    const capability = inspectFluxRoutingCapability(input.capability, input.now);
    if (capability.profile === 'no_flux') {
      return this.replace(noFlux(capability.reason));
    }

    const decision = consumeFluxRoutingEvidence(input.events, input.expectedCorrelation);
    if (decision.profile === 'no_flux') return this.replace(decision);

    return this.replace(decision, {
      routeExplanations: decision.summary.route !== null,
      providerAttempts: decision.summary.attempts.length > 0,
      costClaims: decision.summary.cost !== null,
    });
  }

  disable(reason = 'capability_absent'): FluxRoutingEvidenceSnapshot {
    return this.replace(noFlux(reason));
  }

  private replace(
    decision: FluxRoutingDecision,
    claims: FluxRoutingClaimPermissions = DISABLED_CLAIMS
  ): FluxRoutingEvidenceSnapshot {
    this.snapshot = {
      surface: this.surface,
      decision,
      claims: { ...claims },
    };
    return this.current();
  }
}

let desktopAdapter: FluxRoutingEvidenceAdapter | null = null;
let webCloudAdapter: FluxRoutingEvidenceAdapter | null = null;

export function initDesktopFluxRoutingEvidenceAdapter(): FluxRoutingEvidenceAdapter {
  desktopAdapter = new FluxRoutingEvidenceAdapter('desktop');
  return desktopAdapter;
}

export function initWebCloudFluxRoutingEvidenceAdapter(): FluxRoutingEvidenceAdapter {
  webCloudAdapter = new FluxRoutingEvidenceAdapter('web-cloud');
  return webCloudAdapter;
}

export function getDesktopFluxRoutingEvidenceAdapter(): FluxRoutingEvidenceAdapter | null {
  return desktopAdapter;
}

export function getWebCloudFluxRoutingEvidenceAdapter(): FluxRoutingEvidenceAdapter | null {
  return webCloudAdapter;
}
