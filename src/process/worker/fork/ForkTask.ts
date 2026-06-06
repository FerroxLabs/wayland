/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
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
      this.emit('error', args[0] as Error);
    });
    fcp.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
      const expected = this.childExitExpected;
      this.childExitExpected = false;
      if (this.fcp === fcp) {
        this.fcp = undefined;
      }

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
  // Send message to child process and await callback
  protected postMessagePromise(type: string, data: any) {
    if (!this.fcp) {
      return Promise.reject(new Error('fork task not enabled'));
    }
    return new Promise<any>((resolve, reject) => {
      const pipeId = uuid(8);
      this.once(this.callbackKey(pipeId), (data) => {
        if (data.state === 'fulfilled') {
          resolve(data.data);
        } else {
          reject(data.data);
        }
      });
      this.postMessage(type, data, { pipeId });
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
