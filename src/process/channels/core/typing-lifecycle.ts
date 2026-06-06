/*
 * Portions adapted from OpenClaw <https://github.com/openclaw/openclaw>@aee2681a
 * Source: src/channels/typing-lifecycle.ts
 * MIT License - Copyright (c) 2025 Peter Steinberger
 * Used per MIT permission grant; Wayland additions remain under Apache-2.0.
 */
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Channel-agnostic typing indicator keepalive loop.
 *
 * Some platforms (Telegram, Slack) expire their typing/presence signal after a
 * few seconds; callers create a keepalive loop that re-fires the indicator on
 * a fixed interval until stopped. Ticks are serialized - a long-running tick
 * never overlaps the next interval fire.
 */

type AsyncTick = () => Promise<void> | void;

export type TypingKeepaliveLoop = {
  tick: () => Promise<void>;
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
};

export function createTypingKeepaliveLoop(params: {
  intervalMs: number;
  onTick: AsyncTick;
}): TypingKeepaliveLoop {
  let timer: ReturnType<typeof setInterval> | undefined;
  let tickInFlight = false;

  const tick = async () => {
    if (tickInFlight) {
      return;
    }
    tickInFlight = true;
    try {
      await params.onTick();
    } finally {
      tickInFlight = false;
    }
  };

  const start = () => {
    if (params.intervalMs <= 0 || timer) {
      return;
    }
    timer = setInterval(() => {
      void tick();
    }, params.intervalMs);
  };

  const stop = () => {
    if (!timer) {
      return;
    }
    clearInterval(timer);
    timer = undefined;
    tickInFlight = false;
  };

  const isRunning = () => timer !== undefined;

  return {
    tick,
    start,
    stop,
    isRunning,
  };
}
