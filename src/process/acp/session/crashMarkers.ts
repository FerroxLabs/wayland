/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Stable opening phrases of the two disconnect banners `buildCrashMessage`
 * produces, factored out because they are a de-facto protocol: two downstream
 * consumers classify a turn as "the agent died" by substring-matching the
 * user-facing text.
 *
 *  - `AcpAgentV2` (compat/AcpAgentV2.ts) matches to decide whether to synthesize
 *    the `finish` frame carrying `agentCrash: true`. Without that frame the
 *    renderer's loading state never clears.
 *  - `TeammateManager` matches to route the agent into `handleAgentCrash`.
 *
 * #1020 added the second phrase (a transport drop with no observed process
 * exit). Any new banner wording MUST be added here and to both matchers, or the
 * disconnect stops terminating the turn.
 *
 * Kept dependency-free so `TeammateManager` can import it without dragging the
 * ACP session tree in.
 */

/** An exit code or a signal was actually observed. */
export const CRASH_MARKER_PROCESS_EXIT = 'process exited unexpectedly';

/**
 * The transport dropped and NO exit code or signal was observed, so neither a
 * process death nor a live child is proven. The banner says only that, and
 * deliberately does not reassure the user that the child is probably alive.
 */
export const CRASH_MARKER_TRANSPORT_CLOSE = 'lost the connection to the agent process';
