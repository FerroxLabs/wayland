/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import { ForkTask } from '@process/worker/fork/ForkTask';
import type { IConfirmation } from '@/common/chat/chatLib';
import type { AgentType, AgentStatus } from './agentTypes';
import type { IAgentEventEmitter } from './IAgentEventEmitter';
import type { IAgentManager } from './IAgentManager';
import { resolveMainBundlePath } from '@process/utils/mainBundlePath';

/** #983 - upper bound on remembered consumed callIds (see consumedConfirmCallIds). */
const CONSUMED_CONFIRM_CALLID_LIMIT = 500;

/**
 * @description Base class for agent tasks
 * */
class BaseAgentManager<Data, ConfirmationOption extends any = any>
  extends ForkTask<{
    type: AgentType;
    data: Data;
  }>
  implements IAgentManager
{
  type: AgentType;
  workspace: string = '';
  conversation_id: string = '';
  protected confirmations: Array<IConfirmation<ConfirmationOption>> = [];
  /**
   * #983 - callIds this manager has already confirmed once.
   *
   * The worker registers exactly ONE `pipe.once(callId, ...)` listener per
   * callId and deletes it when it fires (src/process/worker/gemini.ts), so a
   * SECOND confirm for the same callId posts a message nobody will ever answer.
   * Subclasses that forward a confirmation over the worker round-trip gate that
   * post on {@link claimConfirmCallId} so the repeat never becomes a promise
   * that cannot settle.
   *
   * Deliberately NOT derived from `this.confirmations`: `addConfirmation`
   * returns BEFORE populating that cache under yoloMode, and `tryAutoApprove`
   * never populates it at all, so an "absent from the cache" guard would
   * swallow every auto-approval rather than just the repeats.
   */
  private readonly consumedConfirmCallIds = new Set<string>();
  status: AgentStatus | undefined;
  protected _lastActivityAt: number = Date.now();
  get lastActivityAt(): number {
    return this._lastActivityAt;
  }

  /**
   * Whether this agent is in yolo mode (auto-approve)
   */
  protected yoloMode: boolean = false;

  protected readonly emitter: IAgentEventEmitter;

  constructor(type: AgentType, data: Data, emitter: IAgentEventEmitter, enableFork = true) {
    super(
      resolveMainBundlePath(type + '.js'),
      {
        type: type,
        data: data,
      },
      enableFork
    );
    this.type = type;
    this.emitter = emitter;

    // Set yoloMode from data if present
    if (data && typeof data === 'object' && 'yoloMode' in data) {
      this.yoloMode = !!(data as any).yoloMode;
    }
  }
  protected init(): void {
    super.init();
  }
  protected addConfirmation(data: IConfirmation<ConfirmationOption>) {
    // If yoloMode is active, attempt to auto-confirm instead of adding
    if (this.yoloMode && data.options && data.options.length > 0) {
      // Select the first "allow" option (usually proceed_once or similar)
      // Most agents put the positive confirmation as the first option
      const autoOption = data.options[0];

      // Delay slightly to allow the agent to reach a stable state if needed
      // (#504: pass the option's answer so a yolo-auto-confirmed question sends
      // the first choice instead of an empty answer the engine would error on).
      setTimeout(() => {
        // #983: subclasses (GeminiAgentManager) return the worker round-trip
        // here, and that promise now rejects when the child exits. Wrap so a
        // dead worker cannot turn a yolo auto-confirm into a process-killing
        // unhandled rejection.
        void Promise.resolve(this.confirm(data.id, data.callId, autoOption.value, autoOption.answer)).catch((error) => {
          console.warn(
            `[BaseAgentManager] yolo auto-confirm for callId=${data.callId} was not delivered:`,
            error instanceof Error ? error.message : String(error)
          );
        });
      }, 50);
      return;
    }

    const originIndex = this.confirmations.findIndex((p) => p.id === data.id);
    if (originIndex !== -1) {
      this.confirmations = this.confirmations.map((item, i) => (i === originIndex ? { ...item, ...data } : item));
      this.emitter.emitConfirmationUpdate(this.conversation_id, data);
      return;
    }
    this.confirmations = [...this.confirmations, data];
    this.emitter.emitConfirmationAdd(this.conversation_id, data);
  }
  // #504: `_answer` threads an AskUserQuestion choice back through subclasses
  // that support it (WCoreManager); ignored by the rest.
  confirm(_msg_id: string, callId: string, _data: ConfirmationOption, _answer?: string) {
    // Find the confirmation to remove (match by callId)
    const confirmationToRemove = this.confirmations.find((p) => p.callId === callId);

    // Remove from cache
    this.confirmations = this.confirmations.filter((p) => p.callId !== callId);

    // Notify frontend to remove the confirmation
    if (confirmationToRemove) {
      this.emitter.emitConfirmationRemove(this.conversation_id, confirmationToRemove.id);
    }
  }
  /**
   * #983 - claim the worker's single-use confirm slot for `callId`.
   *
   * @returns `true` the first time a callId is claimed, `false` for every
   *   repeat. A caller that forwards the confirmation over the worker
   *   round-trip MUST skip that post on `false`: the worker's one-shot listener
   *   for the callId is already gone, so `postMessagePromise` would return a
   *   promise bounded only by child death - and `ChannelMessageService.confirm`
   *   awaits it.
   */
  protected claimConfirmCallId(callId: string): boolean {
    if (this.consumedConfirmCallIds.has(callId)) return false;
    this.consumedConfirmCallIds.add(callId);
    // Bound the set so a very long conversation cannot grow it without limit.
    // callIds are unique per tool call (the model's own id, else
    // `name_<timestamp>_<counter>`), so evicting the oldest entries cannot
    // resurrect a callId that is still live.
    while (this.consumedConfirmCallIds.size > CONSUMED_CONFIRM_CALLID_LIMIT) {
      const oldest = this.consumedConfirmCallIds.values().next().value;
      if (oldest === undefined) break;
      this.consumedConfirmCallIds.delete(oldest);
    }
    return true;
  }
  getConfirmations() {
    return this.confirmations;
  }
  start(data?: Data) {
    if (data) {
      this.data = {
        ...this.data,
        data,
      };
    }
    return super.start();
  }

  stop() {
    this.confirmations = [];
    return this.postMessagePromise('stop.stream', {}).catch(() => {
      // Worker process may have already exited - stopping a dead process is a no-op
    });
  }

  sendMessage(data: any) {
    this._lastActivityAt = Date.now();
    return this.postMessagePromise('send.message', data);
  }

  /**
   * Ensure yoloMode (auto-approve) is enabled for this agent.
   * Used by CronService to enable yoloMode on existing agents without killing them.
   * Returns true if yoloMode is already active or was successfully enabled.
   * Subclasses should override to implement agent-specific yoloMode logic.
   */
  async ensureYoloMode(): Promise<boolean> {
    return false;
  }
}

export default BaseAgentManager;
