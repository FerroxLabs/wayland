/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import {
  CONSTITUTION_CLASSIC_RECOVERY_DTO_CONTRACT,
  type ConstitutionClassicRecoveryAction,
  type ConstitutionClassicRecoveryDecisionRequest,
  type ConstitutionClassicRecoveryErrorCode,
  type ConstitutionClassicRecoveryItem,
  type ConstitutionClassicRecoveryMetadataSuccess,
  type ConstitutionClassicRecoveryMutationSuccess,
  type ConstitutionClassicRecoveryResumeRequest,
  type ConstitutionClassicRecoveryState,
} from '../../../common/types/constitutionRecovery';
import { canonicalizeRestrictedJson } from '../../utils/restrictedCanonicalJson';
import {
  ConstitutionClassicRecoveryAuthorityError,
  type ConstitutionClassicRecoveryOperationAuthority,
  type ConstitutionClassicRecoveryOperationRecord,
} from './constitutionClassicRecoveryAuthority';
import {
  constitutionRestorePrincipalBindingSha256,
  type ConstitutionRestorePrincipalBinding,
} from './constitutionArchiveRestoreAuthority';
import {
  inspectClassicConstitutionRecovery,
  preserveClassicConstitutionPromotion,
  promoteClassicConstitutionChanges,
  resolveClassicPromotionJournalRoot,
  resumeClassicConstitutionPromotion,
  type ClassicAuthorityEnvelopeCodec,
  type ClassicConstitutionPromotionService,
  type ClassicRecoveryInspection,
} from '../recovery/classicConstitutionPromotion';
import {
  type ClassicRecoveryLocatorAuthority,
  type ClassicRecoveryLocatorEvent,
} from '../recovery/classicRecoveryLocator';

const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/;

export type ConstitutionClassicDestructiveAuthorizer = (
  principalBinding: ConstitutionRestorePrincipalBinding,
  password: string
) => Promise<void>;

type ServiceDependencies = Readonly<{
  authorityEnvelopePath: string;
  destinationAuthority: string;
  codec: ClassicAuthorityEnvelopeCodec;
  promotionService: ClassicConstitutionPromotionService;
  operationAuthority: ConstitutionClassicRecoveryOperationAuthority;
  authorizeDestructivePassword?: ConstitutionClassicDestructiveAuthorizer;
  acquireQuiescence: () => Promise<() => Promise<void> | void>;
  createId?: () => string;
  locatorBinding?: Readonly<{
    authority: ClassicRecoveryLocatorAuthority;
    activation: ClassicRecoveryLocatorEvent;
  }>;
}>;

export type ConstitutionClassicRecoveryLocatorDependencies = Omit<
  ServiceDependencies,
  'authorityEnvelopePath' | 'codec' | 'locatorBinding'
> &
  Readonly<{
    locatorAuthority: ClassicRecoveryLocatorAuthority;
  }>;

type RecoverySnapshot = Readonly<{
  state: ConstitutionClassicRecoveryState;
  recoveryRevision: string;
  projectionReceiptSha256: `sha256:${string}`;
  promotionId: string | null;
  journalHeadSha256: `sha256:${string}` | null;
  items: readonly ConstitutionClassicRecoveryItem[];
  rescue: ConstitutionClassicRecoveryMetadataSuccess['data']['rescue'];
  allowedActions: readonly ConstitutionClassicRecoveryAction[];
}>;

export class ConstitutionClassicRecoveryServiceError extends Error {
  constructor(
    readonly code: ConstitutionClassicRecoveryErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'ConstitutionClassicRecoveryServiceError';
  }
}

function sha256Canonical(value: unknown): `sha256:${string}` {
  return `sha256:${createHash('sha256').update(canonicalizeRestrictedJson(value)).digest('hex')}`;
}

function mapAuthorityError(error: ConstitutionClassicRecoveryAuthorityError): ConstitutionClassicRecoveryServiceError {
  const code: ConstitutionClassicRecoveryErrorCode =
    error.code === 'AUTHORITY_BUSY' ? 'CONFLICT' : error.code === 'INVALID_REQUEST' ? 'INVALID_REQUEST' : error.code;
  return new ConstitutionClassicRecoveryServiceError(code, 'Classic recovery operation could not be accepted.');
}

