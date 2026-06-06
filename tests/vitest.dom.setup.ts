/**
 * Vitest DOM Test Setup
 * Configuration for React component and hook tests using jsdom
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import * as React from 'react';

// `electron-log/renderer` talks to the Electron main process over IPC. Under
// jsdom there is no main process, so importing it HANGS at module-evaluation
// time. That hang happens during test COLLECTION (a static `import`), which
// `testTimeout` cannot bound - it only bounds test/hook bodies - so a single
// renderer module that logs (e.g. ErrorBoundary, and transitively Router) stalls
// the whole worker until the CI job's hard timeout cancels the shard. Stub it
// globally so any renderer module can be imported in DOM tests. A per-file
// `vi.mock('electron-log/renderer', ...)` still overrides this where a test
// wants to assert on log calls.
vi.mock('electron-log/renderer', () => {
  const logger = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    verbose: vi.fn(),
    silly: vi.fn(),
    log: vi.fn(),
  };
  return { default: logger, ...logger };
});

// Lucide test-id stamping: every Lucide icon gets data-testid='icon-<ComponentName>'
// automatically. Stable across icon swaps; no per-icon TESTID_MAP maintenance.
// Tests that previously asserted on icon-park kebab ids (e.g. `icon-delete`) must
// migrate to Lucide PascalCase ids (e.g. `icon-Trash2`).
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('lucide-react');
  const wrapped: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(actual)) {
    if (typeof value === 'object' && value && (value as { $$typeof?: symbol }).$$typeof) {
      const Original = value as React.ComponentType<Record<string, unknown>>;
      const Display = React.forwardRef<unknown, Record<string, unknown>>((props, ref) => {
        const merged = 'data-testid' in props ? props : { ...props, 'data-testid': `icon-${name}` };
        return React.createElement(Original, { ...merged, ref } as Record<string, unknown>);
      });
      Display.displayName = name;
      wrapped[name] = Display;
    } else {
      wrapped[name] = value;
    }
  }
  return wrapped;
});

// Make this a module

// Extend global types for testing
declare global {
  // eslint-disable-next-line no-var
  var electronAPI: any;
}

const noop = () => Promise.resolve();

// Mock Electron APIs for testing
const windowControlsMock = {
  minimize: noop,
  maximize: noop,
  unmaximize: noop,
  close: noop,
  isMaximized: () => Promise.resolve(false),
  onMaximizedChange: (): (() => void) => () => void 0,
};

(global as any).electronAPI = {
  emit: noop,
  on: () => {},
  windowControls: windowControlsMock,
};

if (typeof window !== 'undefined') {
  (window as any).electronAPI = (global as any).electronAPI;
}

// Mock ResizeObserver for Virtuoso
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

// Mock IntersectionObserver
class IntersectionObserverMock {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.IntersectionObserver = IntersectionObserverMock as any;

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(() => callback(Date.now()), 0) as unknown as number;
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// Mock scrollTo
Element.prototype.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

// Mock localStorage (not always available in jsdom).
// Probe via own-property descriptor on globalThis so we don't invoke Node's
// experimental built-in `localStorage` getter - that getter logs the
// `--localstorage-file` warning to stderr the first time it's touched per
// worker fork, polluting test output and masking real warnings.
const localStorageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const localStorageInstalled =
  localStorageDescriptor !== undefined &&
  typeof (localStorageDescriptor.value as { clear?: unknown } | undefined)?.clear === 'function';
if (!localStorageInstalled) {
  const store = new Map<string, string>();
  const localStorageMock = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    get length() {
      return store.size;
    },
    key: (index: number) => [...store.keys()][index] ?? null,
  };
  Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
  }
}
