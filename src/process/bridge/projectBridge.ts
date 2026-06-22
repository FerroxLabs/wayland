/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs/promises';
import { confinePath } from './pathConfinement';
import { ipcBridge } from '@/common';
import { projectServiceSingleton as projectService } from '@process/services/projectServiceSingleton';
import {
  readProjectKnowledge,
  writeProjectKnowledge,
  listProjectReference,
  addProjectReference,
  removeProjectReference,
  readProjectSummaries,
  writeProjectSummary,
  appendProjectDecision,
  readProjectIjfwMemory,
} from '@process/services/projectKnowledge/knowledge';
import { hasUsableModel, oneShotComplete, oneShotCompleteBest } from '@process/services/completion/oneShot';

/** Prompt the cheap model with a knowledge doc and ask for a single-sentence summary. */
const SUMMARY_KIND_LABEL = { context: 'project instructions', rules: 'project rules', decisions: 'project decisions' };

/** Per-file and total caps when ingesting uploaded/pasted source for a draft. */
const DRAFT_FILE_CHAR_CAP = 8_000;
const DRAFT_TOTAL_CHAR_CAP = 24_000;

/**
 * Read uploaded source files as text, truncated, for the draft prompt.
 * Best-effort. Exported for confinement regression testing (RT-F2-01).
 */
export async function readSourceFiles(filePaths: string[]): Promise<string> {
  const parts: string[] = [];
  let budget = DRAFT_TOTAL_CHAR_CAP;
  for (const p of filePaths) {
    if (budget <= 0) break;
    // Confine each renderer/remote-supplied path to the app's authorized roots
    // before reading. Without this, an arbitrary absolute path (~/.ssh/id_rsa,
    // ~/.aws/credentials, /etc/passwd) would be read and embedded in the draft
    // prompt returned to the renderer - an exfiltration channel (RT-F2-01).
    // Fail closed: a rejected path is skipped, never read raw.
    const safePath = await confinePath(p);
    if (safePath === null) continue;
    try {
      const raw = await fs.readFile(safePath, 'utf-8');
      const slice = raw.slice(0, Math.min(DRAFT_FILE_CHAR_CAP, budget));
      budget -= slice.length;
      const name = safePath.split(/[\\/]/).pop() || safePath;
      parts.push(`--- ${name} ---\n${slice}`);
    } catch {
      // Unreadable / binary file - skip silently.
    }
  }
  return parts.join('\n\n');
}

