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
 *
 * WHY THE SESSION GRANT STAYS FIRST NOW THERE ARE TWO. Both index-keyed paths
 * above pick `options[0]`, and both exclude this card - but the ordering is the
 * blast radius if either exclusion is ever regressed, so `options[0]` is the
 * NARROWER of the two grants. It is also the right default on its own merits:
 * remembering a folder past the end of the chat is a further step, not the one
 * a user should take by reflex to unblock the call in front of them.
 */

/** Grant the session standing READ access to the containing folder. */
export const PATH_BOUNDARY_GRANT_FOLDER = 'path_boundary_grant_folder';

/**
 * The same grant, PLUS a durable record of it on this workspace's folder-grant
 * list, so the folder is still open after a restart and to an unattended run.
 *
 * A separate VALUE rather than a flag on the existing one, for the same reason
 * the card has its own vocabulary at all: `isPathBoundaryOptionValue` is what
 * every exclusion in this app reads, and widening that predicate is what
 * extends all of them at once. A boolean rider on the grant option would have
 * been invisible to all of them.
 */
export const PATH_BOUNDARY_REMEMBER_FOLDER = 'path_boundary_remember_folder';

/** Refuse the crossing. The tool call is denied. */
export const PATH_BOUNDARY_DENY = 'path_boundary_deny';

/**
 * The i18n interpolation key under which a grant option carries the root it
 * opens. The label renders it and the confirm handler grants it, so the button
 * text and the authority it hands over cannot drift apart.
 */
export const PATH_BOUNDARY_ROOT_PARAM = 'folder';

export type PathBoundaryOptionValue =
  | typeof PATH_BOUNDARY_GRANT_FOLDER
  | typeof PATH_BOUNDARY_REMEMBER_FOLDER
  | typeof PATH_BOUNDARY_DENY;

export function isPathBoundaryOptionValue(value: unknown): value is PathBoundaryOptionValue {
  return (
    value === PATH_BOUNDARY_GRANT_FOLDER ||
    value === PATH_BOUNDARY_REMEMBER_FOLDER ||
    value === PATH_BOUNDARY_DENY
  );
}

/**
 * True for the option values that HAND OVER a folder, false for the refusal.
 *
 * Kept as its own predicate because two different questions are asked of these
 * values and conflating them is how a third option goes wrong: the exclusions
 * ask "is this the boundary card's vocabulary at all" ({@link
 * isPathBoundaryOptionValue}, which must include the deny value or a remote
 * peer could smuggle a decline through), while the route and the renderer ask
 * "does answering this widen filesystem authority".
 */
export function isPathBoundaryGrantValue(value: unknown): boolean {
  return value === PATH_BOUNDARY_GRANT_FOLDER || value === PATH_BOUNDARY_REMEMBER_FOLDER;
}

/**
 * True when this confirmation is a folder-grant card.
 *
 * Detected from the OPTIONS rather than a separate flag so the property is
 * structural: a card cannot claim to be an ordinary approval while carrying a
 * grant button, and every exclusion below reads the same fact.
 */
export function isPathBoundaryConfirmation(confirmation: { options?: Array<{ value?: unknown }> }): boolean {
  return Boolean(confirmation.options?.some((option) => isPathBoundaryOptionValue(option?.value)));
}

/**
 * The root a grant option opens, or `undefined` if this card has none.
 *
 * Matches on {@link isPathBoundaryGrantValue} rather than on the session-grant
 * value alone, so the durable option is read the same way. Both grant options
 * are built from ONE `suggestedRoot` in `WCoreManager.handleConformationMessage`
 * and therefore carry the same value; this returning the first is not a
 * preference between them, and a card whose two grant buttons disagreed would
 * be a bug upstream of here, not a choice to be made here.
 */
export function pathBoundaryRootOf(confirmation: {
  options?: Array<{ value?: unknown; params?: Record<string, string> }>;
}): string | undefined {
  const grant = confirmation.options?.find((option) => isPathBoundaryGrantValue(option?.value));
  const root = grant?.params?.[PATH_BOUNDARY_ROOT_PARAM];
  return root && root.length > 0 ? root : undefined;
}
