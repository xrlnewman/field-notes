import { readFileSync } from 'node:fs';

import { describe, expect, it, vi } from 'vitest';

import {
  createStar,
  createStarfieldRuntime,
  getAdaptiveStarCount,
  getParallaxOffset,
  getThemePalette,
  type PointerState,
} from '../src/lib/starfield';

const readText = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

describe('adaptive star count', () => {
  it('keeps desktop star counts between 70 and 180', () => {
    expect(getAdaptiveStarCount(320, 240, false)).toBe(70);
    expect(getAdaptiveStarCount(1440, 900, false)).toBe(144);
    expect(getAdaptiveStarCount(3840, 2160, false)).toBe(180);
  });

  it('keeps coarse-pointer star counts between 45 and 90', () => {
    expect(getAdaptiveStarCount(320, 240, true)).toBe(45);
    expect(getAdaptiveStarCount(768, 1024, true)).toBe(87);
    expect(getAdaptiveStarCount(1440, 900, true)).toBe(90);
  });
});

describe('theme palettes', () => {
  it('returns a distinct palette for every cosmic theme', () => {
    const palettes = [
      getThemePalette('observatory'),
      getThemePalette('nebula'),
      getThemePalette('terminal'),
    ];

    expect(new Set(palettes.map((palette) => JSON.stringify(palette))).size).toBe(3);
  });
});

describe('seeded stars', () => {
  it('creates the same star for the same seed and viewport', () => {
    expect(createStar(42, 1280, 720)).toEqual(createStar(42, 1280, 720));
  });
});

describe('pointer parallax', () => {
  it('moves distant stars less than nearby stars', () => {
    const pointer: PointerState = { x: 0.8, y: -0.4, active: true };
    const near = getParallaxOffset(pointer, 0.2);
    const far = getParallaxOffset(pointer, 0.8);

    expect(Math.abs(far.x)).toBeLessThan(Math.abs(near.x));
    expect(Math.abs(far.y)).toBeLessThan(Math.abs(near.y));
  });

  it('does not move stars when the pointer is inactive', () => {
    expect(getParallaxOffset({ x: 0, y: 0, active: false }, 0.5)).toEqual({ x: 0, y: 0 });
  });
});

describe('starfield runtime controller', () => {
  const pointerInput = {
    normalizedX: 0.5,
    normalizedY: -0.25,
    clientX: 640,
    clientY: 240,
  };

  const createHarness = (reducedMotion = false) => {
    const frameCallbacks: FrameRequestCallback[] = [];
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      frameCallbacks.push(callback);
      return frameCallbacks.length;
    });
    const cancelFrame = vi.fn();
    const draw = vi.fn();
    const setPointerGlow = vi.fn();
    const runtime = createStarfieldRuntime(
      { requestFrame, cancelFrame, draw, setPointerGlow, now: () => 100 },
      { reducedMotion, hidden: false },
    );

    return { runtime, frameCallbacks, requestFrame, cancelFrame, draw, setPointerGlow };
  };

  it('keeps reduced-motion rendering static and ignores pointer input', () => {
    const { runtime, requestFrame, draw, setPointerGlow } = createHarness(true);

    runtime.start();
    runtime.handlePointerMove(pointerInput);
    runtime.handlePointerDown(pointerInput);

    expect(requestFrame).not.toHaveBeenCalled();
    expect(draw).toHaveBeenCalledTimes(1);
    expect(setPointerGlow).not.toHaveBeenCalled();
    expect(runtime.getSnapshot()).toMatchObject({
      pointer: { x: 0, y: 0, active: false },
      ripples: [],
    });
  });

  it('clears interaction and draws one static frame when reduced motion turns on', () => {
    const { runtime, requestFrame, cancelFrame, draw, setPointerGlow } = createHarness();

    runtime.start();
    runtime.handlePointerMove(pointerInput);
    runtime.handlePointerDown(pointerInput);
    expect(runtime.getSnapshot().ripples[0]?.duration).toBe(900);
    runtime.handleReducedMotionChange(true);

    expect(requestFrame).toHaveBeenCalledTimes(1);
    expect(cancelFrame).toHaveBeenCalledWith(1);
    expect(setPointerGlow).toHaveBeenLastCalledWith(null);
    expect(draw).toHaveBeenCalledTimes(1);
    expect(draw).toHaveBeenLastCalledWith(0, {
      pointer: { x: 0, y: 0, active: false },
      ripples: [],
    });
    expect(runtime.getSnapshot()).toMatchObject({
      pointer: { x: 0, y: 0, active: false },
      ripples: [],
    });
  });

  it('cancels animation while hidden and resumes with only one loop', () => {
    const { runtime, frameCallbacks, requestFrame, cancelFrame } = createHarness();

    runtime.start();
    runtime.handleVisibilityChange(true);
    runtime.handleVisibilityChange(false);
    runtime.handleVisibilityChange(false);

    expect(cancelFrame).toHaveBeenCalledWith(1);
    expect(requestFrame).toHaveBeenCalledTimes(2);

    frameCallbacks[1]?.(16);
    expect(requestFrame).toHaveBeenCalledTimes(3);
  });

  it('tears down the active frame and ignores later input', () => {
    const { runtime, requestFrame, cancelFrame, setPointerGlow } = createHarness();

    runtime.start();
    runtime.teardown();
    runtime.handlePointerMove(pointerInput);

    expect(cancelFrame).toHaveBeenCalledWith(1);
    expect(requestFrame).toHaveBeenCalledTimes(1);
    expect(setPointerGlow).toHaveBeenCalledTimes(1);
    expect(setPointerGlow).toHaveBeenLastCalledWith(null);
    expect(runtime.getSnapshot().destroyed).toBe(true);
  });
});

