/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1099 / #1098 — the process-side half of the permissive-escalation build,
 * asserted against the wayland-core v0.13.4 wire contract.
 *
 * v0.13.4 is not published yet, so these are contract tests, not live ones. The
 * frames below are transcribed from the engine's serde shapes at
 * `wayland-core` main `56ec176e`:
 *   - `ToolEscalation` is internally tagged (`tag = "kind"`, snake_case), so
 *     the discriminant arrives as `kind: "path_boundary"`;
 *   - `ApprovalScope` is EXTERNALLY tagged, so `Once`/`Always` stay bare
 *     strings and `AlwaysPath` is `{"always_path":{"root":…,"write":…}}`;
 *   - `RenderMime` is a CLOSED vocabulary of three tokens.
 */
import { describe, expect, it } from 'vitest';
import {
  PATH_BOUNDARY_DENY,
  PATH_BOUNDARY_GRANT_FOLDER,
  PATH_BOUNDARY_REMEMBER_FOLDER,
  PATH_BOUNDARY_ROOT_PARAM,
  isPathBoundaryConfirmation,
  isPathBoundaryGrantValue,
  isPathBoundaryOptionValue,
  pathBoundaryRootOf,
} from '@/common/chat/pathBoundaryConsent';
import { isRemoteDeniedConfirmation } from '@/common/adapter/bridgeAllowlist';
import { transformMessage } from '@/common/chat/chatLib';
import { previewContentTypeForRenderMime } from '@/renderer/pages/conversation/Preview/previewContentType';

const ROOT = '/Users/sean/Documents/reports';

describe('#1099 consent vocabulary', () => {
  it('shares no value with the ToolConfirmationOutcome vocabulary every other matcher keys on', () => {
    // The real strings, not a re-declaration: if either side is renamed this
    // stops being a tautology and starts being a comparison that can fail.
    const outcomes = ['proceed_once', 'proceed_always', 'proceed_always_server', 'proceed_always_tool', 'cancel'];
    for (const value of [PATH_BOUNDARY_GRANT_FOLDER, PATH_BOUNDARY_REMEMBER_FOLDER, PATH_BOUNDARY_DENY]) {
      expect(outcomes).not.toContain(value);
    }
    // CONTROL: the comparison does find a match when one exists.
    expect(outcomes).toContain('proceed_always');
  });

  it('identifies a boundary card from its options, and an ordinary card as not one', () => {
    const boundary = { options: [{ value: PATH_BOUNDARY_GRANT_FOLDER }, { value: PATH_BOUNDARY_DENY }] };
    const ordinary = { options: [{ value: 'proceed_once' }, { value: 'proceed_always' }, { value: 'cancel' }] };

    expect(isPathBoundaryConfirmation(boundary)).toBe(true);
    expect(isPathBoundaryConfirmation(ordinary)).toBe(false);
    expect(isPathBoundaryConfirmation({ options: [] })).toBe(false);
    expect(isPathBoundaryConfirmation({})).toBe(false);
  });

  it('reads the granted root back off the option that grants it', () => {
    const boundary = {
      options: [
        { value: PATH_BOUNDARY_GRANT_FOLDER, params: { [PATH_BOUNDARY_ROOT_PARAM]: ROOT } },
        { value: PATH_BOUNDARY_DENY },
      ],
    };
    expect(pathBoundaryRootOf(boundary)).toBe(ROOT);
    // A grant option with no root yields nothing rather than an empty grant.
    expect(pathBoundaryRootOf({ options: [{ value: PATH_BOUNDARY_GRANT_FOLDER, params: {} }] })).toBeUndefined();
    expect(pathBoundaryRootOf({ options: [{ value: 'proceed_always', params: { folder: ROOT } }] })).toBeUndefined();
  });

  it('recognises only its own three values', () => {
    expect(isPathBoundaryOptionValue(PATH_BOUNDARY_GRANT_FOLDER)).toBe(true);
    expect(isPathBoundaryOptionValue(PATH_BOUNDARY_REMEMBER_FOLDER)).toBe(true);
    expect(isPathBoundaryOptionValue(PATH_BOUNDARY_DENY)).toBe(true);
    expect(isPathBoundaryOptionValue('proceed_always')).toBe(false);
    expect(isPathBoundaryOptionValue(undefined)).toBe(false);
  });

  it('gives the three values three distinct strings', () => {
    // Two option values that collided would make the durable answer and the
    // session answer indistinguishable at the route, which is exactly the
    // mistake a copy-pasted constant produces.
    const values = [PATH_BOUNDARY_GRANT_FOLDER, PATH_BOUNDARY_REMEMBER_FOLDER, PATH_BOUNDARY_DENY];
    expect(new Set(values).size).toBe(3);
  });

  it('separates "is our vocabulary" from "hands over a folder"', () => {
    // Two different questions. Conflating them either lets a remote decline
    // through the allowlist gate (which keys on the first) or makes the deny
    // button grant (the route keys on the second).
    expect(isPathBoundaryGrantValue(PATH_BOUNDARY_GRANT_FOLDER)).toBe(true);
    expect(isPathBoundaryGrantValue(PATH_BOUNDARY_REMEMBER_FOLDER)).toBe(true);
    expect(isPathBoundaryGrantValue(PATH_BOUNDARY_DENY)).toBe(false);
    expect(isPathBoundaryGrantValue('proceed_always')).toBe(false);
  });
});

