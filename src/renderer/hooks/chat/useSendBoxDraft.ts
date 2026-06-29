import type { TChatConversation } from '@/common/config/storage';
import { useCallback, useMemo } from 'react';
import useSWR from 'swr';
import type { FileOrFolderItem } from '@/renderer/utils/file/fileTypes';
export type { FileOrFolderItem } from '@/renderer/utils/file/fileTypes';

type Draft =
  | {
      _type: 'gemini';
      content: string;
      atPath: Array<string | FileOrFolderItem>;
      uploadFile: string[];
    }
  | {
      _type: 'claude';
      content: unknown;
    }
  | {
      _type: 'acp';
      content: string;
      atPath: Array<string | FileOrFolderItem>;
      uploadFile: string[];
    }
  | {
      _type: 'codex';
      content: string;
      atPath: Array<string | FileOrFolderItem>;
      uploadFile: string[];
    }
  | {
      _type: 'openclaw-gateway';
      content: string;
      atPath: Array<string | FileOrFolderItem>;
      uploadFile: string[];
    }
  | {
      _type: 'nanobot';
      content: string;
      atPath: Array<string | FileOrFolderItem>;
      uploadFile: string[];
    }
  | {
      _type: 'remote';
      content: string;
      atPath: Array<string | FileOrFolderItem>;
      uploadFile: string[];
    }
  | {
      _type: 'wcore';
      content: string;
      atPath: Array<string | FileOrFolderItem>;
      uploadFile: string[];
    };

/**
 * Currently supported conversation types and their corresponding draft objects.
 */
type SendBoxDraftStore = {
  [K in TChatConversation['type']]: Map<string, Extract<Draft, { _type: K }>>;
};

const store: SendBoxDraftStore = {
  gemini: new Map(),
  acp: new Map(),
  codex: new Map(),
  'openclaw-gateway': new Map(),
  nanobot: new Map(),
  remote: new Map(),
  wcore: new Map(),
};

/**
 * Test-only: drop every in-memory draft (localStorage is left intact). Lets a
 * test simulate a renderer reload - the in-memory store is gone but the durable
 * copy survives, which is exactly the scenario #412 fixes.
 */
export function __clearInMemoryDraftsForTests(): void {
  for (const map of Object.values(store)) map.clear();
}

// ── Durable persistence (#412) ───────────────────────────────────────────────
// The in-memory `store` above survives navigation and component remounts within
// a single renderer session, but is wiped whenever the renderer reloads or the
// app restarts/crashes - which is exactly when users reported losing typed-but-
// unsent text ("the system jumps and all my words are lost"). Mirror each draft
// into localStorage (synchronous, renderer-local, survives reload/restart) so a
// half-written message is never dropped. Failures here are non-fatal: the
// in-memory store keeps working if storage is unavailable or over quota.
const DRAFT_STORAGE_PREFIX = 'wayland:sendbox-draft:';

// Coalesce rapid keystrokes into a single durable write. The in-memory store is
// still updated synchronously (so reads stay correct), but the localStorage
// mirror is deferred by this trailing debounce - a large draft no longer pays a
// JSON.stringify + setItem on every keystroke, which is what added input lag.
const DRAFT_WRITE_DEBOUNCE_MS = 300;

function draftStorageKey(type: string, conversation_id: string): string {
  return `${DRAFT_STORAGE_PREFIX}${type}:${conversation_id}`;
}

/** A draft worth persisting has typed content or attached files; anything else is noise. */
function isDraftPersistable(draft: Draft | undefined): boolean {
  if (!draft) return false;
  const content = (draft as { content?: unknown }).content;
  if (typeof content === 'string' && content.length > 0) return true;
  const atPath = (draft as { atPath?: unknown[] }).atPath;
  if (Array.isArray(atPath) && atPath.length > 0) return true;
  const uploadFile = (draft as { uploadFile?: unknown[] }).uploadFile;
  if (Array.isArray(uploadFile) && uploadFile.length > 0) return true;
  return false;
}

