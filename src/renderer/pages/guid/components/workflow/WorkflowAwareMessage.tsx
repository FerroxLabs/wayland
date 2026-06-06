/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WorkflowAwareMessage - render-prop wrapper that strips workflow control
 * markers (<step>, <ask>) from an agent message body before handing the
 * cleaned text to a downstream markdown renderer, and emits each extracted
 * marker via `onMarker` so the host page can route it to
 * `useWorkflowSession.applyStepMarker(...)`.
 *
 * v1 strategy (post-stream finalize-only):
 *   - Run the AST-authoritative `finalize()` pass once per `body` change.
 *   - Hand `finalOutput` to the render-prop child.
 *   - Emit each `finalMarkers[i]` via `onMarker` exactly once per body change.
 *
 * Mid-stream, a half-rendered marker may briefly appear in the raw body
 * before this wrapper sees the completed text; once the message finishes
 * streaming and re-renders with the full body, finalize() strips it.
 * Streaming-time per-chunk stripping (Phase 1) is intentionally deferred -
 * the wrapper's contract is "post-stream truth", which matches how
 * `useWorkflowSession.applyStepMarker(...)` is invoked from the host.
 *
 * TODO: wire this wrapper into the conversation page's message renderer
 * once GuidPage decomposition lands (W8). For now, the wrapper IS the
 * contract - it lets W4.5 ship without touching the dense message
 * pipeline, and W8 swaps in the wire-in.
 *
 * Spec: .planning/brainstorm/2026-05-25-workflow-launch-surface/SPEC.md §8, §11.2
 */

import React from 'react';
import {
  createParserState,
  finalize,
} from '@/renderer/pages/guid/components/workflow/workflowMarkerParser';
import type { WorkflowMarker } from '@/common/types/workflowTypes';

export type WorkflowAwareMessageProps = {
  /** Full message text (post-stream - agent's complete message body). */
  body: string;
  /** Total steps in the workflow (used for marker validation per SPEC §7.4). */
  totalSteps: number;
  /** Called for every marker the AST pass extracts. */
  onMarker: (marker: WorkflowMarker) => void;
  /**
   * Children = a render-prop receiving the cleaned (markers-stripped) body.
   * Caller wraps with their preferred markdown renderer.
   */
  children: (cleanedBody: string) => React.ReactNode;
};

export const WorkflowAwareMessage: React.FC<WorkflowAwareMessageProps> = ({
  body,
  totalSteps,
  onMarker,
  children,
}) => {
  const { finalOutput, finalMarkers } = React.useMemo(() => {
    return finalize(createParserState(), totalSteps, body);
  }, [body, totalSteps]);

  // Emit markers once per body change. The dependency on `finalMarkers`
  // is intentional: it's a fresh array each time `body` changes (memo above
  // recomputes), so the effect fires exactly once per stable body.
  React.useEffect(() => {
    for (const m of finalMarkers) {
      onMarker(m);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalMarkers]);

  return <>{children(finalOutput)}</>;
};