/** Build the best-practice drafting prompt for Instructions (context) or Rules. */
function buildDraftPrompt(params: {
  name?: string;
  description?: string;
  kind: 'context' | 'rules';
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

/** Resolve a project's workspace dir, throwing a clear error if unset. */
async function requireWorkspace(id: string): Promise<string> {
  const project = await projectService.getProject(id);
  if (!project?.workspace) throw new Error('Project has no workspace folder');
  return project.workspace;
}

/**
 * Initialize project IPC bridge handlers. A project is an umbrella over
 * conversations; there is no execution lock, so none of these handlers gate on
 * a "currently running" conversation. `changed` is emitted after every mutation
 * so the renderer can refresh the project list and per-project chat counts.
 */
export function initProjectBridge(): void {
  ipcBridge.project.create.provider(async (params) => {
    const project = await projectService.createProject(params);
    ipcBridge.project.changed.emit(undefined);
    return project;
  });

  ipcBridge.project.get.provider(async ({ id }) => {
    return projectService.getProject(id);
  });

  ipcBridge.project.list.provider(async () => {
    return projectService.listProjects();
  });

  ipcBridge.project.update.provider(async ({ id, updates }) => {
    await projectService.updateProject(id, updates);
    ipcBridge.project.changed.emit(undefined);
  });

  ipcBridge.project.remove.provider(async ({ id }) => {
    await projectService.removeProject(id);
    ipcBridge.project.changed.emit(undefined);
  });

  ipcBridge.project.getConversations.provider(async ({ projectId }) => {
    return projectService.getProjectConversations(projectId);
  });

  ipcBridge.project.assignConversation.provider(async ({ conversationId, projectId }) => {
    await projectService.assignConversation(conversationId, projectId);
    // PERF-IPC-01: only one project's chat count changed - emit a targeted
    // payload so the renderer can patch that single row instead of re-listing.
    const count = (await projectService.getProjectConversations(projectId)).length;
    ipcBridge.project.changed.emit({ id: projectId, count });
    ipcBridge.conversation.listChanged.emit({
      conversationId,
      action: 'updated',
      source: 'project-assignment',
    });
  });

  ipcBridge.project.removeConversation.provider(async ({ conversationId }) => {
    await projectService.removeConversationFromProject(conversationId);
    // The service detaches without reporting which project lost the conversation,
    // so we can't cheaply target one row here - emit the broad refresh signal
    // (unchanged behavior). assignConversation above carries the targeted payload
    // since it already knows the destination projectId (PERF-IPC-01).
    ipcBridge.project.changed.emit(undefined);
    ipcBridge.conversation.listChanged.emit({
      conversationId,
      action: 'updated',
      source: 'project-assignment',
    });
  });

  ipcBridge.project.readKnowledge.provider(async ({ id }) => {
    const project = await projectService.getProject(id);
    // No workspace yet → empty docs (the UI prompts the user to set a folder).
    if (!project?.workspace) return { context: '', rules: '', decisions: '' };
    return readProjectKnowledge(project.workspace);
  });

  ipcBridge.project.writeKnowledge.provider(async ({ id, kind, content }) => {
    const workspace = await requireWorkspace(id);
    await writeProjectKnowledge(workspace, kind, content);
  });

  ipcBridge.project.listReference.provider(async ({ id }) => {
    const project = await projectService.getProject(id);
    if (!project?.workspace) return [];
    return listProjectReference(project.workspace);
  });

  ipcBridge.project.addReference.provider(async ({ id, filePaths }) => {
    const workspace = await requireWorkspace(id);
    return addProjectReference(workspace, filePaths);
  });

  ipcBridge.project.removeReference.provider(async ({ id, name }) => {
    const workspace = await requireWorkspace(id);
    return removeProjectReference(workspace, name);
  });

  ipcBridge.project.readSummaries.provider(async ({ id }) => {
    const project = await projectService.getProject(id);
    if (!project?.workspace) return {};
    return readProjectSummaries(project.workspace);
  });

  ipcBridge.project.writeSummary.provider(async ({ id, kind, summary }) => {
    const workspace = await requireWorkspace(id);
    await writeProjectSummary(workspace, kind, summary);
  });

  ipcBridge.project.hasUsableModel.provider(async () => hasUsableModel());

  ipcBridge.project.generateSummary.provider(async ({ id, kind }) => {
    // Never reject: a model error must stop the UI spinner and surface a message,
    // not hang the in-flight invoke. Errors are returned, not thrown.
    try {
      const workspace = await requireWorkspace(id);
      const knowledge = await readProjectKnowledge(workspace);
      const body = knowledge[kind]?.trim();
      if (!body) return { summary: '' };
      const prompt =
        `Write a single concise sentence (max 18 words) summarizing the following ${SUMMARY_KIND_LABEL[kind]}. ` +
        `Reply with only the sentence, no preamble, no quotes.\n\n---\n${body}`;
      const raw = await oneShotComplete(prompt, { maxTokens: 80 });
      // Defend against a chatty model: keep the first line, strip wrapping quotes.
      const summary = raw
        .split('\n')[0]
        .trim()
        .replace(/^["']|["']$/g, '');
      await writeProjectSummary(workspace, kind, summary);
      return { summary };
    } catch (err) {
      console.error('[projectBridge] generateSummary failed:', err);
      const msg = err instanceof Error ? err.message : '';
      return { summary: '', error: msg === 'no-usable-model' ? 'no-model' : 'failed' };
    }
  });

  ipcBridge.project.generateKnowledgeDraft.provider(
    async ({ name, description, kind, sourceText, filePaths, relatedKnowledge, audience, constraints }) => {
      // High-stakes, rarely-run: use the best model the user has, not the cheap one.
      // Never reject - return a structured error so the wizard never hangs.
      try {
        const sourceFiles = filePaths && filePaths.length > 0 ? await readSourceFiles(filePaths) : '';
        const prompt = buildDraftPrompt({
          name,
          description,
          kind,
          sourceText,
          sourceFiles,
          relatedKnowledge,
          audience,
          constraints,
        });
        // A 1200-token draft from a flagship/reasoning model can take well over the
        // cheap-summary timeout; give it room so it doesn't abort mid-generation.
        // oneShotCompleteBest tries each usable provider in ranked order, so a single
        // broken "best" provider no longer hard-fails the draft (#244/#248).
        const raw = await oneShotCompleteBest(prompt, { maxTokens: 1200, timeoutMs: 90_000 });
        // Strip accidental wrapping code fences from a chatty model.
        const draft = raw
          .replace(/^```(?:markdown|md)?\s*\n?/i, '')
          .replace(/\n?```\s*$/i, '')
          .trim();
        return { draft };
      } catch (err) {
        console.error('[projectBridge] generateKnowledgeDraft failed:', err);
        const msg = err instanceof Error ? err.message : '';
        if (msg === 'no-usable-model') return { draft: '', error: 'no-model' };
        // Surface the real cause (provider status + message, or an abort/timeout)
        // so the wizard can tell the user WHY instead of a dead-end 'failed' (#221).
        return { draft: '', error: 'failed', detail: msg || undefined };
      }
    }
  );

  ipcBridge.project.appendDecision.provider(async ({ id, text }) => {
    const workspace = await requireWorkspace(id);
    const decisions = await appendProjectDecision(workspace, text);
    return { decisions };
  });

  ipcBridge.project.readIjfwMemory.provider(async ({ id }) => {
    const project = await projectService.getProject(id);
    if (!project?.workspace) return { available: false, files: [] };
    return readProjectIjfwMemory(project.workspace);
  });
}
