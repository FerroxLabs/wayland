/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Process-local mutation barrier shared by ordinary Constitution writes,
 * archive restore, and Classic promotion. Electron's main process is the sole
 * dispatcher for these mutations; acquiring either side synchronously before
 * the first await closes the otherwise dangerous password/dispatch race.
 */
export class ConstitutionMutationQuiescenceAuthority {
  private activeInteractiveMutations = 0;
  private recoveryOwner: symbol | null = null;

  acquireInteractiveMutation(): () => void {
    if (this.recoveryOwner) {
      throw Object.assign(new Error('Constitution recovery owns the mutation authority.'), {
        code: 'CONSTITUTION_FS_CONFLICT',
      });
    }
    this.activeInteractiveMutations += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.activeInteractiveMutations -= 1;
      if (this.activeInteractiveMutations < 0) {
        this.activeInteractiveMutations = 0;
        throw new Error('Constitution mutation authority release underflow.');
      }
    };
  }

  async acquireRecoveryQuiescence(): Promise<() => void> {
    if (this.recoveryOwner || this.activeInteractiveMutations !== 0) {
      throw Object.assign(new Error('Constitution mutation authority is busy.'), {
        code: 'CONSTITUTION_FS_CONFLICT',
      });
    }
    const owner = Symbol('constitution-recovery-quiescence');
    this.recoveryOwner = owner;
    let released = false;
    return () => {
      if (released) return;
      if (this.recoveryOwner !== owner) {
        throw new Error('Constitution recovery mutation authority ownership changed.');
      }
      released = true;
      this.recoveryOwner = null;
    };
  }

  runInteractiveMutation<T>(operation: () => T): T {
    const release = this.acquireInteractiveMutation();
    try {
      return operation();
    } finally {
      release();
    }
  }

  async runInteractiveMutationAsync<T>(operation: () => Promise<T>): Promise<T> {
    const release = this.acquireInteractiveMutation();
    try {
      return await operation();
    } finally {
      release();
    }
  }
}

export const constitutionMutationQuiescence = new ConstitutionMutationQuiescenceAuthority();
