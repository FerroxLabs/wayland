/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ErrorEvent } from '@sentry/core';

const SENSITIVE_KEYS = /^(?:username|password|authorization|bearer|jwt_secret|.*token.*)$/i;

function stripObj(obj: Record<string, unknown>): Record<string, unknown> {
  if (!obj) return obj;
  for (const key of Object.keys(obj)) {
    if (SENSITIVE_KEYS.test(key)) delete obj[key];
  }
  return obj;
}

// L11 (AUDIT-04 F20): build a Sentry `beforeSend` scrubber.
//
// Pass the OS homedir from a Node context (main process) to enable home-dir
// path replacement in messages, exception values, and stacktrace filenames.
// From the renderer (sandbox + no nodeIntegration), call with no argument -
// homedir substitution is skipped; the rest of the scrub still runs
// (sensitive keys, request headers/cookies).
//
// Factory shape is what lets the same module load cleanly in both processes -
// the renderer bundle never imports `node:os`.
export function createScrubPii(homedir?: string): (event: ErrorEvent) => ErrorEvent {
  const replaceHome = homedir ? (s: string) => s.replaceAll(homedir, '~') : (s: string) => s;
  return function scrubPii(event: ErrorEvent): ErrorEvent {
    if (event.extra) stripObj(event.extra);
    if (event.tags) stripObj(event.tags as Record<string, unknown>);
    if (event.contexts) {
      for (const ctxKey of Object.keys(event.contexts)) {
        const ctx = event.contexts[ctxKey];
        if (ctx && typeof ctx === 'object') stripObj(ctx as Record<string, unknown>);
      }
    }
    if (event.request?.headers) stripObj(event.request.headers as Record<string, unknown>);
    if (event.request?.cookies) stripObj(event.request.cookies as Record<string, unknown>);
    if (event.message) event.message = replaceHome(event.message);
    if (event.exception?.values) {
      for (const ex of event.exception.values) {
        if (ex.value) ex.value = replaceHome(ex.value);
        if (ex.stacktrace?.frames) {
          for (const frame of ex.stacktrace.frames) {
            if (frame.filename) frame.filename = replaceHome(frame.filename);
          }
        }
      }
    }
    return event;
  };
}
