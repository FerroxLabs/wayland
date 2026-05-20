/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

interface RateLimitEntry {
  count: number; // attempt count
  resetTime: number; // reset timestamp
}

export class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();

  /**
   * Get rate limit entry for a key
   */
  public get(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  /**
   * Set rate limit entry for a key
   */
  public set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  /**
   * Increment attempt count for a key (e.g., IP address or username)
   */
  public increment(key: string): void {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      this.store.set(key, { count: 1, resetTime: now });
    } else {
      entry.count++;
      this.store.set(key, entry);
    }
  }

  /**
   * Get attempt count for a key within the time window
   */
  public getCount(key: string, _windowMs: number): number {
    const entry = this.store.get(key);
    if (!entry) return 0;

    const now = Date.now();
    if (now > entry.resetTime) {
      // Window expired, reset
      this.store.delete(key);
      return 0;
    }

    return entry.count;
  }

  /**
   * Reset attempts for a key
   */
  public reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear rate limit by IP address, optionally for specific action
   */
  public clearByIp(ip: string, action?: string): void {
    if (action) {
      // Clear specific action for this IP
      const key = `ratelimit:${action}:${ip}`;
      this.store.delete(key);
    } else {
      // Clear all actions for this IP
      for (const key of this.store.keys()) {
        if (key.endsWith(`:${ip}`)) {
          this.store.delete(key);
        }
      }
    }
  }

  /**
   * Clean up expired entries
   */
  public cleanup(_windowMs: number): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}
