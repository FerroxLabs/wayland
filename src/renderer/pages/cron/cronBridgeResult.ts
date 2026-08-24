/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The renderer half of H1.
 *
 * Every cron provider now RESOLVES with `{ ok: false, errorCode, message }`
 * instead of rejecting, because `buildProvider(...).invoke` has no reject
 * channel and no timeout: a throw in main is a promise that never settles here,
 * so the `catch` and the `finally` around it never run and the surface is stuck
 * on its spinner forever.
 *
 * The resolved failure has to be turned back into something each call site can
 * act on. Two shapes, on purpose:
 *
 *  - `unwrapCron` for the places that already sit inside a `try/catch` and only
 *    need a loading flag cleared and a log line. Throwing there is not a
 *    regression of the fix - a throw in the RENDERER settles the promise, so the
 *    existing `catch`/`finally` finally do run.
 *  - a plain `isCronBridgeFailure` branch for the places that must show the
 *    user the sentence main wrote (the P2-10 three-option workspace message),
 *    where wrapping it in `Error:` would be worse copy.
 */

import type { ICronBridgeErrorCode, ICronBridgeFailure } from '@/common/adapter/ipcBridge';
import { isCronBridgeFailure } from '@/common/adapter/ipcBridge';

export class CronBridgeError extends Error {
  readonly errorCode: ICronBridgeErrorCode;
  readonly path?: string;

  constructor(failure: ICronBridgeFailure) {
    super(failure.message);
    this.name = 'CronBridgeError';
    this.errorCode = failure.errorCode;
    this.path = failure.path;
  }
}

/** The success arm, or a throw the caller's existing `catch` can see. */
export function unwrapCron<T>(result: T | ICronBridgeFailure): T {
  if (isCronBridgeFailure(result)) throw new CronBridgeError(result);
  return result as T;
}
