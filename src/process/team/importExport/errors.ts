/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * W4 - Errors raised by the team import/export pipeline.
 *
 * `TeamImportError` is thrown by every guard in the import path: DOS limits,
 * prototype-pollution rejection, depth check, Zod validation, missing
 * specialist lookup. Callers map `.code` to a translated user-facing message.
 *
 * `TeamImportBusyError` is the specific sub-type for the bounded-queue
 * back-pressure case (max 2 concurrent parse workers + 5s queue-wait timeout).
 *
 * `TeamSandboxedError` is reserved for W4b; it is defined here so consumers
 * can `import { TeamSandboxedError }` from a single module once the FS
 * sandbox lands.
 */

export class TeamImportError extends Error {
  readonly code: string;
  constructor(message: string, code = 'TEAM_IMPORT_ERROR') {
    super(message);
    this.name = 'TeamImportError';
    this.code = code;
  }
}

export class TeamImportBusyError extends TeamImportError {
  constructor() {
    super('Import busy - too many concurrent imports', 'TEAM_IMPORT_BUSY');
    this.name = 'TeamImportBusyError';
  }
}

/**
 * W4b - thrown by the workspace FS sandbox + MCP capability gates when a
 * sandboxed team attempts a denied operation. Defined here in W4a so the
 * import-time tests and downstream callers share a single import path.
 */
export class TeamSandboxedError extends Error {
  readonly code: string;
  constructor(message: string, code = 'TEAM_SANDBOXED') {
    super(message);
    this.name = 'TeamSandboxedError';
    this.code = code;
  }
}
