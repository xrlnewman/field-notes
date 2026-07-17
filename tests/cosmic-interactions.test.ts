import { readFileSync } from 'node:fs';

import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';

type Listener = (event: Record<string, unknown>) => void;

const readInteractionScript = () => {
  const source = readFileSync('src/components/CosmicInteractions.astro', 'utf8');
  const script = source.match(/<script>\s*([\s\S]*?)\s*<\/script>/)?.[1];

  if (!script) throw new Error('CosmicInteractions 缺少客户端脚本');
  return ts.transpile(script, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 });
};

const createMediaQuery = (initialMatches: boolean) => {
  const listeners = new Set<Listener>();
  const media = {
    matches: initialMatches,
    addEventListener: vi.fn((_type: string, listener: Listener) => listeners.add(listener)),
    removeEventListener: vi.fn((_type: string, listener: Listener) => listeners.delete(listener)),
    setMatches(matches: boolean) {
      media.matches = matches;
      listeners.forEach((listener) => listener({ matches }));
    },
    listenerCount: () => listeners.size,
  };
  return media;
};

const createHarness = () => {
  const cardListeners = new Map<string, Set<Listener>>();
  const properties = new Map<string, string>();
  const card = {
    style: {
      setProperty: vi.fn((name: string, value: string) => properties.set(name, value)),
    },
    addEventListener: vi.fn((type: string, listener: Listener) => {
      const listeners = cardListeners.get(type) ?? new Set<Listener>();
      listeners.add(listener);
      cardListeners.set(type, listeners);
    }),
    removeEventListener: vi.fn((type: string, listener: Listener) => {
      cardListeners.get(type)?.delete(listener);
    }),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 100 }),
    emit(type: string, event: Record<string, unknown> = {}) {
      cardListeners.get(type)?.forEach((listener) => listener({ ...event, currentTarget: card }));
    },
  };

  const reveal = { classList: { add: vi.fn() } };
  const rootClasses = new Set<string>();
  const documentListeners = new Map<string, Set<Listener>>();
  const document = {
    documentElement: {
      classList: {
        add: vi.fn((name: string) => rootClasses.add(name)),
        remove: vi.fn((name: string) => rootClasses.delete(name)),
      },
    },
    querySelectorAll: (selector: string) => selector === '[data-cosmic-card]' ? [card] : [reveal],
    addEventListener: vi.fn((type: string, listener: Listener) => {
      const listeners = documentListeners.get(type) ?? new Set<Listener>();
      listeners.add(listener);
      documentListeners.set(type, listeners);
    }),
    removeEventListener: vi.fn((type: string, listener: Listener) => {
      documentListeners.get(type)?.delete(listener);
    }),
    emit(type: string) {
      documentListeners.get(type)?.forEach((listener) => listener({ type }));
    },
  };

  const motion = createMediaQuery(false);
  const pointer = createMediaQuery(false);
  const matchMedia = (query: string) => query.includes('reduced-motion') ? motion : pointer;
  const observers: Array<{ disconnect: ReturnType<typeof vi.fn> }> = [];
  class IntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();

    constructor(_callback: unknown, _options: unknown) {
      observers.push(this);
    }
  }
  const window = { IntersectionObserver } as Record<string, unknown>;

  const run = () => {
    const execute = Function('matchMedia', 'document', 'window', 'IntersectionObserver', readInteractionScript());
    execute(matchMedia, document, window, IntersectionObserver);
  };

  return { card, properties, motion, pointer, document, observers, run };
};

describe('cosmic card interaction lifecycle', () => {
  it('keeps reveal content visible while it waits for the observer', () => {
    const source = readFileSync('src/components/CosmicInteractions.astro', 'utf8');
    const pendingRevealRule = source.match(/html\.cosmic-interactions-ready \[data-reveal\] \{([^}]*)\}/)?.[1] ?? '';

    expect(pendingRevealRule).toContain('opacity: 1;');
    expect(pendingRevealRule).not.toContain('opacity: 0;');
  });

  it('unbinds tilt and resets every visual variable as soon as reduced motion turns on', () => {
    const harness = createHarness();
    harness.run();
    harness.card.emit('pointermove', { clientX: 190, clientY: 10 });

    expect(harness.properties.get('--card-rotate-y')).not.toBe('0deg');
    harness.motion.setMatches(true);

    expect(harness.properties).toMatchObject(new Map([
      ['--card-rotate-x', '0deg'],
      ['--card-rotate-y', '0deg'],
      ['--card-highlight-x', '50%'],
      ['--card-highlight-y', '50%'],
    ]));
    const writesAfterReset = harness.card.style.setProperty.mock.calls.length;
    harness.card.emit('pointermove', { clientX: 10, clientY: 90 });
    expect(harness.card.style.setProperty).toHaveBeenCalledTimes(writesAfterReset);
  });

  it('disconnects observers and prevents duplicate bindings across page setup', () => {
    const harness = createHarness();
    harness.run();
    const firstObserver = harness.observers[0];
    harness.run();

    expect(firstObserver?.disconnect).toHaveBeenCalledOnce();
    expect(harness.motion.listenerCount()).toBe(1);
    expect(harness.pointer.listenerCount()).toBe(1);

    harness.document.emit('astro:before-swap');
    expect(harness.observers[1]?.disconnect).toHaveBeenCalledOnce();
    expect(harness.motion.listenerCount()).toBe(0);
    expect(harness.pointer.listenerCount()).toBe(0);
  });
});