describe('cosmic backdrop integration', () => {
  it('renders a non-interactive, hidden canvas before the skip link', () => {
    const backdrop = readText('src/components/CosmicBackdrop.astro');
    const layout = readText('src/layouts/BaseLayout.astro');

    expect(backdrop).toContain('<canvas class="cosmic-backdrop" aria-hidden="true"></canvas>');
    expect(layout).toContain("import CosmicBackdrop from '../components/CosmicBackdrop.astro';");
    expect(layout.indexOf('<CosmicBackdrop />')).toBeLessThan(layout.indexOf('<a class="skip-link"'));
  });

  it('caps DPR and reacts to resize, pointers, themes, reduced motion, and visibility', () => {
    const backdrop = readText('src/components/CosmicBackdrop.astro');

    expect(backdrop).toContain('Math.min(window.devicePixelRatio || 1, 2)');
    expect(backdrop).toContain("window.addEventListener('resize'");
    expect(backdrop).toContain("window.addEventListener('pointermove'");
    expect(backdrop).toContain("window.addEventListener('pointerdown'");
    expect(backdrop).toContain('createStarfieldRuntime');
    expect(backdrop).toContain("document.addEventListener('cosmic-theme-change'");
    expect(backdrop).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')");
    expect(backdrop).toContain("document.addEventListener('visibilitychange'");
    expect(backdrop).toContain('document.hidden');
    expect(backdrop).toContain('cancelAnimationFrame');
  });

  it('names and removes every runtime event handler during teardown', () => {
    const backdrop = readText('src/components/CosmicBackdrop.astro');

    expect(backdrop).not.toContain("window.addEventListener('pointerout', (");
    expect(backdrop).toContain("window.removeEventListener('resize', handleResize)");
    expect(backdrop).toContain("window.removeEventListener('pointermove', handlePointerMove)");
    expect(backdrop).toContain("window.removeEventListener('pointerdown', handlePointerDown)");
    expect(backdrop).toContain("window.removeEventListener('pointerout', handlePointerOut)");
    expect(backdrop).toContain(
      "document.removeEventListener('cosmic-theme-change', handleThemeChange)",
    );
    expect(backdrop).toContain(
      "document.removeEventListener('visibilitychange', handleVisibilityChange)",
    );
    expect(backdrop).toContain("reduceMotion.removeEventListener('change', handleMotionPreference)");
    expect(backdrop).toContain('return teardown;');
  });

  it('defines backdrop layers behind the page content without intercepting events', () => {
    const styles = readText('src/styles/global.css');

    expect(styles).toMatch(/\.cosmic-backdrop[\s\S]*pointer-events:\s*none/);
    expect(styles).toContain('.cosmic-noise');
    expect(styles).toContain('.cosmic-pointer-glow');
    expect(styles).toContain('body > :not(.cosmic-backdrop):not(.cosmic-noise):not(.cosmic-pointer-glow)');
  });
});