/**
 * THE POINT OF THE STRUCTURAL DESIGN, asserted rather than assumed.
 *
 * Adding a third option value must extend every exclusion in the app by
 * itself, because each of them reads one shared predicate rather than
 * comparing against a list of strings. These fixtures carry the durable value
 * and NOTHING ELSE from the card's vocabulary - no `PATH_BOUNDARY_GRANT_FOLDER`
 * to be recognised by - so an exclusion keyed on the old value specifically
 * would fail here while the ordinary boundary-card tests all still passed.
 */
/** The exact envelope the WebSocket adapter hands the remote-denial gate. */
const wire = (value: unknown) => ({
  id: 'req-1',
  data: { conversation_id: 'c1', msg_id: 'call-1', callId: 'call-1', data: value },
});

describe('#1099 a new option value extends every exclusion by itself', () => {
  const rememberOnly = {
    options: [
      { value: PATH_BOUNDARY_REMEMBER_FOLDER, params: { [PATH_BOUNDARY_ROOT_PARAM]: ROOT } },
      { value: PATH_BOUNDARY_DENY },
    ],
  };

  it('is recognised as a boundary card with no session-grant option present', () => {
    // `isPathBoundaryConfirmation` is the single predicate behind the
    // BaseAgentManager yolo gate, both ConversationChatConfirm exclusions, and
    // the renderer's card route. One recognition, four exclusions.
    expect(rememberOnly.options.map((o) => o.value)).not.toContain(PATH_BOUNDARY_GRANT_FOLDER);
    expect(isPathBoundaryConfirmation(rememberOnly)).toBe(true);
  });

  it('CONTROL: the same predicate still says no to an ordinary card', () => {
    expect(isPathBoundaryConfirmation({ options: [{ value: 'proceed_once' }, { value: 'cancel' }] })).toBe(false);
  });

  it('yields its root to the same accessor the card renders and the route grants from', () => {
    // Display and stored authority read ONE value. A `pathBoundaryRootOf` that
    // matched only the session-grant option would hand `undefined` to the
    // route, and the durable button would silently do nothing at all.
    expect(pathBoundaryRootOf(rememberOnly)).toBe(ROOT);
  });

  it('is refused to a remote peer by the bridge allowlist, unedited', () => {
    // `isRemoteDeniedConfirmation` keys on `isPathBoundaryOptionValue`, so this
    // denial came from widening the predicate and from nothing else.
    expect(isRemoteDeniedConfirmation('subscribe-confirmation.confirm', wire(PATH_BOUNDARY_REMEMBER_FOLDER))).toBe(
      true
    );
    // CONTROL, same call: an ordinary value is still allowed through, so the
    // denial above is the predicate deciding and not a blanket refusal.
    expect(isRemoteDeniedConfirmation('subscribe-confirmation.confirm', wire('proceed_once'))).toBe(false);
  });
});

describe('#1098 render_artifact viewer routing', () => {
  it('maps the closed mime vocabulary onto internal viewers, with no fallback branch', () => {
    expect(previewContentTypeForRenderMime('text/plain')).toBe('code');
    expect(previewContentTypeForRenderMime('text/markdown')).toBe('markdown');
    expect(previewContentTypeForRenderMime('text/html')).toBe('html');
  });

  it('projects a render_artifact frame into a chat message carrying content and NO path', () => {
    const message = transformMessage({
      type: 'render_artifact',
      conversation_id: 'conv-1098',
      msg_id: 'turn-1',
      data: {
        callId: 'call-9',
        title: 'Q3 summary',
        mime: 'text/markdown',
        content: '# Q3\n\nRevenue up.',
        truncated: false,
      },
    });

    expect(message).toBeTruthy();
    expect(message?.type).toBe('render_artifact');
    const content = message?.content as Record<string, unknown>;
    expect(content.content).toBe('# Q3\n\nRevenue up.');
    // The absence is the point: with no path there is nothing to hand the OS
    // launcher, which is why the card can only offer Preview.
    // The projected card carries exactly these five fields and nothing that
    // names a location on disk. Asserted as an exact key set, not as a list of
    // absences, so a path field added later fails here rather than sliding in.
    expect(Object.keys(content).sort()).toEqual(['callId', 'content', 'mime', 'title', 'truncated']);
  });
});
