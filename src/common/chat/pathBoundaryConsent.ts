/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Consent vocabulary for a Wayland Core `PathBoundary` escalation.
 *
 * WHY ITS OWN VALUES. Every other approval card in this app answers with
 * `proceed_once` / `proceed_always` (`ToolConfirmationOutcome`), and several
 * auto-approve paths are keyed on exactly those strings — most visibly
 * `ConversationChatConfirm.checkAndAutoConfirm`, which replays a stored "always
 * allow" by finding the first option whose `value` is one of them. A folder
 * grant reuses none of that vocabulary, so no existing matcher can ever fire on
 * one by accident.
 *
 * That is necessary but NOT sufficient: `BaseAgentManager.addConfirmation`
 * auto-confirms `options[0]` by INDEX under yolo, and the renderer binds Enter
 * to `options[0]` the same way. A boundary card is therefore excluded from
 * those paths explicitly, using {@link isPathBoundaryConfirmation} as the one
 * shared predicate — one definition to audit rather than five string compares.
 *
 * WHY THERE IS NO "ONCE". Core cannot run the call under a one-shot grant: an
 * `ApprovalScope::Once` answer to a boundary leaves the read refused anyway, so
 * a Once button would be a button that does nothing. The grant is the only
 * answer that works, which is why it is also the primary (first) option.
 */

/** Grant the session standing READ access to the containing folder. */
export const PATH_BOUNDARY_GRANT_FOLDER = 'path_boundary_grant_folder';

/** Refuse the crossing. The tool call is denied. */
export const PATH_BOUNDARY_DENY = 'path_boundary_deny';

/**
 * The i18n interpolation key under which a grant option carries the root it
 * opens. The label renders it and the confirm handler grants it, so the button
 * text and the authority it hands over cannot drift apart.
 */
export const PATH_BOUNDARY_ROOT_PARAM = 'folder';

export type PathBoundaryOptionValue = typeof PATH_BOUNDARY_GRANT_FOLDER | typeof PATH_BOUNDARY_DENY;

export function isPathBoundaryOptionValue(value: unknown): value is PathBoundaryOptionValue {
  return value === PATH_BOUNDARY_GRANT_FOLDER || value === PATH_BOUNDARY_DENY;
}

/**
 * True when this confirmation is a folder-grant card.
 *
 * Detected from the OPTIONS rather than a separate flag so the property is
 * structural: a card cannot claim to be an ordinary approval while carrying a
 * grant button, and every exclusion below reads the same fact.
 */
export function isPathBoundaryConfirmation(confirmation: {
  options?: Array<{ value?: unknown }>;
}): boolean {
  return Boolean(confirmation.options?.some((option) => isPathBoundaryOptionValue(option?.value)));
}

/** The root a grant option opens, or `undefined` if this is not a grant option. */
export function pathBoundaryRootOf(confirmation: {
  options?: Array<{ value?: unknown; params?: Record<string, string> }>;
}): string | undefined {
  const grant = confirmation.options?.find((option) => option?.value === PATH_BOUNDARY_GRANT_FOLDER);
  const root = grant?.params?.[PATH_BOUNDARY_ROOT_PARAM];
  return root && root.length > 0 ? root : undefined;
}