function mapServiceError(error: unknown): ConstitutionClassicRecoveryServiceError {
  if (error instanceof ConstitutionClassicRecoveryServiceError) return error;
  if (error instanceof ConstitutionClassicRecoveryAuthorityError) return mapAuthorityError(error);
  if (error instanceof SyntaxError) {
    return new ConstitutionClassicRecoveryServiceError(
      'INTEGRITY_FAILURE',
      'Classic recovery evidence failed authentication.'
    );
  }
  const code =
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' ? error.code : '';
  if (code === 'AUTH_REQUIRED' || code === 'AUTH_FAILED' || code === 'LOCKED_OUT') {
    return new ConstitutionClassicRecoveryServiceError(code, 'Fresh destructive authentication failed.');
  }
  const text = error instanceof Error ? error.message : '';
  if (/unsupported/i.test(text)) {
    return new ConstitutionClassicRecoveryServiceError(
      'UNSUPPORTED_CHANGE',
      'Classic recovery contains an unsupported change.'
    );
  }
  if (/vault|key unavailable|recovery key/i.test(text)) {
    return new ConstitutionClassicRecoveryServiceError(
      'RECOVERY_KEY_UNAVAILABLE',
      'Classic recovery authentication is unavailable.'
    );
  }
  if (/conflict|stale|changed|already owns/i.test(text)) {
    return new ConstitutionClassicRecoveryServiceError('CONFLICT', 'Classic recovery facts changed.');
  }
  if (/authentic|integrity|canonical|digest|identity|journal|rescue|authority/i.test(text)) {
    return new ConstitutionClassicRecoveryServiceError(
      'INTEGRITY_FAILURE',
      'Classic recovery evidence failed authentication.'
    );
  }
  return new ConstitutionClassicRecoveryServiceError('NATIVE_FAILURE', 'Classic recovery could not complete.');
}

function actionsForState(state: ConstitutionClassicRecoveryState): readonly ConstitutionClassicRecoveryAction[] {
  switch (state) {
    case 'awaiting-decision':
      return ['promote', 'keep-v2', 'discard'];
    case 'partial':
      return ['keep-v2', 'resume'];
    case 'conflicted':
      return ['keep-v2'];
    default:
      return [];
  }
}

function itemsFromInspection(inspection: ClassicRecoveryInspection): readonly ConstitutionClassicRecoveryItem[] {
  const journal = inspection.journal;
  if (!journal) {
    return inspection.delta.items.map(
      (item): ConstitutionClassicRecoveryItem => ({
        objectId: item.objectId,
        operation: item.operation,
        state: 'pending',
        resultRevision: null,
        receiptId: null,
        conflictCode: null,
      })
    );
  }
  if (journal.items.length > 0) {
    return journal.items.map((item) => ({
      objectId: item.objectId,
      operation: item.operation,
      state: item.state,
      resultRevision: item.resultRevision,
      receiptId: item.receiptId,
      conflictCode: item.conflictCode,
    }));
  }
  return inspection.delta.items.map(
    (item): ConstitutionClassicRecoveryItem => ({
      objectId: item.objectId,
      operation: item.operation,
      state: journal.state === 'conflicted' ? ('conflicted' as const) : ('pending' as const),
      resultRevision: null,
      receiptId: null,
      conflictCode: journal.state === 'conflicted' ? ('STALE_DESTINATION' as const) : null,
    })
  );
}

function stateFromInspection(inspection: ClassicRecoveryInspection): ConstitutionClassicRecoveryState {
  if (!inspection.journal) return inspection.delta.items.length === 0 ? 'no-change' : 'awaiting-decision';
  if (inspection.journal.state === 'prepared') {
    throw new ConstitutionClassicRecoveryServiceError(
      'CONFLICT',
      'Classic recovery requires operation replay before inventory.'
    );
  }
  return inspection.journal.state;
}

