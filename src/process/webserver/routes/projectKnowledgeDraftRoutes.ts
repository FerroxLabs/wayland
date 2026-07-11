/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Headless-WebUI route for the Project AI Knowledge Wizard draft step
 * (remote-secure-config W1.C, issue #234).
 *
 * Trust model: this is an AUTHENTICATED MODEL/DRAFT route, NOT a config write
 * (#683). It mutates no config and touches no secret — it drafts text from
 * user-provided context — so the CONFIG-WRITE floor (`requireSecureConfigWrite`,
 * the HTTPS-when-public refusal for secret writes) does NOT apply here. Gating
 * it there wrongly 403'd legitimate draft generation. The IPC action
 * `project.generate-knowledge-draft` remains in the remote-deny list (defense
 * in depth); headless renderers use this authenticated HTTP route instead.
 *
 * Security invariants:
 *  - `confinePath` is called for EVERY caller-supplied file path before the
 *    file is read. A path that escapes the app's authorized roots is skipped,
 *    never read raw (RT-F2-01). This is enforced by `readSourceFiles` in
 *    projectBridge.ts which this route imports and calls directly.
 *  - The response returns ONLY the generated draft string (+ a fixed error
 *    enum). It never echoes file paths, file names, or any path metadata back
 *    to the caller (§0 invariant: no exfiltration channel).
 *  - Auth middleware stack: `validateApiAccess` (token) + tiny-csrf (global)
 *    + `apiRateLimiter`. Real config/secret writes (provider keys, MCP config,
 *    channels, ...) keep `requireSecureConfigWrite` unchanged.
 */

import { type Express, type Request, type RequestHandler, type Response } from 'express';
import { apiRateLimiter } from '../middleware/security';
import { detectNetworkContext } from '../middleware/detectNetworkContext';
import { appendAudit } from '../audit/auditLog';
import { readSourceFiles } from '@process/bridge/projectBridge';
import { hasUsableModel, oneShotCompleteBest } from '@process/services/completion/oneShot';

type DraftKind = 'context' | 'rules';

interface DraftRequestBody {
  name?: string;
  description?: string;
  kind?: DraftKind;
  sourceText?: string;
  filePaths?: string[];
  relatedKnowledge?: string;
  audience?: string;
  constraints?: string;
}

// `detail` mirrors the IPC path (#221): the real provider cause (e.g. "401:
// invalid api key", "Provider returned HTTP 502 (non-JSON response)") so
// headless WebUI users see WHY a draft failed, not a dead-end "failed" (#238).
// It carries only provider/HTTP error text — never file paths (readSourceFiles
// fails closed and never throws a path), so the no-exfiltration invariant holds.
type DraftResponse = { draft: string; error?: 'no-model' | 'failed'; detail?: string };

function bodyString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function bodyStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

/** Build the best-practice drafting prompt for Instructions (context) or Rules. */
function buildDraftPrompt(params: {
  name?: string;
  description?: string;
  kind: DraftKind;
  sourceText?: string;
  sourceFiles?: string;
  relatedKnowledge?: string;
  audience?: string;
  constraints?: string;
}): string {
  const { name, description, kind, sourceText, sourceFiles, relatedKnowledge, audience, constraints } = params;
  const guidance =
    kind === 'rules'
      ? 'Write a tight set of hard rules and conventions as markdown bullet points: non-negotiables, formatting/tone constraints, and explicit never-dos. Derive them from the project intent and everything provided above. Keep it scannable. No long prose.'
      : 'Write concise project instructions as markdown with short `##` sections: what this project is, who it is for, tone & voice, what every chat should always keep in mind, and a brief definition of done. Be concrete, not generic.';
  const lines: string[] = [
    `You are helping a user author the ${kind === 'rules' ? 'Rules & conventions' : 'Instructions'} document for a project.`,
    'This document is injected into EVERY AI chat in the project, so it must be high-signal, concrete, and free of filler.',
    '',
  ];
  if (name) lines.push(`Project name: ${name}`);
  if (description) lines.push(`Project description: ${description}`);
  if (audience) lines.push(`Audience: ${audience}`);
  if (constraints) lines.push(`Must always keep in mind: ${constraints}`);
  if (relatedKnowledge && relatedKnowledge.trim())
    lines.push(
      '',
      "The project's existing instructions and decisions (use these to infer intent):",
      relatedKnowledge.trim()
    );
  if (sourceText && sourceText.trim()) lines.push('', 'What the user said about the project:', sourceText.trim());
  if (sourceFiles && sourceFiles.trim()) lines.push('', 'Reference material the user provided:', sourceFiles.trim());
  lines.push(
    '',
    guidance,
    '',
    'Output ONLY the document as clean markdown. No preamble, no closing remarks, no code fences.'
  );
  return lines.join('\n');
}

/**
 * Execute the knowledge draft: pick best model, confine+read files, call LLM.
 * Shared logic between the IPC handler (projectBridge.ts) and this HTTP route.
 * Never throws — returns a structured result so callers never hang.
 */
export async function generateKnowledgeDraftLogic(params: {
  name?: string;
  description?: string;
  kind: DraftKind;
  sourceText?: string;
  filePaths?: string[];
  relatedKnowledge?: string;
  audience?: string;
  constraints?: string;
}): Promise<DraftResponse> {
  try {
    if (!(await hasUsableModel())) return { draft: '', error: 'no-model' };
    // readSourceFiles calls confinePath on every path — this is the security gate.
    const sourceFiles = params.filePaths && params.filePaths.length > 0 ? await readSourceFiles(params.filePaths) : '';
    const prompt = buildDraftPrompt({
      name: params.name,
      description: params.description,
      kind: params.kind,
      sourceText: params.sourceText,
      sourceFiles,
      relatedKnowledge: params.relatedKnowledge,
      audience: params.audience,
      constraints: params.constraints,
    });
    // Tries each usable provider in ranked order so one broken "best" provider
    // doesn't hard-fail the draft (#244/#248).
    const raw = await oneShotCompleteBest(prompt, { maxTokens: 1200, timeoutMs: 90_000 });
    const draft = raw
      .replace(/^```(?:markdown|md)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();
    return { draft };
  } catch (err) {
    console.error('[projectKnowledgeDraftRoutes] generateKnowledgeDraftLogic failed:', err);
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'no-usable-model') return { draft: '', error: 'no-model' };
    // Surface the real cause to headless users (parity with the IPC path, #238).
    return { draft: '', error: 'failed', detail: msg || undefined };
  }
}

/**
 * Register the headless knowledge-draft route for the remote WebUI (W1.C).
 */
export function registerProjectKnowledgeDraftRoutes(app: Express, validateApiAccess: RequestHandler): void {
  // POST /api/projects/generate-knowledge-draft
  // Returns { draft: string; error?: 'no-model' | 'failed' } — never echoes
  // file paths or names, never returns raw file content.
  app.post(
    '/api/projects/generate-knowledge-draft',
    apiRateLimiter,
    validateApiAccess,
    async (req: Request, res: Response) => {
      // No CONFIG-WRITE floor here (#683): drafting writes no config/secret,
      // so it must not be refused by the secure-config-write gate. Auth
      // (validateApiAccess), CSRF (global tiny-csrf) and rate-limit
      // (apiRateLimiter) above are the correct permission class.
      const body = (req.body ?? {}) as DraftRequestBody;
      const kind = bodyString(body.kind).trim();
      if (kind !== 'context' && kind !== 'rules') {
        res.status(400).json({ success: false, msg: 'kind must be "context" or "rules"' });
        return;
      }

      const ctx = detectNetworkContext(req);
      const ip = req.socket?.remoteAddress ?? null;

      // Audit the call attempt (never the draft content or file paths).
      void appendAudit({
        userId: req.user?.id ?? null,
        action: 'project.generate-knowledge-draft',
        target: kind,
        ip,
        reachedVia: ctx.reachedVia,
      });

      const result = await generateKnowledgeDraftLogic({
        name: bodyString(body.name) || undefined,
        description: bodyString(body.description) || undefined,
        kind: kind as DraftKind,
        sourceText: bodyString(body.sourceText) || undefined,
        // filePaths: confine+read happens inside generateKnowledgeDraftLogic →
        // readSourceFiles → confinePath. Security gate is preserved.
        filePaths: bodyStringArray(body.filePaths),
        relatedKnowledge: bodyString(body.relatedKnowledge) || undefined,
        audience: bodyString(body.audience) || undefined,
        constraints: bodyString(body.constraints) || undefined,
      });

      // Return DRAFT ONLY. Never echo file paths, names, or input metadata.
      res.json({ success: true, data: result });
    }
  );
}
