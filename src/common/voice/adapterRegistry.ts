/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * VOC-04 — provider-neutral speech adapter registry.
 *
 * A speech provider is REGISTERED against a contract, not hard-coded into a
 * switch/ternary. One contract per modality (`TextToSpeechAdapter`,
 * `SpeechToTextAdapter`) each declares `provider`; the modality's registry maps
 * that key to the adapter and dispatch resolves through the registry.
 *
 * `resolve` fails closed: an unregistered provider throws rather than silently
 * falling through to a default engine.
 */

export interface VoiceAdapter<P extends string> {
  readonly provider: P;
}

export class VoiceAdapterRegistry<P extends string, A extends VoiceAdapter<P>> {
  private readonly adapters = new Map<P, A>();

  register(adapter: A): this {
    if (this.adapters.has(adapter.provider)) {
      throw new Error(`voice adapter already registered for provider: ${adapter.provider}`);
    }
    this.adapters.set(adapter.provider, adapter);
    return this;
  }

  resolve(provider: P): A {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`no voice adapter registered for provider: ${provider}`);
    }
    return adapter;
  }

  has(provider: P): boolean {
    return this.adapters.has(provider);
  }

  providers(): P[] {
    return [...this.adapters.keys()];
  }
}