function snapshotFromInspection(inspection: ClassicRecoveryInspection): RecoverySnapshot {
  const state = stateFromInspection(inspection);
  const items = itemsFromInspection(inspection).toSorted((left, right) =>
    left.objectId < right.objectId ? -1 : left.objectId > right.objectId ? 1 : 0
  );
  const rescueVisible = state === 'applying' || state === 'partial' || state === 'conflicted' || state === 'rescued';
  const rescue =
    rescueVisible && inspection.rescue
      ? {
          rescueId: inspection.rescue.rescueId,
          sha256: inspection.rescue.envelopeSha256,
          bytes: inspection.rescue.bytes,
          createdAt: inspection.rescue.createdAt,
        }
      : null;
  if (rescueVisible && !rescue) {
    throw new ConstitutionClassicRecoveryServiceError(
      'INTEGRITY_FAILURE',
      'Classic recovery is missing its authenticated local rescue.'
    );
  }
  const recoveryRevision = sha256Canonical({
    contract: CONSTITUTION_CLASSIC_RECOVERY_DTO_CONTRACT,
    projectionReceiptSha256: inspection.projectionAuthoritySha256,
    promotionId: inspection.promotionId,
    journalHeadSha256: inspection.journalHeadSha256,
    state,
    items,
    rescue,
  });
  return {
    state,
    recoveryRevision,
    projectionReceiptSha256: inspection.projectionAuthoritySha256,
    promotionId: inspection.promotionId,
    journalHeadSha256: inspection.journalHeadSha256,
    items,
    rescue,
    allowedActions: actionsForState(state),
  };
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function isAuthenticatedOrphanBarrier(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message === 'Classic promotion journal requires explicit reconciliation before metadata inventory.'
  );
}

export class ConstitutionClassicRecoveryService {
  private readonly challengeByPrincipal = new Map<string, Readonly<{ revision: string; challenge: string }>>();
  private readonly createId: () => string;

  constructor(private readonly dependencies: ServiceDependencies) {
    this.createId = dependencies.createId ?? randomUUID;
  }

  /** Resolve and authenticate the sole active preparation without accepting any caller path. */
  static async fromLocator(
    dependencies: ConstitutionClassicRecoveryLocatorDependencies
  ): Promise<ConstitutionClassicRecoveryService | null> {
    const locatorSnapshot = await dependencies.locatorAuthority.snapshot();
    const selection = locatorSnapshot.active ?? locatorSnapshot.events.at(-1) ?? null;
    if (!selection) return null;
    const layout = await dependencies.locatorAuthority.layout();
    const codec = await dependencies.locatorAuthority.createRecordCodec(selection.preparationId);
    const service = new ConstitutionClassicRecoveryService({
      ...dependencies,
      authorityEnvelopePath: path.join(layout.recordsRoot, selection.preparationId, 'projection-authority.sealed'),
      codec,
      locatorBinding: { authority: dependencies.locatorAuthority, activation: selection },
    });
    const recovery = snapshotFromInspection(await service.inspect());
    if (selection.kind === 'terminal') {
      if (recovery.state !== selection.terminalState) {
        throw new ConstitutionClassicRecoveryServiceError(
          'INTEGRITY_FAILURE',
          'Classic recovery terminal locator contradicts its authenticated projection state.'
        );
      }
      return selection.terminalState === 'no-change' ? null : service;
    }
    if (recovery.state !== 'no-change') return service;
    await dependencies.locatorAuthority.terminal({
      preparationId: selection.preparationId,
      projectionAuthoritySha256: selection.projectionAuthoritySha256,
      terminalState: 'no-change',
      operationReceiptId: null,
    });
    return null;
  }

  private async assertLocatorBinding(): Promise<void> {
    const binding = this.dependencies.locatorBinding;
    if (!binding) return;
    const snapshot = await binding.authority.snapshot();
    const current = snapshot.active;
    const latest = snapshot.events.at(-1) ?? null;
    const expected = binding.activation;
    const activeMatches =
      current?.preparationId === expected.preparationId &&
      current.projectionAuthoritySha256 === expected.projectionAuthoritySha256;
    const terminalMatches =
      !current &&
      latest?.kind === 'terminal' &&
      latest.preparationId === expected.preparationId &&
      latest.projectionAuthoritySha256 === expected.projectionAuthoritySha256;
    if (!activeMatches && !terminalMatches) {
      throw new ConstitutionClassicRecoveryServiceError('CONFLICT', 'Classic recovery activation changed before use.');
    }
  }

