import type { CosmicTheme } from './cosmic-theme';

export interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  depth: number;
  twinkleOffset: number;
  twinkleSpeed: number;
}

export interface PointerState {
  x: number;
  y: number;
  active: boolean;
}

export interface Ripple {
  x: number;
  y: number;
  startedAt: number;
  duration: number;
}

export interface StarfieldPalette {
  background: string;
  star: string;
  starSecondary: string;
  glow: string;
  line: string;
  accent: string;
  grid: string;
  label: string;
}

export interface StarfieldPointerInput {
  normalizedX: number;
  normalizedY: number;
  clientX: number;
  clientY: number;
}

export interface StarfieldRenderState {
  pointer: PointerState;
  ripples: readonly Ripple[];
}

export interface StarfieldRuntimeSnapshot extends StarfieldRenderState {
  reducedMotion: boolean;
  hidden: boolean;
  frameId: number | null;
  destroyed: boolean;
}

export interface StarfieldRuntimeDependencies {
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (frameId: number) => void;
  draw: (timestamp: number, state: StarfieldRenderState) => void;
  setPointerGlow: (input: StarfieldPointerInput | null) => void;
  now: () => number;
}

export interface StarfieldRuntimeOptions {
  reducedMotion: boolean;
  hidden: boolean;
}

export interface StarfieldRuntimeController {
  start: () => void;
  drawStaticFrame: (timestamp?: number) => void;
  handlePointerMove: (input: StarfieldPointerInput) => void;
  handlePointerDown: (input: StarfieldPointerInput) => void;
  handlePointerOut: () => void;
  handleVisibilityChange: (hidden: boolean) => void;
  handleReducedMotionChange: (reducedMotion: boolean) => void;
  teardown: () => void;
  getSnapshot: () => StarfieldRuntimeSnapshot;
}

const palettes: Record<CosmicTheme, StarfieldPalette> = {
  observatory: {
    background: '#07111f',
    star: '#dff7ff',
    starSecondary: '#77c9ff',
    glow: '#5bc8ff',
    line: '#79d8ff',
    accent: '#b8ecff',
    grid: '#25506e',
    label: '#84d9ff',
  },
  nebula: {
    background: '#13091f',
    star: '#fff0ff',
    starSecondary: '#f59cff',
    glow: '#a76bff',
    line: '#ee8fff',
    accent: '#ff78c9',
    grid: '#653877',
    label: '#ffc0ed',
  },
  terminal: {
    background: '#031412',
    star: '#d5fff1',
    starSecondary: '#5dffd1',
    glow: '#20dba7',
    line: '#35f2bd',
    accent: '#80ffe0',
    grid: '#176c5d',
    label: '#65fbd1',
  },
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const mulberry32 = (seed: number) => {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

export const getAdaptiveStarCount = (width: number, height: number, coarsePointer: boolean) => {
  const count = Math.round((width * height) / 9000);
  return coarsePointer ? clamp(count, 45, 90) : clamp(count, 70, 180);
};

export const getThemePalette = (theme: CosmicTheme): StarfieldPalette => palettes[theme];

export const createStar = (seed: number, width: number, height: number): Star => {
  const random = mulberry32(seed);

  return {
    x: random() * width,
    y: random() * height,
    radius: 0.6 + random() * 1.8,
    alpha: 0.4 + random() * 0.6,
    depth: 0.15 + random() * 0.75,
    twinkleOffset: random() * Math.PI * 2,
    twinkleSpeed: 0.0006 + random() * 0.0012,
  };
};

export const getParallaxOffset = (pointer: PointerState, depth: number) => {
  if (!pointer.active) {
    return { x: 0, y: 0 };
  }

  const strength = 18 * (1 - clamp(depth, 0, 1));
  return {
    x: pointer.x * strength,
    y: pointer.y * strength,
  };
};

export const createStarfieldRuntime = (
  dependencies: StarfieldRuntimeDependencies,
  options: StarfieldRuntimeOptions,
): StarfieldRuntimeController => {
  let pointer: PointerState = { x: 0, y: 0, active: false };
  let ripples: Ripple[] = [];
  let reducedMotion = options.reducedMotion;
  let hidden = options.hidden;
  let frameId: number | null = null;
  let started = false;
  let destroyed = false;

  const getRenderState = (): StarfieldRenderState => ({ pointer, ripples });

  const getSnapshot = (): StarfieldRuntimeSnapshot => ({
    pointer: { ...pointer },
    ripples: ripples.map((ripple) => ({ ...ripple })),
    reducedMotion,
    hidden,
    frameId,
    destroyed,
  });

  const drawStaticFrame = (timestamp = 0) => {
    if (destroyed || hidden) return;
    dependencies.draw(timestamp, getRenderState());
  };

  const stopAnimation = () => {
    if (frameId === null) return;
    dependencies.cancelFrame(frameId);
    frameId = null;
  };

  const scheduleAnimation = () => {
    if (destroyed || reducedMotion || hidden || frameId !== null) return;
    frameId = dependencies.requestFrame(handleAnimationFrame);
  };

  const handleAnimationFrame = (timestamp: number) => {
    frameId = null;
    ripples = ripples.filter((ripple) => timestamp - ripple.startedAt <= ripple.duration);
    dependencies.draw(timestamp, getRenderState());
    scheduleAnimation();
  };

  const start = () => {
    if (started || destroyed) return;
    started = true;
    if (reducedMotion) drawStaticFrame();
    else scheduleAnimation();
  };

  const handlePointerMove = (input: StarfieldPointerInput) => {
    if (destroyed || reducedMotion) return;
    pointer = { x: input.normalizedX, y: input.normalizedY, active: true };
    dependencies.setPointerGlow(input);
  };

  const handlePointerDown = (input: StarfieldPointerInput) => {
    if (destroyed || reducedMotion) return;
    handlePointerMove(input);
    ripples.push({
      x: input.clientX,
      y: input.clientY,
      startedAt: dependencies.now(),
      duration: 900,
    });
  };

  const handlePointerOut = () => {
    if (destroyed || reducedMotion) return;
    pointer = { x: 0, y: 0, active: false };
    dependencies.setPointerGlow(null);
  };

  const handleVisibilityChange = (nextHidden: boolean) => {
    if (destroyed || hidden === nextHidden) return;
    hidden = nextHidden;
    if (hidden) stopAnimation();
    else if (reducedMotion) drawStaticFrame();
    else scheduleAnimation();
  };

  const handleReducedMotionChange = (nextReducedMotion: boolean) => {
    if (destroyed || reducedMotion === nextReducedMotion) return;
    reducedMotion = nextReducedMotion;

    if (reducedMotion) {
      stopAnimation();
      pointer = { x: 0, y: 0, active: false };
      ripples = [];
      dependencies.setPointerGlow(null);
      drawStaticFrame();
    } else {
      scheduleAnimation();
    }
  };

  const teardown = () => {
    if (destroyed) return;
    destroyed = true;
    stopAnimation();
    pointer = { x: 0, y: 0, active: false };
    ripples = [];
    dependencies.setPointerGlow(null);
  };

  return {
    start,
    drawStaticFrame,
    handlePointerMove,
    handlePointerDown,
    handlePointerOut,
    handleVisibilityChange,
    handleReducedMotionChange,
    teardown,
    getSnapshot,
  };
};
