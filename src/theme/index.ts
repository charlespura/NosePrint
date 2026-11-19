import { useColorScheme } from 'react-native';

const light = {
  bg: '#FAF7F2',
  surface: '#FFFFFF',
  surfaceAlt: '#F1ECE4',
  text: '#1C1A17',
  textMuted: '#6E675E',
  border: '#E4DDD2',
  accent: '#C2562F',
  accentText: '#FFFFFF',
  danger: '#B3261E',
  canvas: '#FFFFFF',
};

const dark: typeof light = {
  bg: '#141311',
  surface: '#1E1C19',
  surfaceAlt: '#2A2723',
  text: '#F3EFE8',
  textMuted: '#A49C90',
  border: '#36322C',
  accent: '#E07A52',
  accentText: '#1C1A17',
  danger: '#F2B8B5',
  canvas: '#FFFFFF',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };
export const space = (n: number) => n * 4;