/** Read a persisted draft from localStorage. Returns undefined on miss, parse error, or type drift. */
function readPersistedDraft<K extends TChatConversation['type']>(
  type: K,
  conversation_id: string
): Extract<Draft, { _type: K }> | undefined {
  if (typeof localStorage === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem(draftStorageKey(type, conversation_id));
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Draft;
    // Guard against schema drift across releases: only accept a matching _type.
    if (!parsed || parsed._type !== type) return undefined;
    return parsed as Extract<Draft, { _type: K }>;
  } catch {
    return undefined;
  }
}

/** A storage error that means the draft was not persisted (over quota), across browsers/Electron. */
function isQuotaExceededError(error: unknown): boolean {
  if (!(error instanceof DOMException)) return false;
  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014
  );
}

/**
 * Synchronously write-through a draft to localStorage, or clear it once the
 * draft is empty (e.g. after send). Storage failures are surfaced, not swallowed:
 * a quota/serialization error means the draft was NOT persisted and will be lost
 * on reload, so warn loudly. The in-memory store keeps working either way, so
 * typing is never blocked.
 */
function persistDraftNow(type: string, conversation_id: string, draft: Draft | undefined): void {
  if (typeof localStorage === 'undefined') return;
  const key = draftStorageKey(type, conversation_id);
  try {
    if (isDraftPersistable(draft)) {
      localStorage.setItem(key, JSON.stringify(draft));
    } else {
      localStorage.removeItem(key);
    }
  } catch (error) {
    if (isQuotaExceededError(error)) {
      console.warn(
        `[sendbox-draft] localStorage quota exceeded; draft "${key}" was not saved and may be lost on reload.`,
        error
      );
    } else {
      console.warn(`[sendbox-draft] failed to persist draft "${key}"; it may be lost on reload.`, error);
    }
  }
}

type PendingDraftWrite = {
  timer: ReturnType<typeof setTimeout>;
  type: string;
  conversation_id: string;
  draft: Draft | undefined;
};

// One pending trailing write per draft key; a newer keystroke replaces the older.
const pendingDraftWrites = new Map<string, PendingDraftWrite>();

/** Cancel any scheduled trailing write for a key (its value is now stale or being flushed). */
function cancelPendingDraftWrite(key: string): void {
  const pending = pendingDraftWrites.get(key);
  if (pending) {
    clearTimeout(pending.timer);
    pendingDraftWrites.delete(key);
  }
}

/**
 * Mirror a draft to durable storage. An empty draft (after send/clear) flushes
 * immediately so the key never lingers on disk; a non-empty draft is coalesced
 * through a short trailing debounce so rapid typing writes once after input
 * settles instead of on every keystroke.
 */
function writePersistedDraft(type: string, conversation_id: string, draft: Draft | undefined): void {
  if (typeof localStorage === 'undefined') return;
  const key = draftStorageKey(type, conversation_id);
  // Removal must not be debounced: a deferred clear would leave just-sent text on
  // disk between send and the timer firing.
  if (!isDraftPersistable(draft)) {
    cancelPendingDraftWrite(key);
    persistDraftNow(type, conversation_id, draft);
    return;
  }
  cancelPendingDraftWrite(key);
  const timer = setTimeout(() => {
    pendingDraftWrites.delete(key);
    persistDraftNow(type, conversation_id, draft);
  }, DRAFT_WRITE_DEBOUNCE_MS);
  pendingDraftWrites.set(key, { timer, type, conversation_id, draft });
}

/**
 * Remove every persisted send-box draft for a conversation across all draft
 * types, and drop the matching in-memory entries. Called when a conversation is
 * deleted: the delete sites don't know the conversation's draft type, so this
 * matches on the `wayland:sendbox-draft:<type>:<conversation_id>` key suffix.
 * Without this, an unsent draft for a deleted conversation lingers on disk
 * (unbounded growth + deleted text remains stored).
 */
