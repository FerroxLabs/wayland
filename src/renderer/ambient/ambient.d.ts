/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Required so that this file is treated as a module; otherwise `declare global` errors.
export {};

declare global {
  interface Window {
    ambientAPI: {
      dragStart(): void;
      dragEnd(): void;
      click(): void;
    };
  }
}