  private async inspectRaw(promotionId?: string): Promise<ClassicRecoveryInspection> {
    await this.assertLocatorBinding();
    return inspectClassicConstitutionRecovery({
      authorityEnvelopePath: this.dependencies.authorityEnvelopePath,
      codec: this.dependencies.codec,
      ...(promotionId ? { promotionId } : {}),
    });
  }

  private async inspect(promotionId?: string): Promise<ClassicRecoveryInspection> {
    try {
      return await this.inspectRaw(promotionId);
    } catch (error) {
      if (error instanceof ConstitutionClassicRecoveryServiceError) throw error;
      const message = error instanceof Error ? error.message : '';
      if (/vault|key unavailable|recovery key/i.test(message)) {
        throw new ConstitutionClassicRecoveryServiceError(
          'RECOVERY_KEY_UNAVAILABLE',
          'Classic recovery authentication is unavailable.'
        );
      }
      throw new ConstitutionClassicRecoveryServiceError(
        'INTEGRITY_FAILURE',
        'Classic recovery evidence failed authentication.'
      );
    }
  }

  private challenge(principalBinding: ConstitutionRestorePrincipalBinding, snapshot: RecoverySnapshot): string | null {
    if (snapshot.state !== 'awaiting-decision') return null;
    const principal = constitutionRestorePrincipalBindingSha256(principalBinding);
    const existing = this.challengeByPrincipal.get(principal);
    if (existing?.revision === snapshot.recoveryRevision) return existing.challenge;
    const challenge = `discard:${sha256Canonical({
      principal,
      revision: snapshot.recoveryRevision,
      nonce: randomUUID(),
    }).slice('sha256:'.length)}`;
    this.challengeByPrincipal.set(principal, { revision: snapshot.recoveryRevision, challenge });
    return challenge;
  }

  async metadata(
    principalBinding: ConstitutionRestorePrincipalBinding
  ): Promise<ConstitutionClassicRecoveryMetadataSuccess> {
    try {
      constitutionRestorePrincipalBindingSha256(principalBinding);
      const snapshot = snapshotFromInspection(await this.inspect());
      return {
        success: true,
        data: {
          contract: CONSTITUTION_CLASSIC_RECOVERY_DTO_CONTRACT,
          recoveryRevision: snapshot.recoveryRevision,
          projectionReceiptSha256: snapshot.projectionReceiptSha256,
          promotionId: snapshot.promotionId,
          journalHeadSha256: snapshot.journalHeadSha256,
          state: snapshot.state,
          items: snapshot.items,
          rescue: snapshot.rescue,
          allowedActions: snapshot.allowedActions,
          discardChallenge: this.challenge(principalBinding, snapshot),
        },
      };
    } catch (error) {
      throw mapServiceError(error);
    }
  }

  private assertCurrentFacts(
    snapshot: RecoverySnapshot,
    request: Pick<ConstitutionClassicRecoveryDecisionRequest, 'projectionReceiptSha256' | 'expectedRecoveryRevision'>
  ): void {
    if (snapshot.projectionReceiptSha256 !== request.projectionReceiptSha256) {
      throw new ConstitutionClassicRecoveryServiceError('CONFLICT', 'Classic projection receipt no longer matches.');
    }
    if (snapshot.recoveryRevision !== request.expectedRecoveryRevision) {
      throw new ConstitutionClassicRecoveryServiceError(
        'STALE_RECOVERY_REVISION',
        'Classic recovery revision is stale.'
      );
    }
  }

  private mutationSuccess(operationId: string, snapshot: RecoverySnapshot): ConstitutionClassicRecoveryMutationSuccess {
    const receiptId = `classic-recovery:${sha256Canonical({
      operationId,
      recoveryRevision: snapshot.recoveryRevision,
      promotionId: snapshot.promotionId,
      journalHeadSha256: snapshot.journalHeadSha256,
      state: snapshot.state,
      items: snapshot.items,
      rescue: snapshot.rescue,
    }).slice('sha256:'.length)}`;
    return {
      success: true,
      data: {
        status: snapshot.state,
        operationId,
        recoveryRevision: snapshot.recoveryRevision,
        promotionId: snapshot.promotionId,
        journalHeadSha256: snapshot.journalHeadSha256,
        receiptId,
        items: snapshot.items,
        rescue: snapshot.rescue,
      },
    };
  }