export function clearPersistedDraftsForConversation(conversation_id: string): void {
  // Drop in-memory drafts (the type is unknown here, so clear every map).
  for (const map of Object.values(store)) map.delete(conversation_id);
  // Cancel any debounced write still pending for this conversation. A draft
  // deleted inside the debounce window may not be on disk yet, so the storage
  // scan below would miss it and the trailing timer would re-persist the deleted
  // draft after we clear. Match on conversation_id, not the (unknown) draft type.
  for (const [key, pending] of pendingDraftWrites) {
    if (pending.conversation_id === conversation_id) {
      clearTimeout(pending.timer);
      pendingDraftWrites.delete(key);
    }
  }
  if (typeof localStorage === 'undefined') return;
  // Best-effort: enumerating or mutating localStorage can throw outright when
  // storage is blocked/disabled. This runs after the conversation is already
  // deleted, so a throw here must never bubble up - the delete sites call this
  // inside their own try/catch and would otherwise report a successful delete as
  // failed (and skip refresh/navigation).
  try {
    const suffix = `:${conversation_id}`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DRAFT_STORAGE_PREFIX) && key.endsWith(suffix)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      cancelPendingDraftWrite(key);
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn(`[sendbox-draft] failed to clear drafts for a deleted conversation "${conversation_id}".`, error);
  }
}

/** Synchronously write out every pending debounced draft (e.g. just before the renderer unloads). */
function flushPendingDraftWrites(): void {
  for (const pending of pendingDraftWrites.values()) {
    clearTimeout(pending.timer);
    persistDraftNow(pending.type, pending.conversation_id, pending.draft);
  }
  pendingDraftWrites.clear();
}

// A reload/close can land inside the 300ms debounce window, leaving the latest
// edit only in memory. Flush pending writes on unload so the durable copy still
// survives the reload/restart - the exact guarantee #412 added. `pagehide` fires
// reliably on both reload and navigation (more so than `beforeunload`).
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushPendingDraftWrites);
}

/**
 * Test-only: synchronously flush any pending debounced durable writes so a test
 * can assert on localStorage without waiting for the trailing timer to fire.
 */
export function __flushPersistedDraftWritesForTests(): void {
  flushPendingDraftWrites();
}

const setDraft = <K extends TChatConversation['type']>(
  type: K,
  conversation_id: string,
  draft: Extract<Draft, { _type: K }> | undefined
) => {
  // TODO import ts-pattern for exhaustive check
  switch (type) {
    case 'gemini':
      if (draft) {
        store.gemini.set(conversation_id, draft as Extract<Draft, { _type: 'gemini' }>);
      } else {
        store.gemini.delete(conversation_id);
      }
      break;
    case 'acp':
      if (draft) {
        store.acp.set(conversation_id, draft as Extract<Draft, { _type: 'acp' }>);
      } else {
        store.acp.delete(conversation_id);
      }
      break;
    case 'codex':
      if (draft) {
        store.codex.set(conversation_id, draft as Extract<Draft, { _type: 'codex' }>);
      } else {
        store.codex.delete(conversation_id);
      }
      break;
    case 'openclaw-gateway':
      if (draft) {
        store['openclaw-gateway'].set(conversation_id, draft as Extract<Draft, { _type: 'openclaw-gateway' }>);
      } else {
        store['openclaw-gateway'].delete(conversation_id);
      }
      break;
    case 'nanobot':
      if (draft) {
        store.nanobot.set(conversation_id, draft as Extract<Draft, { _type: 'nanobot' }>);
      } else {
        store.nanobot.delete(conversation_id);
      }
      break;
    case 'remote':
      if (draft) {
        store.remote.set(conversation_id, draft as Extract<Draft, { _type: 'remote' }>);
      } else {
        store.remote.delete(conversation_id);
      }
      break;
    case 'wcore':
      if (draft) {
        store.wcore.set(conversation_id, draft as Extract<Draft, { _type: 'wcore' }>);
      } else {
        store.wcore.delete(conversation_id);
      }
      break;
    default:
      break;
  }
  // Mirror the change to durable storage so the draft survives reload/restart (#412).
  writePersistedDraft(type, conversation_id, draft);
};

