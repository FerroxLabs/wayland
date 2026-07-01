/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ForkTask } from '@process/worker/fork/ForkTask';
import path from 'path';
import type { IConfirmation } from '@/common/chat/chatLib';
import type { AgentType, AgentStatus } from './agentTypes';
import type { IAgentEventEmitter } from './IAgentEventEmitter';
import type { IAgentManager } from './IAgentManager';

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
      path.resolve(__dirname, type + '.js'),
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
        void this.confirm(data.id, data.callId, autoOption.value, autoOption.answer);
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
