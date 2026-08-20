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
  PATH_BOUNDARY_ROOT_PARAM,
  isPathBoundaryConfirmation,
  isPathBoundaryOptionValue,
  pathBoundaryRootOf,
} from '@/common/chat/pathBoundaryConsent';
import { transformMessage } from '@/common/chat/chatLib';
import { previewContentTypeForRenderMime } from '@/renderer/pages/conversation/Preview/previewContentType';

const ROOT = '/Users/sean/Documents/reports';

describe('#1099 consent vocabulary', () => {
  it('shares no value with the ToolConfirmationOutcome vocabulary every other matcher keys on', () => {
    // The real strings, not a re-declaration: if either side is renamed this
    // stops being a tautology and starts being a comparison that can fail.
    const outcomes = ['proceed_once', 'proceed_always', 'proceed_always_server', 'proceed_always_tool', 'cancel'];
    for (const value of [PATH_BOUNDARY_GRANT_FOLDER, PATH_BOUNDARY_DENY]) {
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

  it('recognises only its own two values', () => {
    expect(isPathBoundaryOptionValue(PATH_BOUNDARY_GRANT_FOLDER)).toBe(true);
    expect(isPathBoundaryOptionValue(PATH_BOUNDARY_DENY)).toBe(true);
    expect(isPathBoundaryOptionValue('proceed_always')).toBe(false);
    expect(isPathBoundaryOptionValue(undefined)).toBe(false);
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
