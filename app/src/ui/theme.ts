import { useColorScheme } from 'react-native';

const light = {
  bg: '#F6F4EF',
  surface: '#FFFFFF',
  surfaceMuted: '#EFECE5',
  ink: '#1D2421',
  inkSoft: '#4A5550',
  inkFaint: '#6F7974',
  line: '#DCD8CF',
  brand: '#0F6B5C',
  brandStrong: '#0A5045',
  brandTint: '#E2F1EC',
  onBrand: '#FFFFFF',
  sev1: '#A3341F',
  sev1Tint: '#FBE9E4',
  sev2: '#8A5A00',
  sev2Tint: '#FBF0D9',
  sev3: '#3F5560',
  sev3Tint: '#E7EEF1',
  ok: '#1F6E3A',
  okTint: '#E3F2E7',
};

const dark: typeof light = {
  bg: '#111614',
  surface: '#18201D',
  surfaceMuted: '#1F2925',
  ink: '#E8EEEB',
  inkSoft: '#B4C0BA',
  inkFaint: '#8E9A94',
  line: '#2C3833',
  brand: '#4FB8A4',
  brandStrong: '#79D2C0',
  brandTint: '#17332D',
  onBrand: '#06201B',
  sev1: '#F19A84',
  sev1Tint: '#3A1F18',
  sev2: '#E8C06B',
  sev2Tint: '#33290F',
  sev3: '#A9C0CB',
  sev3Tint: '#1D2A30',
  ok: '#86D39D',
  okTint: '#173022',
};

export type Colors = typeof light;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 10, md: 14, lg: 20, pill: 999 } as const;
export const type = { small: 15, body: 18, large: 20, title: 26, hero: 32 } as const;

export function severityColors(c: Colors, severity: number) {
  if (severity === 1) return { fg: c.sev1, bg: c.sev1Tint };
  if (severity === 2) return { fg: c.sev2, bg: c.sev2Tint };
  return { fg: c.sev3, bg: c.sev3Tint };
}