  private async publishTerminal(
    result: ConstitutionClassicRecoveryMutationSuccess
  ): Promise<ConstitutionClassicRecoveryMutationSuccess> {
    const binding = this.dependencies.locatorBinding;
    if (!binding) return result;
    const terminalState =
      result.data.status === 'committed'
        ? ('committed' as const)
        : result.data.status === 'rescued'
          ? ('rescued' as const)
          : result.data.status === 'discarded'
            ? ('discarded' as const)
            : null;
    if (!terminalState) return result;
    await binding.authority.terminal({
      eventId: result.data.operationId,
      preparationId: binding.activation.preparationId,
      projectionAuthoritySha256: binding.activation.projectionAuthoritySha256,
      terminalState,
      operationReceiptId: result.data.receiptId,
    });
    return result;
  }

  private async completeDecision(
    record: ConstitutionClassicRecoveryOperationRecord
  ): Promise<ConstitutionClassicRecoveryMutationSuccess> {
    let inspection: ClassicRecoveryInspection | null = null;
    try {
      inspection = await this.inspectRaw();
    } catch (error) {
      if (!isAuthenticatedOrphanBarrier(error)) throw error;
      // Only a claimed, authenticated orphan may enter journal reconciliation.
      // Locator drift and every other integrity/authentication failure remain fatal.
    }
    if (inspection?.journal) {
      if (inspection.promotionId !== record.promotionId) {
        throw new ConstitutionClassicRecoveryServiceError(
          'OPERATION_ID_CONFLICT',
          'Classic recovery operation is bound to another promotion.'
        );
      }
      if (
        record.decision === 'keep-v2' &&
        (inspection.journal.state === 'partial' || inspection.journal.state === 'conflicted')
      ) {
        await preserveClassicConstitutionPromotion({
          journalRoot: inspection.journalRoot!,
          dependencies: { codec: this.dependencies.codec },
        });
      } else if (inspection.journal.state === 'prepared' || inspection.journal.state === 'applying') {
        if (record.decision !== 'promote') {
          throw new ConstitutionClassicRecoveryServiceError(
            'INTEGRITY_FAILURE',
            'Classic recovery decision conflicts with its prepared journal.'
          );
        }
        await resumeClassicConstitutionPromotion({
          journalRoot: inspection.journalRoot!,
          service: this.dependencies.promotionService,
          dependencies: {
            codec: this.dependencies.codec,
            acquireQuiescence: this.dependencies.acquireQuiescence,
          },
        });
      }
    } else {
      if (inspection) {
        await this.executeFreshDecision(record);
      } else {
        const journalRoot = await resolveClassicPromotionJournalRoot({
          authorityEnvelopePath: this.dependencies.authorityEnvelopePath,
          codec: this.dependencies.codec,
          promotionId: record.promotionId,
        });
        await resumeClassicConstitutionPromotion({
          journalRoot,
          service: this.dependencies.promotionService,
          dependencies: {
            codec: this.dependencies.codec,
            acquireQuiescence: this.dependencies.acquireQuiescence,
          },
        });
      }
    }
    const completed = snapshotFromInspection(await this.inspect(record.promotionId));
    return this.mutationSuccess(record.operationId, completed);
  }

  private async executeFreshDecision(record: ConstitutionClassicRecoveryOperationRecord): Promise<void> {
    await promoteClassicConstitutionChanges({
      authorityEnvelopePath: this.dependencies.authorityEnvelopePath,
      destinationAuthority: this.dependencies.destinationAuthority,
      service: this.dependencies.promotionService,
      decision:
        record.decision === 'promote'
          ? { kind: 'promote' }
          : record.decision === 'keep-v2'
            ? { kind: 'keep-v2' }
            : { kind: 'confirmed-discard', confirmedObjectIds: record.confirmedObjectIds },
      dependencies: {
        codec: this.dependencies.codec,
        createId: () => record.promotionId,
        acquireQuiescence: this.dependencies.acquireQuiescence,
      },
    });
  }

