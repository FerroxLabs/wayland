// src/process/acp/session/PermissionResolver.ts

import type { RequestPermissionRequest, RequestPermissionResponse } from '@agentclientprotocol/sdk';
import type { PermissionUIData } from '@process/acp/types';

// ─── ApprovalCache (LRU eviction, stores optionId by serialized key) ──

export class ApprovalCache {
  private cache = new Map<string, string>();

  constructor(public readonly maxSize: number = 500) {}

  get size(): number {
    return this.cache.size;
  }

  get(key: string): string | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Refresh LRU order: delete and re-insert
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: string, optionId: string): void {
    // Delete first to reset insertion order
    this.cache.delete(key);
    this.cache.set(key, optionId);

    // Evict oldest if over limit
    if (this.cache.size > this.maxSize) {
      const oldest = this.cache.keys().next().value!;
      this.cache.delete(oldest);
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

// ─── Cache key builder ──────────────────────────────────────────

/**
 * Build a cache key from kind + title + operation-identifying fields in rawInput.
 *
 * Matches the semantics of AcpApprovalStore: users approve commands/paths,
 * not descriptions - so we only include operation-identifying fields
 * (command, path, file_path) from rawInput.
 */
function buildCacheKey(request: RequestPermissionRequest): string {
  const { kind, title, rawInput } = request.toolCall;

  const normalizedInput: Record<string, unknown> = {};
  if (rawInput && typeof rawInput === 'object') {
    const input = rawInput as Record<string, unknown>;
    if (input.command) normalizedInput.command = input.command;
    if (input.path) normalizedInput.path = input.path;
    if (input.file_path) normalizedInput.file_path = input.file_path;
  }

  return JSON.stringify({
    kind: kind ?? 'unknown',
    title: title ?? '',
    rawInput: normalizedInput,
  });
}

// ─── PermissionResolver ─────────────────────────────────────────

type PendingPermission = {
  callId: string;
  resolve: (response: RequestPermissionResponse) => void;
  reject: (error: Error) => void;
  createdAt: number;
  /** #1045: armed only when this resolver has an unattended deadline. */
  expiryTimer?: ReturnType<typeof setTimeout>;
};

type PermissionResolverConfig = {
  autoApproveAll: boolean;
  cacheMaxSize?: number;
  /**
   * #672: durable, workspace-scoped persistence for "allow always" decisions.
   * `hydrate` loads previously-persisted [cacheKey, optionId] entries ONCE
   * (lazily, before the first cache lookup) so an "allow always" survives an
   * app restart. `persist` write-throughs a newly-cached always decision. Both
   * are optional — without them the resolver is the original in-memory-only
   * session cache.
   */
  hydrate?: () => Promise<Iterable<[string, string]>>;
  persist?: (cacheKey: string, optionId: string) => void;
  /**
   * #1045: bound how long an UNATTENDED run may sit on a held tool call, in ms.
   *
   * ABSENT for an attended session, and that absence is the feature: a person in
   * front of the app is the thing being waited on, so their prompt still waits
   * indefinitely. Only the scheduled-run path supplies a value (see
   * `resolveUnattendedHoldMs`, which also keeps it strictly under the time to
   * that conversation's next scheduled run).
   *
   * On expiry the hold resolves as a DENIAL - never an approval, never cached,
   * never persisted. See {@link PermissionResolver.expire}.
   */
  holdDeadlineMs?: number;
  /**
   * Fired when a hold expired, so the run is distinguishable from an ordinary
   * failure. A denial the user cannot tell apart from a normal error leaves most
   * of #1045 in place: they still cannot see that their automation stopped
   * because it was waiting on them.
   */
  onHoldExpired?: (info: { callId: string; title: string; deadlineMs: number }) => void;
};

type PendingPermissionWithContext = PendingPermission & {
  cacheKey: string;
};

export class PermissionResolver {
  private readonly yoloMode: boolean;
  private readonly cache: ApprovalCache;
  private readonly pending = new Map<string, PendingPermissionWithContext>();
  private readonly hydrateFn?: () => Promise<Iterable<[string, string]>>;
  private readonly persistFn?: (cacheKey: string, optionId: string) => void;
  private readonly onHoldExpired?: (info: { callId: string; title: string; deadlineMs: number }) => void;
  /** #1045: ms an unattended hold may last, or undefined for an attended run. */
  private holdDeadlineMs?: number;
  /** Memoized one-shot rehydration of persisted approvals (#672). */
  private hydration?: Promise<void>;

  constructor(config: PermissionResolverConfig) {
    this.yoloMode = config.autoApproveAll;
    this.cache = new ApprovalCache(config.cacheMaxSize ?? 500);
    this.hydrateFn = config.hydrate;
    this.persistFn = config.persist;
    this.holdDeadlineMs = config.holdDeadlineMs;
    this.onHoldExpired = config.onHoldExpired;
  }

  /**
   * Adopt an unattended deadline on a resolver that is already live (#1045).
   *
   * The scheduled-run executor REUSES a running agent when it can, so the second
   * and later runs of a job never rebuild the session and would otherwise keep
   * the attended (indefinite) behaviour the first spawn was constructed with.
   * Only holds armed AFTER this call are bounded; an already-pending one keeps
   * whatever deadline it was armed with, because retro-arming a request the user
   * may be looking at right now would deny it out from under them.
   */
  setHoldDeadlineMs(ms: number | undefined): void {
    this.holdDeadlineMs = ms;
  }

  get hasPending(): boolean {
    return this.pending.size > 0;
  }

  /**
   * Seed persisted "allow always" entries into the cache exactly once (#672).
   * Idempotent + lazy: runs on the first cache lookup, never re-runs, and a
   * failed load resolves (empty) so it can never block a permission decision.
   */
  private ensureHydrated(): Promise<void> {
    if (!this.hydrateFn) return Promise.resolve();
    if (!this.hydration) {
      this.hydration = this.hydrateFn()
        .then((entries) => {
          for (const [key, optionId] of entries) {
            // Defense-in-depth: only honor persisted "allow always" grants (the
            // only shape we ever write). A tampered on-disk store therefore
            // can't inject some other decision to auto-select from the cache.
            if (!(optionId.startsWith('allow_') && optionId.includes('always'))) continue;
            // Do not clobber a decision the user made this session (already in
            // cache) with a stale persisted one; only fill gaps.
            if (this.cache.get(key) === undefined) this.cache.set(key, optionId);
          }
        })
        .catch(() => {
          /* load failure = behave as if nothing persisted; never block a turn */
        });
    }
    return this.hydration;
  }

  async evaluate(
    request: RequestPermissionRequest,
    uiCallback: (data: PermissionUIData) => void
  ): Promise<RequestPermissionResponse> {
    // Level 1: YOLO mode - auto-approve everything (client-side fallback).
    // Short-circuits before the cache, so no need to hydrate persisted approvals.
    if (this.yoloMode) {
      const allowOption = request.options.find((o) => o.kind.startsWith('allow_'));
      const optionId = allowOption?.optionId ?? request.options[0].optionId;
      return { outcome: { outcome: 'selected', optionId } };
    }

    // #672: ensure persisted "allow always" decisions are loaded before the
    // first cache lookup, so an approval from a prior session is honored. Guard
    // the await so a resolver WITHOUT persistence keeps the original synchronous
    // UI-delegation timing (a bare `await` would defer the uiCallback a tick).
    if (this.hydrateFn) await this.ensureHydrated();

    // Level 2: Cache hit (persisted + session "always allow" memory)
    const cacheKey = buildCacheKey(request);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return { outcome: { outcome: 'selected', optionId: cached } };
    }

    // Level 3: UI delegation
    const { toolCall } = request;
    const callId = toolCall.toolCallId;
    return new Promise<RequestPermissionResponse>((resolve, reject) => {
      const entry: PendingPermissionWithContext = { callId, resolve, reject, createdAt: Date.now(), cacheKey };
      this.pending.set(callId, entry);
      // #1045: arm the deadline BEFORE the UI callback. `uiCallback` is
      // synchronous today, but arming after it would make the bound depend on
      // that staying true.
      const deadlineMs = this.holdDeadlineMs;
      if (deadlineMs !== undefined && deadlineMs > 0) {
        // Resolved here, from THIS request's own options, rather than at expiry:
        // the request is what says how this agent spells "no".
        const denyOptionId = request.options.find((o) => o.kind.startsWith('reject'))?.optionId;
        const timer = setTimeout(() => {
          this.expire(callId, denyOptionId, toolCall.title ?? '', deadlineMs);
        }, deadlineMs);
        // Unref'd: it still fires for as long as the process is running, which
        // is the whole life of any hold, but it must never be the thing that
        // keeps a quitting main process alive.
        (timer as { unref?: () => void }).unref?.();
        entry.expiryTimer = timer;
      }
      uiCallback({
        callId,
        title: toolCall.title ?? '',
        description: '',
        kind: toolCall.kind ?? undefined,
        options: request.options.map((o) => ({
          optionId: o.optionId,
          label: o.name,
          kind: o.kind,
        })),
        locations: toolCall.locations?.map((l) => ({
          path: l.path,
          range: l.line != null ? { startLine: l.line } : undefined,
        })),
        rawInput: toolCall.rawInput,
      });
    });
  }

  /**
   * The unattended deadline elapsed (#1045). DENY.
   *
   * Three properties, in the order they matter:
   *  1. It NEVER selects an allow option. When the request offered no reject
   *     option there is nothing to select, so the answer is `cancelled` - "no
   *     decision" - rather than the allow option that happens to be on offer.
   *  2. It never touches the cache and never calls `persistFn`. `resolve()`
   *     already refuses to cache a deny; an expiry is not even a deny the user
   *     made, so it must be at least as strict. A cached expiry would silently
   *     answer every future matching call.
   *  3. It resolves the SAME pending promise a user decision resolves, so
   *     everything downstream - the ACP response, the turn, the busy guard -
   *     behaves exactly as it does for a real denial.
   */
  private expire(callId: string, denyOptionId: string | undefined, title: string, deadlineMs: number): void {
    const entry = this.pending.get(callId);
    if (!entry) return;
    this.pending.delete(callId);
    if (entry.expiryTimer) clearTimeout(entry.expiryTimer);

    entry.resolve(
      denyOptionId !== undefined
        ? { outcome: { outcome: 'selected', optionId: denyOptionId } }
        : { outcome: { outcome: 'cancelled' } }
    );
    this.onHoldExpired?.({ callId, title, deadlineMs });
  }

  resolve(callId: string, optionId: string): void {
    const entry = this.pending.get(callId);
    if (!entry) return;
    this.pending.delete(callId);
    // A decision arrived, so the deadline is moot. Without this the timer still
    // fires and `expire` finds nothing pending - correct, but it would keep an
    // unattended run's timer alive for its full deadline after every answer.
    if (entry.expiryTimer) clearTimeout(entry.expiryTimer);

    // Cache "allow always" decisions for future auto-approval (never cache deny)
    if (optionId.startsWith('allow_') && optionId.includes('always')) {
      this.cache.set(entry.cacheKey, optionId);
      // #672: write-through to durable per-workspace persistence so the grant
      // survives an app restart. Fire-and-forget: a failed persist only costs a
      // re-prompt next session and must not affect this decision.
      this.persistFn?.(entry.cacheKey, optionId);
    }

    entry.resolve({ outcome: { outcome: 'selected', optionId } });
  }

  rejectAll(error: Error): void {
    for (const entry of this.pending.values()) {
      if (entry.expiryTimer) clearTimeout(entry.expiryTimer);
      entry.reject(error);
    }
    this.pending.clear();
  }
}