const getInMemoryDraft = <K extends TChatConversation['type']>(
  type: K,
  conversation_id: string
): Extract<Draft, { _type: K }> | undefined => {
  // TODO import ts-pattern for exhaustive check
  switch (type) {
    case 'gemini':
      return store.gemini.get(conversation_id) as Extract<Draft, { _type: K }>;
    case 'acp':
      return store.acp.get(conversation_id) as Extract<Draft, { _type: K }>;
    case 'codex':
      return store.codex.get(conversation_id) as Extract<Draft, { _type: K }>;
    case 'openclaw-gateway':
      return store['openclaw-gateway'].get(conversation_id) as Extract<Draft, { _type: K }>;
    case 'nanobot':
      return store.nanobot.get(conversation_id) as Extract<Draft, { _type: K }>;
    case 'remote':
      return store.remote.get(conversation_id) as Extract<Draft, { _type: K }>;
    case 'wcore':
      return store.wcore.get(conversation_id) as Extract<Draft, { _type: K }>;
    default:
      return undefined;
  }
};

const getDraft = <K extends TChatConversation['type']>(
  type: K,
  conversation_id: string
): Extract<Draft, { _type: K }> | undefined => {
  const inMemory = getInMemoryDraft(type, conversation_id);
  if (inMemory !== undefined) return inMemory;
  // Cold session (post reload/restart): rehydrate from durable storage and warm
  // the in-memory store so subsequent reads are cheap (#412).
  const persisted = readPersistedDraft(type, conversation_id);
  if (persisted !== undefined) {
    setDraft(type, conversation_id, persisted);
    return persisted;
  }
  return undefined;
};

/**
 * React Hook for conversation draft operations of a given type.
 */
export const getSendBoxDraftHook = <K extends TChatConversation['type']>(
  type: K,
  initialValue: Extract<Draft, { _type: K }>
) => {
  function useDraft(conversation_id: string) {
    // Synchronously seed SWR with the persisted draft so `data` is the saved
    // value on the VERY FIRST render after a reload/restart - never undefined.
    // Without this, a mount-time partial update (e.g. setAtPath) would run while
    // `data` is still undefined, rebuild the draft from the empty `initialValue`,
    // and clobber the persisted text before async hydration lands (#412). This
    // is a pure read (no side effects during render); the fetcher below performs
    // the actual in-memory hydration.
    const fallbackData = useMemo(
      () => getInMemoryDraft(type, conversation_id) ?? readPersistedDraft(type, conversation_id),
      [conversation_id]
    );
    const swrRet = useSWR(
      [`/send-box/${type}/draft/${conversation_id}`, conversation_id],
      ([_, id]) => {
        return getDraft(type, id);
      },
      { fallbackData }
    );

    const mutateDraft = useCallback(
      (draft: (k: Extract<Draft, { _type: K }>) => typeof k | undefined): void => {
        swrRet
          .mutate(
            (prev) => {
              // SWR's cached `prev` is undefined until the fetcher commits, so on
              // the first mutate after a reload we must fall back to the persisted
              // draft (not the empty initialValue) - otherwise a partial update
              // would rebuild from empty and wipe the saved text (#412).
              const base = prev ?? getDraft(type, conversation_id) ?? initialValue;
              const newDraft = draft(base);
              setDraft(type, conversation_id, newDraft);
              return newDraft;
            },
            { revalidate: false }
          )
          .catch((error) => {
            console.error('Failed to mutate draft:', error);
          });
      },
      [conversation_id]
    );

    return {
      get data() {
        return swrRet.data;
      },
      mutate: mutateDraft,
    };
  }

  return useDraft;
};