  async decide(
    principalBinding: ConstitutionRestorePrincipalBinding,
    request: ConstitutionClassicRecoveryDecisionRequest,
    authorizeDestructivePassword = this.dependencies.authorizeDestructivePassword
  ): Promise<ConstitutionClassicRecoveryMutationSuccess> {
    try {
      const existing = this.dependencies.operationAuthority.lookup(request.operationId, principalBinding);
      if (existing?.state === 'committed') return await this.publishTerminal(existing.result!);
      const decision = request.decision.kind;
      const confirmedObjectIds = request.decision.kind === 'discard' ? request.decision.confirmedObjectIds : [];
      if (existing) {
        this.dependencies.operationAuthority.reserve({
          operationId: request.operationId,
          principalBinding,
          kind: 'decision',
          decision,
          projectionReceiptSha256: request.projectionReceiptSha256,
          expectedRecoveryRevision: request.expectedRecoveryRevision,
          confirmedObjectIds,
          promotionId: existing.promotionId,
          expectedJournalHeadSha256: null,
        });
        if (!authorizeDestructivePassword) {
          throw new ConstitutionClassicRecoveryServiceError(
            'AUTH_REQUIRED',
            'Fresh destructive authentication is required.'
          );
        }
        await authorizeDestructivePassword(principalBinding, request.password);
        return await this.publishTerminal(
          await this.dependencies.operationAuthority.dispatch(request.operationId, principalBinding, (marked) =>
            this.completeDecision(marked)
          )
        );
      }
      const snapshot = snapshotFromInspection(await this.inspect());
      this.assertCurrentFacts(snapshot, request);
      if (!snapshot.allowedActions.includes(decision)) {
        throw new ConstitutionClassicRecoveryServiceError('CONFLICT', 'Classic recovery decision is not available.');
      }
      if (request.decision.kind === 'discard') {
        const challenge = this.challenge(principalBinding, snapshot);
        if (!challenge || request.decision.confirmationText !== challenge) {
          throw new ConstitutionClassicRecoveryServiceError('CONFLICT', 'Classic discard confirmation is stale.');
        }
        if (
          !sameStrings(
            confirmedObjectIds,
            snapshot.items.map((item) => item.objectId)
          )
        ) {
          throw new ConstitutionClassicRecoveryServiceError('CONFLICT', 'Classic discard object confirmation changed.');
        }
      }
      if (!authorizeDestructivePassword) {
        throw new ConstitutionClassicRecoveryServiceError(
          'AUTH_REQUIRED',
          'Fresh destructive authentication is required.'
        );
      }
      await authorizeDestructivePassword(principalBinding, request.password);
      const promotionId = snapshot.promotionId ?? existing?.promotionId ?? this.createId();
      this.dependencies.operationAuthority.reserve({
        operationId: request.operationId,
        principalBinding,
        kind: 'decision',
        decision,
        projectionReceiptSha256: request.projectionReceiptSha256,
        expectedRecoveryRevision: request.expectedRecoveryRevision,
        confirmedObjectIds,
        promotionId,
        expectedJournalHeadSha256: null,
      });
      return await this.publishTerminal(
        await this.dependencies.operationAuthority.dispatch(request.operationId, principalBinding, (marked) =>
          this.completeDecision(marked)
        )
      );
    } catch (error) {
      throw mapServiceError(error);
    }
  }

  private async completeResume(
    record: ConstitutionClassicRecoveryOperationRecord
  ): Promise<ConstitutionClassicRecoveryMutationSuccess> {
    const journalRoot = await resolveClassicPromotionJournalRoot({
      authorityEnvelopePath: this.dependencies.authorityEnvelopePath,
      codec: this.dependencies.codec,
      promotionId: record.promotionId,
    });
    await resumeClassicConstitutionPromotion({
      journalRoot,
      service: this.dependencies.promotionService,
      dependencies: {
        codec: this.dependencies.codec,
        acquireQuiescence: this.dependencies.acquireQuiescence,
      },
    });
    return this.mutationSuccess(record.operationId, snapshotFromInspection(await this.inspect(record.promotionId)));
  }

