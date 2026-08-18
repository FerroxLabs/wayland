/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

// Child process instance
/**
 * Provides process startup
 * Provides IPC between main and child processes
 */

import { uuid } from '@/renderer/utils/common';
import { getPlatformServices } from '@/common/platform';
import type { IWorkerProcess } from '@/common/platform';
import { getEnhancedEnv } from '@process/utils/shellEnv';
import type { MainToWorkerMessage } from '../WorkerProtocol';
import { Pipe } from './pipe';

export class ForkTask<Data> extends Pipe {
  protected path = '';
  protected data: Data;
  protected fcp: IWorkerProcess | undefined;
  private enableFork: boolean;
  private childExitExpected = false;
  /**
   * #983 - in-flight {@link postMessagePromise} waiters, keyed by pipeId.
   *
   * A waiter only ever settled on the child's callback message, so a child that
   * died (crash, kill, failed spawn) left every caller pending FOREVER: no
   * resolve, no reject, no timeout. Upstream that surfaced as a teammate frozen
   * in "Processing" with no error to show. Keeping the rejectors here lets the
   * exit/error handlers fail them all deterministically.
   */
  private readonly pendingCalls = new Map<string, (reason: Error) => void>();
  // NOTE(M14/AUDIT-05 F5): per-instance `process.on('exit', ...)` registration
  // was removed here. Every ForkTask used to register its own exit listener,
  // which tripped Node's default 11-listener cap once >10 forks were live
  // concurrently or errored before kill(). The owning registry (e.g.
  // WorkerTaskManager) is now responsible for installing ONE shared exit
  // handler that iterates its task list and calls kill() on each.
  constructor(path: string, data: Data, enableFork = true) {
    super(true);
    this.path = path;
    this.data = data;
    this.enableFork = enableFork;
    if (this.enableFork) this.init();
  }
  /**
   * Terminate the forked child and wait for it to actually exit.
   * AUDIT-05 F20 / M18: `await workerTaskManager.clear()` in before-quit relies
   * on this promise resolving only after the child dies, so Cmd+Q during an
   * active Claude/Gemini stream doesn't leave `bun` children running.
   */
  kill(): Promise<void> {
    if (!this.fcp) return Promise.resolve();
    this.childExitExpected = true;
    return this.fcp.kill();
  }
  protected init() {
    const platform = getPlatformServices();
    // In packaged Electron builds, resolve to app.asar.unpacked for WASM files.
    const workerCwd = platform.paths.isPackaged()
      ? (platform.paths.getAppPath() ?? process.cwd()).replace('app.asar', 'app.asar.unpacked')
      : process.cwd();
    // Pass enhanced shell environment so workers inherit the full PATH (nvm, npm globals, etc.)
    // This is critical for skills that depend on globally installed tools (node, npm, playwright, etc.)
    // Without this, workers only get Electron's limited env, missing paths set in .zshrc/.bashrc
    const workerEnv = getEnhancedEnv();
    const fcp = platform.worker.fork(this.path, [], {
      cwd: workerCwd,
      env: workerEnv,
    });
    this.childExitExpected = false;
    // Receive messages sent from the child process
    fcp.on('message', (...args: unknown[]) => {
      const e = args[0] as IForkData;
      if (e.type === 'complete') {
        this.childExitExpected = true;
        // Fire-and-forget: emit 'complete' immediately; the child's exit is awaited
        // only via the public kill() path used by WorkerTaskManager.clear().
        void fcp.kill();
        this.emit('complete', e.data);
      } else if (e.type === 'error') {
        this.childExitExpected = true;
        void fcp.kill();
        this.emit('error', e.data);
      } else {
        // clientId acts as the IPC key between main and child processes
        // If clientId is present, dispatch the message on the corresponding channel
        const deferred = this.deferred(e.pipeId);
        if (e.pipeId) {
          // If a callback exists, forward callback messages back to the child process
          Promise.resolve(deferred.pipe(this.postMessage.bind(this))).catch((error) => {
            console.error('Failed to pipe message:', error);
          });
        }
        return this.emit(e.type, e.data, deferred);
      }
    });
    fcp.on('error', (...args: unknown[]) => {
      const error = args[0] as Error;
      // #983: the child will never answer once it has errored out.
      this.rejectPendingCalls(new Error(`fork task child errored: ${error?.message ?? String(error)}`));
      this.emit('error', error);
    });
    fcp.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
      const expected = this.childExitExpected;
      this.childExitExpected = false;
      if (this.fcp === fcp) {
        this.fcp = undefined;
      }

      // #983: reject on EVERY exit, expected or not. An expected exit (kill(),
      // or the child's own 'complete'/'error' frame) is still an exit: any
      // callback the child had not already posted is never coming, and leaving
      // the waiter pending is exactly the hang this fixes.
      this.rejectPendingCalls(new Error(`fork task child exited before responding (code=${code}, signal=${signal})`));

      if (!expected) {
        this.emit('exit', { code, signal });
      }
    });
    this.fcp = fcp;
  }
  start() {
    if (!this.enableFork) return Promise.resolve();
    const { data } = this;
    return this.postMessagePromise('start', data);
  }
  /** #983 - fail every in-flight {@link postMessagePromise} waiter at once. */
  private rejectPendingCalls(reason: Error): void {
    if (this.pendingCalls.size === 0) return;
    const rejectors = [...this.pendingCalls.values()];
    this.pendingCalls.clear();
    for (const rejectCall of rejectors) rejectCall(reason);
  }

  /**
   * Send a message to the child process and await its callback.
   *
   * The returned promise is bounded three ways (#983): the child's callback,
   * child exit/error (see {@link rejectPendingCalls}), and — only when the
   * caller asks for it — `options.timeoutMs`.
   *
   * There is deliberately NO default timeout. Several message types are
   * turn-scoped rather than request-scoped: `send.message` resolves when the
   * whole agent turn ends (see src/process/worker/gemini.ts), which legitimately
   * runs for many minutes. A blanket deadline here would abort healthy long
   * turns. Wake-level stall detection is TeammateManager's inactivity watchdog,
   * which can tell silence from slowness because it sees the response stream.
   */
  protected postMessagePromise(type: string, data: any, options?: { timeoutMs?: number }) {
    if (!this.fcp) {
      return Promise.reject(new Error('fork task not enabled'));
    }
    return new Promise<any>((resolve, reject) => {
      const pipeId = uuid(8);
      const key = this.callbackKey(pipeId);
      let timer: ReturnType<typeof setTimeout> | undefined;
      const settle = () => {
        this.pendingCalls.delete(pipeId);
        if (timer !== undefined) clearTimeout(timer);
      };
      const fail = (reason: Error) => {
        // Drop the never-fired callback listener; the pipeId is unique so this
        // cannot clear anyone else's handler.
        this.off(key);
        settle();
        reject(reason);
      };

      this.pendingCalls.set(pipeId, fail);
      this.once(key, (payload) => {
        settle();
        if (payload.state === 'fulfilled') {
          resolve(payload.data);
        } else {
          reject(payload.data);
        }
      });

      const timeoutMs = options?.timeoutMs;
      if (typeof timeoutMs === 'number' && timeoutMs > 0) {
        timer = setTimeout(() => fail(new Error(`fork task "${type}" timed out after ${timeoutMs}ms`)), timeoutMs);
      }

      try {
        this.postMessage(type, data, { pipeId });
      } catch (error) {
        fail(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
  // Send callback to child process
  postMessage(type: MainToWorkerMessage['type'] | string, data: unknown, extPrams: Record<string, unknown> = {}) {
    if (!this.fcp) throw new Error('fork task not enabled');
    this.fcp.postMessage({ type, data, ...extPrams });
  }
}

interface IForkData {
  type: 'complete' | 'error' | string;
  data: any;
  pipeId?: string;
  [key: string]: any;
}
