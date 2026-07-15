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
