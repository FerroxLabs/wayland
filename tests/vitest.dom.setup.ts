/**
 * Vitest DOM Test Setup
 * Configuration for React component and hook tests using jsdom
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import * as React from 'react';

// Lucide-react replaced icon-park (Forge Suite brand sweep). Existing DOM tests
// query icons by the data-testid that icon-park's IconProvider emitted, e.g.
// `icon-delete`. Wrap each Lucide export so it stamps the equivalent test id,
// keeping the prior assertion surface stable without changing test bodies.
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('lucide-react');
  // Maps Lucide component name -> icon-park kebab name expected by tests.
  const TESTID_MAP: Record<string, string> = {
    Clock: 'alarm-clock',
    Check: 'check',
    CheckCircle2: 'check-one',
    X: 'close',
    Trash2: 'delete',
    ChevronDown: 'down',
    Pencil: 'edit',
    Zap: 'lightning',
    Link: 'link',
    Plus: 'plus',
    ChevronRight: 'right',
    Bot: 'robot',
    Settings: 'setting',
    Terminal: 'terminal',
    ChevronUp: 'up',
    PenSquare: 'write',
  };
  const wrapped: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(actual)) {
    if (typeof value === 'object' && value && (value as { $$typeof?: symbol }).$$typeof) {
      const Original = value as React.ComponentType<Record<string, unknown>>;
      const Display = React.forwardRef<unknown, Record<string, unknown>>((props, ref) => {
        const testid = TESTID_MAP[name];
        const merged = testid && !('data-testid' in props) ? { ...props, 'data-testid': `icon-${testid}` } : props;
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

// Mock localStorage (not always available in jsdom)
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage?.clear !== 'function') {
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
