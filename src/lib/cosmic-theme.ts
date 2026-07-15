export type CosmicTheme = 'observatory' | 'nebula' | 'terminal';

export interface CosmicThemeOption {
  id: CosmicTheme;
  label: string;
  shortLabel: string;
  description: string;
}

export const COSMIC_THEME_STORAGE_KEY = 'cosmic-theme';
export const DEFAULT_COSMIC_THEME: CosmicTheme = 'observatory';

export const cosmicThemes: readonly CosmicThemeOption[] = [
  {
    id: 'observatory',
    label: '深空观测站',
    shortLabel: '观测站',
    description: '冷静克制的深空观测界面',
  },
  {
    id: 'nebula',
    label: '梦幻银河',
    shortLabel: '银河',
    description: '柔和绚丽的星云漫游界面',
  },
  {
    id: 'terminal',
    label: '宇宙终端',
    shortLabel: '终端',
    description: '清晰锐利的宇宙终端界面',
  },
];

export const isCosmicTheme = (value: unknown): value is CosmicTheme =>
  value === 'observatory' || value === 'nebula' || value === 'terminal';

export const resolveCosmicTheme = (value: unknown): CosmicTheme =>
  isCosmicTheme(value) ? value : DEFAULT_COSMIC_THEME;