  async resume(
    principalBinding: ConstitutionRestorePrincipalBinding,
    request: ConstitutionClassicRecoveryResumeRequest,
    authorizeDestructivePassword = this.dependencies.authorizeDestructivePassword
  ): Promise<ConstitutionClassicRecoveryMutationSuccess> {
    try {
      const existing = this.dependencies.operationAuthority.lookup(request.operationId, principalBinding);
      if (existing?.state === 'committed') return await this.publishTerminal(existing.result!);
      if (existing) {
        this.dependencies.operationAuthority.reserve({
          operationId: request.operationId,
          principalBinding,
          kind: 'resume',
          decision: 'resume',
          projectionReceiptSha256: request.projectionReceiptSha256,
          expectedRecoveryRevision: request.expectedRecoveryRevision,
          confirmedObjectIds: [],
          promotionId: request.promotionId,
          expectedJournalHeadSha256: request.expectedJournalHeadSha256,
        });
        if (!authorizeDestructivePassword) {
          throw new ConstitutionClassicRecoveryServiceError(
            'AUTH_REQUIRED',
            'Fresh destructive authentication is required.'
          );
        }
        await authorizeDestructivePassword(principalBinding, request.password);
        return await this.publishTerminal(
          await this.dependencies.operationAuthority.dispatch(request.operationId, principalBinding, (marked) =>
            this.completeResume(marked)
          )
        );
      }
      const snapshot = snapshotFromInspection(await this.inspect(request.promotionId));
      this.assertCurrentFacts(snapshot, request);
      if (
        snapshot.promotionId !== request.promotionId ||
        snapshot.journalHeadSha256 !== request.expectedJournalHeadSha256
      ) {
        throw new ConstitutionClassicRecoveryServiceError('STALE_JOURNAL_HEAD', 'Classic recovery journal is stale.');
      }
      if (!snapshot.allowedActions.includes('resume')) {
        throw new ConstitutionClassicRecoveryServiceError('CONFLICT', 'Classic recovery cannot be resumed.');
      }
      if (!authorizeDestructivePassword) {
        throw new ConstitutionClassicRecoveryServiceError(
          'AUTH_REQUIRED',
          'Fresh destructive authentication is required.'
        );
      }
      await authorizeDestructivePassword(principalBinding, request.password);
      this.dependencies.operationAuthority.reserve({
        operationId: request.operationId,
        principalBinding,
        kind: 'resume',
        decision: 'resume',
        projectionReceiptSha256: request.projectionReceiptSha256,
        expectedRecoveryRevision: request.expectedRecoveryRevision,
        confirmedObjectIds: [],
        promotionId: request.promotionId,
        expectedJournalHeadSha256: request.expectedJournalHeadSha256,
      });
      return await this.publishTerminal(
        await this.dependencies.operationAuthority.dispatch(request.operationId, principalBinding, (marked) =>
          this.completeResume(marked)
        )
      );
    } catch (error) {
      throw mapServiceError(error);
    }
  }
}

let constitutionClassicRecoveryServiceReady: Promise<ConstitutionClassicRecoveryService | null> | null = null;

/** Register the single cold-start discovery attempt before any transport handler can resolve it. */
export function setConstitutionClassicRecoveryServiceReady(
  ready: Promise<ConstitutionClassicRecoveryService | null>
): void {
  if (constitutionClassicRecoveryServiceReady && constitutionClassicRecoveryServiceReady !== ready) {
    throw new Error('ConstitutionClassicRecoveryService readiness already initialized.');
  }
  constitutionClassicRecoveryServiceReady = ready;
}

/** Resolve restart discovery without accepting a renderer/route supplied path. */
export async function getConstitutionClassicRecoveryServiceReady(): Promise<ConstitutionClassicRecoveryService | null> {
  if (!constitutionClassicRecoveryServiceReady) {
    throw new Error('ConstitutionClassicRecoveryService readiness is not initialized.');
  }
  return constitutionClassicRecoveryServiceReady;
}

export function isClassicRecoveryDigest(value: string): value is `sha256:${string}` {
  return SHA256_PATTERN.test(value);
}
